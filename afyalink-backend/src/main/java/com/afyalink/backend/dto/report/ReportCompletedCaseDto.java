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
public class ReportCompletedCaseDto {
    private Long caseId;
    private String caseNumber;
    private String title;
    private String beneficiaryName;
    private Integer progressPercent;
    private LocalDateTime closedAt;
    private long totalInterventions;
    private long completedInterventions;
}
