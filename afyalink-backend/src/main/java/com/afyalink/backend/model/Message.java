package com.afyalink.backend.model;

import com.afyalink.backend.enums.ConversationType;
import com.afyalink.backend.enums.MessageStatus;
import com.afyalink.backend.enums.MessageType;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "messages")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    // Conversation context
    @Column(name = "conversation_id", nullable = false)
    private String conversationId;

    @Enumerated(EnumType.STRING)
    @Column(name = "conversation_type", nullable = false)
    private ConversationType conversationType;

    @Column(name = "conversation_title")
    private String conversationTitle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "case_id")
    private Case caseRecord;

    @Column(name = "case_number")
    private String caseNumber;

    @Column(name = "case_title")
    private String caseTitle;

    // Participants stored as JSONB
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "participants", columnDefinition = "jsonb")
    private String participants;

    // Sender
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @Column(name = "sender_name")
    private String senderName;

    @Column(name = "sender_email")
    private String senderEmail;

    @Column(name = "sender_avatar")
    private String senderAvatar;

    @Column(name = "sender_role")
    private String senderRole;

    // Content
    @Column(name = "content", columnDefinition = "TEXT")
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(name = "message_type", nullable = false)
    @Builder.Default
    private MessageType messageType = MessageType.TEXT;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private MessageStatus status = MessageStatus.SENT;

    // JSONB fields
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "attachments", columnDefinition = "jsonb")
    private String attachments;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "mentions", columnDefinition = "jsonb")
    private String mentions;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "read_by", columnDefinition = "jsonb")
    private String readBy;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "delivered_to", columnDefinition = "jsonb")
    private String deliveredTo;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "reactions", columnDefinition = "jsonb")
    private String reactions;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "pinned_by", columnDefinition = "jsonb")
    private String pinnedBy;

    // Reply (self-referencing FK)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reply_to_message_id")
    @JsonIgnore
    private Message replyToMessage;

    @Column(name = "reply_to_content", columnDefinition = "TEXT")
    private String replyToContent;

    @Column(name = "reply_to_sender_name")
    private String replyToSenderName;

    // Flags
    @Column(name = "is_edited", nullable = false)
    @Builder.Default
    private boolean isEdited = false;

    @Column(name = "edited_at")
    private LocalDateTime editedAt;

    @Column(name = "is_deleted", nullable = false)
    @Builder.Default
    private boolean isDeleted = false;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Column(name = "deleted_for", columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private String deletedFor;

    @Column(name = "is_forwarded", nullable = false)
    @Builder.Default
    private boolean isForwarded = false;

    @Column(name = "forwarded_from_conversation_id")
    private String forwardedFromConversationId;

    @Column(name = "forwarded_from_message_id")
    private String forwardedFromMessageId;

    @Column(name = "is_encrypted", nullable = false)
    @Builder.Default
    private boolean isEncrypted = false;

    @Column(name = "encryption_key_id")
    private String encryptionKeyId;

    @Column(name = "scheduled_at")
    private LocalDateTime scheduledAt;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Notifications linked to this message
    @OneToMany(mappedBy = "relatedMessage", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Notification> notifications;

    @Column(name = "group_avatar")
    private String groupAvatar;

    @Column(name = "group_avatar_updated_at")
    private LocalDateTime groupAvatarUpdatedAt;

    @Column(name = "group_avatar_updated_by")
    private Long groupAvatarUpdatedBy;
}
