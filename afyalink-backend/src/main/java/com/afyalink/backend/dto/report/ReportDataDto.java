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
public class ReportDataDto {
    private ReportDto reportDto;
    private SocialWorkerSummaryDto summary;
    private List<BeneficiaryProgressDto> beneficiaries;
    private List<ReportCaseDto> cases;
    private List<ReportDiaryItemDto> caseEntries;
    private List<ReportInterventionDto> interventions;
    private ChartDataDto chartData;
    private TeamSummaryDto teamSummary;
    private OrganizationReportDataDto organizationData;
}
