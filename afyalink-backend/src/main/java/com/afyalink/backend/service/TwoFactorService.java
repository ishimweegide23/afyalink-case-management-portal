package com.afyalink.backend.service;

import com.afyalink.backend.exception.BadRequestException;
import com.afyalink.backend.model.OtpCode;
import com.afyalink.backend.model.User;
import com.afyalink.backend.repository.OtpCodeRepository;
import com.afyalink.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class TwoFactorService {

    private final UserRepository userRepository;
    private final OtpCodeRepository otpCodeRepository;
    private final EmailService emailService;
    
    @Value("${app.2fa.otp.length:6}")
    private int otpLength;
    
    @Value("${app.2fa.otp.expiry-minutes:10}")
    private int expiryMinutes;
    
    @Value("${app.2fa.max-attempts:5}")
    private int maxAttempts;
    
    @Value("${app.2fa.resend-cooldown-seconds:60}")
    private int resendCooldownSeconds;
    
    private static final SecureRandom secureRandom = new SecureRandom();
    
    /**
     * Generate OTP code
     */
    private String generateOtpCode() {
        int code = 100000 + secureRandom.nextInt(900000);
        return String.valueOf(code);
    }
    
    /**
     * Send OTP for login 2FA
     */
    @Transactional
    public void sendLoginOtp(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new BadRequestException("User not found"));
        
        // Check cooldown (prevent spam)
        long recentCodes = otpCodeRepository.countByUserAndPurposeAndCreatedAtAfter(
            user, "LOGIN_2FA", LocalDateTime.now().minusSeconds(resendCooldownSeconds));
        
        if (recentCodes > 0) {
            throw new BadRequestException("Please wait " + resendCooldownSeconds + " seconds before requesting another code");
        }
        
        // Invalidate old unused codes
        otpCodeRepository.invalidateAllCodesForUser(user, "LOGIN_2FA");
        
        // Generate new OTP
        String code = generateOtpCode();
        
        // Save to database
        OtpCode otpCode = OtpCode.builder()
            .user(user)
            .code(code)
            .purpose("LOGIN_2FA")
            .expiresAt(LocalDateTime.now().plusMinutes(expiryMinutes))
            .isUsed(false)
            .attempts(0)
            .build();
        otpCodeRepository.save(otpCode);
        
        // Send email
        emailService.sendTwoFactorLoginOtp(user.getEmail(), code, expiryMinutes);
        
        log.info("Login OTP sent to user: {}", user.getEmail());
    }
    
    /**
     * Verify OTP for login
     */
    @Transactional
    public boolean verifyLoginOtp(Long userId, String enteredCode) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new BadRequestException("User not found"));
        
        // Find valid OTP
        OtpCode otpCode = otpCodeRepository
            .findByUserAndCodeAndPurposeAndIsUsedFalseAndExpiresAtAfter(
                user, enteredCode, "LOGIN_2FA", LocalDateTime.now())
            .orElse(null);
        
        if (otpCode == null) {
            throw new BadRequestException("Invalid or expired verification code");
        }
        
        // Check attempts
        if (otpCode.getAttempts() >= maxAttempts) {
            otpCode.setUsed(true);
            otpCodeRepository.save(otpCode);
            throw new BadRequestException("Too many failed attempts. Please request a new code.");
        }
        
        // Increment attempts
        otpCode.setAttempts(otpCode.getAttempts() + 1);
        otpCodeRepository.save(otpCode);
        
        // Mark as used
        otpCode.setUsed(true);
        otpCodeRepository.save(otpCode);
        
        return true;
    }
    
    /**
     * Enable 2FA for user (after setup verification)
     */
    @Transactional
    public void enableTwoFactor(Long userId, String code) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new BadRequestException("User not found"));
        
        // Verify setup code
        OtpCode otpCode = otpCodeRepository
            .findByUserAndCodeAndPurposeAndIsUsedFalseAndExpiresAtAfter(
                user, code, "SETUP_2FA", LocalDateTime.now())
            .orElseThrow(() -> new BadRequestException("Invalid verification code"));
        
        // Mark code as used
        otpCode.setUsed(true);
        otpCodeRepository.save(otpCode);
        
        // Enable 2FA
        user.setTwoFactorEnabled(true);
        user.setTwoFactorMethod("EMAIL");
        user.setTwoFactorVerifiedAt(LocalDateTime.now());
        userRepository.save(user);
        
        log.info("2FA enabled for user: {}", user.getEmail());
    }
    
    /**
     * Send setup OTP (when user wants to enable 2FA)
     */
    @Transactional
    public void sendSetupOtp(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new BadRequestException("User not found"));
        
        // Invalidate old setup codes
        otpCodeRepository.invalidateAllCodesForUser(user, "SETUP_2FA");
        
        // Generate new OTP
        String code = generateOtpCode();
        
        // Save to database
        OtpCode otpCode = OtpCode.builder()
            .user(user)
            .code(code)
            .purpose("SETUP_2FA")
            .expiresAt(LocalDateTime.now().plusMinutes(expiryMinutes))
            .isUsed(false)
            .attempts(0)
            .build();
        otpCodeRepository.save(otpCode);
        
        // Send email
        emailService.sendTwoFactorSetupOtp(user.getEmail(), code, expiryMinutes);
        
        log.info("Setup OTP sent to user: {}", user.getEmail());
    }
    
    /**
     * Disable 2FA for user
     */
    @Transactional
    public void disableTwoFactor(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new BadRequestException("User not found"));
        
        user.setTwoFactorEnabled(false);
        user.setTwoFactorMethod(null);
        user.setTwoFactorVerifiedAt(null);
        userRepository.save(user);
        
        // Invalidate all pending OTPs
        otpCodeRepository.invalidateAllCodesForUser(user, "LOGIN_2FA");
        otpCodeRepository.invalidateAllCodesForUser(user, "SETUP_2FA");
        
        log.info("2FA disabled for user: {}", user.getEmail());
    }
    
    /**
     * Get 2FA status
     */
    public boolean isTwoFactorEnabled(Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        return user != null && user.isTwoFactorEnabled();
    }
}
