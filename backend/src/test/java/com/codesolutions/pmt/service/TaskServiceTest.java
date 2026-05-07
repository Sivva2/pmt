package com.codesolutions.pmt.service;

import com.codesolutions.pmt.dto.TaskDto;
import com.codesolutions.pmt.entity.*;
import com.codesolutions.pmt.exception.ForbiddenException;
import com.codesolutions.pmt.exception.NotFoundException;
import com.codesolutions.pmt.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TaskServiceTest {

    @Mock private TaskRepository taskRepository;
    @Mock private TaskHistoryRepository historyRepository;
    @Mock private ProjectRepository projectRepository;
    @Mock private UserRepository userRepository;
    @Mock private NotificationRepository notificationRepository;
    @Mock private ProjectService projectService;
    @InjectMocks private TaskService taskService;

    private User alice, bob;
    private Project project;
    private Task task;

    @BeforeEach
    void setUp() {
        alice = new User("alice", "a@a.com", "h"); alice.setId(1L);
        bob = new User("bob", "b@b.com", "h"); bob.setId(2L);
        project = new Project("P", "d", alice); project.setId(10L);

        task = new Task();
        task.setId(100L);
        task.setName("Test task");
        task.setProject(project);
        task.setCreatedBy(alice);
        task.setPriority(Priority.MEDIUM);
        task.setStatus(Status.TODO);
    }

    @Test
    void listByProject_success() {
        when(taskRepository.findByProjectIdOrderByCreatedAtDesc(10L))
                .thenReturn(List.of(task));

        List<TaskDto.Response> result = taskService.listByProject(10L, 1L);

        assertThat(result).hasSize(1);
        verify(projectService).ensureMember(1L, 10L);
    }

    @Test
    void create_success_withoutAssignee() {
        when(projectRepository.findById(10L)).thenReturn(Optional.of(project));
        when(userRepository.findById(1L)).thenReturn(Optional.of(alice));
        when(taskRepository.save(any(Task.class))).thenAnswer(inv -> {
            Task t = inv.getArgument(0);
            t.setId(100L);
            return t;
        });

        TaskDto.CreateRequest req = new TaskDto.CreateRequest(
                "New", "desc", Priority.HIGH, Status.TODO,
                LocalDate.now(), null);

        TaskDto.Response resp = taskService.create(10L, 1L, req);

        assertThat(resp.name()).isEqualTo("New");
        assertThat(resp.priority()).isEqualTo(Priority.HIGH);
        verify(notificationRepository, never()).save(any());
    }

    @Test
    void create_success_withAssignee_triggersNotification() {
        when(projectRepository.findById(10L)).thenReturn(Optional.of(project));
        when(userRepository.findById(1L)).thenReturn(Optional.of(alice));
        when(userRepository.findById(2L)).thenReturn(Optional.of(bob));
        when(taskRepository.save(any(Task.class))).thenAnswer(inv -> {
            Task t = inv.getArgument(0);
            t.setId(100L);
            return t;
        });

        TaskDto.CreateRequest req = new TaskDto.CreateRequest(
                "New", "desc", null, null, null, 2L);

        taskService.create(10L, 1L, req);

        verify(notificationRepository).save(any(Notification.class));
    }

    @Test
    void create_asObserver_forbidden() {
        doThrow(new ForbiddenException("non")).when(projectService).ensureCanWrite(1L, 10L);

        TaskDto.CreateRequest req = new TaskDto.CreateRequest(
                "N", null, null, null, null, null);

        assertThatThrownBy(() -> taskService.create(10L, 1L, req))
                .isInstanceOf(ForbiddenException.class);
    }

    @Test
    void update_changesTrackedInHistory() {
        when(taskRepository.findById(100L)).thenReturn(Optional.of(task));
        when(userRepository.findById(1L)).thenReturn(Optional.of(alice));
        when(taskRepository.save(any(Task.class))).thenAnswer(inv -> inv.getArgument(0));

        TaskDto.UpdateRequest req = new TaskDto.UpdateRequest(
                "Updated", null, Priority.HIGH, Status.IN_PROGRESS, null, null);

        taskService.update(100L, 1L, req);

        verify(historyRepository).saveAll(argThat(iter -> {
            int count = 0;
            for (Object ignored : iter) count++;
            return count == 3; // name, priority, status
        }));
    }

    @Test
    void update_taskNotFound() {
        when(taskRepository.findById(999L)).thenReturn(Optional.empty());

        TaskDto.UpdateRequest req = new TaskDto.UpdateRequest(
                null, null, null, null, null, null);

        assertThatThrownBy(() -> taskService.update(999L, 1L, req))
                .isInstanceOf(NotFoundException.class);
    }

    @Test
    void update_noChanges_noHistoryWritten() {
        when(taskRepository.findById(100L)).thenReturn(Optional.of(task));
        when(userRepository.findById(1L)).thenReturn(Optional.of(alice));
        when(taskRepository.save(any(Task.class))).thenAnswer(inv -> inv.getArgument(0));

        TaskDto.UpdateRequest req = new TaskDto.UpdateRequest(
                null, null, null, null, null, null);

        taskService.update(100L, 1L, req);

        verify(historyRepository, never()).saveAll(any());
    }

    @Test
    void delete_success() {
        when(taskRepository.findById(100L)).thenReturn(Optional.of(task));

        taskService.delete(100L, 1L);

        verify(taskRepository).delete(task);
    }

    @Test
    void delete_taskNotFound() {
        when(taskRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> taskService.delete(999L, 1L))
                .isInstanceOf(NotFoundException.class);
    }

    @Test
    void getHistory_success() {
        when(taskRepository.findById(100L)).thenReturn(Optional.of(task));
        TaskHistory h = new TaskHistory(task, alice, "status", "TODO", "DONE");
        h.setId(1L);
        when(historyRepository.findByTaskIdOrderByChangedAtDesc(100L))
                .thenReturn(List.of(h));

        List<TaskDto.HistoryResponse> result = taskService.getHistory(100L, 1L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).fieldChanged()).isEqualTo("status");
    }
}
