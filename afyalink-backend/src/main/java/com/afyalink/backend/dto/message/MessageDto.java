package com.afyalink.backend.dto.message;

import com.afyalink.backend.enums.ConversationType;
import com.afyalink.backend.enums.MessageStatus;
import com.afyalink.backend.enums.MessageType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class MessageDto {
    private UUID id;
    private String conversationId;
    private ConversationType conversationType;
    private String conversationTitle;
    private Long caseId;
    private String caseNumber;
    private String participants;
    private Long senderId;
    private String senderName;
    private String senderEmail;
    private String senderAvatar;
    private String senderRole;
    private String content;
    private MessageType messageType;
    private MessageStatus status;
    private String attachments;
    private String mentions;
    private String readBy;
    private String reactions;
    private UUID replyToMessageId;
    private String replyToContent;
    private String replyToSenderName;
    private boolean isEdited;
    private boolean isDeleted;
    private boolean isForwarded;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String groupAvatar;
}
