package com.afyalink.backend.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PerformanceDetailsDto {

    private PerformanceMetricsDto user;
    private int beneficiariesRegistered;
    private long totalBeneficiaries;
    private int casesAssigned;
    private int casesActive;
    private int casesCompleted;
    private int overdueTasks;
    private int tasksCompleted;
    private int interventionsPlanned;
    private int interventionsCompleted;
    private int interventionSuccessRate;
    private int reportsExpected;
    private int reportsSubmitted;
    private int reportSubmissionRate;
    private double avgResponseHours;
    private List<PerformanceWarningDto> warningHistory;
    private List<PerformanceWarningDto> complimentHistory;
    private List<DateValueDto> trendData;
}
