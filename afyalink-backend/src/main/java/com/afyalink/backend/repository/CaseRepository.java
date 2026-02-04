package com.afyalink.backend.repository;

import com.afyalink.backend.enums.CasePriority;
import com.afyalink.backend.enums.CaseStatus;
import com.afyalink.backend.model.Case;
import com.afyalink.backend.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface CaseRepository extends JpaRepository<Case, Long> {
    Optional<Case> findByCaseNumber(String caseNumber);
    boolean existsByCaseNumber(String caseNumber);
    Page<Case> findByStatus(CaseStatus status, Pageable pageable);
    Page<Case> findByPriority(CasePriority priority, Pageable pageable);
    Page<Case> findByAssignedSocialWorker(User user, Pageable pageable);
    Page<Case> findByCreatedBy(User user, Pageable pageable);
    Page<Case> findByStatusAndPriority(CaseStatus status, CasePriority priority, Pageable pageable);
    Page<Case> findByAssignedSocialWorkerAndStatus(User user, CaseStatus status, Pageable pageable);
    long countByStatus(CaseStatus status);
    long countByAssignedSocialWorker(User user);
    long countByAssignedSocialWorkerAndStatus(User user, CaseStatus status);

    @Query("SELECT c FROM Case c WHERE " +
           "LOWER(c.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(c.caseNumber) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(c.beneficiaryName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(c.beneficiaryIdentifier) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    Page<Case> searchCases(@Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT c FROM Case c WHERE c.assignedSocialWorker = :worker AND (" +
           "LOWER(c.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(c.caseNumber) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(c.beneficiaryName) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Case> searchCasesByWorker(@Param("worker") User worker,
                                   @Param("keyword") String keyword,
                                   Pageable pageable);

    long countByAssignedSocialWorkerAndCreatedAtBetween(User assignedSocialWorker, LocalDateTime start, LocalDateTime end);

    long countByAssignedSocialWorkerAndStatusAndClosedAtBetween(User assignedSocialWorker, CaseStatus status, LocalDateTime start, LocalDateTime end);

    Page<Case> findByAssignedSocialWorker_Supervisor_Id(Long supervisorId, Pageable pageable);

    Page<Case> findByAssignedSocialWorker_Supervisor_IdAndStatus(Long supervisorId, CaseStatus status, Pageable pageable);

    @Query("SELECT c FROM Case c WHERE c.assignedSocialWorker.supervisor.id = :supervisorId AND (" +
           "LOWER(c.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(c.caseNumber) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(c.beneficiaryName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(c.beneficiaryIdentifier) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Case> searchCasesBySupervisorTeam(@Param("supervisorId") Long supervisorId, @Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT c FROM Case c WHERE c.assignedSocialWorker = :worker AND " +
           "(:district IS NULL OR :district = '' OR LOWER(c.assignedSocialWorker.district) = LOWER(:district))")
    Page<Case> findByWorkerInDistrict(@Param("worker") User worker,
                                      @Param("district") String district,
                                      Pageable pageable);

    @Query("SELECT c FROM Case c WHERE c.assignedSocialWorker = :worker AND c.status = :status AND " +
           "(:district IS NULL OR :district = '' OR LOWER(c.assignedSocialWorker.district) = LOWER(:district))")
    Page<Case> findByWorkerInDistrictAndStatus(@Param("worker") User worker,
                                               @Param("district") String district,
                                               @Param("status") CaseStatus status,
                                               Pageable pageable);

    @Query("SELECT c FROM Case c WHERE c.assignedSocialWorker.supervisor.id = :supervisorId AND c.status = :status AND " +
           "(:district IS NULL OR :district = '' OR LOWER(c.assignedSocialWorker.district) = LOWER(:district))")
    Page<Case> findBySupervisorTeamInDistrictAndStatus(@Param("supervisorId") Long supervisorId,
                                                       @Param("district") String district,
                                                       @Param("status") CaseStatus status,
                                                       Pageable pageable);

    @Query("SELECT c FROM Case c WHERE c.assignedSocialWorker = :worker AND " +
           "c.assignedSocialWorker.district IS NOT NULL AND LOWER(c.assignedSocialWorker.district) = LOWER(:district)")
    List<Case> findCasesByWorkerDistrict(@Param("worker") User worker, @Param("district") String district);

    @Query("SELECT c FROM Case c WHERE c.assignedSocialWorker.supervisor.id = :supervisorId AND " +
           "(:district IS NULL OR :district = '' OR LOWER(c.assignedSocialWorker.district) = LOWER(:district))")
    Page<Case> findBySupervisorTeamInDistrict(@Param("supervisorId") Long supervisorId,
                                              @Param("district") String district,
                                              Pageable pageable);

    @Query("SELECT c FROM Case c WHERE c.assignedSocialWorker.supervisor.id = :supervisorId AND " +
           "(:district IS NULL OR :district = '' OR LOWER(c.assignedSocialWorker.district) = LOWER(:district))")
    List<Case> findCasesBySupervisorDistrict(@Param("supervisorId") Long supervisorId,
                                             @Param("district") String district);

    @Query("SELECT COUNT(c) FROM Case c WHERE " +
           "LOWER(c.assignedSocialWorker.district) = LOWER(:district) AND " +
           "LOWER(c.assignedSocialWorker.sector) = LOWER(:sector)")
    long countCasesBySector(@Param("district") String district, @Param("sector") String sector);

    @Query("SELECT c.assignedSocialWorker.district, COUNT(c) FROM Case c " +
           "WHERE c.assignedSocialWorker.district IS NOT NULL GROUP BY c.assignedSocialWorker.district")
    List<Object[]> countCasesByDistrict();

    @Query("SELECT c.priority, COUNT(c) FROM Case c WHERE c.createdAt BETWEEN :start AND :end GROUP BY c.priority")
    List<Object[]> countCasesByPriority(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT c.priority, COUNT(c) FROM Case c WHERE LOWER(c.assignedSocialWorker.district) = LOWER(:district) AND c.createdAt BETWEEN :start AND :end GROUP BY c.priority")
    List<Object[]> countCasesByPriorityAndDistrict(@Param("district") String district, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT c.status, COUNT(c) FROM Case c WHERE c.createdAt BETWEEN :start AND :end GROUP BY c.status")
    List<Object[]> countCasesByStatus(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT c.status, COUNT(c) FROM Case c WHERE LOWER(c.assignedSocialWorker.district) = LOWER(:district) AND c.createdAt BETWEEN :start AND :end GROUP BY c.status")
    List<Object[]> countCasesByStatusAndDistrict(@Param("district") String district, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT CASE WHEN c.progressPercent <= 25 THEN '0-25%' WHEN c.progressPercent <= 50 THEN '26-50%' WHEN c.progressPercent <= 75 THEN '51-75%' ELSE '76-100%' END as band, COUNT(c) FROM Case c GROUP BY band")
    List<Object[]> countCasesByProgressBand();

    @Query("SELECT CASE WHEN c.progressPercent <= 25 THEN '0-25%' WHEN c.progressPercent <= 50 THEN '26-50%' WHEN c.progressPercent <= 75 THEN '51-75%' ELSE '76-100%' END as band, COUNT(c) FROM Case c WHERE LOWER(c.assignedSocialWorker.district) = LOWER(:district) GROUP BY band")
    List<Object[]> countCasesByProgressBandAndDistrict(@Param("district") String district);
}
