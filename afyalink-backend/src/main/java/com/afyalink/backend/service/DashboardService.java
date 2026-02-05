package com.afyalink.backend.service;

import com.afyalink.backend.dto.cases.CaseDto;
import com.afyalink.backend.dto.dashboard.TodaySummaryDto;
import com.afyalink.backend.dto.intervention.InterventionDto;
import com.afyalink.backend.dto.user.UserDto;
import com.afyalink.backend.enums.*;
import com.afyalink.backend.model.Case;
import com.afyalink.backend.model.CaseEntry;
import com.afyalink.backend.model.Intervention;
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

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final CaseRepository caseRepository;
    private final InterventionRepository interventionRepository;
    private final CaseEntryRepository caseEntryRepository;
    private final UserRepository userRepository;
    private final UserService userService;

    @Transactional(readOnly = true)
    public TodaySummaryDto getTodaySummary(Long userId) {
        User worker = userRepository.getReferenceById(userId);
        LocalDate today = LocalDate.now();
        LocalDateTime dayStart = today.atStartOfDay();
        LocalDateTime dayEnd = today.atTime(LocalTime.MAX);

        List<Case> workerCases = caseRepository.findByAssignedSocialWorker(
                worker, PageRequest.of(0, 500, Sort.by("updatedAt").descending())).getContent();

        List<Intervention> todayInterventions = interventionRepository
                .findByPlannedByAndPlannedStartDatetimeBetween(worker, dayStart, dayEnd,
                        PageRequest.of(0, 50, Sort.by("plannedStartDatetime").ascending()))
                .getContent().stream()
                .filter(i -> i.getDeletedAt() == null)
                .collect(Collectors.toList());

        List<Intervention> allWorkerInterventions = interventionRepository
                .findByAssignedWorker(userId, PageRequest.of(0, 500))
                .getContent();

        List<Intervention> overdueInterventions = allWorkerInterventions.stream()
                .filter(i -> i.getDeletedAt() == null
                        && i.getPlannedStartDatetime() != null
                        && i.getPlannedStartDatetime().toLocalDate().isBefore(today)
                        && i.getStatus() != InterventionStatus.COMPLETED)
                .collect(Collectors.toList());

        List<Case> casesWithoutInterventions = workerCases.stream()
                .filter(c -> c.getStatus() != CaseStatus.CLOSED)
                .filter(c -> {
                    long count = interventionRepository.countByCaseRecord(c);
                    return count == 0;
                })
                .collect(Collectors.toList());

        List<CaseEntry> overdueTasks = caseEntryRepository.findOverdueTasksByWorker(
                userId, CaseEntryType.TASK, CaseEntryStatus.COMPLETED, today);

        List<Case> overdueFollowUps = workerCases.stream()
                .filter(c -> c.getStatus() != CaseStatus.CLOSED)
                .filter(c -> c.getNextFollowUpDate() != null && c.getNextFollowUpDate().isBefore(today))
                .collect(Collectors.toList());

        List<CaseEntry> recentActivities = caseEntryRepository
                .findByAssignedWorkerAndCreatedAtBetween(userId, dayStart, dayEnd);

        int completedToday = (int) todayInterventions.stream()
                .filter(i -> i.getStatus() == InterventionStatus.COMPLETED).count();

        TodaySummaryDto.TodayStatsDto stats = TodaySummaryDto.TodayStatsDto.builder()
                .totalScheduledToday(todayInterventions.size())
                .completedToday(completedToday)
                .pendingToday(todayInterventions.size() - completedToday)
                .overdueTaskCount(overdueTasks.size())
                .casesNeedingIntervention(casesWithoutInterventions.size())
                .overdueFollowUpCount(overdueFollowUps.size())
                .build();

        DateTimeFormatter dtf = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

        return TodaySummaryDto.builder()
                .todayInterventions(todayInterventions.stream().map(this::toInterventionDto).collect(Collectors.toList()))
                .overdueInterventions(overdueInterventions.stream().limit(10).map(this::toInterventionDto).collect(Collectors.toList()))
                .casesWithoutInterventions(casesWithoutInterventions.stream().limit(10).map(this::toCaseDto).collect(Collectors.toList()))
                .overdueTasks(overdueTasks.stream().limit(10).map(e -> TodaySummaryDto.OverdueTaskDto.builder()
                        .taskId(e.getId())
                        .taskTitle(e.getTitle())
                        .dueDate(e.getDueDate() != null ? e.getDueDate().toString() : null)
                        .caseId(e.getCaseRecord().getId())
                        .caseNumber(e.getCaseRecord().getCaseNumber())
                        .beneficiaryName(e.getCaseRecord().getBeneficiaryName())
                        .build()).collect(Collectors.toList()))
                .overdueFollowUps(overdueFollowUps.stream().limit(10).map(this::toCaseDto).collect(Collectors.toList()))
                .recentActivities(recentActivities.stream().limit(15).map(e -> TodaySummaryDto.ActivityLogDto.builder()
                        .id(e.getId())
                        .type(e.getType().name())
                        .title(e.getTitle())
                        .content(e.getContent())
                        .caseNumber(e.getCaseRecord().getCaseNumber())
                        .beneficiaryName(e.getCaseRecord().getBeneficiaryName())
                        .createdAt(e.getCreatedAt() != null ? e.getCreatedAt().format(dtf) : null)
                        .build()).collect(Collectors.toList()))
                .stats(stats)
                .build();
    }

    private UserDto userToDto(User u) {
        if (u == null) return null;
        return userService.findById(u.getId());
    }

    private InterventionDto toInterventionDto(Intervention i) {
        return InterventionDto.builder()
                .id(i.getId())
                .caseId(i.getCaseRecord() != null ? i.getCaseRecord().getId() : null)
                .caseNumber(i.getCaseRecord() != null ? i.getCaseRecord().getCaseNumber() : null)
                .caseBeneficiaryName(i.getCaseRecord() != null ? i.getCaseRecord().getBeneficiaryName() : null)
                .interventionCode(i.getInterventionCode())
                .title(i.getTitle())
                .type(i.getType())
                .category(i.getCategory())
                .description(i.getDescription())
                .priority(i.getPriority())
                .location(i.getLocation())
                .plannedStartDatetime(i.getPlannedStartDatetime())
                .plannedEndDatetime(i.getPlannedEndDatetime())
                .durationMinutes(i.getDurationMinutes())
                .status(i.getStatus())
                .completionNotes(i.getCompletionNotes())
                .effectivenessPercent(i.getEffectivenessPercent())
                .effectivenessStarRating(i.getEffectivenessStarRating())
                .plannedBy(userToDto(i.getPlannedBy()))
                .outcomesPlanned(i.getOutcomesPlanned())
                .outcomesActual(i.getOutcomesActual())
                .resources(i.getResources())
                .createdAt(i.getCreatedAt())
                .updatedAt(i.getUpdatedAt())
                .build();
    }

    private CaseDto toCaseDto(Case c) {
        return CaseDto.builder()
                .id(c.getId())
                .caseNumber(c.getCaseNumber())
                .title(c.getTitle())
                .beneficiaryName(c.getBeneficiaryName())
                .status(c.getStatus())
                .priority(c.getPriority())
                .openedAt(c.getOpenedAt())
                .nextFollowUpDate(c.getNextFollowUpDate())
                .progressPercent(c.getProgressPercent())
                .interventionCount(c.getInterventionCount() != null ? c.getInterventionCount() : 0)
                .totalTaskCount(c.getTotalTaskCount() != null ? c.getTotalTaskCount() : 0)
                .completedTaskCount(c.getCompletedTaskCount() != null ? c.getCompletedTaskCount() : 0)
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }
}
