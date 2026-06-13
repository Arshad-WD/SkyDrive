package com.skydrive.skydrive.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.skydrive.skydrive.dto.auth.AuthResponse;
import com.skydrive.skydrive.dto.auth.LoginRequest;
import com.skydrive.skydrive.dto.auth.RegisterRequest;
import com.skydrive.skydrive.entity.User;
import com.skydrive.skydrive.exception.AccessDeniedException;
import com.skydrive.skydrive.repository.UserRepository;
import com.skydrive.skydrive.security.JwtService;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Service
public class AuthService {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final FolderService folderService;

    public User register(RegisterRequest request){

        User user = User.builder()
            .name(request.getName())
            .email(request.getEmail())
            .password(passwordEncoder.encode(request.getPassword()))
            .build();

        User savedUser = userRepository.save(user);
        folderService.createDefaultFolders(savedUser);

        return savedUser;
    }

    public AuthResponse login(LoginRequest request){

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow();

        boolean matches = passwordEncoder.matches(
            request.getPassword(), user.getPassword());

        if(!matches){
            throw new AccessDeniedException("Invalid Credentials");
        }

        String token = jwtService.generateToken(user.getEmail());

        return new AuthResponse(token);
    }
}
