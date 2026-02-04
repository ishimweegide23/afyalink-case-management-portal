package com.afyalink.backend.repository;

import com.afyalink.backend.enums.UserRole;
import com.afyalink.backend.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    Page<User> findAll(Pageable pageable);
    Page<User> findByRole(UserRole role, Pageable pageable);
    Page<User> findByIsActiveTrue(Pageable pageable);
    Page<User> findByIsActiveFalse(Pageable pageable);
    List<User> findByRole(UserRole role);
    long countByRole(UserRole role);
    long countByIsActiveTrue();

    @Query("SELECT u FROM User u WHERE " +
           "LOWER(u.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(u.phoneNumber) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    Page<User> searchUsers(@Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT u FROM User u WHERE u.role = :role AND " +
           "(LOWER(u.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<User> searchByRoleAndKeyword(@Param("role") UserRole role,
                                      @Param("keyword") String keyword,
                                      Pageable pageable);

    List<User> findBySupervisor(User supervisor);

    List<User> findByRoleAndAssignedDistrict(UserRole role, String assignedDistrict);

    List<User> findByRoleAndDistrict(UserRole role, String district);

    List<User> findByRoleAndSector(UserRole role, String sector);

    @Query("SELECT u FROM User u WHERE u.supervisor.id = :supervisorId AND " +
           "(:district IS NULL OR :district = '' OR LOWER(u.district) = LOWER(:district))")
    List<User> findWorkersBySupervisorAndDistrict(@Param("supervisorId") Long supervisorId,
                                                    @Param("district") String district);

    @Query("SELECT u FROM User u WHERE u.supervisor.id = :supervisorId AND " +
           "(:sector IS NULL OR :sector = '' OR LOWER(u.sector) = LOWER(:sector))")
    List<User> findBySupervisorAndSector(@Param("supervisorId") Long supervisorId,
                                         @Param("sector") String sector);

    @Query("SELECT DISTINCT u.district FROM User u WHERE u.district IS NOT NULL AND u.district <> '' ORDER BY u.district")
    List<String> findDistinctDistricts();
}
