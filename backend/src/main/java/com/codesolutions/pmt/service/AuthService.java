package com.codesolutions.pmt.service;

import com.codesolutions.pmt.dto.AuthDto;
import com.codesolutions.pmt.entity.User;
import com.codesolutions.pmt.exception.BadRequestException;
import com.codesolutions.pmt.exception.ConflictException;
import com.codesolutions.pmt.repository.UserRepository;
import org.mindrot.jbcrypt.BCrypt;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;

    public AuthService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public AuthDto.UserResponse register(AuthDto.RegisterRequest req) {
        if (userRepository.existsByEmail(req.email())) {
            throw new ConflictException("Email déjà utilisé");
        }
        if (userRepository.existsByUsername(req.username())) {
            throw new ConflictException("Nom d'utilisateur déjà utilisé");
        }

        String hashed = BCrypt.hashpw(req.password(), BCrypt.gensalt(10));
        User user = userRepository.save(new User(req.username(), req.email(), hashed));
        return new AuthDto.UserResponse(user.getId(), user.getUsername(), user.getEmail());
    }

    public AuthDto.UserResponse login(AuthDto.LoginRequest req) {
        User user = userRepository.findByEmail(req.email())
                .orElseThrow(() -> new BadRequestException("Email ou mot de passe incorrect"));

        if (!BCrypt.checkpw(req.password(), user.getPassword())) {
            throw new BadRequestException("Email ou mot de passe incorrect");
        }
        return new AuthDto.UserResponse(user.getId(), user.getUsername(), user.getEmail());
    }
}
