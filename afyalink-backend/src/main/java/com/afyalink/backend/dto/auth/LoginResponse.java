package com.afyalink.backend.dto.auth;

import com.afyalink.backend.enums.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class LoginResponse {
    private String token;
    @Builder.Default
    private String tokenType = "Bearer";
    private Long userId;
    private String fullName;
    private String email;
    private UserRole role;
    private long expiresIn;
    private boolean requiresTwoFactor;
    private String message;
}
