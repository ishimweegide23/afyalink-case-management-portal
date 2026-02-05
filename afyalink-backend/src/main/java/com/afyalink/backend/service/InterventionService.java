package com.afyalink.backend.service;

import com.afyalink.backend.dto.intervention.*;
import com.afyalink.backend.dto.common.PageResponse;
import com.afyalink.backend.dto.user.UserDto;
import com.afyalink.backend.enums.CaseEntryStatus;
import com.afyalink.backend.enums.CaseEntryType;
import com.afyalink.backend.enums.CasePriority;
import com.afyalink.backend.enums.InterventionStatus;
import com.afyalink.backend.enums.InterventionType;
import com.afyalink.backend.enums.UserRole;
import com.afyalink.backend.exception.DuplicateResourceException;
import com.afyalink.backend.exception.ResourceNotFoundException;
import com.afyalink.backend.model.Case;
import com.afyalink.backend.model.CaseEntry;
import com.afyalink.backend.model.Intervention;
import com.afyalink.backend.model.InterventionStaff;
import com.afyalink.backend.model.User;
import com.afyalink.backend.repository.CaseEntryRepository;
import com.afyalink.backend.repository.CaseRepository;
import com.afyalink.backend.repository.InterventionRepository;
import com.afyalink.backend.repository.InterventionStaffRepository;
import com.afyalink.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;
@Service
@RequiredArgsConstructor
public class InterventionService {

    private final InterventionRepository interventionRepository;
    private final InterventionStaffRepository interventionStaffRepository;
    private final CaseRepository caseRepository;
    private final UserRepository userRepository;
    private final UserService userService;
    private final AuditLogService auditLogService;
    private final CaseProgressService caseProgressService;
    private final CaseEntryRepository caseEntryRepository;

