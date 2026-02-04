package com.afyalink.backend.repository;

import com.afyalink.backend.model.PerformanceWarning;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PerformanceWarningRepository extends JpaRepository<PerformanceWarning, Long> {

    Page<PerformanceWarning> findByToUser_Id(Long userId, Pageable pageable);

    Page<PerformanceWarning> findByFromUser_Id(Long userId, Pageable pageable);

    Page<PerformanceWarning> findByToUser_IdAndIsResolved(Long userId, boolean resolved, Pageable pageable);

    long countByToUser_IdAndIsResolved(Long userId, boolean resolved);

    Page<PerformanceWarning> findByFromUser_IdAndToUser_Id(Long fromId, Long toId, Pageable pageable);
}
