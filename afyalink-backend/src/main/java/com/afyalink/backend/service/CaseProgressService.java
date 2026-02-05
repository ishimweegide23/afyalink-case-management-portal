package com.afyalink.backend.service;

import com.afyalink.backend.enums.CaseEntryStatus;
import com.afyalink.backend.enums.CaseEntryType;
import com.afyalink.backend.enums.CaseStatus;
import com.afyalink.backend.enums.InterventionStatus;
import com.afyalink.backend.enums.InterventionType;
import com.afyalink.backend.exception.ResourceNotFoundException;
import com.afyalink.backend.model.Case;
import com.afyalink.backend.model.CaseEntry;
import com.afyalink.backend.model.Intervention;
import com.afyalink.backend.repository.CaseEntryRepository;
import com.afyalink.backend.repository.CaseRepository;
import com.afyalink.backend.repository.InterventionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Recalculates case progress from interventions, tasks, and diary notes; keeps case status in sync.
 * Progress: 50% interventions + 30% tasks + 20% notes.
 * Status: CLOSED when all interventions (if any) and all tasks (if any) are complete; IN_PROGRESS when work is active.
 */
@Service
@RequiredArgsConstructor
public class CaseProgressService {

    private final CaseRepository caseRepository;
    private final InterventionRepository interventionRepository;
    private final CaseEntryRepository caseEntryRepository;

    @Transactional
    public void recalculateProgress(Long caseId) {
        Case caseRecord = caseRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("Case", "id", caseId));
        recalculateProgress(caseRecord);
    }

    @Transactional
    public void recalculateProgress(Case caseRecord) {
        Long caseId = caseRecord.getId();
        int interventionPct = computeInterventionProgress(caseRecord);
        int taskPct = computeTaskProgress(caseRecord);
        int notePct = computeNoteProgress(caseRecord);

        int blended = (int) Math.round(interventionPct * 0.5 + taskPct * 0.3 + notePct * 0.2);
        caseRecord.setProgressPercent(Math.min(100, Math.max(0, blended)));
        caseRecord.setUpdatedAt(LocalDateTime.now());
        caseRepository.save(caseRecord);

        synchronizeCaseStatus(caseId);
    }

    private void synchronizeCaseStatus(Long caseId) {
        Case c = caseRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("Case", "id", caseId));

        /* Do not auto-reopen or re-close from here once a case is CLOSED (manual or automatic). Progress still updates above. */
        if (c.getStatus() == CaseStatus.CLOSED) {
            return;
        }

        List<Intervention> interventions = interventionRepository.findByCaseRecord(c, PageRequest.of(0, Integer.MAX_VALUE))
                .getContent().stream()
                .filter(i -> i.getDeletedAt() == null)
                .collect(Collectors.toList());
        List<CaseEntry> tasks = caseEntryRepository.findByCaseRecordAndType(c, CaseEntryType.TASK);

        boolean hasInts = !interventions.isEmpty();
        boolean hasTasks = !tasks.isEmpty();
        boolean allIntDone = !hasInts || interventions.stream().allMatch(i -> i.getStatus() == InterventionStatus.COMPLETED);
        boolean allTasksDone = !hasTasks || tasks.stream().allMatch(t -> t.getStatus() == CaseEntryStatus.COMPLETED);
        boolean fullyDone = (hasInts || hasTasks) && allIntDone && allTasksDone;

        if (fullyDone) {
            c.setStatus(CaseStatus.CLOSED);
            if (c.getClosedAt() == null) {
                c.setClosedAt(LocalDateTime.now());
            }
        } else {
            if (!hasInts && !hasTasks) {
                c.setStatus(CaseStatus.OPEN);
            } else if (hasInts) {
                long active = interventions.stream()
                        .filter(i -> i.getStatus() == InterventionStatus.IN_PROGRESS || i.getStatus() == InterventionStatus.SCHEDULED)
                        .count();
                if (active > 0) {
                    c.setStatus(CaseStatus.IN_PROGRESS);
                } else if (!allIntDone) {
                    c.setStatus(CaseStatus.OPEN);
                } else if (hasTasks && !allTasksDone) {
                    c.setStatus(CaseStatus.IN_PROGRESS);
                } else {
                    c.setStatus(CaseStatus.OPEN);
                }
            } else {
                c.setStatus(hasTasks && !allTasksDone ? CaseStatus.IN_PROGRESS : CaseStatus.OPEN);
            }
        }

        c.setUpdatedAt(LocalDateTime.now());
        caseRepository.save(c);
    }

    private int computeInterventionProgress(Case caseRecord) {
        List<Intervention> all = interventionRepository.findByCaseRecord(caseRecord, PageRequest.of(0, Integer.MAX_VALUE))
                .getContent().stream()
                .filter(i -> i.getDeletedAt() == null)
                .collect(Collectors.toList());
        if (all.isEmpty()) return 0;
        int totalWeight = 0, completedWeight = 0;
        for (Intervention i : all) {
            int weight = getInterventionWeight(i.getType());
            int factor = switch (i.getStatus()) {
                case COMPLETED -> (i.getEffectivenessPercent() != null ? i.getEffectivenessPercent() : 100);
                case IN_PROGRESS -> 50;
                case SCHEDULED -> 25;
                default -> 0;
            };
            totalWeight += weight;
            completedWeight += (weight * factor) / 100;
        }
        return totalWeight > 0 ? Math.min(100, (completedWeight * 100) / totalWeight) : 0;
    }

    private int getInterventionWeight(InterventionType type) {
        if (type == null) return 3;
        return switch (type) {
            case EMERGENCY -> 10;
            case MEDICAL -> 8;
            case COUNSELING -> 7;
            case EDUCATION -> 6;
            case HOME_VISIT -> 5;
            case TRAINING -> 4;
            default -> 3;
        };
    }

    private int computeTaskProgress(Case caseRecord) {
        List<CaseEntry> taskList = caseEntryRepository.findByCaseRecordAndType(caseRecord, CaseEntryType.TASK);
        if (taskList.isEmpty()) return 0;
        long completed = taskList.stream().filter(t -> t.getStatus() == CaseEntryStatus.COMPLETED).count();
        return (int) Math.min(100, (completed * 100) / taskList.size());
    }

    private int computeNoteProgress(Case caseRecord) {
        long count = caseEntryRepository.countByCaseRecordAndType(caseRecord, CaseEntryType.NOTE);
        return (int) Math.min(100, count * 20);
    }
}
