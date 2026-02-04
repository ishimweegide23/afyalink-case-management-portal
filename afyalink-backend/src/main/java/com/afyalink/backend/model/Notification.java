package com.afyalink.backend.model;

import com.afyalink.backend.enums.NotificationType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    private NotificationType type;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "message", columnDefinition = "TEXT")
    private String message;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "related_case_id")
    private Case relatedCase;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "related_intervention_id")
    private Intervention relatedIntervention;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "related_case_entry_id")
    private CaseEntry relatedCaseEntry;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "related_message_id")
    private Message relatedMessage;

    @Column(name = "related_conversation_id")
    private String relatedConversationId;

    @Column(name = "due_datetime")
    private LocalDateTime dueDateTime;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
