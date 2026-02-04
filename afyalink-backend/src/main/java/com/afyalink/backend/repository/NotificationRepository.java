package com.afyalink.backend.repository;

import com.afyalink.backend.enums.NotificationType;
import com.afyalink.backend.model.Notification;
import com.afyalink.backend.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    Page<Notification> findByUser(User user, Pageable pageable);
    Page<Notification> findByUserAndReadAtIsNull(User user, Pageable pageable);
    Page<Notification> findByUserAndType(User user, NotificationType type, Pageable pageable);
    long countByUserAndReadAtIsNull(User user);

    @Query("SELECT n FROM Notification n WHERE n.user = :user AND (" +
           "LOWER(n.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(n.message) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Notification> searchByUser(@Param("user") User user,
                                    @Param("keyword") String keyword,
                                    Pageable pageable);
}
