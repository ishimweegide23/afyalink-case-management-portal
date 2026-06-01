// Added extra validation checks here
package com.afyalink.backend.service;

import com.afyalink.backend.dto.notification.NotificationDto;
import com.afyalink.backend.dto.common.PageResponse;
import com.afyalink.backend.enums.NotificationType;
import com.afyalink.backend.exception.ResourceNotFoundException;
import com.afyalink.backend.model.*;
import com.afyalink.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final CaseRepository caseRepository;
    private final InterventionRepository interventionRepository;
    private final CaseEntryRepository caseEntryRepository;
    private final MessageRepository messageRepository;

    public NotificationDto findById(Long id) {
        Notification n = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", "id", id));
        return toDto(n);
    }

    @Transactional(readOnly = true)
    public PageResponse<NotificationDto> findByUserId(Long userId, int page, int size, String sortBy, String direction) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        Sort sort = Sort.by(Sort.Direction.fromString(direction), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);
        return PageResponse.of(notificationRepository.findByUser(user, pageable).map(this::toDto));
    }

    @Transactional(readOnly = true)
    public PageResponse<NotificationDto> findUnreadByUserId(Long userId, int page, int size, String sortBy, String direction) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        Sort sort = Sort.by(Sort.Direction.fromString(direction), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);
        return PageResponse.of(notificationRepository.findByUserAndReadAtIsNull(user, pageable).map(this::toDto));
    }

    public long countUnreadByUserId(Long userId) {
        User user = userRepository.getReferenceById(userId);
        return notificationRepository.countByUserAndReadAtIsNull(user);
    }

    @Transactional(readOnly = true)
    public PageResponse<NotificationDto> searchByUserId(Long userId, String keyword, int page, int size, String sortBy, String direction) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        Sort sort = Sort.by(Sort.Direction.fromString(direction), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);
        return PageResponse.of(notificationRepository.searchByUser(user, keyword, pageable).map(this::toDto));
    }

    @Transactional
    public NotificationDto create(Long userId, NotificationType type, String title, String message,
                                  Long relatedCaseId, Long relatedInterventionId, Long relatedCaseEntryId,
                                  java.util.UUID relatedMessageId, String relatedConversationId,
                                  LocalDateTime dueDateTime) {
        User user = userRepository.getReferenceById(userId);
        Case relatedCase = relatedCaseId != null ? caseRepository.getReferenceById(relatedCaseId) : null;
        Intervention relatedIntervention = relatedInterventionId != null ? interventionRepository.getReferenceById(relatedInterventionId) : null;
        CaseEntry relatedCaseEntry = relatedCaseEntryId != null ? caseEntryRepository.getReferenceById(relatedCaseEntryId) : null;
        Message relatedMessage = relatedMessageId != null ? messageRepository.getReferenceById(relatedMessageId) : null;

        Notification n = Notification.builder()
                .user(user)
                .type(type)
                .title(title)
                .message(message)
                .relatedCase(relatedCase)
                .relatedIntervention(relatedIntervention)
                .relatedCaseEntry(relatedCaseEntry)
                .relatedMessage(relatedMessage)
                .relatedConversationId(relatedConversationId)
                .dueDateTime(dueDateTime)
                .sentAt(LocalDateTime.now())
                .build();
        n = notificationRepository.save(n);
        return toDto(n);
    }

    @Transactional
    public NotificationDto markRead(Long id, Long userId) {
        Notification n = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", "id", id));
        if (!n.getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException("Notification", "id", id);
        }
        n.setReadAt(LocalDateTime.now());
        n = notificationRepository.save(n);
        return toDto(n);
    }

    @Transactional
    public void markAllReadByUserId(Long userId) {
        User user = userRepository.getReferenceById(userId);
        notificationRepository.findByUserAndReadAtIsNull(user, Pageable.unpaged()).getContent().forEach(n -> {
            n.setReadAt(LocalDateTime.now());
            notificationRepository.save(n);
        });
    }

    @Transactional
    public void sendReminder(Long senderId, Long targetUserId, String periodType, java.time.LocalDate start, java.time.LocalDate end) {
        User targetUser = userRepository.findById(targetUserId).orElseThrow(() -> new ResourceNotFoundException("User", "id", targetUserId));
        User sender = userRepository.findById(senderId).orElseThrow(() -> new ResourceNotFoundException("User", "id", senderId));
        
        String title = "Report Reminder: " + periodType + " Report";
        String message = "This is a reminder from " + sender.getFullName() + " to submit your " + periodType + " report for the period " + start + " to " + end + ".";
        
        create(targetUserId, NotificationType.REPORT_REMINDER, title, message, null, null, null, null, null, null);
    }

    private NotificationDto toDto(Notification n) {
        return NotificationDto.builder()
                .id(n.getId())
                .userId(n.getUser().getId())
                .type(n.getType())
                .title(n.getTitle())
                .message(n.getMessage())
                .relatedCaseId(n.getRelatedCase() != null ? n.getRelatedCase().getId() : null)
                .relatedCaseNumber(n.getRelatedCase() != null ? n.getRelatedCase().getCaseNumber() : null)
                .relatedInterventionId(n.getRelatedIntervention() != null ? n.getRelatedIntervention().getId() : null)
                .relatedCaseEntryId(n.getRelatedCaseEntry() != null ? n.getRelatedCaseEntry().getId() : null)
                .relatedMessageId(n.getRelatedMessage() != null ? n.getRelatedMessage().getId() : null)
                .relatedConversationId(n.getRelatedConversationId())
                .dueDateTime(n.getDueDateTime())
                .sentAt(n.getSentAt())
                .readAt(n.getReadAt())
                .isRead(n.getReadAt() != null)
                .createdAt(n.getCreatedAt())
                .build();
    }
}
