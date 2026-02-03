package com.afyalink.backend.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportSummaryDto {
    private long beneficiariesRegistered;
    private long casesOpened;
    private long interventionsDone;
    private long interventionsCompleted;
    private long diaryActivitiesCount;
    private long casesClosedCompletedSupport;
    private LocalDateTime periodFrom;
    private LocalDateTime periodTo;
    private String periodLabel;
}
