package com.afyalink.backend.dto.message;

import com.afyalink.backend.enums.ConversationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ConversationDto {
    private String conversationId;
    private ConversationType conversationType;
    private String conversationTitle;
    private String lastMessageContent;
    private Long lastMessageSenderId;
    private String lastMessageSenderName;
    private String lastMessageSenderAvatar;
    private LocalDateTime lastMessageTime;
    private Long caseId;
    private String caseNumber;
    private long unreadCount;
    private String participants;
    private String groupAvatar;
}
