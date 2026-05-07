package com.codesolutions.pmt.controller;

import com.codesolutions.pmt.dto.TaskDto;
import com.codesolutions.pmt.service.TaskService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @GetMapping("/projects/{projectId}/tasks")
    public ResponseEntity<List<TaskDto.Response>> listByProject(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long projectId) {
        return ResponseEntity.ok(taskService.listByProject(projectId, userId));
    }

    @PostMapping("/projects/{projectId}/tasks")
    public ResponseEntity<TaskDto.Response> create(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long projectId,
            @Valid @RequestBody TaskDto.CreateRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(taskService.create(projectId, userId, req));
    }

    @PutMapping("/tasks/{taskId}")
    public ResponseEntity<TaskDto.Response> update(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long taskId,
            @RequestBody TaskDto.UpdateRequest req) {
        return ResponseEntity.ok(taskService.update(taskId, userId, req));
    }

    @DeleteMapping("/tasks/{taskId}")
    public ResponseEntity<Void> delete(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long taskId) {
        taskService.delete(taskId, userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/tasks/{taskId}/history")
    public ResponseEntity<List<TaskDto.HistoryResponse>> history(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long taskId) {
        return ResponseEntity.ok(taskService.getHistory(taskId, userId));
    }
}
