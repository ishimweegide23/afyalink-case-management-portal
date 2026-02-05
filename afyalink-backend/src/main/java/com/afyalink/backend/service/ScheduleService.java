package com.afyalink.backend.service;

import com.afyalink.backend.dto.schedule.ScheduleItemDto;
import com.afyalink.backend.enums.CaseEntryStatus;
import com.afyalink.backend.enums.CaseEntryType;
import com.afyalink.backend.model.CaseEntry;
import com.afyalink.backend.model.Intervention;
import com.afyalink.backend.repository.CaseEntryRepository;
import com.afyalink.backend.repository.InterventionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ScheduleService {

    private final InterventionRepository interventionRepository;
    private final CaseEntryRepository caseEntryRepository;

    @Transactional(readOnly = true)
    public List<ScheduleItemDto> getSchedule(Long userId, LocalDate fromDate, LocalDate toDate) {
        LocalDate from = fromDate != null ? fromDate : LocalDate.now();
        LocalDate to = toDate != null ? toDate : from.plusWeeks(2);
        LocalDate effectiveFrom = from.minusWeeks(2);
        LocalDateTime rangeStart = effectiveFrom.atStartOfDay();
        LocalDateTime rangeEnd = to.atTime(LocalTime.MAX);

        List<ScheduleItemDto> items = new ArrayList<>();

        List<Intervention> interventions = interventionRepository
                .findByAssignedWorkerAndPlannedStartDatetimeBetween(userId, rangeStart, rangeEnd);
        for (Intervention i : interventions) {
            if (i.getDeletedAt() != null) continue;
            items.add(toInterventionItem(i));
        }

        List<CaseEntry> tasks = caseEntryRepository.findTasksByWorkerAndDueDateBetween(
                userId, CaseEntryType.TASK, from, to);
        for (CaseEntry t : tasks) {
            items.add(toTaskItem(t));
        }

        List<CaseEntry> overdueTasks = caseEntryRepository.findOverdueTasksByWorker(
                userId, CaseEntryType.TASK, CaseEntryStatus.COMPLETED, LocalDate.now());
        for (CaseEntry t : overdueTasks) {
            items.add(toTaskItem(t));
        }

        return items.stream()
                .sorted((a, b) -> a.getScheduleDateTime().compareTo(b.getScheduleDateTime()))
                .collect(Collectors.toList());
    }

    private ScheduleItemDto toInterventionItem(Intervention i) {
        return ScheduleItemDto.builder()
                .type(ScheduleItemDto.TYPE_INTERVENTION)
                .id(i.getId())
                .title(i.getTitle())
                .scheduleDateTime(i.getPlannedStartDatetime())
                .endDateTime(i.getPlannedEndDatetime())
                .status(i.getStatus() != null ? i.getStatus().name() : null)
                .caseId(i.getCaseRecord() != null ? i.getCaseRecord().getId() : null)
                .caseNumber(i.getCaseRecord() != null ? i.getCaseRecord().getCaseNumber() : null)
                .beneficiaryName(i.getCaseRecord() != null ? i.getCaseRecord().getBeneficiaryName() : null)
                .durationMinutes(i.getDurationMinutes())
                .location(i.getLocation())
                .interventionCode(i.getInterventionCode())
                .build();
    }

    private ScheduleItemDto toTaskItem(CaseEntry t) {
        LocalDateTime scheduleDt = t.getDueDate() != null
                ? t.getDueDate().atStartOfDay()
                : t.getCreatedAt() != null ? t.getCreatedAt() : LocalDateTime.now();
        return ScheduleItemDto.builder()
                .type(ScheduleItemDto.TYPE_TASK)
                .id(t.getId())
                .title(t.getTitle())
                .scheduleDateTime(scheduleDt)
                .endDateTime(null)
                .status(t.getStatus() != null ? t.getStatus().name() : null)
                .caseId(t.getCaseRecord() != null ? t.getCaseRecord().getId() : null)
                .caseNumber(t.getCaseRecord() != null ? t.getCaseRecord().getCaseNumber() : null)
                .beneficiaryName(t.getCaseRecord() != null ? t.getCaseRecord().getBeneficiaryName() : null)
                .content(t.getContent())
                .relatedInterventionId(t.getRelatedInterventionId())
                .build();
    }
}
