package com.afyalink.backend.repository;

import com.afyalink.backend.model.Report;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ReportRepository extends JpaRepository<Report, Long> {

    Page<Report> findByGeneratedBy_Id(Long userId, Pageable pageable);

    Page<Report> findByGeneratedBy_IdAndReportType(Long userId, String reportType, Pageable pageable);

    Page<Report> findByGeneratedBy_IdAndReportTypeAndStatus(Long userId, String reportType, String status, Pageable pageable);

    Page<Report> findByTargetUser_Id(Long targetUserId, Pageable pageable);

    @Query("SELECT r FROM Report r WHERE r.generatedBy.id IN :userIds ORDER BY r.createdAt DESC")
    Page<Report> findByGeneratedBy_IdIn(@Param("userIds") List<Long> userIds, Pageable pageable);

    @Query("SELECT r FROM Report r WHERE r.generatedBy.id IN :userIds AND r.periodStart <= :periodEnd AND r.periodEnd >= :periodStart ORDER BY r.createdAt DESC")
    Page<Report> findByGeneratedBy_IdInAndPeriodBetween(@Param("userIds") List<Long> userIds, @Param("periodStart") LocalDate periodStart, @Param("periodEnd") LocalDate periodEnd, Pageable pageable);

    @Query("SELECT r FROM Report r WHERE r.generatedBy.id IN :userIds AND r.reportType = :reportType ORDER BY r.createdAt DESC")
    Page<Report> findByGeneratedBy_IdInAndReportType(@Param("userIds") List<Long> userIds, @Param("reportType") String reportType, Pageable pageable);

    @Query("SELECT r FROM Report r WHERE r.generatedBy.id IN :userIds AND r.status = :status ORDER BY r.createdAt DESC")
    Page<Report> findByGeneratedBy_IdInAndStatus(@Param("userIds") List<Long> userIds, @Param("status") String status, Pageable pageable);

    @Query("SELECT r FROM Report r WHERE r.generatedBy.id IN :userIds AND r.reportType = :reportType AND r.status = :status ORDER BY r.createdAt DESC")
    Page<Report> findByGeneratedBy_IdInAndReportTypeAndStatus(@Param("userIds") List<Long> userIds, @Param("reportType") String reportType, @Param("status") String status, Pageable pageable);

    @Query("SELECT r FROM Report r WHERE LOWER(r.title) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(r.narrative) LIKE LOWER(CONCAT('%', :q, '%'))")
    Page<Report> searchReports(@Param("q") String query, Pageable pageable);

    @Query("SELECT r FROM Report r WHERE r.periodStart <= :end AND r.periodEnd >= :start")
    Page<Report> findByPeriodBetween(@Param("start") LocalDate start, @Param("end") LocalDate end, Pageable pageable);

    @Query("SELECT r FROM Report r WHERE r.status = :status AND r.periodStart <= :end AND r.periodEnd >= :start ORDER BY r.generatedBy.id, r.periodStart")
    List<Report> findByStatusAndPeriodOverlap(@Param("status") String status, @Param("start") LocalDate start, @Param("end") LocalDate end);

    Page<Report> findByGeneratedBy_IdAndStatus(Long userId, String status, Pageable pageable);

    @Query("SELECT COUNT(r) FROM Report r WHERE r.generatedBy.id = :userId AND r.status = 'SUBMITTED' AND r.periodStart <= :periodEnd AND r.periodEnd >= :periodStart")
    long countSubmittedByUserInPeriod(@Param("userId") Long userId, @Param("periodStart") LocalDate periodStart, @Param("periodEnd") LocalDate periodEnd);
}
