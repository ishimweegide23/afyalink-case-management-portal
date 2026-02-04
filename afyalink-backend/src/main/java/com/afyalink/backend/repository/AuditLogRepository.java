package com.afyalink.backend.repository;

import com.afyalink.backend.model.AuditLog;
import com.afyalink.backend.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    Page<AuditLog> findByUser(User user, Pageable pageable);
    Page<AuditLog> findByObjectType(String objectType, Pageable pageable);
    Page<AuditLog> findByObjectTypeAndObjectId(String objectType, String objectId, Pageable pageable);
    Page<AuditLog> findAll(Pageable pageable);

    @Query(value =
        "SELECT * FROM audit_logs al WHERE " +
        "(:keyword = '' OR LOWER(al.action::text) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
        "   OR LOWER(al.object_type::text) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
        "   OR LOWER(al.object_id::text) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
        "AND (:action = '' OR al.action = :action) " +
        "AND (:entityType = '' OR al.object_type = :entityType) " +
        "AND (:userId = -1 OR al.user_id = :userId) " +
        "AND al.created_at >= :startDate " +
        "AND al.created_at <= :endDate",
        countQuery =
        "SELECT COUNT(*) FROM audit_logs al WHERE " +
        "(:keyword = '' OR LOWER(al.action::text) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
        "   OR LOWER(al.object_type::text) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
        "   OR LOWER(al.object_id::text) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
        "AND (:action = '' OR al.action = :action) " +
        "AND (:entityType = '' OR al.object_type = :entityType) " +
        "AND (:userId = -1 OR al.user_id = :userId) " +
        "AND al.created_at >= :startDate " +
        "AND al.created_at <= :endDate",
        nativeQuery = true)
    Page<AuditLog> findWithFilters(@Param("keyword") String keyword,
                                   @Param("action") String action,
                                   @Param("entityType") String entityType,
                                   @Param("userId") Long userId,
                                   @Param("startDate") LocalDateTime startDate,
                                   @Param("endDate") LocalDateTime endDate,
                                   Pageable pageable);

    @Query(value =
        "SELECT * FROM audit_logs al WHERE " +
        "LOWER(al.action::text) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
        "OR LOWER(al.object_type::text) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
        "OR LOWER(al.object_id::text) LIKE LOWER(CONCAT('%', :keyword, '%'))",
        countQuery =
        "SELECT COUNT(*) FROM audit_logs al WHERE " +
        "LOWER(al.action::text) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
        "OR LOWER(al.object_type::text) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
        "OR LOWER(al.object_id::text) LIKE LOWER(CONCAT('%', :keyword, '%'))",
        nativeQuery = true)
    Page<AuditLog> searchAuditLogs(@Param("keyword") String keyword, Pageable pageable);

    @Query(value = "SELECT COUNT(*) FROM audit_logs WHERE DATE(created_at) = CURRENT_DATE", nativeQuery = true)
    long countTodayLogs();

    @Query("SELECT COUNT(DISTINCT a.user) FROM AuditLog a WHERE a.user IS NOT NULL")
    long countUniqueUsers();

    @Query(value = "SELECT object_type FROM audit_logs GROUP BY object_type ORDER BY COUNT(id) DESC LIMIT 1", nativeQuery = true)
    String findMostActiveEntity();
}
