package com.afyalink.backend.dto.common;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AuditStatsDto {
    private long totalLogs;
    private long todayLogs;
    private long uniqueUsers;
    private String mostActiveEntity;
}
