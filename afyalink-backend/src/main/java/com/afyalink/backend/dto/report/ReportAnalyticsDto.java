package com.afyalink.backend.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportAnalyticsDto {
    private long totalBeneficiaries;
    private long totalCases;
    private long totalInterventions;
    private long completedInterventions;
    private List<Map<String, Object>> interventionsByType;
    private List<Map<String, Object>> interventionsByStatus;
    private List<Map<String, Object>> casesByStatus;
}
