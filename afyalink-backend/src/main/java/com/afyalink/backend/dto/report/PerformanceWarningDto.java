package com.afyalink.backend.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PerformanceWarningDto {
    private Long id;
    private Long fromUserId;
    private String fromUserName;
    private String fromUserRole;
    private Long toUserId;
    private String toUserName;
    private String toUserRole;
    private String warningType;
    private String message;
    private boolean isResolved;
    private LocalDateTime resolvedAt;
    private Long relatedCaseId;
    private String relatedCaseNumber;
    private UUID messageId;
    private String conversationId;
    private LocalDateTime createdAt;
}
