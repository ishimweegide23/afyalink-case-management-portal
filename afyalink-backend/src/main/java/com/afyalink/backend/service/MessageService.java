package com.afyalink.backend.service;

import com.afyalink.backend.dto.common.PageResponse;
import com.afyalink.backend.dto.message.ConversationDto;
import com.afyalink.backend.dto.message.CreateGroupRequest;
import com.afyalink.backend.dto.message.CreateTeamGroupRequest;
import com.afyalink.backend.dto.message.MessageDto;
import com.afyalink.backend.dto.message.MessageableUserDto;
import com.afyalink.backend.dto.message.SendMessageRequest;
import com.afyalink.backend.enums.ConversationType;
import com.afyalink.backend.enums.MessageStatus;
import com.afyalink.backend.enums.MessageType;
import com.afyalink.backend.enums.NotificationType;
import com.afyalink.backend.enums.UserRole;
import com.afyalink.backend.exception.ForbiddenException;
import com.afyalink.backend.exception.ResourceNotFoundException;
import com.afyalink.backend.model.Case;
import com.afyalink.backend.model.Message;
import com.afyalink.backend.model.User;
import com.afyalink.backend.model.UserProfile;
import com.afyalink.backend.repository.CaseRepository;
import com.afyalink.backend.repository.MessageRepository;
import com.afyalink.backend.repository.UserProfileRepository;
import com.afyalink.backend.repository.UserRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MessageService {

    private static final String ALL_STAFF_CONVERSATION_ID = "grp-all-staff";

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final CaseRepository caseRepository;
    private final NotificationService notificationService;
    private final DistrictScopeService districtScopeService;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public MessageDto findById(UUID id) {
        Message m = messageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Message", "id", id.toString()));
        if (m.isDeleted()) {
            throw new ResourceNotFoundException("Message", "id", id.toString());
        }
        return toDto(m);
    }

    @Transactional(readOnly = true)
    public PageResponse<MessageDto> findByConversationId(String conversationId, int page, int size, String sortBy, String direction) {
        Sort sort = Sort.by(Sort.Direction.ASC, "createdAt");
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<Message> messagePage = messageRepository.findByConversationId(conversationId, pageable);
        return PageResponse.of(messagePage.map(this::toDto));
    }

    @Transactional(readOnly = true)
    public List<ConversationDto> getConversationsForUser(Long userId) {
        userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        Pageable pageable = PageRequest.of(0, 500);
        Page<Message> page = messageRepository.findMessagesForUserConversations(userId, pageable);
        Map<String, Message> latestByConv = new LinkedHashMap<>();
        for (Message m : page.getContent()) {
            if (!m.isDeleted() && !latestByConv.containsKey(m.getConversationId())) {
                latestByConv.put(m.getConversationId(), m);
            }
        }
        List<ConversationDto> list = new ArrayList<>();
        for (Message m : latestByConv.values()) {
            // Resolve the real name for DIRECT conversations (fixes "direct_1_55" display)
            String convTitle = m.getConversationTitle();
            String otherAvatarUrl = null;
            if (m.getConversationType() == ConversationType.DIRECT || isGenericDirectTitle(convTitle)) {
                Long otherId = resolveOtherParticipantId(m.getConversationId(), m.getParticipants(), userId);
                if (otherId != null) {
                    User otherUser = userRepository.findById(otherId).orElse(null);
                    if (otherUser != null) {
                        convTitle = otherUser.getFullName();
                        otherAvatarUrl = resolveAvatarUrl(otherUser);
                    }
                }
            }
            if (convTitle == null || convTitle.isBlank()) {
                convTitle = m.getConversationTitle() != null ? m.getConversationTitle() : m.getConversationId();
            }
            String lastAvatar = otherAvatarUrl;
            if (lastAvatar == null || lastAvatar.isBlank()) {
                lastAvatar = m.getSenderAvatar();
            }
            if (lastAvatar == null || lastAvatar.isBlank()) {
                lastAvatar = resolveAvatarUrl(m.getSender());
            }
            list.add(ConversationDto.builder()
                    .conversationId(m.getConversationId())
                    .conversationType(m.getConversationType())
                    .conversationTitle(convTitle)
                    .lastMessageContent(m.getContent())
                    .lastMessageSenderId(m.getSender().getId())
                    .lastMessageSenderName(m.getSenderName())
                    .lastMessageSenderAvatar(lastAvatar)
                    .lastMessageTime(m.getCreatedAt())
                    .caseId(m.getCaseRecord() != null ? m.getCaseRecord().getId() : null)
                    .caseNumber(m.getCaseNumber())
                    .unreadCount(0)
                    .participants(m.getParticipants() != null ? m.getParticipants() : "[]")
                    .groupAvatar(m.getGroupAvatar())
                    .build());
        }
        list.sort((a, b) -> {
            if (b.getLastMessageTime() == null && a.getLastMessageTime() == null) return 0;
            if (b.getLastMessageTime() == null) return -1;
            if (a.getLastMessageTime() == null) return 1;
            return b.getLastMessageTime().compareTo(a.getLastMessageTime());
        });
        return list;
    }

    private boolean isGenericDirectTitle(String title) {
        if (title == null || title.isBlank()) return true;
        String t = title.toLowerCase().trim();
        return t.startsWith("direct_") || t.startsWith("dir-")
            || t.equals("direct message") || t.equals("direct") || t.equals("dm");
    }

    private Long resolveOtherParticipantId(String conversationId, String participantsJson, Long currentUserId) {
        List<Long> ids = parseParticipantIds(participantsJson);
        if (ids.isEmpty() && conversationId != null) {
            java.util.regex.Matcher mat = java.util.regex.Pattern
                .compile("(?:direct_|dir-)(\\d+)[_-](\\d+)")
                .matcher(conversationId);
            if (mat.find()) {
                try { ids.add(Long.parseLong(mat.group(1))); } catch (NumberFormatException ignored) {}
                try { ids.add(Long.parseLong(mat.group(2))); } catch (NumberFormatException ignored) {}
            }
        }
        return ids.stream().filter(id -> !id.equals(currentUserId)).findFirst().orElse(null);
    }

    @Transactional(readOnly = true)
    public List<MessageableUserDto> getMessageableUsers(Long userId) {
        User me = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        LinkedHashMap<Long, User> byId = new LinkedHashMap<>();

        switch (me.getRole()) {
            case ADMIN -> userRepository.findAll().forEach(u -> {
                if (u.isActive() && !u.getId().equals(userId)) {
                    byId.put(u.getId(), u);
                }
            });
            case SUPERVISOR -> districtScopeService.workersInSupervisorDistrict(me).stream()
                    .filter(User::isActive)
                    .forEach(u -> byId.put(u.getId(), u));
            case SOCIAL_WORKER -> {
                userRepository.findByRole(UserRole.SOCIAL_WORKER).stream()
                        .filter(u -> u.isActive() && !u.getId().equals(userId))
                        .forEach(u -> byId.put(u.getId(), u));
                if (me.getSupervisor() != null) {
                    User sup = userRepository.findById(me.getSupervisor().getId()).orElse(null);
                    if (sup != null && sup.isActive()) {
                        byId.put(sup.getId(), sup);
                    }
                }
                userRepository.findByRole(UserRole.ADMIN).stream()
                        .filter(User::isActive)
                        .forEach(u -> byId.put(u.getId(), u));
            }
            default -> { }
        }

        return byId.values().stream().map(this::toMessageableUserDto).toList();
    }

    @Transactional
    public Map<String, String> createAllStaffGroup(CreateGroupRequest request, Long adminId) {
        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", adminId));
        if (admin.getRole() != UserRole.ADMIN) {
            throw new ForbiddenException("Only administrators can create the all-staff group");
        }

        Set<Long> participantIds = new LinkedHashSet<>();
        for (UserRole role : List.of(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.SOCIAL_WORKER)) {
            userRepository.findByRole(role).stream()
                    .filter(User::isActive)
                    .map(User::getId)
                    .forEach(participantIds::add);
        }
        participantIds.add(adminId);

        String title = request.getTitle() != null && !request.getTitle().isBlank()
                ? request.getTitle().trim() : "AfyaLink - All Staff";
        String content = request.getInitialMessage() != null && !request.getInitialMessage().isBlank()
                ? request.getInitialMessage().trim()
                : "Welcome to the all-staff channel.";

        SendMessageRequest msgRequest = new SendMessageRequest();
        msgRequest.setConversationId(ALL_STAFF_CONVERSATION_ID);
        msgRequest.setConversationType(ConversationType.GROUP);
        msgRequest.setConversationTitle(title);
        msgRequest.setParticipants(toJsonIds(new ArrayList<>(participantIds)));
        msgRequest.setContent(content);
        msgRequest.setMessageType(MessageType.ANNOUNCEMENT);

        send(msgRequest, adminId);
        return Map.of("conversationId", ALL_STAFF_CONVERSATION_ID);
    }

    @Transactional
    public Map<String, String> createTeamGroup(CreateTeamGroupRequest request, Long supervisorId) {
        User supervisor = userRepository.findById(supervisorId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", supervisorId));
        if (supervisor.getRole() != UserRole.SUPERVISOR) {
            throw new ForbiddenException("Only supervisors can create team groups");
        }

        List<User> teamWorkers = districtScopeService.workersInSupervisorDistrict(supervisor).stream()
                .filter(User::isActive)
                .toList();

        Set<Long> participantIds = new LinkedHashSet<>();
        participantIds.add(supervisorId);

        if (request.getMemberIds() != null && !request.getMemberIds().isEmpty()) {
            Set<Long> allowed = teamWorkers.stream().map(User::getId).collect(Collectors.toSet());
            for (Long memberId : request.getMemberIds()) {
                if (allowed.contains(memberId)) {
                    participantIds.add(memberId);
                }
            }
        } else {
            teamWorkers.forEach(w -> participantIds.add(w.getId()));
        }

        if (participantIds.size() <= 1) {
            throw new ForbiddenException("No social workers assigned to your team. Assign workers before creating a group.");
        }

        String district = districtScopeService.resolveSupervisorDistrict(supervisor);
        String slug = district != null && !district.isBlank()
                ? district.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "-")
                : String.valueOf(supervisorId);
        String conversationId = "team-" + supervisorId + "-" + slug;

        String title = request.getTitle().trim();
        String content = request.getInitialMessage() != null && !request.getInitialMessage().isBlank()
                ? request.getInitialMessage().trim()
                : "Team group created for " + (district != null ? district : "your district") + ".";

        SendMessageRequest msgRequest = new SendMessageRequest();
        msgRequest.setConversationId(conversationId);
        msgRequest.setConversationType(ConversationType.TEAM);
        msgRequest.setConversationTitle(title);
        msgRequest.setParticipants(toJsonIds(new ArrayList<>(participantIds)));
        msgRequest.setContent(content);
        msgRequest.setMessageType(MessageType.TEXT);

        send(msgRequest, supervisorId);
        return Map.of("conversationId", conversationId);
    }

    @Transactional(readOnly = true)
    public PageResponse<MessageDto> findByCaseId(Long caseId, int page, int size, String sortBy, String direction) {
        Case caseRecord = caseRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("Case", "id", caseId));
        Sort sort = Sort.by(Sort.Direction.fromString(direction), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);
        return PageResponse.of(messageRepository.findByCaseRecord(caseRecord, pageable).map(this::toDto));
    }

    @Transactional(readOnly = true)
    public PageResponse<MessageDto> search(String keyword, int page, int size, String sortBy, String direction) {
        Sort sort = Sort.by(Sort.Direction.fromString(direction), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);
        return PageResponse.of(messageRepository.searchMessages(keyword, pageable).map(this::toDto));
    }

    @Transactional(readOnly = true)
    public PageResponse<MessageDto> searchByConversation(String conversationId, String keyword, int page, int size, String sortBy, String direction) {
        Sort sort = Sort.by(Sort.Direction.fromString(direction), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);
        return PageResponse.of(messageRepository.searchByConversation(conversationId, keyword, pageable).map(this::toDto));
    }

    @Transactional
    public MessageDto send(SendMessageRequest request, Long senderId) {
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", senderId));
        Case caseRecord = request.getCaseId() != null ? caseRepository.findById(request.getCaseId())
                .orElse(null) : null;
        Message replyTo = request.getReplyToMessageId() != null
                ? messageRepository.findById(request.getReplyToMessageId()).orElse(null) : null;

        String replyToContent = null;
        String replyToSenderName = null;
        if (replyTo != null) {
            replyToContent = replyTo.getContent();
            replyToSenderName = replyTo.getSenderName() != null ? replyTo.getSenderName() : replyTo.getSender().getFullName();
        }

        String participantsJson = ensureParticipantsIncludesSender(
                toJsonArrayOrEmpty(request.getParticipants()), senderId, request.getConversationId());

        String conversationTitle = request.getConversationTitle();

        if (request.getConversationType() == ConversationType.DIRECT && 
            (conversationTitle == null || conversationTitle.startsWith("direct_"))) {
            
            List<Long> participantIds = parseParticipantIds(participantsJson);
            Long otherId = participantIds.stream()
                .filter(id -> !id.equals(senderId))
                .findFirst()
                .orElse(null);
            
            if (otherId != null) {
                User otherUser = userRepository.findById(otherId).orElse(null);
                if (otherUser != null) {
                    conversationTitle = otherUser.getFullName();
                }
            }
            
            if (conversationTitle == null || conversationTitle.startsWith("direct_")) {
                conversationTitle = "Direct Message";
            }
        }
        
        if (request.getConversationType() == ConversationType.GROUP && 
            (conversationTitle == null || conversationTitle.isBlank())) {
            conversationTitle = "Group Conversation";
        }

        String existingAvatar = getGroupAvatar(request.getConversationId());

        Message message = Message.builder()
                .conversationId(request.getConversationId())
                .conversationType(request.getConversationType())
                .conversationTitle(conversationTitle)
                .caseRecord(caseRecord)
                .caseNumber(caseRecord != null ? caseRecord.getCaseNumber() : null)
                .caseTitle(caseRecord != null ? caseRecord.getTitle() : null)
                .participants(participantsJson)
                .sender(sender)
                .senderName(sender.getFullName())
                .senderEmail(sender.getEmail())
                .senderAvatar(resolveAvatarUrl(sender))
                .senderRole(sender.getRole() != null ? sender.getRole().name() : null)
                .content(request.getContent() != null ? request.getContent() : "")
                .messageType(request.getMessageType() != null ? request.getMessageType() : MessageType.TEXT)
                .status(MessageStatus.SENT)
                .attachments(toJsonArrayOrEmpty(request.getAttachments()))
                .mentions(toJsonArrayOrEmpty(request.getMentions()))
                .readBy("[]")
                .deliveredTo("[]")
                .reactions("{}")
                .pinnedBy("[]")
                .groupAvatar(existingAvatar)
                .replyToMessage(replyTo)
                .replyToContent(replyToContent)
                .replyToSenderName(replyToSenderName)
                .build();
        message = messageRepository.save(message);
        notifyRecipients(message, senderId);
        return toDto(message);
    }

    @Transactional
    public void softDelete(UUID messageId, Long userId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message", "id", messageId.toString()));
        message.setDeleted(true);
        message.setDeletedAt(LocalDateTime.now());
        messageRepository.save(message);
    }

    @Transactional
    public void updateConversationTitle(String conversationId, String newTitle, Long updatedBy) {
        Pageable pageable = PageRequest.of(0, 1000, Sort.by(Sort.Direction.ASC, "createdAt"));
        Page<Message> messages = messageRepository.findByConversationId(conversationId, pageable);
        
        for (Message msg : messages) {
            msg.setConversationTitle(newTitle);
        }
        messageRepository.saveAll(messages.getContent());
    }

    @Transactional
    public void updateGroupAvatar(String conversationId, String avatarUrl, Long updatedBy) {
        Pageable pageable = PageRequest.of(0, 1000, Sort.by(Sort.Direction.ASC, "createdAt"));
        Page<Message> messages = messageRepository.findByConversationId(conversationId, pageable);
        
        for (Message msg : messages) {
            msg.setGroupAvatar(avatarUrl);
            msg.setGroupAvatarUpdatedAt(LocalDateTime.now());
            msg.setGroupAvatarUpdatedBy(updatedBy);
        }
        messageRepository.saveAll(messages.getContent());
    }

    public String getGroupAvatar(String conversationId) {
        Pageable pageable = PageRequest.of(0, 1, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Message> messages = messageRepository.findByConversationId(conversationId, pageable);
        if (messages.hasContent()) {
            return messages.getContent().get(0).getGroupAvatar();
        }
        return null;
    }

    private void notifyRecipients(Message message, Long senderId) {
        Set<Long> recipientIds = resolveRecipientIds(message.getParticipants(), senderId);
        String preview = message.getContent() != null && !message.getContent().isBlank()
                ? message.getContent()
                : "Sent an attachment";
        if (preview.length() > 120) {
            preview = preview.substring(0, 117) + "...";
        }
        String title = "New message from " + message.getSenderName();
        for (Long recipientId : recipientIds) {
            notificationService.create(
                    recipientId,
                    NotificationType.NEW_MESSAGE,
                    title,
                    preview,
                    null,
                    null,
                    null,
                    message.getId(),
                    message.getConversationId(),
                    null
            );
        }
    }

    private Set<Long> resolveRecipientIds(String participantsJson, Long senderId) {
        List<Long> ids = parseParticipantIds(participantsJson);
        Set<Long> recipients = new LinkedHashSet<>(ids);
        recipients.remove(senderId);
        return recipients;
    }

    private String ensureParticipantsIncludesSender(String participantsJson, Long senderId, String conversationId) {
        List<Long> ids = parseParticipantIds(participantsJson);
        if (ids.isEmpty() && conversationId != null && conversationId.startsWith("dir-")) {
            String[] parts = conversationId.substring(4).split("-");
            for (String part : parts) {
                try {
                    ids.add(Long.parseLong(part.trim()));
                } catch (NumberFormatException ignored) {
                }
            }
        }
        if (!ids.contains(senderId)) {
            ids.add(senderId);
        }
        return toJsonIds(ids);
    }

    private List<Long> parseParticipantIds(String participantsJson) {
        if (participantsJson == null || participantsJson.isBlank()) {
            return new ArrayList<>();
        }
        try {
            List<Object> raw = objectMapper.readValue(participantsJson, new TypeReference<>() {});
            List<Long> ids = new ArrayList<>();
            for (Object o : raw) {
                if (o instanceof Number n) {
                    ids.add(n.longValue());
                } else if (o != null) {
                    try {
                        ids.add(Long.parseLong(o.toString()));
                    } catch (NumberFormatException ignored) {
                    }
                }
            }
            return ids;
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    private String toJsonIds(List<Long> ids) {
        try {
            return objectMapper.writeValueAsString(ids.stream().distinct().toList());
        } catch (Exception e) {
            return "[]";
        }
    }

    private String resolveAvatarUrl(User user) {
        UserProfile profile = userProfileRepository.findByUserId(user.getId()).orElse(null);
        if (profile != null && profile.getAvatarUrl() != null && !profile.getAvatarUrl().isBlank()) {
            return "/api/users/" + user.getId() + "/profile-picture";
        }
        return null;
    }

    private MessageableUserDto toMessageableUserDto(User user) {
        return MessageableUserDto.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole())
                .avatarUrl(resolveAvatarUrl(user))
                .build();
    }

    private static String toJsonArrayOrEmpty(String value) {
        if (value == null || value.isBlank()) return "[]";
        String t = value.trim();
        if (t.startsWith("[") && t.endsWith("]") || t.startsWith("{") && t.endsWith("}")) return t;
        return "[\"" + t.replace("\\", "\\\\").replace("\"", "\\\"") + "\"]";
    }

    private MessageDto toDto(Message m) {
        String avatar = m.getSenderAvatar();
        if (avatar == null || avatar.isBlank()) {
            avatar = resolveAvatarUrl(m.getSender());
        }
        return MessageDto.builder()
                .id(m.getId())
                .conversationId(m.getConversationId())
                .conversationType(m.getConversationType())
                .conversationTitle(m.getConversationTitle())
                .caseId(m.getCaseRecord() != null ? m.getCaseRecord().getId() : null)
                .caseNumber(m.getCaseNumber())
                .participants(m.getParticipants())
                .senderId(m.getSender().getId())
                .senderName(m.getSenderName())
                .senderEmail(m.getSenderEmail())
                .senderAvatar(avatar)
                .senderRole(m.getSenderRole())
                .content(m.getContent())
                .messageType(m.getMessageType())
                .status(m.getStatus())
                .attachments(m.getAttachments())
                .mentions(m.getMentions())
                .readBy(m.getReadBy())
                .reactions(m.getReactions())
                .replyToMessageId(m.getReplyToMessage() != null ? m.getReplyToMessage().getId() : null)
                .replyToContent(m.getReplyToContent())
                .replyToSenderName(m.getReplyToSenderName())
                .isEdited(m.isEdited())
                .isDeleted(m.isDeleted())
                .isForwarded(m.isForwarded())
                .createdAt(m.getCreatedAt())
                .updatedAt(m.getUpdatedAt())
                .groupAvatar(m.getGroupAvatar())
                .build();
    }
}
