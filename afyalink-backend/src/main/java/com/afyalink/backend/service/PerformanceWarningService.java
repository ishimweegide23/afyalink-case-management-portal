package com.afyalink.backend.service;

import com.afyalink.backend.dto.report.CreateWarningRequest;
import com.afyalink.backend.dto.report.PerformanceWarningDto;
import com.afyalink.backend.dto.report.UnderperformerFlagDto;
import com.afyalink.backend.enums.ConversationType;
import com.afyalink.backend.enums.MessageStatus;
import com.afyalink.backend.enums.MessageType;
import com.afyalink.backend.enums.NotificationType;
import com.afyalink.backend.enums.UserRole;
import com.afyalink.backend.exception.BadRequestException;
import com.afyalink.backend.exception.ForbiddenException;
import com.afyalink.backend.exception.ResourceNotFoundException;
import com.afyalink.backend.model.Message;
import com.afyalink.backend.model.PerformanceWarning;
import com.afyalink.backend.model.User;
import com.afyalink.backend.repository.MessageRepository;
import com.afyalink.backend.repository.PerformanceWarningRepository;
import com.afyalink.backend.repository.UserRepository;
import com.afyalink.backend.repository.CaseRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PerformanceWarningService {

    private static final String LOW_ACTIVITY_MSG = "This is a formal notice regarding your recent activity. Our records show insufficient updates to cases in the past 7 days. Please improve your effort and ensure cases are updated regularly.";
    private static final String MISSED_FOLLOWUPS_MSG = "This notice is regarding missed follow-up dates on assigned cases. Please review your cases and reschedule or complete overdue follow-ups.";
    private static final String OVERDUE_INTERVENTIONS_MSG = "Several interventions under your responsibility are overdue. Please update their status or complete them as soon as possible.";
    private static final String EXCELLENT_WORK_MSG = "This is a formal commendation for your excellent performance this period. Keep up the great work!";

    private final PerformanceWarningRepository warningRepository;
    private final UserRepository userRepository;
    private final CaseRepository caseRepository;
    private final MessageRepository messageRepository;
    private final NotificationService notificationService;
    private final AnalyticsService analyticsService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional
    public PerformanceWarningDto createWarning(Long fromUserId, CreateWarningRequest request) {
        User fromUser = userRepository.findById(fromUserId).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        User toUser = userRepository.findById(request.getToUserId()).orElseThrow(() -> new ResourceNotFoundException("Recipient not found"));

        if (fromUser.getRole() == UserRole.SOCIAL_WORKER) {
            throw new ForbiddenException("Social workers cannot send performance warnings");
        }
        if (fromUser.getRole() == UserRole.SUPERVISOR) {
            if (toUser.getRole() != UserRole.SOCIAL_WORKER) {
                throw new BadRequestException("Supervisors can only warn social workers");
            }
            if (toUser.getSupervisor() == null || !toUser.getSupervisor().getId().equals(fromUserId)) {
                List<User> team = userRepository.findBySupervisor(fromUser);
                if (team == null || team.stream().noneMatch(w -> w.getId().equals(toUser.getId()))) {
                    throw new ForbiddenException("You can only warn workers in your team");
                }
            }
        }

        String normalizedType = request.getWarningType() != null
                ? request.getWarningType().toUpperCase().replace(" ", "_")
                : "";

        if ("LOW_ACTIVITY".equals(normalizedType)) {
            var summary = analyticsService.getSocialWorkerSummary(toUser.getId(), java.time.LocalDate.now().minusDays(7), java.time.LocalDate.now());
            if (summary.getDaysSinceLastActivity() < 1) {
                throw new BadRequestException("Cannot send LOW_ACTIVITY warning to someone active in the last 24 hours");
            }
        }

        // Allow supervisors to send multiple warnings of the same type based on performance.
        // The restriction has been removed.

        String messageContent = buildMessageContent(normalizedType, request.getMessage());

        com.afyalink.backend.model.Case relatedCase = request.getRelatedCaseId() != null ? caseRepository.getReferenceById(request.getRelatedCaseId()) : null;

        PerformanceWarning warning = PerformanceWarning.builder()
                .fromUser(fromUser)
                .toUser(toUser)
                .warningType(normalizedType)
                .message(request.getMessage())
                .isResolved(false)
                .relatedCase(relatedCase)
                .build();
        warning = warningRepository.save(warning);

        long id1 = fromUserId;
        long id2 = toUser.getId();
        String conversationId = "direct_" + Math.min(id1, id2) + "_" + Math.max(id1, id2);
        String participantsJson;
        try {
            participantsJson = objectMapper.writeValueAsString(List.of(fromUserId, toUser.getId()));
        } catch (JsonProcessingException e) {
            participantsJson = "[" + fromUserId + "," + toUser.getId() + "]";
        }

        Message message = Message.builder()
                .conversationId(conversationId)
                .conversationType(ConversationType.DIRECT)
                .sender(fromUser)
                .senderName(fromUser.getFullName())
                .senderEmail(fromUser.getEmail())
                .senderRole(fromUser.getRole() != null ? fromUser.getRole().name() : null)
                .content(messageContent)
                .messageType(MessageType.ANNOUNCEMENT)
                .status(MessageStatus.DELIVERED)
                .participants(participantsJson)
                .attachments("[]")
                .mentions("[]")
                .readBy("[]")
                .deliveredTo("[]")
                .reactions("{}")
                .pinnedBy("[]")
                .build();
        message = messageRepository.save(message);

        warning.setMessageRef(message);
        warning = warningRepository.save(warning);

        String notifTitle = "EXCELLENT_WORK".equals(request.getWarningType()) ? "🌟 Commendation Received" : "⚠️ Performance Warning Received";
        String notifMessage = request.getMessage().length() > 100 ? request.getMessage().substring(0, 100) + "..." : request.getMessage();
        notificationService.create(toUser.getId(), NotificationType.NEW_MESSAGE, notifTitle, notifMessage, null, null, null, message.getId(), conversationId, null);

        return toDto(warning);
    }

    private String buildMessageContent(String warningType, String customMessage) {
        String template = switch (warningType != null ? warningType.toUpperCase().replace(" ", "_") : "") {
            case "LOW_ACTIVITY" -> LOW_ACTIVITY_MSG;
            case "MISSED_FOLLOWUPS" -> MISSED_FOLLOWUPS_MSG;
            case "OVERDUE_INTERVENTIONS" -> OVERDUE_INTERVENTIONS_MSG;
            case "EXCELLENT_WORK" -> EXCELLENT_WORK_MSG;
            default -> customMessage != null ? customMessage : "Performance notice.";
        };
        if (customMessage != null && !customMessage.isBlank() && !template.equals(customMessage)) {
            template = template + "\n\n" + customMessage;
        }
        return template;
    }

    @Transactional
    public PerformanceWarningDto resolveWarning(Long warningId, Long userId) {
        PerformanceWarning warning = warningRepository.findById(warningId).orElseThrow(() -> new ResourceNotFoundException("Warning not found"));
        if (!warning.getToUser().getId().equals(userId)) {
            throw new ForbiddenException("Only the recipient can resolve this warning");
        }
        warning.setResolved(true);
        warning.setResolvedAt(LocalDateTime.now());
        warning = warningRepository.save(warning);

        String msg = warning.getToUser().getFullName() + " has marked your warning as resolved";
        notificationService.create(warning.getFromUser().getId(), NotificationType.SYSTEM_ANNOUNCEMENT, "✅ Warning Resolved", msg, null, null, null, null, null, null);

        return toDto(warning);
    }

    @Transactional(readOnly = true)
    public Page<PerformanceWarningDto> getReceivedWarnings(Long userId, Pageable pageable, Boolean resolved) {
        if (resolved != null) {
            return warningRepository.findByToUser_IdAndIsResolved(userId, resolved, pageable).map(this::toDto);
        }
        return warningRepository.findByToUser_Id(userId, pageable).map(this::toDto);
    }

    @Transactional(readOnly = true)
    public Page<PerformanceWarningDto> getSentWarnings(Long fromUserId, Pageable pageable) {
        return warningRepository.findByFromUser_Id(fromUserId, pageable).map(this::toDto);
    }

    @Transactional(readOnly = true)
    public long getUnresolvedWarningCount(Long userId) {
        return warningRepository.countByToUser_IdAndIsResolved(userId, false);
    }

    @Transactional(readOnly = true)
    public List<PerformanceWarningDto> getWarningsForUser(Long userId, int limit) {
        return warningRepository.findByToUser_Id(userId, PageRequest.of(0, limit)).getContent().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PerformanceWarningDto> getWorkerWarningHistory(Long supervisorId, Long workerId) {
        User supervisor = userRepository.findById(supervisorId).orElseThrow();
        List<User> team = userRepository.findBySupervisor(supervisor);
        if (team == null || team.stream().noneMatch(w -> w.getId().equals(workerId))) {
            throw new ForbiddenException("Worker not in your team");
        }
        return warningRepository.findByFromUser_IdAndToUser_Id(supervisorId, workerId, Pageable.unpaged()).getContent().stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<UnderperformerFlagDto> autoDetectUnderperformers(Long supervisorId) {
        return analyticsService.autoDetectUnderperformers(supervisorId);
    }

    private PerformanceWarningDto toDto(PerformanceWarning w) {
        String conversationId = null;
        UUID messageId = null;
        if (w.getMessageRef() != null) {
            messageId = w.getMessageRef().getId();
            conversationId = w.getMessageRef().getConversationId();
        }
        return PerformanceWarningDto.builder()
                .id(w.getId())
                .fromUserId(w.getFromUser().getId())
                .fromUserName(w.getFromUser().getFullName())
                .fromUserRole(w.getFromUser().getRole() != null ? w.getFromUser().getRole().name() : null)
                .toUserId(w.getToUser().getId())
                .toUserName(w.getToUser().getFullName())
                .toUserRole(w.getToUser().getRole() != null ? w.getToUser().getRole().name() : null)
                .warningType(w.getWarningType())
                .message(w.getMessage())
                .isResolved(w.isResolved())
                .resolvedAt(w.getResolvedAt())
                .relatedCaseId(w.getRelatedCase() != null ? w.getRelatedCase().getId() : null)
                .relatedCaseNumber(w.getRelatedCase() != null ? w.getRelatedCase().getCaseNumber() : null)
                .messageId(messageId)
                .conversationId(conversationId)
                .createdAt(w.getCreatedAt())
                .build();
    }
}
