package com.codesolutions.pmt.service;

import com.codesolutions.pmt.dto.ProjectDto;
import com.codesolutions.pmt.entity.*;
import com.codesolutions.pmt.exception.ConflictException;
import com.codesolutions.pmt.exception.ForbiddenException;
import com.codesolutions.pmt.exception.NotFoundException;
import com.codesolutions.pmt.repository.ProjectMemberRepository;
import com.codesolutions.pmt.repository.ProjectRepository;
import com.codesolutions.pmt.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository memberRepository;
    private final UserRepository userRepository;

    public ProjectService(ProjectRepository projectRepository,
                          ProjectMemberRepository memberRepository,
                          UserRepository userRepository) {
        this.projectRepository = projectRepository;
        this.memberRepository = memberRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public ProjectDto.Response create(Long userId, ProjectDto.CreateRequest req) {
        User creator = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("Utilisateur introuvable"));

        Project project = projectRepository.save(
                new Project(req.name(), req.description(), creator));

        // Le créateur devient automatiquement ADMIN
        memberRepository.save(new ProjectMember(creator, project, Role.ADMIN));

        return toResponse(project);
    }

    public List<ProjectDto.Response> listByUser(Long userId) {
        return projectRepository.findAllByUserId(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    public ProjectDto.Response getById(Long projectId, Long userId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new NotFoundException("Projet introuvable"));

        ensureMember(userId, projectId);
        return toResponse(project);
    }

    @Transactional
    public ProjectDto.MemberResponse inviteMember(Long projectId, Long actorId,
                                                   ProjectDto.InviteRequest req) {
        ensureAdmin(actorId, projectId);

        User invited = userRepository.findByEmail(req.email())
                .orElseThrow(() -> new NotFoundException(
                        "Aucun utilisateur avec l'email : " + req.email()));

        if (memberRepository.existsByUserIdAndProjectId(invited.getId(), projectId)) {
            throw new ConflictException("Cet utilisateur fait déjà partie du projet");
        }

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new NotFoundException("Projet introuvable"));

        ProjectMember pm = memberRepository.save(
                new ProjectMember(invited, project, req.role()));

        return toMemberResponse(pm);
    }

    public List<ProjectDto.MemberResponse> listMembers(Long projectId, Long userId) {
        ensureMember(userId, projectId);
        return memberRepository.findByProjectId(projectId).stream()
                .map(this::toMemberResponse)
                .toList();
    }

    public Role getUserRole(Long userId, Long projectId) {
        return memberRepository.findByUserIdAndProjectId(userId, projectId)
                .map(ProjectMember::getRole)
                .orElseThrow(() -> new ForbiddenException(
                        "Vous n'êtes pas membre de ce projet"));
    }

    // --- Vérifs RBAC ---

    public void ensureMember(Long userId, Long projectId) {
        if (!memberRepository.existsByUserIdAndProjectId(userId, projectId)) {
            throw new ForbiddenException("Vous n'êtes pas membre de ce projet");
        }
    }

    public void ensureAdmin(Long userId, Long projectId) {
        Role role = getUserRole(userId, projectId);
        if (role != Role.ADMIN) {
            throw new ForbiddenException(
                    "Action réservée aux administrateurs du projet");
        }
    }

    public void ensureCanWrite(Long userId, Long projectId) {
        Role role = getUserRole(userId, projectId);
        if (role == Role.OBSERVER) {
            throw new ForbiddenException(
                    "Les observateurs ne peuvent pas modifier les tâches");
        }
    }

    // --- Mappers ---

    private ProjectDto.Response toResponse(Project p) {
        return new ProjectDto.Response(
                p.getId(), p.getName(), p.getDescription(),
                p.getCreatedBy().getUsername(), p.getCreatedAt());
    }

    private ProjectDto.MemberResponse toMemberResponse(ProjectMember pm) {
        return new ProjectDto.MemberResponse(
                pm.getId(),
                pm.getUser().getId(),
                pm.getUser().getUsername(),
                pm.getUser().getEmail(),
                pm.getRole());
    }
}
