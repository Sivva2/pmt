package com.codesolutions.pmt.dto;

import com.codesolutions.pmt.entity.Priority;
import com.codesolutions.pmt.entity.Status;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class TaskDto {

    public record CreateRequest(
        @NotBlank @Size(max = 150) String name,
        String description,
        Priority priority,
        Status status,
        LocalDate dueDate,
        Long assigneeId
    ) {}

    public record UpdateRequest(
        String name,
        String description,
        Priority priority,
        Status status,
        LocalDate dueDate,
        Long assigneeId
    ) {}

    public record Response(
        Long id,
        String name,
        String description,
        Priority priority,
        Status status,
        LocalDate dueDate,
        Long projectId,
        Long assigneeId,
        String assigneeUsername,
        String createdByUsername,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
    ) {}

    public record HistoryResponse(
        Long id,
        String username,
        String fieldChanged,
        String oldValue,
        String newValue,
        LocalDateTime changedAt
    ) {}
}
