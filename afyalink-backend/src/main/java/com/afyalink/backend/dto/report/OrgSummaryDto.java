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
public class OrgSummaryDto {
    private Map<String, Long> totalUsersByRole;
    private long totalActiveBeneficiaries;
    private long newBeneficiariesInPeriod;
    private long totalOpenCases;
    private long totalInProgressCases;
    private long totalClosedCases;
    private long totalInterventionsCompleted;
    private double totalInterventionCompletionRate;
    private List<SupervisorActivityDto> supervisorActivity;
    private List<SupervisorActivityDto> inactiveSupervisors;
    private List<SocialWorkerSummaryDto> topPerformingWorkers;
    private String warningMessage;
}
