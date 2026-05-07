package com.codesolutions.pmt.service;

import com.codesolutions.pmt.dto.TaskDto;
import com.codesolutions.pmt.entity.*;
import com.codesolutions.pmt.exception.BadRequestException;
import com.codesolutions.pmt.exception.NotFoundException;
import com.codesolutions.pmt.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Service
@Transactional(readOnly = true)
public class TaskService {

    private final TaskRepository taskRepository;
    private final TaskHistoryRepository historyRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final ProjectService projectService;

    public TaskService(TaskRepository taskRepository,
                       TaskHistoryRepository historyRepository,
                       ProjectRepository projectRepository,
                       UserRepository userRepository,
                       NotificationRepository notificationRepository,
                       ProjectService projectService) {
        this.taskRepository = taskRepository;
        this.historyRepository = historyRepository;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
        this.notificationRepository = notificationRepository;
        this.projectService = projectService;
    }

    public List<TaskDto.Response> listByProject(Long projectId, Long userId) {
        projectService.ensureMember(userId, projectId);
        return taskRepository.findByProjectIdOrderByCreatedAtDesc(projectId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public TaskDto.Response create(Long projectId, Long userId, TaskDto.CreateRequest req) {
        projectService.ensureCanWrite(userId, projectId);

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new NotFoundException("Projet introuvable"));
        User creator = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("Utilisateur introuvable"));

        Task task = new Task();
        task.setName(req.name());
        task.setDescription(req.description());
        task.setPriority(req.priority() != null ? req.priority() : Priority.MEDIUM);
        task.setStatus(req.status() != null ? req.status() : Status.TODO);
        task.setDueDate(req.dueDate());
        task.setProject(project);
        task.setCreatedBy(creator);

        if (req.assigneeId() != null) {
            User assignee = loadMemberOrThrow(req.assigneeId(), projectId);
            task.setAssignee(assignee);
        }

        Task saved = taskRepository.save(task);

        if (saved.getAssignee() != null) {
            notifyAssignee(saved, "Vous avez été assigné à la tâche « " + saved.getName() + " »");
        }

        return toResponse(saved);
    }

    @Transactional
    public TaskDto.Response update(Long taskId, Long userId, TaskDto.UpdateRequest req) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new NotFoundException("Tâche introuvable"));

        projectService.ensureCanWrite(userId, task.getProject().getId());

        User actor = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("Utilisateur introuvable"));

        List<TaskHistory> changes = new ArrayList<>();

        if (req.name() != null && !Objects.equals(task.getName(), req.name())) {
            changes.add(new TaskHistory(task, actor, "name", task.getName(), req.name()));
            task.setName(req.name());
        }
        if (req.description() != null && !Objects.equals(task.getDescription(), req.description())) {
            changes.add(new TaskHistory(task, actor, "description",
                    task.getDescription(), req.description()));
            task.setDescription(req.description());
        }
        if (req.priority() != null && task.getPriority() != req.priority()) {
            changes.add(new TaskHistory(task, actor, "priority",
                    task.getPriority().name(), req.priority().name()));
            task.setPriority(req.priority());
        }
        if (req.status() != null && task.getStatus() != req.status()) {
            changes.add(new TaskHistory(task, actor, "status",
                    task.getStatus().name(), req.status().name()));
            task.setStatus(req.status());
        }
        if (req.dueDate() != null && !Objects.equals(task.getDueDate(), req.dueDate())) {
            changes.add(new TaskHistory(task, actor, "dueDate",
                    String.valueOf(task.getDueDate()), String.valueOf(req.dueDate())));
            task.setDueDate(req.dueDate());
        }
        if (req.assigneeId() != null) {
            Long currentId = task.getAssignee() != null ? task.getAssignee().getId() : null;
            if (!Objects.equals(currentId, req.assigneeId())) {
                User newAssignee = loadMemberOrThrow(req.assigneeId(), task.getProject().getId());
                String oldName = task.getAssignee() != null
                        ? task.getAssignee().getUsername() : null;
                changes.add(new TaskHistory(task, actor, "assignee",
                        oldName, newAssignee.getUsername()));
                task.setAssignee(newAssignee);

                notifyAssignee(task, "Vous avez été assigné à la tâche « "
                        + task.getName() + " »");
            }
        }

        Task saved = taskRepository.save(task);
        if (!changes.isEmpty()) {
            historyRepository.saveAll(changes);
            if (saved.getAssignee() != null
                    && !saved.getAssignee().getId().equals(userId)) {
                notificationRepository.save(new Notification(
                        saved.getAssignee(), saved,
                        "La tâche « " + saved.getName() + " » a été modifiée"));
            }
        }

        return toResponse(saved);
    }

    @Transactional
    public void delete(Long taskId, Long userId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new NotFoundException("Tâche introuvable"));
        projectService.ensureCanWrite(userId, task.getProject().getId());
        taskRepository.delete(task);
    }

    public List<TaskDto.HistoryResponse> getHistory(Long taskId, Long userId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new NotFoundException("Tâche introuvable"));
        projectService.ensureMember(userId, task.getProject().getId());

        return historyRepository.findByTaskIdOrderByChangedAtDesc(taskId).stream()
                .map(h -> new TaskDto.HistoryResponse(
                        h.getId(), h.getUser().getUsername(),
                        h.getFieldChanged(), h.getOldValue(), h.getNewValue(),
                        h.getChangedAt()))
                .toList();
    }

    // --- Helpers ---

    private User loadMemberOrThrow(Long userId, Long projectId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BadRequestException(
                        "Assigné introuvable : " + userId));
        projectService.ensureMember(user.getId(), projectId);
        return user;
    }

    private void notifyAssignee(Task task, String message) {
        if (task.getAssignee() == null) return;
        notificationRepository.save(new Notification(task.getAssignee(), task, message));
    }

    private TaskDto.Response toResponse(Task t) {
        return new TaskDto.Response(
                t.getId(), t.getName(), t.getDescription(),
                t.getPriority(), t.getStatus(), t.getDueDate(),
                t.getProject().getId(),
                t.getAssignee() != null ? t.getAssignee().getId() : null,
                t.getAssignee() != null ? t.getAssignee().getUsername() : null,
                t.getCreatedBy().getUsername(),
                t.getCreatedAt(), t.getUpdatedAt());
    }
}
