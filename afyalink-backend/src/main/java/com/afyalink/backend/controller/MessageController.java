package com.afyalink.backend.controller;

import com.afyalink.backend.dto.common.ApiResponse;
import com.afyalink.backend.dto.common.PageResponse;
import com.afyalink.backend.dto.message.CreateGroupRequest;
import com.afyalink.backend.dto.message.CreateTeamGroupRequest;
import com.afyalink.backend.dto.message.MessageDto;
import com.afyalink.backend.dto.message.MessageableUserDto;
import com.afyalink.backend.dto.message.SendMessageRequest;
import com.afyalink.backend.enums.ConversationType;
import com.afyalink.backend.enums.MessageType;
import com.afyalink.backend.model.Message;
import com.afyalink.backend.model.User;
import com.afyalink.backend.repository.UserRepository;
import com.afyalink.backend.security.CustomUserDetailsService;
import com.afyalink.backend.service.MessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Path;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;
    private final CustomUserDetailsService customUserDetailsService;
    private final com.afyalink.backend.service.MessageAttachmentService messageAttachmentService;
    private final UserRepository userRepository;

    private Long currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || !(auth.getPrincipal() instanceof UserDetails)) {
            throw new org.springframework.security.access.AccessDeniedException("Not authenticated");
        }
        return customUserDetailsService.getUserIdFromUserDetails((UserDetails) auth.getPrincipal());
    }

    @GetMapping("/conversations")
    public ResponseEntity<ApiResponse<java.util.List<com.afyalink.backend.dto.message.ConversationDto>>> getConversations() {
        return ResponseEntity.ok(ApiResponse.success(messageService.getConversationsForUser(currentUserId())));
    }

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<java.util.List<MessageableUserDto>>> getMessageableUsers() {
        return ResponseEntity.ok(ApiResponse.success(messageService.getMessageableUsers(currentUserId())));
    }

    @PostMapping("/groups/all-staff")
    public ResponseEntity<ApiResponse<Map<String, String>>> createAllStaffGroup(
            @Valid @RequestBody CreateGroupRequest request) {
        return ResponseEntity.ok(ApiResponse.success(messageService.createAllStaffGroup(request, currentUserId())));
    }

    @PostMapping("/groups/team")
    public ResponseEntity<ApiResponse<Map<String, String>>> createTeamGroup(
            @Valid @RequestBody CreateTeamGroupRequest request) {
        return ResponseEntity.ok(ApiResponse.success(messageService.createTeamGroup(request, currentUserId())));
    }

    @PutMapping("/groups/rename")
    public ResponseEntity<ApiResponse<Map<String, String>>> renameGroup(
            @RequestBody Map<String, String> request) {
        String conversationId = request.get("conversationId");
        String newName = request.get("newGroupName");
        Long userId = currentUserId();
        
        if (newName == null || newName.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Group name cannot be empty"));
        }
        
        // Update all messages in conversation with new title
        messageService.updateConversationTitle(conversationId, newName.trim(), userId);
        
        // Send system message about rename
        User user = userRepository.findById(userId).orElseThrow();
        SendMessageRequest notification = new SendMessageRequest();
        notification.setConversationId(conversationId);
        notification.setConversationType(ConversationType.GROUP);
        notification.setConversationTitle(newName.trim());
        notification.setContent(String.format("📝 Group name changed to '%s' by %s", newName.trim(), user.getFullName()));
        notification.setMessageType(MessageType.SYSTEM);
        messageService.send(notification, userId);
        
        return ResponseEntity.ok(ApiResponse.success(Map.of(
            "conversationId", conversationId,
            "newTitle", newName.trim()
        )));
    }

    @PostMapping("/groups/avatar")
    public ResponseEntity<ApiResponse<Map<String, String>>> updateGroupAvatar(
            @RequestParam String conversationId,
            @RequestParam("file") MultipartFile file) throws IOException {
        Long userId = currentUserId();
        
        // Upload file
        String avatarUrl = messageAttachmentService.uploadGroupAvatar(file);
        
        // Update group avatar in messages
        messageService.updateGroupAvatar(conversationId, avatarUrl, userId);
        
        return ResponseEntity.ok(ApiResponse.success(Map.of(
            "conversationId", conversationId,
            "avatarUrl", avatarUrl
        )));
    }

    @DeleteMapping("/groups/avatar")
    public ResponseEntity<ApiResponse<Void>> removeGroupAvatar(@RequestParam String conversationId) {
        Long userId = currentUserId();
        messageService.updateGroupAvatar(conversationId, null, userId);
        return ResponseEntity.ok(ApiResponse.success("Group avatar removed", null));
    }

    @PostMapping(value = "/upload", consumes = "multipart/form-data")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadAttachment(@RequestParam("file") MultipartFile file) {
        try {
            Map<String, String> result = messageAttachmentService.upload(file);
            return ResponseEntity.ok(ApiResponse.success(result));
        } catch (IOException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Upload failed: " + e.getMessage()));
        }
    }

    @GetMapping("/files/{filename}")
    public ResponseEntity<Resource> serveFile(@PathVariable String filename) {
        try {
            if (filename == null || filename.contains("..")) {
                return ResponseEntity.badRequest().build();
            }
            Path file = messageAttachmentService.resolveFile(filename);
            Resource resource = new UrlResource(file.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }
            String contentType = "application/octet-stream";
            if (filename.endsWith(".png")) contentType = "image/png";
            else if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) contentType = "image/jpeg";
            else if (filename.endsWith(".gif")) contentType = "image/gif";
            else if (filename.endsWith(".pdf")) contentType = "application/pdf";
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MessageDto>> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(messageService.findById(id)));
    }

    @GetMapping("/conversation/{conversationId}")
    public ResponseEntity<ApiResponse<PageResponse<MessageDto>>> findByConversationId(
            @PathVariable String conversationId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String direction) {
        return ResponseEntity.ok(ApiResponse.success(
                messageService.findByConversationId(conversationId, page, size, sortBy, direction)));
    }

    @GetMapping("/case/{caseId}")
    public ResponseEntity<ApiResponse<PageResponse<MessageDto>>> findByCaseId(
            @PathVariable Long caseId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String direction) {
        return ResponseEntity.ok(ApiResponse.success(
                messageService.findByCaseId(caseId, page, size, sortBy, direction)));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<PageResponse<MessageDto>>> search(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String direction) {
        return ResponseEntity.ok(ApiResponse.success(messageService.search(keyword, page, size, sortBy, direction)));
    }

    @GetMapping("/conversation/{conversationId}/search")
    public ResponseEntity<ApiResponse<PageResponse<MessageDto>>> searchByConversation(
            @PathVariable String conversationId,
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String direction) {
        return ResponseEntity.ok(ApiResponse.success(
                messageService.searchByConversation(conversationId, keyword, page, size, sortBy, direction)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<MessageDto>> send(@Valid @RequestBody SendMessageRequest request) {
        String content = request.getContent() != null ? request.getContent().trim() : "";
        String attachments = request.getAttachments() != null ? request.getAttachments().trim() : "";
        if (content.isEmpty() && attachments.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Message must have content or at least one attachment"));
        }
        if (content.isEmpty()) request.setContent("");
        return ResponseEntity.ok(ApiResponse.success(messageService.send(request, currentUserId())));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        messageService.softDelete(id, currentUserId());
        return ResponseEntity.ok(ApiResponse.success("Message deleted", null));
    }
}
