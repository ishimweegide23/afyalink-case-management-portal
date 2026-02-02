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
public class BeneficiaryJourneyDto {
    private BeneficiaryProgressDto beneficiary;
    private UserBasicDto assignedWorker;
    private List<ReportCaseDto> allCases;
    private List<ReportDiaryItemDto> allCaseEntries;
    private List<ReportInterventionDto> allInterventions;
    private List<ReportDocumentDto> allDocuments;
    private long totalDaysInSystem;
    private Integer currentProgressPercent;
}
