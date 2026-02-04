package com.afyalink.backend.repository;

import com.afyalink.backend.enums.InterventionStatus;
import com.afyalink.backend.enums.InterventionType;
import com.afyalink.backend.model.Case;
import com.afyalink.backend.model.Intervention;
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
public interface InterventionRepository extends JpaRepository<Intervention, Long> {
    Optional<Intervention> findByInterventionCode(String code);
    boolean existsByInterventionCode(String code);
    Page<Intervention> findAllByDeletedAtIsNull(Pageable pageable);
    Page<Intervention> findByCaseRecord(Case caseRecord, Pageable pageable);
    Page<Intervention> findByStatus(InterventionStatus status, Pageable pageable);
    Page<Intervention> findByType(InterventionType type, Pageable pageable);
    Page<Intervention> findByPlannedBy(User user, Pageable pageable);
    Page<Intervention> findByCaseRecordAndStatus(Case caseRecord, InterventionStatus status, Pageable pageable);
    long countByStatus(InterventionStatus status);
    long countByCaseRecord(Case caseRecord);
    long countByDeletedAtIsNull();

    @Query("SELECT i FROM Intervention i WHERE i.deletedAt IS NULL AND (" +
           "LOWER(i.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(i.interventionCode) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(i.category) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(i.location) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Intervention> searchInterventions(@Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT i FROM Intervention i WHERE i.caseRecord = :caseRecord AND " +
           "i.deletedAt IS NULL AND (" +
           "LOWER(i.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(i.interventionCode) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Intervention> searchByCase(@Param("caseRecord") Case caseRecord,
                                    @Param("keyword") String keyword,
                                    Pageable pageable);

    Page<Intervention> findByPlannedByAndStatus(User plannedBy, InterventionStatus status, Pageable pageable);

    Page<Intervention> findByPlannedByAndPlannedStartDatetimeBetween(User plannedBy, LocalDateTime start, LocalDateTime end, Pageable pageable);

    Page<Intervention> findByPlannedByAndStatusAndPlannedStartDatetimeBetween(User plannedBy, InterventionStatus status, LocalDateTime start, LocalDateTime end, Pageable pageable);

