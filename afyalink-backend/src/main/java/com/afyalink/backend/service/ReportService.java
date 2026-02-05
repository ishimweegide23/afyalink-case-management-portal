package com.afyalink.backend.service;

import com.afyalink.backend.dto.report.*;
import com.afyalink.backend.enums.CaseStatus;
import com.afyalink.backend.enums.InterventionStatus;
import com.afyalink.backend.model.Beneficiary;
import com.afyalink.backend.model.Case;
import com.afyalink.backend.model.CaseEntry;
import com.afyalink.backend.model.Intervention;
import com.afyalink.backend.repository.BeneficiaryRepository;
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
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final BeneficiaryRepository beneficiaryRepository;
    private final CaseRepository caseRepository;
    private final InterventionRepository interventionRepository;
    private final CaseEntryRepository caseEntryRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public ReportSummaryDto getSummary(Long userId, LocalDateTime from, LocalDateTime to, String periodLabel) {
        var user = userRepository.findById(userId).orElseThrow();
        long beneficiariesRegistered = beneficiaryRepository.countByAssignedSocialWorkerAndCreatedAtBetween(user, from, to);
        long casesOpened = caseRepository.countByAssignedSocialWorkerAndCreatedAtBetween(user, from, to);
        long interventionsDone = interventionRepository.countByPlannedByAndCreatedAtBetween(userId, from, to);
        long interventionsCompleted = interventionRepository.countByPlannedByAndStatusAndCreatedAtBetween(userId, InterventionStatus.COMPLETED, from, to);
        List<CaseEntry> diary = caseEntryRepository.findByAssignedWorkerAndCreatedAtBetween(userId, from, to);
        long diaryActivitiesCount = diary.size();
        long casesClosedCompletedSupport = caseRepository.countByAssignedSocialWorkerAndStatusAndClosedAtBetween(user, CaseStatus.CLOSED, from, to);

        return ReportSummaryDto.builder()
                .beneficiariesRegistered(beneficiariesRegistered)
                .casesOpened(casesOpened)
                .interventionsDone(interventionsDone)
                .interventionsCompleted(interventionsCompleted)
                .diaryActivitiesCount(diaryActivitiesCount)
                .casesClosedCompletedSupport(casesClosedCompletedSupport)
                .periodFrom(from)
                .periodTo(to)
                .periodLabel(periodLabel != null ? periodLabel : "Custom")
                .build();
    }

    @Transactional(readOnly = true)
    public List<BeneficiaryProgressDto> getBeneficiariesWithProgress(Long userId, LocalDateTime from, LocalDateTime to) {
        var user = userRepository.findById(userId).orElseThrow();
        var beneficiaries = beneficiaryRepository.findByAssignedSocialWorker(user, PageRequest.of(0, 500, Sort.by("fullName"))).getContent();
        var cases = caseRepository.findByAssignedSocialWorker(user, PageRequest.of(0, 500)).getContent();
        List<BeneficiaryProgressDto> result = new ArrayList<>();
        for (Beneficiary b : beneficiaries) {
            Case c = cases.stream()
                    .filter(caseRecord -> (caseRecord.getBeneficiaryIdentifier() != null && caseRecord.getBeneficiaryIdentifier().equals(b.getIdentifier()))
                            || (caseRecord.getBeneficiaryName() != null && caseRecord.getBeneficiaryName().equals(b.getFullName())))
                    .findFirst()
                    .orElse(null);
            long intCount = 0;
            long completedIntCount = 0;
            if (c != null) {
                intCount = interventionRepository.countByCaseRecord(c);
                completedIntCount = interventionRepository.findByCaseRecordAndStatus(c, InterventionStatus.COMPLETED, PageRequest.of(0, 1000)).getTotalElements();
            }
            result.add(BeneficiaryProgressDto.builder()
                    .beneficiaryId(b.getId())
                    .identifier(b.getIdentifier())
                    .fullName(b.getFullName())
                    .category(b.getCategory())
                    .status(b.getStatus() != null ? b.getStatus().name() : null)
                    .caseProgressPercent(c != null ? c.getProgressPercent() : null)
                    .caseNumber(c != null ? c.getCaseNumber() : null)
                    .caseId(c != null ? c.getId() : null)
                    .interventionsCount(intCount)
                    .completedInterventionsCount(completedIntCount)
                    .district(b.getDistrict())
                    .build());
        }
        return result;
    }

    @Transactional(readOnly = true)
    public List<ReportInterventionDto> getInterventions(Long userId, LocalDateTime from, LocalDateTime to) {
        return interventionRepository.findForWorkerReportPeriod(userId, from, to).stream()
                .map(this::toReportInterventionDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ReportDiaryItemDto> getDiary(Long userId, LocalDateTime from, LocalDateTime to) {
        var entries = caseEntryRepository.findByAssignedWorkerAndCreatedAtBetween(userId, from, to);
        return entries.stream().map(this::toDiaryDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ReportCompletedCaseDto> getCompletedSupport(Long userId, LocalDateTime from, LocalDateTime to) {
        var user = userRepository.findById(userId).orElseThrow();
        var cases = caseRepository.findByAssignedSocialWorkerAndStatus(user, CaseStatus.CLOSED, PageRequest.of(0, 500)).getContent();
        return cases.stream()
                .filter(c -> c.getClosedAt() != null && !c.getClosedAt().isBefore(from) && !c.getClosedAt().isAfter(to))
                .map(c -> {
                    long total = interventionRepository.countByCaseRecord(c);
                    long completed = interventionRepository.findByCaseRecordAndStatus(c, InterventionStatus.COMPLETED, PageRequest.of(0, 1000)).getTotalElements();
                    return ReportCompletedCaseDto.builder()
                            .caseId(c.getId())
                            .caseNumber(c.getCaseNumber())
                            .title(c.getTitle())
                            .beneficiaryName(c.getBeneficiaryName())
                            .progressPercent(c.getProgressPercent())
                            .closedAt(c.getClosedAt())
                            .totalInterventions(total)
                            .completedInterventions(completed)
                            .build();
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ReportAnalyticsDto getAnalytics(Long userId) {
        var user = userRepository.findById(userId).orElseThrow();
        long totalBeneficiaries = beneficiaryRepository.countByAssignedSocialWorker(user);
        long totalCases = caseRepository.countByAssignedSocialWorker(user);
        var interventions = interventionRepository.findByPlannedBy(user, PageRequest.of(0, 2000)).getContent();
        long totalInterventions = interventions.size();
        long completedInterventions = interventions.stream().filter(i -> i.getStatus() == InterventionStatus.COMPLETED).count();

        Map<String, Long> byType = interventions.stream().collect(Collectors.groupingBy(i -> i.getType() != null ? i.getType().name() : "OTHER", Collectors.counting()));
        Map<String, Long> byStatus = interventions.stream().collect(Collectors.groupingBy(i -> i.getStatus() != null ? i.getStatus().name() : "OTHER", Collectors.counting()));
        var cases = caseRepository.findByAssignedSocialWorker(user, PageRequest.of(0, 500)).getContent();
        Map<String, Long> casesByStatus = cases.stream().collect(Collectors.groupingBy(c -> c.getStatus() != null ? c.getStatus().name() : "OTHER", Collectors.counting()));

        List<Map<String, Object>> interventionsByType = byType.entrySet().stream()
                .map(e -> Map.<String, Object>of("type", e.getKey(), "count", e.getValue()))
                .collect(Collectors.toList());
        List<Map<String, Object>> interventionsByStatus = byStatus.entrySet().stream()
                .map(e -> Map.<String, Object>of("status", e.getKey(), "count", e.getValue()))
                .collect(Collectors.toList());
        List<Map<String, Object>> casesByStatusList = casesByStatus.entrySet().stream()
                .map(e -> Map.<String, Object>of("status", e.getKey(), "count", e.getValue()))
                .collect(Collectors.toList());

        return ReportAnalyticsDto.builder()
                .totalBeneficiaries(totalBeneficiaries)
                .totalCases(totalCases)
                .totalInterventions(totalInterventions)
                .completedInterventions(completedInterventions)
                .interventionsByType(interventionsByType)
                .interventionsByStatus(interventionsByStatus)
                .casesByStatus(casesByStatusList)
                .build();
    }

    private ReportInterventionDto toReportInterventionDto(Intervention i) {
        Case c = i.getCaseRecord();
        return ReportInterventionDto.builder()
                .id(i.getId())
                .interventionCode(i.getInterventionCode())
                .title(i.getTitle())
                .type(i.getType() != null ? i.getType().name() : null)
                .status(i.getStatus() != null ? i.getStatus().name() : null)
                .caseNumber(c != null ? c.getCaseNumber() : null)
                .caseId(c != null ? c.getId() : null)
                .beneficiaryName(c != null ? c.getBeneficiaryName() : null)
                .plannedStartDatetime(i.getPlannedStartDatetime())
                .createdAt(i.getCreatedAt())
                .location(i.getLocation())
                .plannedByName(i.getPlannedBy() != null ? i.getPlannedBy().getFullName() : null)
                .build();
    }

    private ReportDiaryItemDto toDiaryDto(CaseEntry e) {
        Case c = e.getCaseRecord();
        return ReportDiaryItemDto.builder()
                .id(e.getId())
                .title(e.getTitle())
                .content(e.getContent())
                .type(e.getType() != null ? e.getType().name() : null)
                .status(e.getStatus() != null ? e.getStatus().name() : null)
                .createdAt(e.getCreatedAt())
                .caseNumber(c != null ? c.getCaseNumber() : null)
                .caseId(c != null ? c.getId() : null)
                .beneficiaryName(c != null ? c.getBeneficiaryName() : null)
                .build();
    }
}
