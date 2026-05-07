package com.codesolutions.pmt.dto;

import com.codesolutions.pmt.entity.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public class ProjectDto {

    public record CreateRequest(
        @NotBlank @Size(max = 100) String name,
        String description
    ) {}

    public record InviteRequest(
        @NotBlank @Email String email,
        @NotNull Role role
    ) {}

    public record Response(
        Long id,
        String name,
        String description,
        String createdByUsername,
        LocalDateTime createdAt
    ) {}

    public record MemberResponse(
        Long id,
        Long userId,
        String username,
        String email,
        Role role
    ) {}
}
