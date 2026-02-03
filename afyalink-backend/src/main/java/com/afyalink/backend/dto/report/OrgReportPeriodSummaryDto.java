package com.afyalink.backend.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrgReportPeriodSummaryDto {
    private String periodType;   // WEEKLY, MONTHLY, YEARLY
    private LocalDate periodStart;
    private LocalDate periodEnd;
    private String periodLabel;  // e.g. "Week of 23 Feb 2026", "March 2026", "2026"
    private int totalSubmittedReports;
    private int totalExpectedReporters;
    private List<ReportSubmissionStatusDto> submissionStatuses;
    private long totalBeneficiariesServed;
    private double avgSuccessRate;
}
