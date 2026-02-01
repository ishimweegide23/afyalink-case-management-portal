package com.afyalink.backend.controller;

import com.afyalink.backend.dto.common.ApiResponse;
import com.afyalink.backend.dto.auth.TwoFactorVerifyRequest;
import com.afyalink.backend.dto.auth.TwoFactorStatusResponse;
import com.afyalink.backend.security.CustomUserDetailsService;
import com.afyalink.backend.service.TwoFactorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/2fa")
@RequiredArgsConstructor
public class TwoFactorController {

    private final TwoFactorService twoFactorService;
    private final CustomUserDetailsService customUserDetailsService;
    private final com.afyalink.backend.service.AuthService authService;
    
    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            throw new RuntimeException("Not authenticated");
        }
        return customUserDetailsService.getUserIdFromUserDetails((UserDetails) auth.getPrincipal());
    }
    
    /**
     * Send OTP for login (after password verification)
     */
    @PostMapping("/send-login-otp")
    public ResponseEntity<ApiResponse<Void>> sendLoginOtp(@RequestParam Long userId) {
        twoFactorService.sendLoginOtp(userId);
        return ResponseEntity.ok(ApiResponse.success("OTP sent to your email", null));
    }
    
    /**
     * Verify OTP for login
     */
    @PostMapping("/verify-login")
    public ResponseEntity<ApiResponse<com.afyalink.backend.dto.auth.LoginResponse>> verifyLoginOtp(
            @RequestBody TwoFactorVerifyRequest request) {
        com.afyalink.backend.dto.auth.LoginResponse response = authService.verifyTwoFactorLogin(request.getUserId(), request.getCode());
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    /**
     * Send setup OTP (when user enables 2FA in settings)
     */
    @PostMapping("/send-setup-otp")
    public ResponseEntity<ApiResponse<Void>> sendSetupOtp() {
        Long userId = getCurrentUserId();
        twoFactorService.sendSetupOtp(userId);
        return ResponseEntity.ok(ApiResponse.success("Setup OTP sent to your email", null));
    }
    
    /**
     * Enable 2FA after verification
     */
    @PostMapping("/enable")
    public ResponseEntity<ApiResponse<Void>> enableTwoFactor(@RequestBody TwoFactorVerifyRequest request) {
        Long userId = getCurrentUserId();
        twoFactorService.enableTwoFactor(userId, request.getCode());
        return ResponseEntity.ok(ApiResponse.success("Two-factor authentication enabled", null));
    }
    
    /**
     * Disable 2FA
     */
    @PostMapping("/disable")
    public ResponseEntity<ApiResponse<Void>> disableTwoFactor() {
        Long userId = getCurrentUserId();
        twoFactorService.disableTwoFactor(userId);
        return ResponseEntity.ok(ApiResponse.success("Two-factor authentication disabled", null));
    }
    
    /**
     * Get 2FA status
     */
    @GetMapping("/status")
    public ResponseEntity<ApiResponse<TwoFactorStatusResponse>> getTwoFactorStatus() {
        Long userId = getCurrentUserId();
        boolean enabled = twoFactorService.isTwoFactorEnabled(userId);
        return ResponseEntity.ok(ApiResponse.success(new TwoFactorStatusResponse(enabled, "EMAIL")));
    }
}
