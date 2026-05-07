package com.codesolutions.pmt.dto;

import java.time.LocalDateTime;

public class NotificationDto {

    public record Response(
        Long id,
        Long taskId,
        String message,
        boolean isRead,
        LocalDateTime createdAt
    ) {}
}