    @Transactional(readOnly = true)
    public PageResponse<InterventionDto> findAll(int page, int size, String sortBy, String direction) {
        Sort sort = Sort.by(Sort.Direction.fromString(direction), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<Intervention> interventionPage = interventionRepository.findAllByDeletedAtIsNull(pageable);
        return PageResponse.of(interventionPage.map(this::toDto));
    }

    /** Role-based: SOCIAL_WORKER sees only interventions on their assigned cases. Supports optional status, type, keyword filters. */
    @Transactional(readOnly = true)
    public PageResponse<InterventionDto> findAll(int page, int size, String sortBy, String direction,
            InterventionStatus status, InterventionType type, String keyword,
            Long currentUserId, UserRole role) {
        Sort sort = Sort.by(Sort.Direction.fromString(direction), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<Intervention> interventionPage;
        if (role == UserRole.SOCIAL_WORKER && currentUserId != null) {
            if (keyword != null && !keyword.isBlank()) {
                interventionPage = interventionRepository.searchByAssignedWorker(currentUserId, keyword.trim(), pageable);
            } else if (status != null) {
                interventionPage = interventionRepository.findByAssignedWorkerAndStatus(currentUserId, status, pageable);
            } else if (type != null) {
                interventionPage = interventionRepository.findByAssignedWorkerAndType(currentUserId, type, pageable);
            } else {
                interventionPage = interventionRepository.findByAssignedWorker(currentUserId, pageable);
            }
        } else if (role == UserRole.SUPERVISOR && currentUserId != null) {
            if (keyword != null && !keyword.isBlank()) {
                interventionPage = interventionRepository.searchBySupervisorTeam(currentUserId, keyword.trim(), pageable);
            } else if (status != null) {
                interventionPage = interventionRepository.findBySupervisorTeamAndStatus(currentUserId, status, pageable);
            } else if (type != null) {
                interventionPage = interventionRepository.findBySupervisorTeamAndType(currentUserId, type, pageable);
            } else {
                interventionPage = interventionRepository.findBySupervisorTeam(currentUserId, pageable);
            }
        } else {
            if (keyword != null && !keyword.isBlank()) {
                interventionPage = interventionRepository.searchInterventions(keyword.trim(), pageable);
            } else if (status != null) {
                interventionPage = interventionRepository.findByStatus(status, pageable);
            } else if (type != null) {
                interventionPage = interventionRepository.findByType(type, pageable);
            } else {
                interventionPage = interventionRepository.findAllByDeletedAtIsNull(pageable);
            }
        }
        return PageResponse.of(interventionPage.map(i -> toDto(i, role)));
    }

    /** Role-based findByStatus */
    @Transactional(readOnly = true)
    public PageResponse<InterventionDto> findByStatus(InterventionStatus status, int page, int size, String sortBy, String direction, Long currentUserId, UserRole role) {
        Sort sort = Sort.by(Sort.Direction.fromString(direction), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<Intervention> result;
        if (role == UserRole.SOCIAL_WORKER && currentUserId != null) {
            result = interventionRepository.findByAssignedWorkerAndStatus(currentUserId, status, pageable);
        } else if (role == UserRole.SUPERVISOR && currentUserId != null) {
            result = interventionRepository.findBySupervisorTeamAndStatus(currentUserId, status, pageable);
        } else {
            result = interventionRepository.findByStatus(status, pageable);
        }
        return PageResponse.of(result.map(i -> toDto(i, role)));
    }

    /** Role-based findByType */
    @Transactional(readOnly = true)
    public PageResponse<InterventionDto> findByType(InterventionType type, int page, int size, String sortBy, String direction, Long currentUserId, UserRole role) {
        if (role == UserRole.SOCIAL_WORKER && currentUserId != null) {
            Sort sort = Sort.by(Sort.Direction.fromString(direction), sortBy);
            Pageable pageable = PageRequest.of(page, size, sort);
            return PageResponse.of(interventionRepository.findByAssignedWorkerAndType(currentUserId, type, pageable).map(this::toDto));
        }
        if (role == UserRole.SUPERVISOR && currentUserId != null) {
            Sort sort = Sort.by(Sort.Direction.fromString(direction), sortBy);
            Pageable pageable = PageRequest.of(page, size, sort);
            return PageResponse.of(interventionRepository.findBySupervisorTeamAndType(currentUserId, type, pageable).map(this::toDto));
        }
        return findByType(type, page, size, sortBy, direction);
    }

    /** Role-based search */
    @Transactional(readOnly = true)
    public PageResponse<InterventionDto> search(String keyword, int page, int size, String sortBy, String direction, Long currentUserId, UserRole role) {
        Sort sort = Sort.by(Sort.Direction.fromString(direction), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<Intervention> result;
        if (role == UserRole.SOCIAL_WORKER && currentUserId != null) {
            result = interventionRepository.searchByAssignedWorker(currentUserId, keyword, pageable);
        } else if (role == UserRole.SUPERVISOR && currentUserId != null) {
            result = interventionRepository.searchBySupervisorTeam(currentUserId, keyword.trim(), pageable);
        } else {
            result = interventionRepository.searchInterventions(keyword.trim(), pageable);
        }
        return PageResponse.of(result.map(i -> toDto(i, role)));
    }

    /** Role-based stats */
    @Transactional(readOnly = true)
    public InterventionStatsDto getStats(Long currentUserId, UserRole role) {
        if (role == UserRole.SOCIAL_WORKER && currentUserId != null) {
            return InterventionStatsDto.builder()
                    .total(interventionRepository.countByAssignedWorker(currentUserId))
                    .planned(interventionRepository.countByAssignedWorkerAndStatus(currentUserId, InterventionStatus.PLANNED))
                    .scheduled(interventionRepository.countByAssignedWorkerAndStatus(currentUserId, InterventionStatus.SCHEDULED))
                    .inProgress(interventionRepository.countByAssignedWorkerAndStatus(currentUserId, InterventionStatus.IN_PROGRESS))
                    .completed(interventionRepository.countByAssignedWorkerAndStatus(currentUserId, InterventionStatus.COMPLETED))
                    .build();
        }
        if (role == UserRole.SUPERVISOR && currentUserId != null) {
            return InterventionStatsDto.builder()
                    .total(interventionRepository.countBySupervisorTeam(currentUserId))
                    .planned(interventionRepository.countBySupervisorTeamAndStatus(currentUserId, InterventionStatus.PLANNED))
                    .scheduled(interventionRepository.countBySupervisorTeamAndStatus(currentUserId, InterventionStatus.SCHEDULED))
                    .inProgress(interventionRepository.countBySupervisorTeamAndStatus(currentUserId, InterventionStatus.IN_PROGRESS))
                    .completed(interventionRepository.countBySupervisorTeamAndStatus(currentUserId, InterventionStatus.COMPLETED))
                    .build();
        }
        return getStats();
    }

    @Transactional(readOnly = true)
    public InterventionDto findById(Long id) {
        Intervention i = interventionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Intervention", "id", id));
        if (i.getDeletedAt() != null) {
            throw new ResourceNotFoundException("Intervention", "id", id);
        }
        return toDto(i);
    }

    @Transactional(readOnly = true)
    public InterventionDto findById(Long id, Long currentUserId, UserRole role) {
        Intervention i = interventionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Intervention", "id", id));
        if (i.getDeletedAt() != null) {
            throw new ResourceNotFoundException("Intervention", "id", id);
        }
        validateWorkerAccess(i, currentUserId, role);
        return toDto(i, role);
    }

    /** For related resources (e.g. documents) tied to an intervention. */
    public void assertInterventionAccessible(Intervention intervention, Long currentUserId, UserRole role) {
        if (role == null || currentUserId == null || role == UserRole.ADMIN) {
            return;
        }
        validateWorkerAccess(intervention, currentUserId, role);
    }

    private void validateWorkerAccess(Intervention intervention, Long currentUserId, UserRole role) {
        if (currentUserId == null || role == null) return;
        Case caseRecord = intervention.getCaseRecord();
        if (role == UserRole.SOCIAL_WORKER) {
            if (caseRecord == null || caseRecord.getAssignedSocialWorker() == null
                    || !caseRecord.getAssignedSocialWorker().getId().equals(currentUserId)) {
                throw new org.springframework.security.access.AccessDeniedException("You do not have access to this intervention");
            }
        } else if (role == UserRole.SUPERVISOR) {
            if (caseRecord == null || caseRecord.getAssignedSocialWorker() == null
                    || caseRecord.getAssignedSocialWorker().getSupervisor() == null
                    || !caseRecord.getAssignedSocialWorker().getSupervisor().getId().equals(currentUserId)) {
                throw new org.springframework.security.access.AccessDeniedException("You do not have access to this intervention");
            }
        }
    }

    private void validateCaseOwnership(Case caseRecord, Long currentUserId, UserRole role) {
        if (currentUserId == null || role == null) return;
        if (role == UserRole.SOCIAL_WORKER) {
            if (caseRecord.getAssignedSocialWorker() == null
                    || !caseRecord.getAssignedSocialWorker().getId().equals(currentUserId)) {
                throw new org.springframework.security.access.AccessDeniedException("You can only create interventions for your own cases");
            }
        } else if (role == UserRole.SUPERVISOR) {
            if (caseRecord.getAssignedSocialWorker() == null
                    || caseRecord.getAssignedSocialWorker().getSupervisor() == null
                    || !caseRecord.getAssignedSocialWorker().getSupervisor().getId().equals(currentUserId)) {
                throw new org.springframework.security.access.AccessDeniedException("You can only manage interventions for your team's cases");
            }
        }
    }

    @Transactional(readOnly = true)
    public PageResponse<InterventionDto> findByCaseId(Long caseId, int page, int size, String sortBy, String direction) {
        Case caseRecord = caseRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("Case", "id", caseId));
        Sort sort = Sort.by(Sort.Direction.fromString(direction), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);
        return PageResponse.of(interventionRepository.findByCaseRecord(caseRecord, pageable).map(this::toDto));
    }

    @Transactional(readOnly = true)
    public PageResponse<InterventionDto> findByCaseId(Long caseId, int page, int size, String sortBy, String direction, Long currentUserId, UserRole role) {
        Case caseRecord = caseRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("Case", "id", caseId));
        validateCaseOwnership(caseRecord, currentUserId, role);
        Sort sort = Sort.by(Sort.Direction.fromString(direction), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);
        return PageResponse.of(interventionRepository.findByCaseRecord(caseRecord, pageable).map(i -> toDto(i, role)));
    }

    @Transactional(readOnly = true)
    public PageResponse<InterventionDto> findByStatus(InterventionStatus status, int page, int size, String sortBy, String direction) {
        Sort sort = Sort.by(Sort.Direction.fromString(direction), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);
        return PageResponse.of(interventionRepository.findByStatus(status, pageable).map(this::toDto));
    }

    @Transactional(readOnly = true)
    public PageResponse<InterventionDto> findByType(InterventionType type, int page, int size, String sortBy, String direction) {
        Sort sort = Sort.by(Sort.Direction.fromString(direction), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);
        return PageResponse.of(interventionRepository.findByType(type, pageable).map(this::toDto));
    }

    @Transactional(readOnly = true)
    public PageResponse<InterventionDto> search(String keyword, int page, int size, String sortBy, String direction) {
        Sort sort = Sort.by(Sort.Direction.fromString(direction), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);
        return PageResponse.of(interventionRepository.searchInterventions(keyword, pageable).map(this::toDto));
    }

    @Transactional(readOnly = true)
    public PageResponse<InterventionDto> searchByCaseId(Long caseId, String keyword, int page, int size, String sortBy, String direction) {
        Case caseRecord = caseRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("Case", "id", caseId));
        Sort sort = Sort.by(Sort.Direction.fromString(direction), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);
        return PageResponse.of(interventionRepository.searchByCase(caseRecord, keyword, pageable).map(this::toDto));
    }

    @Transactional(readOnly = true)
    public PageResponse<InterventionDto> searchByCaseId(Long caseId, String keyword, int page, int size, String sortBy, String direction, Long currentUserId, UserRole role) {
        Case caseRecord = caseRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("Case", "id", caseId));
        validateCaseOwnership(caseRecord, currentUserId, role);
        Sort sort = Sort.by(Sort.Direction.fromString(direction), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);
        return PageResponse.of(interventionRepository.searchByCase(caseRecord, keyword, pageable).map(i -> toDto(i, role)));
    }

