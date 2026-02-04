package com.afyalink.backend.repository;

import com.afyalink.backend.enums.BeneficiaryStatus;
import com.afyalink.backend.enums.VulnerabilityLevel;
import com.afyalink.backend.model.Beneficiary;
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
public interface BeneficiaryRepository extends JpaRepository<Beneficiary, Long> {

    Optional<Beneficiary> findByIdentifier(String identifier);

    boolean existsByIdentifier(String identifier);

    Page<Beneficiary> findByAssignedSocialWorker(User user, Pageable pageable);

    Page<Beneficiary> findByAssignedSocialWorkerAndStatus(User user, BeneficiaryStatus status, Pageable pageable);

    long countByAssignedSocialWorker(User user);

    long countByAssignedSocialWorkerAndStatus(User user, BeneficiaryStatus status);

    @Query("SELECT b FROM Beneficiary b WHERE " +
           "LOWER(b.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(b.identifier) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(b.district) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(b.sector) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    Page<Beneficiary> searchAll(@Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT b FROM Beneficiary b WHERE b.assignedSocialWorker = :worker AND (" +
           "LOWER(b.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(b.identifier) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(b.district) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Beneficiary> searchByWorker(@Param("worker") User worker, @Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT b FROM Beneficiary b WHERE " +
           "(:status IS NULL OR b.status = :status) AND " +
           "(:category IS NULL OR :category = '' OR b.category = :category) AND " +
           "(:vulnerability IS NULL OR b.vulnerabilityLevel = :vulnerability)")
    Page<Beneficiary> findAllWithFilters(
            @Param("status") BeneficiaryStatus status,
            @Param("category") String category,
            @Param("vulnerability") VulnerabilityLevel vulnerability,
            Pageable pageable);

    @Query("SELECT b FROM Beneficiary b WHERE b.assignedSocialWorker = :worker AND " +
           "(:status IS NULL OR b.status = :status) AND " +
           "(:category IS NULL OR :category = '' OR b.category = :category) AND " +
           "(:vulnerability IS NULL OR b.vulnerabilityLevel = :vulnerability)")
    Page<Beneficiary> findByWorkerWithFilters(
            @Param("worker") User worker,
            @Param("status") BeneficiaryStatus status,
            @Param("category") String category,
            @Param("vulnerability") VulnerabilityLevel vulnerability,
            Pageable pageable);

    @Query("SELECT b FROM Beneficiary b WHERE " +
           "(:worker IS NULL OR b.assignedSocialWorker = :worker) AND " +
           "(:keyword IS NULL OR :keyword = '' OR LOWER(b.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(b.identifier) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(b.district) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
           "(:status IS NULL OR b.status = :status) AND " +
           "(:category IS NULL OR :category = '' OR b.category = :category) AND " +
           "(:vulnerability IS NULL OR b.vulnerabilityLevel = :vulnerability)")
    Page<Beneficiary> search(@Param("worker") User worker,
                            @Param("keyword") String keyword,
                            @Param("status") BeneficiaryStatus status,
                            @Param("category") String category,
                            @Param("vulnerability") VulnerabilityLevel vulnerability,
                            Pageable pageable);

    long countByAssignedSocialWorkerAndCreatedAtBetween(User assignedSocialWorker, LocalDateTime start, LocalDateTime end);

    @Query("SELECT COUNT(b) FROM Beneficiary b WHERE b.createdAt BETWEEN :start AND :end")
    long countByCreatedAtBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    Page<Beneficiary> findByAssignedSocialWorker_Supervisor_Id(Long supervisorId, Pageable pageable);

    @Query("SELECT b FROM Beneficiary b WHERE b.assignedSocialWorker.supervisor.id = :supervisorId AND " +
           "(:keyword IS NULL OR :keyword = '' OR LOWER(b.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(b.identifier) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(b.district) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
           "(:status IS NULL OR b.status = :status) AND " +
           "(:category IS NULL OR :category = '' OR b.category = :category) AND " +
           "(:vulnerability IS NULL OR b.vulnerabilityLevel = :vulnerability)")
    Page<Beneficiary> searchBySupervisorTeam(
            @Param("supervisorId") Long supervisorId,
            @Param("keyword") String keyword,
            @Param("status") BeneficiaryStatus status,
            @Param("category") String category,
            @Param("vulnerability") VulnerabilityLevel vulnerability,
            Pageable pageable);

    @Query("SELECT b FROM Beneficiary b WHERE b.assignedSocialWorker = :worker AND " +
           "(:district IS NULL OR :district = '' OR LOWER(b.district) = LOWER(:district))")
    Page<Beneficiary> findByWorkerInDistrict(@Param("worker") User worker,
                                             @Param("district") String district,
                                             Pageable pageable);

    @Query("SELECT COUNT(b) FROM Beneficiary b WHERE " +
           "(:district IS NULL OR :district = '' OR LOWER(b.district) = LOWER(:district))")
    long countByDistrict(@Param("district") String district);

    @Query("SELECT b FROM Beneficiary b WHERE b.assignedSocialWorker.supervisor.id = :supervisorId AND " +
           "(:district IS NULL OR :district = '' OR LOWER(b.assignedSocialWorker.district) = LOWER(:district))")
    Page<Beneficiary> findBySupervisorTeamInDistrict(@Param("supervisorId") Long supervisorId,
                                                       @Param("district") String district,
                                                       Pageable pageable);

    @Query("SELECT DISTINCT b.district FROM Beneficiary b WHERE b.district IS NOT NULL AND b.district <> '' ORDER BY b.district")
    List<String> findDistinctDistricts();
}
