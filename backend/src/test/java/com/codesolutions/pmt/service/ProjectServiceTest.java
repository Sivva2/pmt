package com.codesolutions.pmt.service;

import com.codesolutions.pmt.dto.ProjectDto;
import com.codesolutions.pmt.entity.*;
import com.codesolutions.pmt.exception.ConflictException;
import com.codesolutions.pmt.exception.ForbiddenException;
import com.codesolutions.pmt.exception.NotFoundException;
import com.codesolutions.pmt.repository.ProjectMemberRepository;
import com.codesolutions.pmt.repository.ProjectRepository;
import com.codesolutions.pmt.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProjectServiceTest {

    @Mock private ProjectRepository projectRepository;
    @Mock private ProjectMemberRepository memberRepository;
    @Mock private UserRepository userRepository;
    @InjectMocks private ProjectService projectService;

    private User alice;
    private User bob;
    private Project project;

    @BeforeEach
    void setUp() {
        alice = new User("alice", "alice@pmt.com", "h");
        alice.setId(1L);
        bob = new User("bob", "bob@pmt.com", "h");
        bob.setId(2L);
        project = new Project("Projet X", "desc", alice);
        project.setId(10L);
    }

    @Test
    void create_success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(alice));
        when(projectRepository.save(any(Project.class))).thenAnswer(inv -> {
            Project p = inv.getArgument(0);
            p.setId(10L);
            return p;
        });

        ProjectDto.Response resp = projectService.create(1L,
                new ProjectDto.CreateRequest("Projet X", "desc"));

        assertThat(resp.name()).isEqualTo("Projet X");
        verify(memberRepository).save(any(ProjectMember.class));
    }

    @Test
    void getById_notMember_forbidden() {
        when(projectRepository.findById(10L)).thenReturn(Optional.of(project));
        when(memberRepository.existsByUserIdAndProjectId(99L, 10L)).thenReturn(false);

        assertThatThrownBy(() -> projectService.getById(10L, 99L))
                .isInstanceOf(ForbiddenException.class);
    }

    @Test
    void getById_success() {
        when(projectRepository.findById(10L)).thenReturn(Optional.of(project));
        when(memberRepository.existsByUserIdAndProjectId(1L, 10L)).thenReturn(true);

        ProjectDto.Response resp = projectService.getById(10L, 1L);
        assertThat(resp.id()).isEqualTo(10L);
    }

    @Test
    void getById_notFound() {
        when(projectRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> projectService.getById(999L, 1L))
                .isInstanceOf(NotFoundException.class);
    }

    @Test
    void inviteMember_success() {
        ProjectMember pm = new ProjectMember(alice, project, Role.ADMIN);
        when(memberRepository.findByUserIdAndProjectId(1L, 10L))
                .thenReturn(Optional.of(pm));
        when(userRepository.findByEmail("bob@pmt.com")).thenReturn(Optional.of(bob));
        when(memberRepository.existsByUserIdAndProjectId(2L, 10L)).thenReturn(false);
        when(projectRepository.findById(10L)).thenReturn(Optional.of(project));
        when(memberRepository.save(any(ProjectMember.class))).thenAnswer(inv -> inv.getArgument(0));

        ProjectDto.MemberResponse resp = projectService.inviteMember(10L, 1L,
                new ProjectDto.InviteRequest("bob@pmt.com", Role.MEMBER));

        assertThat(resp.username()).isEqualTo("bob");
        assertThat(resp.role()).isEqualTo(Role.MEMBER);
    }

    @Test
    void inviteMember_notAdmin_forbidden() {
        ProjectMember pm = new ProjectMember(bob, project, Role.MEMBER);
        when(memberRepository.findByUserIdAndProjectId(2L, 10L))
                .thenReturn(Optional.of(pm));

        assertThatThrownBy(() -> projectService.inviteMember(10L, 2L,
                new ProjectDto.InviteRequest("x@x.com", Role.MEMBER)))
                .isInstanceOf(ForbiddenException.class);
    }

    @Test
    void inviteMember_alreadyInProject() {
        ProjectMember pm = new ProjectMember(alice, project, Role.ADMIN);
        when(memberRepository.findByUserIdAndProjectId(1L, 10L))
                .thenReturn(Optional.of(pm));
        when(userRepository.findByEmail("bob@pmt.com")).thenReturn(Optional.of(bob));
        when(memberRepository.existsByUserIdAndProjectId(2L, 10L)).thenReturn(true);

        assertThatThrownBy(() -> projectService.inviteMember(10L, 1L,
                new ProjectDto.InviteRequest("bob@pmt.com", Role.MEMBER)))
                .isInstanceOf(ConflictException.class);
    }

    @Test
    void inviteMember_unknownEmail() {
        ProjectMember pm = new ProjectMember(alice, project, Role.ADMIN);
        when(memberRepository.findByUserIdAndProjectId(1L, 10L))
                .thenReturn(Optional.of(pm));
        when(userRepository.findByEmail(any())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> projectService.inviteMember(10L, 1L,
                new ProjectDto.InviteRequest("ghost@pmt.com", Role.MEMBER)))
                .isInstanceOf(NotFoundException.class);
    }

    @Test
    void listByUser_success() {
        when(projectRepository.findAllByUserId(1L)).thenReturn(List.of(project));
        List<ProjectDto.Response> list = projectService.listByUser(1L);
        assertThat(list).hasSize(1);
    }

    @Test
    void ensureCanWrite_observer_forbidden() {
        ProjectMember pm = new ProjectMember(bob, project, Role.OBSERVER);
        when(memberRepository.findByUserIdAndProjectId(2L, 10L))
                .thenReturn(Optional.of(pm));

        assertThatThrownBy(() -> projectService.ensureCanWrite(2L, 10L))
                .isInstanceOf(ForbiddenException.class);
    }

    @Test
    void ensureCanWrite_member_ok() {
        ProjectMember pm = new ProjectMember(bob, project, Role.MEMBER);
        when(memberRepository.findByUserIdAndProjectId(2L, 10L))
                .thenReturn(Optional.of(pm));

        projectService.ensureCanWrite(2L, 10L); // ne throw pas
    }

    @Test
    void listMembers_success() {
        when(memberRepository.existsByUserIdAndProjectId(1L, 10L)).thenReturn(true);
        ProjectMember pm = new ProjectMember(alice, project, Role.ADMIN);
        pm.setId(1L);
        when(memberRepository.findByProjectId(10L)).thenReturn(List.of(pm));

        List<ProjectDto.MemberResponse> members = projectService.listMembers(10L, 1L);
        assertThat(members).hasSize(1);
        assertThat(members.get(0).role()).isEqualTo(Role.ADMIN);
    }
}
