package com.afyalink.backend.repository;

import com.afyalink.backend.model.OtpCode;
import com.afyalink.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

public interface OtpCodeRepository extends JpaRepository<OtpCode, Long> {
    
    Optional<OtpCode> findByUserAndCodeAndPurposeAndIsUsedFalseAndExpiresAtAfter(
        User user, String code, String purpose, LocalDateTime now);
    
    @Modifying
    @Transactional
    @Query("UPDATE OtpCode o SET o.isUsed = true WHERE o.user = :user AND o.purpose = :purpose")
    void invalidateAllCodesForUser(@Param("user") User user, @Param("purpose") String purpose);
    
    long countByUserAndPurposeAndCreatedAtAfter(User user, String purpose, LocalDateTime since);
}
