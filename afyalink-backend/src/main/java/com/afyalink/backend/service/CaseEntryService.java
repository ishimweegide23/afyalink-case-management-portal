package com.afyalink.backend.service;

import com.afyalink.backend.dto.cases.*;
import com.afyalink.backend.dto.common.PageResponse;
import com.afyalink.backend.enums.CaseEntryStatus;
import com.afyalink.backend.enums.CaseEntryType;
import com.afyalink.backend.enums.UserRole;
import com.afyalink.backend.exception.ForbiddenException;
import com.afyalink.backend.exception.ResourceNotFoundException;
import com.afyalink.backend.model.Case;
import com.afyalink.backend.model.CaseEntry;
import com.afyalink.backend.model.User;
import com.afyalink.backend.repository.CaseEntryRepository;
import com.afyalink.backend.repository.CaseRepository;
import com.afyalink.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CaseEntryService {

    private final CaseEntryRepository caseEntryRepository;
    private final CaseRepository caseRepository;
    private final UserRepository userRepository;
    private final UserService userService;
    private final AuditLogService auditLogService;
    private final CaseProgressService caseProgressService;
    private final CaseService caseService;

    public PageResponse<CaseEntryDto> findByCaseId(Long caseId, int page, int size, String sortBy, String direction,
                                                     Long currentUserId, UserRole role) {
        Case caseRecord = caseRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("Case", "id", caseId));
        caseService.assertCaseAccessible(caseRecord, currentUserId, role);
        Sort sort = Sort.by(Sort.Direction.fromString(direction), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<CaseEntry> entryPage = caseEntryRepository.findByCaseRecord(caseRecord, pageable);
        return PageResponse.of(entryPage.map(this::toDto));
    }

    public CaseEntryDto findById(Long caseId, Long id, Long currentUserId, UserRole role) {
        CaseEntry e = caseEntryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("CaseEntry", "id", id));
        if (!e.getCaseRecord().getId().equals(caseId)) {
            throw new ResourceNotFoundException("CaseEntry", "id", id);
        }
        caseService.assertCaseAccessible(e.getCaseRecord(), currentUserId, role);
        return toDto(e);
    }

    public PageResponse<CaseEntryDto> searchByCaseId(Long caseId, String keyword, int page, int size, String sortBy, String direction,
                                                     Long currentUserId, UserRole role) {
        Case caseRecord = caseRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("Case", "id", caseId));
        caseService.assertCaseAccessible(caseRecord, currentUserId, role);
        Sort sort = Sort.by(Sort.Direction.fromString(direction), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<CaseEntry> entryPage = caseEntryRepository.searchEntries(caseRecord, keyword, pageable);
        return PageResponse.of(entryPage.map(this::toDto));
    }

    public List<CaseEntryDto> findOverdueTasks(Long caseId, Long currentUserId, UserRole role) {
        Case caseRecord = caseRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("Case", "id", caseId));
        caseService.assertCaseAccessible(caseRecord, currentUserId, role);
        return caseEntryRepository.findOverdueTasks(caseRecord, CaseEntryType.TASK, CaseEntryStatus.COMPLETED, LocalDate.now())
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional
    public CaseEntryDto create(Long caseId, CreateCaseEntryRequest request, Long authorId) {
        Case caseRecord = caseRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("Case", "id", caseId));
        User author = userRepository.getReferenceById(authorId);
        caseService.assertCaseAccessible(caseRecord, authorId, author.getRole());
        if (author.getRole() == UserRole.SUPERVISOR) {
            throw new ForbiddenException("Supervisors cannot add case diary entries.");
        }
        CaseEntry entry = CaseEntry.builder()
                .caseRecord(caseRecord)
                .type(request.getType())
                .title(request.getTitle())
                .content(request.getContent())
                .status(CaseEntryStatus.PENDING)
                .dueDate(request.getDueDate())
                .targetDate(request.getTargetDate())
                .author(author)
                .relatedInterventionId(request.getRelatedInterventionId())
                .build();
        entry = caseEntryRepository.save(entry);
        caseProgressService.recalculateProgress(caseId);
        auditLogService.log(authorId, "CREATE", "CaseEntry", String.valueOf(entry.getId()), null, null);
        return toDto(entry);
    }

    @Transactional
    public CaseEntryDto update(Long id, UpdateCaseEntryRequest request, Long userId) {
        CaseEntry entry = caseEntryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("CaseEntry", "id", id));
        User editor = userRepository.getReferenceById(userId);
        caseService.assertCaseAccessible(entry.getCaseRecord(), userId, editor.getRole());
        if (editor.getRole() == UserRole.SUPERVISOR) {
            throw new ForbiddenException("Supervisors cannot edit case diary entries.");
        }
        if (request.getTitle() != null) entry.setTitle(request.getTitle());
        if (request.getContent() != null) entry.setContent(request.getContent());
        if (request.getStatus() != null) {
            entry.setStatus(request.getStatus());
        }
        if (entry.getStatus() == CaseEntryStatus.COMPLETED) {
            LocalDateTime completedAt = request.getCompletedAt() != null ? request.getCompletedAt() : 
                    (entry.getCompletedAt() != null ? entry.getCompletedAt() : LocalDateTime.now());
            if (completedAt.isAfter(LocalDateTime.now())) {
                throw new IllegalArgumentException("Cannot mark task as complete on a future date. Please select today or an earlier date.");
            }
            entry.setCompletedAt(completedAt);
        } else {
            entry.setCompletedAt(null);
        }
        if (request.getDueDate() != null) entry.setDueDate(request.getDueDate());
        if (request.getTargetDate() != null) entry.setTargetDate(request.getTargetDate());
        entry = caseEntryRepository.save(entry);
        caseProgressService.recalculateProgress(entry.getCaseRecord().getId());
        auditLogService.log(userId, "UPDATE", "CaseEntry", String.valueOf(id), null, null);
        return toDto(entry);
    }

    @Transactional
    public void delete(Long id, Long userId) {
        CaseEntry entry = caseEntryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("CaseEntry", "id", id));
        User editor = userRepository.getReferenceById(userId);
        caseService.assertCaseAccessible(entry.getCaseRecord(), userId, editor.getRole());
        if (editor.getRole() == UserRole.SUPERVISOR) {
            throw new ForbiddenException("Supervisors cannot delete case diary entries.");
        }
        Long caseId = entry.getCaseRecord().getId();
        caseEntryRepository.delete(entry);
        caseProgressService.recalculateProgress(caseId);
        auditLogService.log(userId, "DELETE", "CaseEntry", String.valueOf(id), null, null);
    }

    private CaseEntryDto toDto(CaseEntry e) {
        return CaseEntryDto.builder()
                .id(e.getId())
                .caseId(e.getCaseRecord().getId())
                .type(e.getType())
                .title(e.getTitle())
                .content(e.getContent())
                .status(e.getStatus())
                .dueDate(e.getDueDate())
                .targetDate(e.getTargetDate())
                .completedAt(e.getCompletedAt())
                .relatedInterventionId(e.getRelatedInterventionId())
                .author(userService.findById(e.getAuthor().getId()))
                .createdAt(e.getCreatedAt())
                .updatedAt(e.getUpdatedAt())
                .build();
    }
}
