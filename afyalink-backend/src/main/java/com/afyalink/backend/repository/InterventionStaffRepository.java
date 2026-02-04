package com.afyalink.backend.repository;

import com.afyalink.backend.model.Intervention;
import com.afyalink.backend.model.InterventionStaff;
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
public interface InterventionStaffRepository extends JpaRepository<InterventionStaff, Long> {
    List<InterventionStaff> findByIntervention(Intervention intervention);
    List<InterventionStaff> findByUser(User user);
    Page<InterventionStaff> findByIntervention(Intervention intervention, Pageable pageable);
    Optional<InterventionStaff> findByInterventionAndUser(Intervention intervention, User user);
    boolean existsByInterventionAndUser(Intervention intervention, User user);
    long countByIntervention(Intervention intervention);

    @Query("SELECT s FROM InterventionStaff s WHERE s.intervention = :intervention AND (" +
           "LOWER(s.roleInIntervention) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(s.user.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(s.user.email) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<InterventionStaff> searchByIntervention(@Param("intervention") Intervention intervention,
                                                @Param("keyword") String keyword,
                                                Pageable pageable);
}
