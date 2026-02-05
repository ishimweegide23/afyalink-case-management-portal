package com.afyalink.backend.service;

import com.afyalink.backend.dto.auth.*;
import com.afyalink.backend.exception.BadRequestException;
import com.afyalink.backend.exception.DuplicateResourceException;
import com.afyalink.backend.model.PasswordResetOtp;
import com.afyalink.backend.model.User;
import com.afyalink.backend.model.UserProfile;
import com.afyalink.backend.repository.PasswordResetOtpRepository;
import com.afyalink.backend.repository.UserProfileRepository;
import com.afyalink.backend.repository.UserRepository;
import com.afyalink.backend.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Collections;
import java.time.LocalDateTime;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuditLogService auditLogService;
    private final PasswordResetOtpRepository passwordResetOtpRepository;
    private final TwoFactorService twoFactorService;
    private final EmailService emailService;

    private static final int OTP_EXPIRY_MINUTES = 10;

    // ─────────────────────────────────────────────────────────────────
    // LOGIN
    // ─────────────────────────────────────────────────────────────────
    @Transactional
    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new BadRequestException("Invalid credentials"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Invalid credentials");
        }

        if (!user.isActive()) {
            throw new BadRequestException("Your account has been deactivated. Contact your administrator.");
        }

        // If 2FA is enabled → send OTP and stop here
        if (user.isTwoFactorEnabled()) {
            twoFactorService.sendLoginOtp(user.getId());
            return LoginResponse.builder()
                .requiresTwoFactor(true)
                .userId(user.getId())
                .email(user.getEmail())
                .message("A verification code has been sent to your email.")
                .build();
        }

        // Normal login (no 2FA)
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));
        SecurityContextHolder.getContext().setAuthentication(authentication);
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();

        String token = jwtTokenProvider.generateToken(userDetails);
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        return LoginResponse.builder()
            .requiresTwoFactor(false)
            .token(token)
            .tokenType("Bearer")
            .userId(user.getId())
            .fullName(user.getFullName())
            .email(user.getEmail())
            .role(user.getRole())
            .expiresIn(jwtTokenProvider.getExpirationTime())
            .build();
    }

    // ─────────────────────────────────────────────────────────────────
    // 2FA VERIFY LOGIN  (called after OTP entered on 2FA page)
    // ─────────────────────────────────────────────────────────────────
    @Transactional
    public LoginResponse verifyTwoFactorLogin(Long userId, String code) {
        // Validate OTP (throws if invalid / expired / too many attempts)
        twoFactorService.verifyLoginOtp(userId, code);

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new BadRequestException("User not found"));

        // Build a lightweight UserDetails to generate the JWT
        UserDetails userDetails = org.springframework.security.core.userdetails.User.builder()
            .username(user.getEmail())
            .password(user.getPasswordHash())
            .authorities(Collections.singletonList(
                new SimpleGrantedAuthority("ROLE_" + user.getRole().name())))
            .accountExpired(false)
            .accountLocked(false)
            .credentialsExpired(false)
            .disabled(!user.isActive())
            .build();

        String token = jwtTokenProvider.generateToken(userDetails);
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        return LoginResponse.builder()
            .requiresTwoFactor(false)
            .token(token)
            .tokenType("Bearer")
            .userId(user.getId())
            .fullName(user.getFullName())
            .email(user.getEmail())
            .role(user.getRole())
            .expiresIn(jwtTokenProvider.getExpirationTime())
            .build();
    }

    // ─────────────────────────────────────────────────────────────────
    // REGISTER
    // ─────────────────────────────────────────────────────────────────
    @Transactional
    public LoginResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email already registered");
        }
        if (request.getRole() == com.afyalink.backend.enums.UserRole.ADMIN) {
            throw new BadRequestException("Admin accounts cannot be created via registration");
        }

        User user = User.builder()
            .fullName(request.getFullName())
            .email(request.getEmail())
            .passwordHash(passwordEncoder.encode(request.getPassword()))
            .role(request.getRole())
            .phoneNumber(request.getPhoneNumber())
            .isActive(true)
            .build();
        user = userRepository.saveAndFlush(user);

        UserProfile profile = new UserProfile();
        profile.setUser(user);
        profile.setDepartment(
            request.getDepartment() != null && !request.getDepartment().isBlank()
                ? request.getDepartment() : null);
        profile.setJobTitle(
            request.getJobTitle() != null && !request.getJobTitle().isBlank()
                ? request.getJobTitle() : null);
        profile.setAvatarInitials(getInitials(user.getFullName()));
        userProfileRepository.saveAndFlush(profile);

        auditLogService.log(user.getId(), "REGISTER", "User",
            String.valueOf(user.getId()), null, user.getEmail());

        UserDetails userDetails = org.springframework.security.core.userdetails.User.builder()
            .username(user.getEmail())
            .password(user.getPasswordHash())
            .authorities(Collections.singletonList(
                new SimpleGrantedAuthority("ROLE_" + user.getRole().name())))
            .accountExpired(false)
            .accountLocked(false)
            .credentialsExpired(false)
            .disabled(!user.isActive())
            .build();

        String token = jwtTokenProvider.generateToken(userDetails);
        return LoginResponse.builder()
            .token(token)
            .tokenType("Bearer")
            .userId(user.getId())
            .fullName(user.getFullName())
            .email(user.getEmail())
            .role(user.getRole())
            .expiresIn(jwtTokenProvider.getExpirationTime())
            .build();
    }

    // ─────────────────────────────────────────────────────────────────
    // CHANGE PASSWORD
    // ─────────────────────────────────────────────────────────────────
    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new BadRequestException("User not found"));
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Current password is incorrect");
        }
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        auditLogService.log(userId, "UPDATE", "User", String.valueOf(userId), null, "password changed");
    }

    // ─────────────────────────────────────────────────────────────────
    // FORGOT PASSWORD  — now sends OTP by email
    // ─────────────────────────────────────────────────────────────────
    @Transactional
    public void requestPasswordResetOtp(String email) {
        String normalizedEmail = email != null ? email.trim().toLowerCase() : "";
        if (normalizedEmail.isBlank()) {
            throw new BadRequestException("Email is required");
        }
        if (!userRepository.existsByEmail(normalizedEmail)) {
            throw new BadRequestException("No account found with this email");
        }
        passwordResetOtpRepository.deleteByEmail(normalizedEmail);

        String otp = String.format("%06d", ThreadLocalRandom.current().nextInt(0, 1_000_000));
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES);

        PasswordResetOtp entity = PasswordResetOtp.builder()
            .email(normalizedEmail)
            .otp(otp)
            .expiresAt(expiresAt)
            .used(false)
            .build();
        passwordResetOtpRepository.save(entity);

        // Send OTP via email
        try {
            emailService.sendPasswordResetOtp(normalizedEmail, otp, OTP_EXPIRY_MINUTES);
            log.info("Password reset OTP email sent to: {}", normalizedEmail);
        } catch (Exception ex) {
            log.error("Failed to send password reset OTP email to {}: {}", normalizedEmail, ex.getMessage());
            // Still log to terminal as fallback so devs can test
            log.warn("FALLBACK – OTP for {} : {} (valid {} min)", normalizedEmail, otp, OTP_EXPIRY_MINUTES);
        }
    }

    // ─────────────────────────────────────────────────────────────────
    // VERIFY OTP
    // ─────────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public void verifyOtp(String email, String otp) {
        String normalizedEmail = email != null ? email.trim().toLowerCase() : "";
        if (normalizedEmail.isBlank() || otp == null || otp.length() != 6) {
            throw new BadRequestException("Email and 6-digit OTP are required");
        }
        boolean valid = passwordResetOtpRepository
            .findByEmailAndOtpAndUsedFalseAndExpiresAtAfter(
                normalizedEmail, otp.trim(), LocalDateTime.now())
            .isPresent();
        if (!valid) {
            throw new BadRequestException("Invalid or expired OTP. Please request a new code.");
        }
    }

    // ─────────────────────────────────────────────────────────────────
    // RESET PASSWORD
    // ─────────────────────────────────────────────────────────────────
    @Transactional
    public void resetPassword(String email, String otp, String newPassword) {
        String normalizedEmail = email != null ? email.trim().toLowerCase() : "";
        if (normalizedEmail.isBlank() || otp == null || otp.length() != 6) {
            throw new BadRequestException("Email and 6-digit OTP are required");
        }
        if (newPassword == null || newPassword.length() < 6) {
            throw new BadRequestException("New password must be at least 6 characters");
        }

        PasswordResetOtp otpEntity = passwordResetOtpRepository
            .findByEmailAndOtpAndUsedFalseAndExpiresAtAfter(
                normalizedEmail, otp.trim(), LocalDateTime.now())
            .orElseThrow(() -> new BadRequestException("Invalid or expired OTP. Please request a new code."));

        User user = userRepository.findByEmail(normalizedEmail)
            .orElseThrow(() -> new BadRequestException("User not found"));
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        otpEntity.setUsed(true);
        passwordResetOtpRepository.save(otpEntity);

        auditLogService.log(user.getId(), "PASSWORD_RESET", "User",
            String.valueOf(user.getId()), null, "password reset via OTP");
    }

    // ─────────────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────────────
    private String getInitials(String fullName) {
        if (fullName == null || fullName.isBlank()) return "?";
        String[] parts = fullName.trim().split("\\s+");
        if (parts.length == 1) return parts[0].substring(0, 1).toUpperCase();
        return (parts[0].substring(0, 1) + parts[parts.length - 1].substring(0, 1)).toUpperCase();
    }
}
