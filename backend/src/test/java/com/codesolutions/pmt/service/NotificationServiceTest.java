package com.codesolutions.pmt.service;

import com.codesolutions.pmt.dto.NotificationDto;
import com.codesolutions.pmt.entity.*;
import com.codesolutions.pmt.exception.ForbiddenException;
import com.codesolutions.pmt.exception.NotFoundException;
import com.codesolutions.pmt.repository.NotificationRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock private NotificationRepository notificationRepository;
    @InjectMocks private NotificationService notificationService;

    @Test
    void listForUser() {
        User u = new User("a", "a@a.com", "h"); u.setId(1L);
        Notification n = new Notification(u, null, "hello");
        n.setId(1L);
        when(notificationRepository.findByUserIdOrderByCreatedAtDesc(1L))
                .thenReturn(List.of(n));

        List<NotificationDto.Response> result = notificationService.listForUser(1L);
        assertThat(result).hasSize(1);
        assertThat(result.get(0).message()).isEqualTo("hello");
    }

    @Test
    void countUnread() {
        when(notificationRepository.countByUserIdAndIsReadFalse(1L)).thenReturn(3L);
        assertThat(notificationService.countUnread(1L)).isEqualTo(3L);
    }

    @Test
    void markAsRead_success() {
        User u = new User("a", "a@a.com", "h"); u.setId(1L);
        Notification n = new Notification(u, null, "x");
        n.setId(10L);
        when(notificationRepository.findById(10L)).thenReturn(Optional.of(n));

        notificationService.markAsRead(10L, 1L);

        assertThat(n.isRead()).isTrue();
        verify(notificationRepository).save(n);
    }

    @Test
    void markAsRead_notOwner_forbidden() {
        User u = new User("a", "a@a.com", "h"); u.setId(1L);
        Notification n = new Notification(u, null, "x");
        n.setId(10L);
        when(notificationRepository.findById(10L)).thenReturn(Optional.of(n));

        assertThatThrownBy(() -> notificationService.markAsRead(10L, 99L))
                .isInstanceOf(ForbiddenException.class);
    }

    @Test
    void markAsRead_notFound() {
        when(notificationRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> notificationService.markAsRead(999L, 1L))
                .isInstanceOf(NotFoundException.class);
    }
}
