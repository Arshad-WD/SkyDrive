package com.skydrive.skydrive.dto.auth;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class RegisterRequest {
    
    @NotBlank(message = "Name is required")
    private String name;

    @Email(message = "Invalid email")
    @NotBlank(message = "Email is requied")
    private String email;

    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;
}
