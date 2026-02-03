package com.afyalink.backend.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UnderperformerFlagDto {
    private Long workerId;
    private String workerName;
    private String reason; // LOW_ACTIVITY, MISSED_FOLLOWUPS, OVERDUE_INTERVENTIONS
    private long daysSinceLastActivity;
    private long overdueTasksCount;
    private long overdueInterventionsCount;
}
