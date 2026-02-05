package com.afyalink.backend.service;

import com.afyalink.backend.dto.report.ReassignmentRequest;
import com.afyalink.backend.enums.NotificationType;
import com.afyalink.backend.enums.UserRole;
import com.afyalink.backend.exception.BadRequestException;
import com.afyalink.backend.exception.ForbiddenException;
import com.afyalink.backend.exception.ResourceNotFoundException;
import com.afyalink.backend.model.User;
import com.afyalink.backend.repository.UserRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReassignmentService {

    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional
    public void reassignSocialWorker(Long adminUserId, ReassignmentRequest request) {
        User worker = userRepository.findById(request.getSocialWorkerId())
                .orElseThrow(() -> new ResourceNotFoundException("Social worker not found"));
        User newSupervisor = userRepository.findById(request.getNewSupervisorId())
                .orElseThrow(() -> new ResourceNotFoundException("New supervisor not found"));

        if (worker.getRole() != UserRole.SOCIAL_WORKER) {
            throw new BadRequestException("User is not a social worker");
        }
        if (newSupervisor.getRole() != UserRole.SUPERVISOR) {
            throw new BadRequestException("Target user is not a supervisor");
        }
        if (worker.getDistrict() != null && !worker.getDistrict().isBlank()
                && newSupervisor.getAssignedDistrict() != null
                && !newSupervisor.getAssignedDistrict().equalsIgnoreCase(worker.getDistrict())) {
            throw new BadRequestException(String.format(
                    "Cannot reassign: Worker is in %s district but supervisor manages %s district",
                    worker.getDistrict(), newSupervisor.getAssignedDistrict()));
        }
        if (newSupervisor.getId().equals(worker.getSupervisor() != null ? worker.getSupervisor().getId() : null)) {
            throw new BadRequestException("Social worker is already assigned to this supervisor");
        }

        User oldSupervisor = worker.getSupervisor();
        Long oldSupervisorId = oldSupervisor != null ? oldSupervisor.getId() : null;

        worker.setSupervisor(newSupervisor);
        userRepository.save(worker);

        String reason = request.getReason() != null ? request.getReason().trim() : "Workload rebalancing";
        String oldName = oldSupervisor != null ? oldSupervisor.getFullName() : "Unassigned";
        String newName = newSupervisor.getFullName();
        String workerName = worker.getFullName();

        try {
            String oldVal = objectMapper.writeValueAsString(java.util.Map.of("supervisorId", oldSupervisorId != null ? oldSupervisorId : "null"));
            String newVal = objectMapper.writeValueAsString(java.util.Map.of("supervisorId", newSupervisor.getId(), "reason", reason));
            auditLogService.log(adminUserId, "REASSIGN_SUPERVISOR", "USER", worker.getId().toString(), oldVal, newVal);
        } catch (JsonProcessingException ignored) {}

        if (oldSupervisor != null) {
            String msg = String.format("%s has been reassigned to %s. Reason: %s. You now have %d team member(s).",
                    workerName, newName, reason, userRepository.findBySupervisor(oldSupervisor).size());
            notificationService.create(oldSupervisor.getId(), NotificationType.SYSTEM_ANNOUNCEMENT,
                    "Team Member Reassigned", msg, null, null, null, null, null, null);
        }

        String msgNew = String.format("%s has been assigned to your team. Reason: %s. Please reach out to welcome them. You now have %d team member(s).",
                workerName, reason, userRepository.findBySupervisor(newSupervisor).size());
        notificationService.create(newSupervisor.getId(), NotificationType.SYSTEM_ANNOUNCEMENT,
                "New Team Member Assigned", msgNew, null, null, null, null, null, null);

        String msgWorker = String.format("Your supervisor has been changed from %s to %s. Please coordinate with your new supervisor.",
                oldName, newName);
        notificationService.create(worker.getId(), NotificationType.SYSTEM_ANNOUNCEMENT,
                "Supervisor Change", msgWorker, null, null, null, null, null, null);
    }
}
