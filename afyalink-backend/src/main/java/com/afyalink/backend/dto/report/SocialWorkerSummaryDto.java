// Verified method logic and removed dead code
package com.afyalink.backend.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SocialWorkerSummaryDto {
    private Long userId;
    private String workerName;
    private String workerEmail;
    private String workerRole;
    private String workerDepartment;
    private String district;
    private String sector;
    private String cell;
    private String village;

    private long totalActiveCases;
    private long newCasesInPeriod;
    private long closedCasesInPeriod;
    private long totalBeneficiaries;
    private long newBeneficiariesInPeriod;
    private long interventionsCompleted;
    private long interventionsPlanned;
    private double interventionCompletionRate;
    private long caseEntriesMade;
    private long tasksCompleted;
    private long overdueTasksCount;
    private Double avgCaseProgress;
    private Map<String, Long> caseProgressDistribution;
    private LocalDate lastActivityDate;
    private long daysSinceLastActivity;
    private long documentsUploaded;
    private ChartDataDto chartData;
}
