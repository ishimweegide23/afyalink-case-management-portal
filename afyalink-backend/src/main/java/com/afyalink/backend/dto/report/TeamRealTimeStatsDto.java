package com.afyalink.backend.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeamRealTimeStatsDto {
    private String assignedDistrict;
    private long totalBeneficiaries;
    private long activeCases;
    private long completedInterventions;
    private int successRate;
    private int teamSize;
}
