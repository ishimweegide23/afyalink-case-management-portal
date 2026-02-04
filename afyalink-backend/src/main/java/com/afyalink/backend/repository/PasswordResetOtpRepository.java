package com.afyalink.backend.repository;

import com.afyalink.backend.model.PasswordResetOtp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface PasswordResetOtpRepository extends JpaRepository<PasswordResetOtp, Long> {

    Optional<PasswordResetOtp> findByEmailAndOtpAndUsedFalseAndExpiresAtAfter(
            String email, String otp, LocalDateTime now);

    void deleteByEmail(String email);
}
