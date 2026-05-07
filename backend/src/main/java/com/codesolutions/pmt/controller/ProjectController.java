package com.codesolutions.pmt.controller;

import com.codesolutions.pmt.dto.ProjectDto;
import com.codesolutions.pmt.service.ProjectService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @PostMapping
    public ResponseEntity<ProjectDto.Response> create(
            @RequestHeader("X-User-Id") Long userId,
            @Valid @RequestBody ProjectDto.CreateRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(projectService.create(userId, req));
    }

    @GetMapping
    public ResponseEntity<List<ProjectDto.Response>> list(
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(projectService.listByUser(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProjectDto.Response> get(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long id) {
        return ResponseEntity.ok(projectService.getById(id, userId));
    }

    @GetMapping("/{id}/members")
    public ResponseEntity<List<ProjectDto.MemberResponse>> listMembers(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long id) {
        return ResponseEntity.ok(projectService.listMembers(id, userId));
    }

    @PostMapping("/{id}/members")
    public ResponseEntity<ProjectDto.MemberResponse> invite(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long id,
            @Valid @RequestBody ProjectDto.InviteRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(projectService.inviteMember(id, userId, req));
    }
}
