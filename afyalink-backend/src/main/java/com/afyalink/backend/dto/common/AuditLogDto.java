package com.afyalink.backend.dto.common;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AuditLogDto {
    private Long id;
    private Long userId;
    private String userEmail;
    private String performedByName;
    private String action;
    private String objectType;
    private String objectId;
    private String oldValues;
    private String newValues;
    private String ipAddress;
    private LocalDateTime createdAt;
}
