package com.afyalink.backend.dto.message;

import com.afyalink.backend.enums.ConversationType;
import com.afyalink.backend.enums.MessageType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class SendMessageRequest {
    @NotBlank(message = "Conversation ID is required")
    private String conversationId;

    @NotNull(message = "Conversation type is required")
    private ConversationType conversationType;

    private String conversationTitle;
    private Long caseId;
    /** JSON array of user ids, e.g. "[1,2,3]" for group/broadcast */
    private String participants;

    /** Text content; can be empty when sending only attachments (e.g. report file) */
    private String content;

    private MessageType messageType = MessageType.TEXT;
    private String attachments;
    private String mentions;
    private UUID replyToMessageId;
}
