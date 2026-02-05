package com.afyalink.backend.service;

import com.afyalink.backend.dto.cases.CaseDto;
import com.afyalink.backend.dto.cases.CreateCaseRequest;
import com.afyalink.backend.dto.cases.UpdateCaseRequest;
import com.afyalink.backend.dto.common.PageResponse;
import com.afyalink.backend.dto.user.UserDto;
import com.afyalink.backend.enums.CasePriority;
import com.afyalink.backend.enums.CaseStatus;
import com.afyalink.backend.enums.UserRole;
import com.afyalink.backend.exception.ForbiddenException;
import com.afyalink.backend.exception.ResourceNotFoundException;
import com.afyalink.backend.model.Case;
import com.afyalink.backend.model.User;
import com.afyalink.backend.repository.CaseRepository;
import com.afyalink.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CaseService {

    private final CaseRepository caseRepository;
    private final UserRepository userRepository;
    private final UserService userService;
    private final AuditLogService auditLogService;
    private final DistrictScopeService districtScopeService;

    @Transactional(readOnly = true)
    public PageResponse<CaseDto> findAll(int page, int size, String sortBy, String direction) {
        Sort sort = Sort.by(Sort.Direction.fromString(direction), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<Case> casePage = caseRepository.findAll(pageable);
        return PageResponse.of(casePage.map(this::toDto));
    }

    /** Role-based: SOCIAL_WORKER = own cases; SUPERVISOR = team cases only; ADMIN = all. */
    @Transactional(readOnly = true)
    public PageResponse<CaseDto> findAll(int page, int size, String sortBy, String direction, Long currentUserId, UserRole role) {
        if (role == UserRole.SOCIAL_WORKER && currentUserId != null) {
            User worker = userRepository.findById(currentUserId).orElseThrow();
            Sort sort = Sort.by(Sort.Direction.fromString(direction), sortBy);
            Pageable pageable = PageRequest.of(page, size, sort);
            String district = districtScopeService.resolveWorkerDistrict(worker);
            return PageResponse.of(caseRepository.findByWorkerInDistrict(worker, district, pageable).map(this::toDto));
        }
        if (role == UserRole.SUPERVISOR && currentUserId != null) {
            User supervisor = userRepository.findById(currentUserId).orElseThrow();
            Sort sort = Sort.by(Sort.Direction.fromString(direction), sortBy);
            Pageable pageable = PageRequest.of(page, size, sort);
            String district = districtScopeService.resolveSupervisorDistrict(supervisor);
            return PageResponse.of(caseRepository.findBySupervisorTeamInDistrict(currentUserId, district, pageable).map(this::toDto));
        }
        return findAll(page, size, sortBy, direction);
    }

    @Transactional(readOnly = true)
    public PageResponse<CaseDto> findByAssignedTo(Long assignedUserId, int page, int size, String sortBy, String direction) {
        User worker = userRepository.getReferenceById(assignedUserId);
        Sort sort = Sort.by(Sort.Direction.fromString(direction), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);
        return PageResponse.of(caseRepository.findByAssignedSocialWorker(worker, pageable).map(this::toDto));
    }

    @Transactional(readOnly = true)
    public CaseDto findById(Long id) {
        Case c = caseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Case", "id", id));
        return toDto(c);
    }

    @Transactional(readOnly = true)
    public CaseDto findById(Long id, Long currentUserId, UserRole role) {
        Case c = caseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Case", "id", id));
        assertCaseAccessible(c, currentUserId, role);
        return toDto(c);
    }

    /** Ensures ADMIN, assigned worker, or that worker's supervisor can access the case. */
    public void assertCaseAccessible(Case c, Long currentUserId, UserRole role) {
        if (role == null || currentUserId == null || role == UserRole.ADMIN) {
            return;
        }
        if (role == UserRole.SOCIAL_WORKER) {
            if (c.getAssignedSocialWorker() == null || !c.getAssignedSocialWorker().getId().equals(currentUserId)) {
                throw new org.springframework.security.access.AccessDeniedException("You are not assigned to this case");
            }
            User worker = c.getAssignedSocialWorker();
            String workerDistrict = districtScopeService.resolveWorkerDistrict(worker);
            if (workerDistrict != null && c.getAssignedSocialWorker().getDistrict() != null
                    && !districtScopeService.matchesDistrict(worker.getDistrict(), workerDistrict)) {
                throw new org.springframework.security.access.AccessDeniedException("This case is outside your assigned district");
            }
            return;
        }
        if (role == UserRole.SUPERVISOR) {
            if (!isSupervisorOfCase(currentUserId, c)) {
                throw new org.springframework.security.access.AccessDeniedException("This case is not assigned to your team");
            }
            User supervisor = userRepository.findById(currentUserId).orElseThrow();
            String supDistrict = districtScopeService.resolveSupervisorDistrict(supervisor);
            if (supDistrict != null && c.getAssignedSocialWorker() != null
                    && !districtScopeService.matchesDistrict(c.getAssignedSocialWorker().getDistrict(), supDistrict)) {
                throw new org.springframework.security.access.AccessDeniedException("This case is outside your assigned district");
            }
        }
    }

    private static boolean matchesCaseKeyword(Case c, String kw) {
        if (kw == null || kw.isBlank()) return true;
        return (c.getTitle() != null && c.getTitle().toLowerCase().contains(kw))
                || (c.getCaseNumber() != null && c.getCaseNumber().toLowerCase().contains(kw))
                || (c.getBeneficiaryName() != null && c.getBeneficiaryName().toLowerCase().contains(kw))
                || (c.getBeneficiaryIdentifier() != null && c.getBeneficiaryIdentifier().toLowerCase().contains(kw));
    }

    private boolean isSupervisorOfCase(Long supervisorId, Case c) {
        return c.getAssignedSocialWorker() != null
                && c.getAssignedSocialWorker().getSupervisor() != null
                && c.getAssignedSocialWorker().getSupervisor().getId().equals(supervisorId);
    }

    @Transactional(readOnly = true)
    public PageResponse<CaseDto> findByStatus(CaseStatus status, int page, int size, String sortBy, String direction) {
        Sort sort = Sort.by(Sort.Direction.fromString(direction), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);
        return PageResponse.of(caseRepository.findByStatus(status, pageable).map(this::toDto));
    }

    /** Role-based: SOCIAL_WORKER / SUPERVISOR scoped; ADMIN all. */
    public PageResponse<CaseDto> findByStatus(CaseStatus status, int page, int size, String sortBy, String direction, Long currentUserId, UserRole role) {
        if (role == UserRole.SOCIAL_WORKER && currentUserId != null) {
            User worker = userRepository.findById(currentUserId).orElseThrow();
            Sort sort = Sort.by(Sort.Direction.fromString(direction), sortBy);
            Pageable pageable = PageRequest.of(page, size, sort);
            String district = districtScopeService.resolveWorkerDistrict(worker);
            return PageResponse.of(caseRepository.findByWorkerInDistrictAndStatus(worker, district, status, pageable).map(this::toDto));
        }
        if (role == UserRole.SUPERVISOR && currentUserId != null) {
            User supervisor = userRepository.findById(currentUserId).orElseThrow();
            Sort sort = Sort.by(Sort.Direction.fromString(direction), sortBy);
            Pageable pageable = PageRequest.of(page, size, sort);
            String district = districtScopeService.resolveSupervisorDistrict(supervisor);
            return PageResponse.of(caseRepository.findBySupervisorTeamInDistrictAndStatus(currentUserId, district, status, pageable).map(this::toDto));
        }
        return findByStatus(status, page, size, sortBy, direction);
    }

    @Transactional(readOnly = true)
    public PageResponse<CaseDto> search(String keyword, int page, int size, String sortBy, String direction) {
        Sort sort = Sort.by(Sort.Direction.fromString(direction), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);
        return PageResponse.of(caseRepository.searchCases(keyword, pageable).map(this::toDto));
    }

    /** Role-based: SOCIAL_WORKER / SUPERVISOR scoped search; ADMIN global. */
    public PageResponse<CaseDto> search(String keyword, int page, int size, String sortBy, String direction, Long currentUserId, UserRole role) {
        if (role == UserRole.SOCIAL_WORKER && currentUserId != null) {
            User worker = userRepository.findById(currentUserId).orElseThrow();
            String district = districtScopeService.resolveWorkerDistrict(worker);
            Sort sort = Sort.by(Sort.Direction.fromString(direction), sortBy);
            Pageable pageable = PageRequest.of(page, size, sort);
            Page<Case> scoped = caseRepository.findByWorkerInDistrict(worker, district, PageRequest.of(0, 2000, sort));
            String kw = keyword.toLowerCase();
            List<Case> filtered = scoped.getContent().stream()
                    .filter(c -> matchesCaseKeyword(c, kw))
                    .toList();
            int from = page * size;
            int to = Math.min(from + size, filtered.size());
            List<Case> slice = from >= filtered.size() ? List.of() : filtered.subList(from, to);
            return PageResponse.of(new org.springframework.data.domain.PageImpl<>(slice, pageable, filtered.size()).map(this::toDto));
        }
        if (role == UserRole.SUPERVISOR && currentUserId != null) {
            User supervisor = userRepository.findById(currentUserId).orElseThrow();
            String district = districtScopeService.resolveSupervisorDistrict(supervisor);
            Sort sort = Sort.by(Sort.Direction.fromString(direction), sortBy);
            Pageable pageable = PageRequest.of(page, size, sort);
            Page<Case> scoped = caseRepository.findBySupervisorTeamInDistrict(currentUserId, district, PageRequest.of(0, 2000, sort));
            String kw = keyword.toLowerCase();
            List<Case> filtered = scoped.getContent().stream()
                    .filter(c -> matchesCaseKeyword(c, kw))
                    .toList();
            int from = page * size;
            int to = Math.min(from + size, filtered.size());
            List<Case> slice = from >= filtered.size() ? List.of() : filtered.subList(from, to);
            return PageResponse.of(new org.springframework.data.domain.PageImpl<>(slice, pageable, filtered.size()).map(this::toDto));
        }
        return search(keyword, page, size, sortBy, direction);
    }

    @Transactional
    public CaseDto create(CreateCaseRequest request, Long createdById, UserRole role) {
        User createdBy = userRepository.getReferenceById(createdById);
        User assignedWorker;
        if (request.getAssignedSocialWorkerId() != null) {
            assignedWorker = userRepository.getReferenceById(request.getAssignedSocialWorkerId());
        } else if (role == UserRole.SOCIAL_WORKER) {
            assignedWorker = createdBy;
        } else {
            assignedWorker = null;
        }
        if (role == UserRole.SUPERVISOR) {
            if (assignedWorker == null) {
                throw new ForbiddenException("Supervisors must assign new cases to a social worker on their team.");
            }
            if (assignedWorker.getSupervisor() == null || !assignedWorker.getSupervisor().getId().equals(createdById)) {
                throw new ForbiddenException("You can only assign cases to social workers on your team.");
            }
        }
        String tempCaseNumber = "TEMP-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        Case caseRecord = Case.builder()
                .caseNumber(tempCaseNumber)
                .title(request.getTitle())
                .beneficiaryName(request.getBeneficiaryName())
                .beneficiaryIdentifier(request.getBeneficiaryIdentifier())
                .priority(request.getPriority())
                .status(CaseStatus.OPEN)
                .assignedSocialWorker(assignedWorker)
                .createdBy(createdBy)
                .openedAt(LocalDateTime.now())
                .nextFollowUpDate(request.getNextFollowUpDate())
                .progressPercent(0)
                .build();
        caseRecord = caseRepository.save(caseRecord);
        caseRecord.setCaseNumber(String.format("CASE-%06d", caseRecord.getId()));
        caseRecord = caseRepository.save(caseRecord);
        auditLogService.log(createdById, "CREATE", "Case", String.valueOf(caseRecord.getId()), null, null);
        return toDto(caseRecord);
    }

    @Transactional
    public CaseDto update(Long id, UpdateCaseRequest request, Long updatedById, UserRole role) {
        Case caseRecord = caseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Case", "id", id));
        if (updatedById != null) {
            assertCaseAccessible(caseRecord, updatedById, role);
            if (role == UserRole.SUPERVISOR) {
                throw new org.springframework.security.access.AccessDeniedException("Supervisors cannot edit case records; reassign via admin if needed");
            }
        }
        if (request.getTitle() != null) caseRecord.setTitle(request.getTitle());
        if (request.getBeneficiaryName() != null) caseRecord.setBeneficiaryName(request.getBeneficiaryName());
        if (request.getBeneficiaryIdentifier() != null) caseRecord.setBeneficiaryIdentifier(request.getBeneficiaryIdentifier());
        if (request.getStatus() != null) {
            caseRecord.setStatus(request.getStatus());
        }
        if (caseRecord.getStatus() == CaseStatus.CLOSED) {
            LocalDateTime closedAt = request.getClosedAt() != null ? request.getClosedAt() : 
                    (caseRecord.getClosedAt() != null ? caseRecord.getClosedAt() : LocalDateTime.now());
            if (closedAt.isAfter(LocalDateTime.now())) {
                throw new IllegalArgumentException("Cannot close case on " + closedAt.toLocalDate() + ". Please use today (" + java.time.LocalDate.now() + ") or an earlier date.");
            }
            caseRecord.setClosedAt(closedAt);
        } else {
            caseRecord.setClosedAt(null);
        }
        if (request.getPriority() != null) caseRecord.setPriority(request.getPriority());
        if (request.getAssignedSocialWorkerId() != null) {
            caseRecord.setAssignedSocialWorker(userRepository.getReferenceById(request.getAssignedSocialWorkerId()));
        }
        if (request.getNextFollowUpDate() != null) caseRecord.setNextFollowUpDate(request.getNextFollowUpDate());
        if (request.getProgressPercent() != null) caseRecord.setProgressPercent(request.getProgressPercent());
        caseRecord.setUpdatedBy(userRepository.getReferenceById(updatedById));
        caseRecord = caseRepository.save(caseRecord);
        auditLogService.log(updatedById, "UPDATE", "Case", String.valueOf(id), null, null);
        return toDto(caseRecord);
    }

    @Transactional
    public void delete(Long id, Long userId, UserRole role) {
        Case caseRecord = caseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Case", "id", id));
        if (userId != null && role != null) {
            assertCaseAccessible(caseRecord, userId, role);
            if (role == UserRole.SUPERVISOR) {
                throw new org.springframework.security.access.AccessDeniedException("Supervisors cannot delete cases");
            }
        }
        caseRepository.delete(caseRecord);
        auditLogService.log(userId, "DELETE", "Case", String.valueOf(id), null, null);
    }

    private UserDto userToDto(User u) {
        if (u == null) return null;
        try {
            return userService.findById(u.getId());
        } catch (Exception e) {
            return null;
        }
    }

    private CaseDto toDto(Case c) {
        User assigned = c.getAssignedSocialWorker();
        User supervisor = assigned != null ? assigned.getSupervisor() : null;
        return CaseDto.builder()
                .id(c.getId())
                .caseNumber(c.getCaseNumber())
                .title(c.getTitle())
                .beneficiaryName(c.getBeneficiaryName())
                .beneficiaryIdentifier(c.getBeneficiaryIdentifier())
                .status(c.getStatus())
                .priority(c.getPriority())
                .assignedSocialWorker(userToDto(assigned))
                .assignedSocialWorkerSupervisorName(supervisor != null ? supervisor.getFullName() : null)
                .assignedSocialWorkerSupervisorId(supervisor != null ? supervisor.getId() : null)
                .createdBy(userToDto(c.getCreatedBy()))
                .openedAt(c.getOpenedAt())
                .closedAt(c.getClosedAt())
                .nextFollowUpDate(c.getNextFollowUpDate())
                .progressPercent(c.getProgressPercent())
                .interventionCount(c.getInterventionCount() != null ? c.getInterventionCount() : 0)
                .totalTaskCount(c.getTotalTaskCount() != null ? c.getTotalTaskCount() : 0)
                .completedTaskCount(c.getCompletedTaskCount() != null ? c.getCompletedTaskCount() : 0)
                .documentCount(c.getDocumentCount() != null ? c.getDocumentCount() : 0)
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }
}
