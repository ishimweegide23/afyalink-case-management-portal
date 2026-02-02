package com.afyalink.backend.dto.notification;

import com.afyalink.backend.enums.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class NotificationDto {
    private Long id;
    private Long userId;
    private NotificationType type;
    private String title;
    private String message;
    private Long relatedCaseId;
    private String relatedCaseNumber;
    private Long relatedInterventionId;
    private Long relatedCaseEntryId;
    private UUID relatedMessageId;
    private String relatedConversationId;
    private LocalDateTime dueDateTime;
    private LocalDateTime sentAt;
    private LocalDateTime readAt;
    private boolean isRead;
    private LocalDateTime createdAt;
}
