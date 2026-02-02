package com.afyalink.backend.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DistrictPerformanceSummaryDto {
    private String district;
    private String supervisorName;
    private int totalWorkers;
    private long totalCases;
    private long activeCases;
    private long closedCases;
    private long beneficiaries;
    private double avgProgress;
    private double successRate;
}
