package com.afyalink.backend.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MetricsDto {

    private int overallScore;
    private int casesAssigned;
    private int casesCompleted;
    private int caseCompletionRate;
    private int reportsExpected;
    private int reportsSubmitted;
    private int reportSubmissionRate;
    private int interventionsCompleted;
    private int interventionSuccessRate;
    private double avgResponseTimeHours;
    private int overdueTasks;
    private int beneficiariesRegistered;
    private int teamSize; // for supervisors only
}
