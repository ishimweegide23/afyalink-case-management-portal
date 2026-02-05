package com.afyalink.backend.service;

import com.afyalink.backend.dto.report.*;
import com.afyalink.backend.exception.ResourceNotFoundException;
import com.afyalink.backend.model.Case;
import com.afyalink.backend.model.Report;
import com.afyalink.backend.model.User;
import com.afyalink.backend.repository.CaseEntryRepository;
import com.afyalink.backend.repository.CaseRepository;
import com.afyalink.backend.repository.InterventionRepository;
import com.afyalink.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportDataService {

    private final ReportManagementService reportManagementService;
    private final OrganizationReportService organizationReportService;
    private final AnalyticsService analyticsService;
    private final ReportService reportService;
    private final UserRepository userRepository;
    private final CaseRepository caseRepository;
    private final CaseEntryRepository caseEntryRepository;
    private final InterventionRepository interventionRepository;

    @Transactional(readOnly = true)
    public ReportDataDto buildReportData(Long reportId) {
        Report report = reportManagementService.getReportEntity(reportId);
        if (report == null) throw new ResourceNotFoundException("Report not found");
        if ("ORGANIZATION".equals(report.getReportType())) {
            return buildOrganizationReportViewData(report);
        }
        if ("SUPERVISOR_TEAM".equals(report.getReportType())) {
            return buildSupervisorTeamReportData(report);
        }
        Long userId = report.getGeneratedBy().getId();
        var start = report.getPeriodStart().atStartOfDay();
        var end = report.getPeriodEnd().atTime(LocalTime.MAX);

        ReportDto reportDto = reportManagementService.toReportDto(report);

        SocialWorkerSummaryDto summary = analyticsService.getSocialWorkerSummary(userId, report.getPeriodStart(), report.getPeriodEnd());
        List<BeneficiaryProgressDto> beneficiaryList = reportService.getBeneficiariesWithProgress(userId, start, end);
        List<ReportCaseDto> cases = getCasesForReport(userId, start, end);
        List<ReportDiaryItemDto> caseEntries = reportService.getDiary(userId, start, end);
        List<ReportInterventionDto> interventions = reportService.getInterventions(userId, start, end);

        List<LabelValueDto> caseStatusDist = summary.getCaseProgressDistribution() == null ? List.of() : List.of();
        List<LabelValueDto> caseProgressDist = summary.getCaseProgressDistribution() != null ? summary.getCaseProgressDistribution().entrySet().stream().map(e -> LabelValueDto.builder().label(e.getKey()).value(e.getValue()).build()).collect(Collectors.toList()) : List.of();

        ChartDataDto chartData = ChartDataDto.builder()
                .progressOverTime(analyticsService.getCaseProgressOverTime(userId, report.getReportType()))
                .interventionTypeDistribution(analyticsService.getInterventionTypeDistribution(userId, report.getPeriodStart(), report.getPeriodEnd()))
                .dailyActivity(analyticsService.getDailyActivityData(userId, report.getPeriodStart(), report.getPeriodEnd()))
                .caseStatusDistribution(caseStatusDist)
                .caseProgressDistribution(caseProgressDist)
                .build();

        return ReportDataDto.builder()
                .reportDto(reportDto)
                .summary(summary)
                .beneficiaries(beneficiaryList)
                .cases(cases)
                .caseEntries(caseEntries)
                .interventions(interventions)
                .chartData(chartData)
                .build();
    }

    private ReportDataDto buildSupervisorTeamReportData(Report report) {
        Long supId = report.getGeneratedBy().getId();
        var ps = report.getPeriodStart();
        var pe = report.getPeriodEnd();
        var start = ps.atStartOfDay();
        var end = pe.atTime(LocalTime.MAX);
        TeamSummaryDto team = analyticsService.getTeamSummary(supId, ps, pe);
        ReportDto reportDto = reportManagementService.toReportDto(report);
        SocialWorkerSummaryDto summary = aggregateTeamSummary(team);

        Map<Long, BeneficiaryProgressDto> beneficiariesById = new LinkedHashMap<>();
        List<ReportCaseDto> cases = new ArrayList<>();
        Set<Long> caseIdsSeen = new HashSet<>();
        List<ReportDiaryItemDto> caseEntries = new ArrayList<>();
        List<ReportInterventionDto> interventions = new ArrayList<>();

        if (team.getMembers() != null) {
            for (SocialWorkerSummaryDto m : team.getMembers()) {
                Long wid = m.getUserId();
                if (wid == null) continue;
                for (BeneficiaryProgressDto b : reportService.getBeneficiariesWithProgress(wid, start, end)) {
                    if (b.getBeneficiaryId() != null) {
                        beneficiariesById.putIfAbsent(b.getBeneficiaryId(), b);
                    }
                }
                for (ReportCaseDto c : getCasesForReport(wid, start, end)) {
                    if (c.getId() != null && caseIdsSeen.add(c.getId())) {
                        cases.add(c);
                    }
                }
                caseEntries.addAll(reportService.getDiary(wid, start, end));
                interventions.addAll(reportService.getInterventions(wid, start, end));
            }
        }

        Map<String, Long> typeCounts = interventions.stream()
                .collect(Collectors.groupingBy(i -> i.getType() != null ? i.getType() : "OTHER", Collectors.counting()));
        List<LabelValueDto> interventionDist = typeCounts.entrySet().stream()
                .map(e -> LabelValueDto.builder().label(e.getKey()).value(e.getValue()).build())
                .collect(Collectors.toList());

        List<LabelValueDto> caseProgressDist = summary.getCaseProgressDistribution() != null
                ? summary.getCaseProgressDistribution().entrySet().stream()
                .map(e -> LabelValueDto.builder().label(e.getKey()).value(e.getValue()).build())
                .collect(Collectors.toList())
                : List.of();

        ChartDataDto chartData = ChartDataDto.builder()
                .progressOverTime(List.of())
                .interventionTypeDistribution(interventionDist)
                .dailyActivity(List.of())
                .caseStatusDistribution(List.of())
                .caseProgressDistribution(caseProgressDist)
                .build();

        return ReportDataDto.builder()
                .reportDto(reportDto)
                .summary(summary)
                .teamSummary(team)
                .beneficiaries(new ArrayList<>(beneficiariesById.values()))
                .cases(cases)
                .caseEntries(caseEntries)
                .interventions(interventions)
                .chartData(chartData)
                .build();
    }

    private ReportDataDto buildOrganizationReportViewData(Report report) {
        ReportDto reportDto = reportManagementService.toReportDto(report);
        String districtFilter = report.getLocation() != null && !report.getLocation().isBlank()
                ? report.getLocation().trim() : null;
        OrganizationReportDataDto orgData = organizationReportService.buildOrganizationReportData(
                report.getPeriodStart(), report.getPeriodEnd(), districtFilter);
        return ReportDataDto.builder()
                .reportDto(reportDto)
                .organizationData(orgData)
                .build();
    }

    private SocialWorkerSummaryDto aggregateTeamSummary(TeamSummaryDto team) {
        List<SocialWorkerSummaryDto> members = team.getMembers() != null ? team.getMembers() : List.of();
        long newCases = members.stream().mapToLong(SocialWorkerSummaryDto::getNewCasesInPeriod).sum();
        long closedCases = members.stream().mapToLong(SocialWorkerSummaryDto::getClosedCasesInPeriod).sum();
        long totalBen = members.stream().mapToLong(SocialWorkerSummaryDto::getTotalBeneficiaries).sum();
        long newBen = members.stream().mapToLong(SocialWorkerSummaryDto::getNewBeneficiariesInPeriod).sum();
        long intDone = members.stream().mapToLong(SocialWorkerSummaryDto::getInterventionsCompleted).sum();
        long intPlan = members.stream().mapToLong(SocialWorkerSummaryDto::getInterventionsPlanned).sum();
        long entries = members.stream().mapToLong(SocialWorkerSummaryDto::getCaseEntriesMade).sum();
        long tasks = members.stream().mapToLong(SocialWorkerSummaryDto::getTasksCompleted).sum();
        long overdue = members.stream().mapToLong(SocialWorkerSummaryDto::getOverdueTasksCount).sum();
        Map<String, Long> mergedProgress = new LinkedHashMap<>();
        for (SocialWorkerSummaryDto m : members) {
            if (m.getCaseProgressDistribution() == null) continue;
            for (Map.Entry<String, Long> e : m.getCaseProgressDistribution().entrySet()) {
                mergedProgress.merge(e.getKey(), e.getValue(), Long::sum);
            }
        }
        return SocialWorkerSummaryDto.builder()
                .workerName("Team aggregate (all supervised workers)")
                .totalActiveCases(team.getTeamTotalCases())
                .newCasesInPeriod(newCases)
                .closedCasesInPeriod(closedCases)
                .totalBeneficiaries(totalBen)
                .newBeneficiariesInPeriod(newBen)
                .interventionsCompleted(intDone)
                .interventionsPlanned(intPlan)
                .interventionCompletionRate(team.getTeamCompletionRate())
                .caseEntriesMade(entries)
                .tasksCompleted(tasks)
                .overdueTasksCount(overdue)
                .avgCaseProgress(team.getTeamAvgProgress())
                .caseProgressDistribution(mergedProgress.isEmpty() ? null : mergedProgress)
                .build();
    }

    private List<ReportCaseDto> getCasesForReport(Long userId, LocalDateTime start, LocalDateTime end) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return List.of();
        return caseRepository.findByAssignedSocialWorker(user, PageRequest.of(0, 500)).getContent().stream()
                .filter(c -> {
                    if (c.getOpenedAt() == null && c.getCreatedAt() == null) return false;
                    var opened = c.getOpenedAt() != null ? c.getOpenedAt() : c.getCreatedAt();
                    if (opened.isAfter(end)) return false;
                    if (c.getClosedAt() != null && c.getClosedAt().isBefore(start)) return false;
                    return true;
                })
                .map(this::toReportCaseDto)
                .collect(Collectors.toList());
    }

    private ReportCaseDto toReportCaseDto(Case c) {
        return ReportCaseDto.builder()
                .id(c.getId())
                .caseNumber(c.getCaseNumber())
                .title(c.getTitle())
                .status(c.getStatus() != null ? c.getStatus().name() : null)
                .progressPercent(c.getProgressPercent())
                .openedAt(c.getOpenedAt())
                .closedAt(c.getClosedAt())
                .build();
    }
}
