package com.afyalink.backend.controller;

import com.afyalink.backend.dto.auth.ChangePasswordRequest;
import com.afyalink.backend.dto.auth.ForgotPasswordRequest;
import com.afyalink.backend.dto.auth.LoginRequest;
import com.afyalink.backend.dto.auth.LoginResponse;
import com.afyalink.backend.dto.auth.RegisterRequest;
import com.afyalink.backend.dto.auth.ResetPasswordRequest;
import com.afyalink.backend.dto.auth.VerifyOtpRequest;
import com.afyalink.backend.dto.common.ApiResponse;
import com.afyalink.backend.security.CustomUserDetailsService;
import com.afyalink.backend.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final CustomUserDetailsService customUserDetailsService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(ApiResponse.success(authService.login(request)));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<LoginResponse>> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Account created successfully", authService.register(request)));
    }

    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        Long userId = customUserDetailsService.getUserIdFromUserDetails(
                (org.springframework.security.core.userdetails.UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal());
        authService.changePassword(userId, request);
        return ResponseEntity.ok(ApiResponse.success("Password updated", null));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.requestPasswordResetOtp(request.getEmail());
        return ResponseEntity.ok(ApiResponse.success("If an account exists with this email, a 6-digit OTP has been generated. Check the server terminal for the code.", null));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse<Void>> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        authService.verifyOtp(request.getEmail(), request.getOtp());
        return ResponseEntity.ok(ApiResponse.success("OTP verified. You can now set a new password.", null));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request.getEmail(), request.getOtp(), request.getNewPassword());
        return ResponseEntity.ok(ApiResponse.success("Password reset successfully. You can now sign in.", null));
    }
}
