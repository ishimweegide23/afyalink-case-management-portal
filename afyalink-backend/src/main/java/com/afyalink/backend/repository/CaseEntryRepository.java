package com.afyalink.backend.repository;

import com.afyalink.backend.enums.CaseEntryStatus;
import com.afyalink.backend.enums.CaseEntryType;
import com.afyalink.backend.model.Case;
import com.afyalink.backend.model.CaseEntry;
import com.afyalink.backend.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CaseEntryRepository extends JpaRepository<CaseEntry, Long> {
    Page<CaseEntry> findByCaseRecord(Case caseRecord, Pageable pageable);
    Page<CaseEntry> findByCaseRecordAndType(Case caseRecord, CaseEntryType type, Pageable pageable);
    Page<CaseEntry> findByCaseRecordAndStatus(Case caseRecord, CaseEntryStatus status, Pageable pageable);
    Page<CaseEntry> findByAuthor(User author, Pageable pageable);
    List<CaseEntry> findByCaseRecordAndType(Case caseRecord, CaseEntryType type);
    long countByCaseRecord(Case caseRecord);
    long countByCaseRecordAndType(Case caseRecord, CaseEntryType type);
    long countByCaseRecordAndStatus(Case caseRecord, CaseEntryStatus status);
    List<CaseEntry> findByRelatedInterventionId(Long relatedInterventionId);

    @Query("SELECT e FROM CaseEntry e WHERE e.caseRecord = :caseRecord AND " +
           "e.type = :taskType AND e.status <> :completedStatus AND e.dueDate < :today")
    List<CaseEntry> findOverdueTasks(@Param("caseRecord") Case caseRecord,
                                    @Param("taskType") CaseEntryType taskType,
                                    @Param("completedStatus") CaseEntryStatus completedStatus,
                                    @Param("today") LocalDate today);

    @Query("SELECT e FROM CaseEntry e WHERE e.caseRecord = :caseRecord AND (" +
           "LOWER(e.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(e.content) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<CaseEntry> searchEntries(@Param("caseRecord") Case caseRecord,
                                  @Param("keyword") String keyword,
                                  Pageable pageable);

    @Query("SELECT e FROM CaseEntry e WHERE e.caseRecord.assignedSocialWorker.id = :userId AND e.createdAt BETWEEN :start AND :end ORDER BY e.createdAt DESC")
    List<CaseEntry> findByAssignedWorkerAndCreatedAtBetween(@Param("userId") Long userId, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT e FROM CaseEntry e WHERE e.caseRecord.assignedSocialWorker.id = :userId AND e.type = :taskType AND e.status = :completedStatus AND e.completedAt BETWEEN :start AND :end")
    List<CaseEntry> findByAssignedWorkerAndTypeAndStatusAndCompletedAtBetween(@Param("userId") Long userId, @Param("taskType") CaseEntryType taskType, @Param("completedStatus") CaseEntryStatus completedStatus, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT e FROM CaseEntry e WHERE e.caseRecord.assignedSocialWorker.id = :userId AND e.type = :taskType AND e.status <> :completedStatus AND e.dueDate < :today")
    List<CaseEntry> findOverdueTasksByWorker(@Param("userId") Long userId, @Param("taskType") CaseEntryType taskType, @Param("completedStatus") CaseEntryStatus completedStatus, @Param("today") LocalDate today);

    @Query("SELECT e FROM CaseEntry e WHERE e.caseRecord.assignedSocialWorker.id = :userId AND e.type = :taskType AND e.dueDate BETWEEN :start AND :end ORDER BY e.dueDate ASC, e.createdAt ASC")
    List<CaseEntry> findTasksByWorkerAndDueDateBetween(@Param("userId") Long userId, @Param("taskType") CaseEntryType taskType, @Param("start") LocalDate start, @Param("end") LocalDate end);

    // For "Last Activity" we need the latest entry date up to a given moment,
    // not only entries inside the selected reporting window.
    @Query("SELECT MAX(e.createdAt) FROM CaseEntry e WHERE e.caseRecord.assignedSocialWorker.id = :userId AND e.createdAt <= :end")
    LocalDateTime findMaxCreatedAtByAssignedWorkerUpTo(@Param("userId") Long userId, @Param("end") LocalDateTime end);
}
