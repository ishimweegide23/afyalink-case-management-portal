package com.afyalink.backend.repository;

import com.afyalink.backend.model.SystemSetting;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SystemSettingRepository extends JpaRepository<SystemSetting, Long> {

    Optional<SystemSetting> findByKey(String key);

    Optional<SystemSetting> findByKeyAndCategoryIsNull(String key);

    List<SystemSetting> findByCategory(String category);

    Optional<SystemSetting> findByCategoryAndKey(String category, String key);

    boolean existsByCategoryAndKey(String category, String key);

    void deleteByCategoryAndKey(String category, String key);

    boolean existsByKey(String key);

    Page<SystemSetting> findAll(Pageable pageable);

    Page<SystemSetting> findByCategory(String category, Pageable pageable);

    @Query("SELECT s FROM SystemSetting s WHERE " +
           "LOWER(s.key) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(s.value) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    Page<SystemSetting> searchSettings(@Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT s FROM SystemSetting s WHERE s.category = :category AND (" +
           "LOWER(s.key) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(s.value) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<SystemSetting> searchByCategory(@Param("category") String category, @Param("keyword") String keyword, Pageable pageable);
}
