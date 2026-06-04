// Refactoring needed for better performance in the future
package com.afyalink.backend.repository;

import com.afyalink.backend.model.Case;
import com.afyalink.backend.model.Message;
import com.afyalink.backend.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MessageRepository extends JpaRepository<Message, UUID> {
    Page<Message> findByConversationId(String conversationId, Pageable pageable);
    Page<Message> findBySender(User sender, Pageable pageable);
    Page<Message> findByCaseRecord(Case caseRecord, Pageable pageable);
    List<Message> findTop1ByConversationIdOrderByCreatedAtDesc(String conversationId);
    long countByConversationId(String conversationId);

    /** Messages where the user is either sender or listed in participants (jsonb array of user ids). */
    @Query(value = "SELECT * FROM messages m WHERE m.is_deleted = false AND (m.sender_id = :userId OR (m.participants IS NOT NULL AND m.participants @> jsonb_build_array(cast(:userId as bigint)))) ORDER BY m.created_at DESC",
           countQuery = "SELECT count(*) FROM messages m WHERE m.is_deleted = false AND (m.sender_id = :userId OR (m.participants IS NOT NULL AND m.participants @> jsonb_build_array(cast(:userId as bigint))))",
           nativeQuery = true)
    Page<Message> findMessagesForUserConversations(@Param("userId") Long userId, Pageable pageable);

    @Query("SELECT m FROM Message m WHERE m.isDeleted = false AND (" +
           "LOWER(m.content) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(m.conversationTitle) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Message> searchMessages(@Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT m FROM Message m WHERE m.conversationId = :conversationId AND m.isDeleted = false AND " +
           "LOWER(m.content) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    Page<Message> searchByConversation(@Param("conversationId") String conversationId,
                                      @Param("keyword") String keyword,
                                      Pageable pageable);
}