    @Query("SELECT COUNT(i) FROM Intervention i WHERE i.deletedAt IS NULL AND i.plannedBy.id = :userId AND i.createdAt BETWEEN :start AND :end")
    long countByPlannedByAndCreatedAtBetween(@Param("userId") Long userId, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT COUNT(i) FROM Intervention i WHERE i.deletedAt IS NULL AND i.plannedBy.id = :userId AND i.status = :status AND i.createdAt BETWEEN :start AND :end")
    long countByPlannedByAndStatusAndCreatedAtBetween(@Param("userId") Long userId, @Param("status") InterventionStatus status, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT COUNT(i) FROM Intervention i WHERE i.deletedAt IS NULL AND i.caseRecord.assignedSocialWorker.id = :userId AND i.status = :status AND i.updatedAt BETWEEN :start AND :end")
    long countByWorkerAndStatusAndUpdatedAtBetween(@Param("userId") Long userId, @Param("status") InterventionStatus status, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT COUNT(i) FROM Intervention i WHERE i.deletedAt IS NULL AND i.caseRecord.assignedSocialWorker.id = :userId AND i.status = :status AND i.createdAt BETWEEN :start AND :end")
    long countByWorkerAndStatusAndCreatedAtBetween(@Param("userId") Long userId, @Param("status") InterventionStatus status, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT i FROM Intervention i WHERE i.deletedAt IS NULL AND i.caseRecord.assignedSocialWorker.id = :workerId")
    Page<Intervention> findByAssignedWorker(@Param("workerId") Long workerId, Pageable pageable);

    @Query("SELECT i FROM Intervention i WHERE i.deletedAt IS NULL AND i.caseRecord.assignedSocialWorker.id = :workerId AND i.status = :status")
    Page<Intervention> findByAssignedWorkerAndStatus(@Param("workerId") Long workerId, @Param("status") InterventionStatus status, Pageable pageable);

    @Query("SELECT i FROM Intervention i WHERE i.deletedAt IS NULL AND i.caseRecord.assignedSocialWorker.id = :workerId AND i.type = :type")
    Page<Intervention> findByAssignedWorkerAndType(@Param("workerId") Long workerId, @Param("type") InterventionType type, Pageable pageable);

    @Query("SELECT i FROM Intervention i WHERE i.deletedAt IS NULL AND i.caseRecord.assignedSocialWorker.id = :workerId AND (" +
           "LOWER(i.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(i.interventionCode) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(i.category) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(i.location) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Intervention> searchByAssignedWorker(@Param("workerId") Long workerId, @Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT COUNT(i) FROM Intervention i WHERE i.deletedAt IS NULL AND i.caseRecord.assignedSocialWorker.id = :workerId")
    long countByAssignedWorker(@Param("workerId") Long workerId);

    @Query("SELECT COUNT(i) FROM Intervention i WHERE i.deletedAt IS NULL AND i.caseRecord.assignedSocialWorker.id = :workerId AND i.status = :status")
    long countByAssignedWorkerAndStatus(@Param("workerId") Long workerId, @Param("status") InterventionStatus status);

    @Query("SELECT i FROM Intervention i WHERE i.deletedAt IS NULL AND i.caseRecord.assignedSocialWorker.id = :workerId AND i.plannedStartDatetime IS NOT NULL AND i.plannedStartDatetime BETWEEN :start AND :end ORDER BY i.plannedStartDatetime ASC")
    List<Intervention> findByAssignedWorkerAndPlannedStartDatetimeBetween(@Param("workerId") Long workerId, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT i FROM Intervention i WHERE i.deletedAt IS NULL AND i.caseRecord.assignedSocialWorker.supervisor.id = :supervisorId")
    Page<Intervention> findBySupervisorTeam(@Param("supervisorId") Long supervisorId, Pageable pageable);

    @Query("SELECT i FROM Intervention i WHERE i.deletedAt IS NULL AND i.caseRecord.assignedSocialWorker.supervisor.id = :supervisorId AND i.status = :status")
    Page<Intervention> findBySupervisorTeamAndStatus(@Param("supervisorId") Long supervisorId, @Param("status") InterventionStatus status, Pageable pageable);

    @Query("SELECT i FROM Intervention i WHERE i.deletedAt IS NULL AND i.caseRecord.assignedSocialWorker.supervisor.id = :supervisorId AND i.type = :type")
    Page<Intervention> findBySupervisorTeamAndType(@Param("supervisorId") Long supervisorId, @Param("type") InterventionType type, Pageable pageable);

    @Query("SELECT i FROM Intervention i WHERE i.deletedAt IS NULL AND i.caseRecord.assignedSocialWorker.supervisor.id = :supervisorId AND (" +
           "LOWER(i.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(i.interventionCode) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(i.category) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(i.location) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Intervention> searchBySupervisorTeam(@Param("supervisorId") Long supervisorId, @Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT COUNT(i) FROM Intervention i WHERE i.deletedAt IS NULL AND i.caseRecord.assignedSocialWorker.supervisor.id = :supervisorId")
    long countBySupervisorTeam(@Param("supervisorId") Long supervisorId);

    @Query("SELECT COUNT(i) FROM Intervention i WHERE i.deletedAt IS NULL AND i.caseRecord.assignedSocialWorker.supervisor.id = :supervisorId AND i.status = :status")
    long countBySupervisorTeamAndStatus(@Param("supervisorId") Long supervisorId, @Param("status") InterventionStatus status);

    @Query("SELECT i.type, COUNT(i) FROM Intervention i WHERE i.status = 'COMPLETED' AND i.updatedAt BETWEEN :start AND :end GROUP BY i.type")
    List<Object[]> countInterventionsByType(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT i.type, COUNT(i), AVG(i.effectivenessPercent) FROM Intervention i WHERE i.caseRecord.assignedSocialWorker.district = :district AND i.status = 'COMPLETED' AND i.updatedAt BETWEEN :start AND :end GROUP BY i.type")
    List<Object[]> countInterventionsByTypeAndDistrict(@Param("district") String district, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    /** All interventions for a worker's cases that fall within the reporting period (any status). */
    @Query("SELECT i FROM Intervention i WHERE i.deletedAt IS NULL AND i.caseRecord.assignedSocialWorker.id = :workerId " +
           "AND ((i.createdAt BETWEEN :start AND :end) OR (i.updatedAt BETWEEN :start AND :end) " +
           "OR (i.plannedStartDatetime IS NOT NULL AND i.plannedStartDatetime BETWEEN :start AND :end)) " +
           "ORDER BY COALESCE(i.plannedStartDatetime, i.createdAt) ASC")
    List<Intervention> findForWorkerReportPeriod(@Param("workerId") Long workerId, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