    @Transactional(readOnly = true)
    public InterventionStatsDto getStats() {
        return InterventionStatsDto.builder()
                .total(interventionRepository.countByDeletedAtIsNull())
                .planned(interventionRepository.countByStatus(InterventionStatus.PLANNED))
                .scheduled(interventionRepository.countByStatus(InterventionStatus.SCHEDULED))
                .inProgress(interventionRepository.countByStatus(InterventionStatus.IN_PROGRESS))
                .completed(interventionRepository.countByStatus(InterventionStatus.COMPLETED))
                .build();
    }

    @Transactional(readOnly = true)
    public PageResponse<InterventionDto> findMySchedule(Long userId, int page, int size,
                                                        LocalDateTime fromDate, LocalDateTime toDate,
                                                        InterventionStatus status) {
        User user = userRepository.getReferenceById(userId);
        Sort sort = Sort.by(Sort.Direction.ASC, "plannedStartDatetime");
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<Intervention> pageResult;
        boolean hasDateRange = fromDate != null && toDate != null;
        if (status != null && hasDateRange) {
            pageResult = interventionRepository.findByPlannedByAndStatusAndPlannedStartDatetimeBetween(user, status, fromDate, toDate, pageable);
        } else if (status != null) {
            pageResult = interventionRepository.findByPlannedByAndStatus(user, status, pageable);
        } else if (hasDateRange) {
            pageResult = interventionRepository.findByPlannedByAndPlannedStartDatetimeBetween(user, fromDate, toDate, pageable);
        } else {
            pageResult = interventionRepository.findByPlannedBy(user, pageable);
        }
        return PageResponse.of(pageResult.map(this::toDto));
    }

