package com.codesolutions.pmt.service;

import com.codesolutions.pmt.dto.AuthDto;
import com.codesolutions.pmt.entity.User;
import com.codesolutions.pmt.exception.BadRequestException;
import com.codesolutions.pmt.exception.ConflictException;
import com.codesolutions.pmt.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mindrot.jbcrypt.BCrypt;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private UserRepository userRepository;
    @InjectMocks private AuthService authService;

    private AuthDto.RegisterRequest registerReq;
    private AuthDto.LoginRequest loginReq;

    @BeforeEach
    void setUp() {
        registerReq = new AuthDto.RegisterRequest("alice", "alice@pmt.com", "password");
        loginReq = new AuthDto.LoginRequest("alice@pmt.com", "password");
    }

    @Test
    void register_success() {
        when(userRepository.existsByEmail("alice@pmt.com")).thenReturn(false);
        when(userRepository.existsByUsername("alice")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(1L);
            return u;
        });

        AuthDto.UserResponse resp = authService.register(registerReq);

        assertThat(resp.id()).isEqualTo(1L);
        assertThat(resp.email()).isEqualTo("alice@pmt.com");
        verify(userRepository).save(any(User.class));
    }

    @Test
    void register_emailAlreadyUsed() {
        when(userRepository.existsByEmail("alice@pmt.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(registerReq))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("Email");
    }

    @Test
    void register_usernameAlreadyUsed() {
        when(userRepository.existsByEmail(any())).thenReturn(false);
        when(userRepository.existsByUsername("alice")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(registerReq))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("utilisateur");
    }

    @Test
    void login_success() {
        User u = new User("alice", "alice@pmt.com", BCrypt.hashpw("password", BCrypt.gensalt(4)));
        u.setId(5L);
        when(userRepository.findByEmail("alice@pmt.com")).thenReturn(Optional.of(u));

        AuthDto.UserResponse resp = authService.login(loginReq);

        assertThat(resp.id()).isEqualTo(5L);
        assertThat(resp.username()).isEqualTo("alice");
    }

    @Test
    void login_wrongPassword() {
        User u = new User("alice", "alice@pmt.com", BCrypt.hashpw("other", BCrypt.gensalt(4)));
        when(userRepository.findByEmail("alice@pmt.com")).thenReturn(Optional.of(u));

        assertThatThrownBy(() -> authService.login(loginReq))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void login_unknownEmail() {
        when(userRepository.findByEmail(any())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(loginReq))
                .isInstanceOf(BadRequestException.class);
    }
}
