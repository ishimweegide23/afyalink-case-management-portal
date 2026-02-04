package com.afyalink.backend.repository;

import com.afyalink.backend.model.Case;
import com.afyalink.backend.model.Document;
import com.afyalink.backend.model.Intervention;
import com.afyalink.backend.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {
    Page<Document> findByCaseRecord(Case caseRecord, Pageable pageable);
    Page<Document> findByIntervention(Intervention intervention, Pageable pageable);
    Page<Document> findByUploadedBy(User user, Pageable pageable);
    Page<Document> findByIsArchived(boolean isArchived, Pageable pageable);
    Page<Document> findByCaseRecordAndDeletedAtIsNull(Case caseRecord, Pageable pageable);
    long countByCaseRecord(Case caseRecord);
    long countByIntervention(Intervention intervention);

    @Query("SELECT d FROM Document d WHERE d.deletedAt IS NULL AND (" +
           "LOWER(d.fileName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(d.mimeType) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Document> searchDocuments(@Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT d FROM Document d WHERE d.deletedAt IS NULL AND (" +
           "LOWER(d.fileName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(d.mimeType) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND (" +
           "(d.caseRecord IS NOT NULL AND d.caseRecord.assignedSocialWorker.id = :workerId) OR " +
           "(d.intervention IS NOT NULL AND d.intervention.caseRecord IS NOT NULL AND " +
           " d.intervention.caseRecord.assignedSocialWorker.id = :workerId) OR " +
           "(d.caseRecord IS NULL AND d.intervention IS NULL AND d.uploadedBy.id = :workerId)" +
           ")")
    Page<Document> searchDocumentsForAssignedWorker(@Param("keyword") String keyword,
                                                    @Param("workerId") Long workerId,
                                                    Pageable pageable);

    @Query("SELECT d FROM Document d WHERE d.deletedAt IS NULL AND (" +
           "LOWER(d.fileName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(d.mimeType) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND (" +
           "(d.caseRecord IS NOT NULL AND d.caseRecord.assignedSocialWorker.supervisor.id = :supervisorId) OR " +
           "(d.caseRecord IS NULL AND d.intervention IS NOT NULL AND d.intervention.caseRecord IS NOT NULL AND " +
           " d.intervention.caseRecord.assignedSocialWorker.supervisor.id = :supervisorId) OR " +
           "(d.caseRecord IS NULL AND d.intervention IS NULL AND d.uploadedBy.supervisor IS NOT NULL AND " +
           " d.uploadedBy.supervisor.id = :supervisorId)" +
           ")")
    Page<Document> searchDocumentsForSupervisorTeam(@Param("keyword") String keyword,
                                                    @Param("supervisorId") Long supervisorId,
                                                    Pageable pageable);

    @Query("SELECT d FROM Document d WHERE d.caseRecord = :caseRecord AND d.deletedAt IS NULL AND " +
           "LOWER(d.fileName) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    Page<Document> searchByCase(@Param("caseRecord") Case caseRecord,
                               @Param("keyword") String keyword,
                               Pageable pageable);

    @Query("SELECT COUNT(d) FROM Document d WHERE d.deletedAt IS NULL AND d.uploadedBy.id = :userId AND d.createdAt BETWEEN :start AND :end")
    long countByUploadedBy_IdAndCreatedAtBetween(@Param("userId") Long userId, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