    @Transactional(readOnly = true)
    public List<InterventionStaffDto> getStaff(Long interventionId) {
        Intervention intervention = interventionRepository.findById(interventionId)
                .orElseThrow(() -> new ResourceNotFoundException("Intervention", "id", interventionId));
        return interventionStaffRepository.findByIntervention(intervention).stream()
                .map(this::staffToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public InterventionDto create(CreateInterventionRequest request, Long plannedById, UserRole role) {
        Case caseRecord = caseRepository.findById(request.getCaseId())
                .orElseThrow(() -> new ResourceNotFoundException("Case", "id", request.getCaseId()));
        validateCaseOwnership(caseRecord, plannedById, role);
        User plannedBy = userRepository.getReferenceById(plannedById);
        String code = "INT-" + System.currentTimeMillis();
        while (interventionRepository.existsByInterventionCode(code)) {
            code = "INT-" + System.currentTimeMillis();
        }
        Intervention intervention = Intervention.builder()
                .caseRecord(caseRecord)
                .interventionCode(code)
                .title(request.getTitle())
                .type(request.getType())
                .category(request.getCategory())
                .description(request.getDescription())
                .priority(request.getPriority() != null ? request.getPriority() : CasePriority.MEDIUM)
                .location(request.getLocation())
                .plannedStartDatetime(request.getPlannedStartDatetime())
                .plannedEndDatetime(request.getPlannedEndDatetime())
                .durationMinutes(request.getDurationMinutes())
                .status(InterventionStatus.PLANNED)
                .outcomesPlanned(request.getOutcomesPlanned())
                .resources(request.getResources())
                .plannedBy(plannedBy)
                .build();
        intervention = interventionRepository.save(intervention);

        CaseEntry followUp = CaseEntry.builder()
                .caseRecord(caseRecord)
                .type(CaseEntryType.TASK)
                .title("Complete intervention: " + intervention.getTitle())
                .content("Linked to " + intervention.getInterventionCode() + ". Mark this done when you finish the visit or activity.")
                .status(CaseEntryStatus.PENDING)
                .dueDate(request.getPlannedStartDatetime() != null ? request.getPlannedStartDatetime().toLocalDate() : null)
                .author(plannedBy)
                .relatedInterventionId(intervention.getId())
                .build();
        caseEntryRepository.save(followUp);

        caseProgressService.recalculateProgress(caseRecord);
        auditLogService.log(plannedById, "CREATE", "Intervention", String.valueOf(intervention.getId()), null, null);
        return toDto(intervention);
    }

    @Transactional
    public InterventionDto update(Long id, UpdateInterventionRequest request, Long userId, UserRole role) {
        Intervention intervention = interventionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Intervention", "id", id));
        if (intervention.getDeletedAt() != null) {
            throw new ResourceNotFoundException("Intervention", "id", id);
        }
        validateWorkerAccess(intervention, userId, role);
        InterventionStatus previousStatus = intervention.getStatus();
        InterventionStatus finalStatus = request.getStatus() != null ? request.getStatus() : intervention.getStatus();

        // 1. Validate effectiveness without completing
        if (request.getEffectivenessPercent() != null && finalStatus != InterventionStatus.COMPLETED) {
            throw new IllegalArgumentException("Cannot set effectiveness without completing the intervention.");
        }

        // 2. Validate completion date
        if (finalStatus == InterventionStatus.COMPLETED) {
            LocalDateTime completedAt = request.getCompletedAt() != null ? request.getCompletedAt() : 
                    (intervention.getCompletedAt() != null ? intervention.getCompletedAt() : LocalDateTime.now());
            if (completedAt.isAfter(LocalDateTime.now())) {
                throw new IllegalArgumentException("Cannot complete intervention on " + completedAt.toLocalDate() + ". Today is " + java.time.LocalDate.now() + ". Please use today or earlier.");
            }
            intervention.setCompletedAt(completedAt);
        } else {
            intervention.setCompletedAt(null);
        }

        if (request.getTitle() != null) intervention.setTitle(request.getTitle());
        if (request.getType() != null) intervention.setType(request.getType());
        if (request.getCategory() != null) intervention.setCategory(request.getCategory());
        if (request.getDescription() != null) intervention.setDescription(request.getDescription());
        if (request.getPriority() != null) intervention.setPriority(request.getPriority());
        if (request.getLocation() != null) intervention.setLocation(request.getLocation());
        if (request.getPlannedStartDatetime() != null) intervention.setPlannedStartDatetime(request.getPlannedStartDatetime());
        if (request.getPlannedEndDatetime() != null) intervention.setPlannedEndDatetime(request.getPlannedEndDatetime());
        if (request.getDurationMinutes() != null) intervention.setDurationMinutes(request.getDurationMinutes());
        if (request.getStatus() != null) intervention.setStatus(request.getStatus());
        if (request.getCompletionNotes() != null) intervention.setCompletionNotes(request.getCompletionNotes());
        if (request.getEffectivenessPercent() != null) intervention.setEffectivenessPercent(request.getEffectivenessPercent());
        if (request.getEffectivenessStarRating() != null) intervention.setEffectivenessStarRating(request.getEffectivenessStarRating());
        if (request.getSupervisorComments() != null) intervention.setSupervisorComments(request.getSupervisorComments());
        if (request.getOutcomesPlanned() != null) intervention.setOutcomesPlanned(request.getOutcomesPlanned());
        if (request.getOutcomesActual() != null) intervention.setOutcomesActual(request.getOutcomesActual());
        if (request.getResources() != null) intervention.setResources(request.getResources());
        if (request.getApprovedById() != null) {
            intervention.setApprovedBy(userRepository.getReferenceById(request.getApprovedById()));
        }
        intervention = interventionRepository.save(intervention);
        if (intervention.getStatus() == InterventionStatus.COMPLETED) {
            for (CaseEntry t : caseEntryRepository.findByRelatedInterventionId(id)) {
                if (t.getType() == CaseEntryType.TASK && t.getStatus() != CaseEntryStatus.COMPLETED) {
                    t.setStatus(CaseEntryStatus.COMPLETED);
                    t.setCompletedAt(intervention.getCompletedAt());
                    caseEntryRepository.save(t);
                }
            }
        }
        Case caseRecord = intervention.getCaseRecord();
        caseProgressService.recalculateProgress(caseRecord);
        auditLogService.log(userId, "UPDATE", "Intervention", String.valueOf(id), null, null);
        return toDto(intervention);
    }

    @Transactional
    public void delete(Long id, Long userId, UserRole role) {
        Intervention intervention = interventionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Intervention", "id", id));
        validateWorkerAccess(intervention, userId, role);
        Case caseRecord = intervention.getCaseRecord();
        intervention.setDeletedAt(LocalDateTime.now());
        interventionRepository.save(intervention);
        caseProgressService.recalculateProgress(caseRecord);
        auditLogService.log(userId, "DELETE", "Intervention", String.valueOf(id), null, null);
    }

    @Transactional
    public InterventionStaffDto assignStaff(Long interventionId, Long userId, String roleInIntervention, Long assignedByUserId) {
        Intervention intervention = interventionRepository.findById(interventionId)
                .orElseThrow(() -> new ResourceNotFoundException("Intervention", "id", interventionId));
        User user = userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        if (interventionStaffRepository.existsByInterventionAndUser(intervention, user)) {
            throw new DuplicateResourceException("User already assigned to this intervention");
        }
        InterventionStaff staff = InterventionStaff.builder()
                .intervention(intervention)
                .user(user)
                .roleInIntervention(roleInIntervention)
                .build();
        staff = interventionStaffRepository.save(staff);
        auditLogService.log(assignedByUserId, "CREATE", "InterventionStaff", String.valueOf(staff.getId()), null, null);
        return staffToDto(staff);
    }

    @Transactional
    public void unassignStaff(Long interventionId, Long userId, Long removedByUserId) {
        Intervention intervention = interventionRepository.findById(interventionId)
                .orElseThrow(() -> new ResourceNotFoundException("Intervention", "id", interventionId));
        User user = userRepository.getReferenceById(userId);
        InterventionStaff staff = interventionStaffRepository.findByInterventionAndUser(intervention, user)
                .orElseThrow(() -> new ResourceNotFoundException("InterventionStaff", "intervention/user", interventionId + "/" + userId));
        interventionStaffRepository.delete(staff);
        auditLogService.log(removedByUserId, "DELETE", "InterventionStaff", String.valueOf(staff.getId()), null, null);
    }

    private UserDto userToDto(User u) {
        if (u == null) return null;
        return userService.findById(u.getId());
    }

    private InterventionStaffDto staffToDto(InterventionStaff s) {
        User u = s.getUser();
        User supervisor = u != null ? u.getSupervisor() : null;
        return InterventionStaffDto.builder()
                .id(s.getId())
                .interventionId(s.getIntervention().getId())
                .userId(u != null ? u.getId() : null)
                .userFullName(u != null ? u.getFullName() : null)
                .userEmail(u != null ? u.getEmail() : null)
                .roleInIntervention(s.getRoleInIntervention())
                .supervisorName(supervisor != null ? supervisor.getFullName() : null)
                .assignedAt(s.getAssignedAt())
                .build();
    }

    private InterventionDto toDto(Intervention i) {
        return toDto(i, null);
    }

    private InterventionDto toDto(Intervention i, UserRole role) {
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
                .completedAt(i.getCompletedAt())
                .completionNotes(i.getCompletionNotes())
                .effectivenessPercent(i.getEffectivenessPercent())
                .effectivenessStarRating(i.getEffectivenessStarRating())
                .supervisorComments(i.getSupervisorComments())
                .plannedBy(userToDto(i.getPlannedBy()))
                .approvedBy(userToDto(i.getApprovedBy()))
                .outcomesPlanned(i.getOutcomesPlanned())
                .outcomesActual(i.getOutcomesActual())
                .resources(i.getResources())
                .createdAt(i.getCreatedAt())
                .updatedAt(i.getUpdatedAt())
                .assignedStaff(role == UserRole.ADMIN ? buildAssignedStaff(i) : null)
                .build();
    }

    private List<InterventionStaffDto> buildAssignedStaff(Intervention i) {
        try {
            return interventionStaffRepository.findByIntervention(i).stream()
                    .map(this::staffToDto)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }
}
