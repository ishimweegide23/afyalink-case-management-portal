package com.afyalink.backend.controller;

import com.afyalink.backend.dto.common.ApiResponse;
import com.afyalink.backend.dto.common.PageResponse;
import com.afyalink.backend.dto.notification.NotificationDto;
import com.afyalink.backend.security.CustomUserDetailsService;
import com.afyalink.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final CustomUserDetailsService customUserDetailsService;

    private Long currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || !(auth.getPrincipal() instanceof UserDetails)) {
            throw new org.springframework.security.access.AccessDeniedException("Not authenticated");
        }
        return customUserDetailsService.getUserIdFromUserDetails((UserDetails) auth.getPrincipal());
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<NotificationDto>>> findByUserId(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String direction) {
        Long userId = currentUserId();
        return ResponseEntity.ok(ApiResponse.success(
                notificationService.findByUserId(userId, page, size, sortBy, direction)));
    }

    @GetMapping("/unread")
    public ResponseEntity<ApiResponse<PageResponse<NotificationDto>>> findUnread(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String direction) {
        Long userId = currentUserId();
        return ResponseEntity.ok(ApiResponse.success(
                notificationService.findUnreadByUserId(userId, page, size, sortBy, direction)));
    }

    @GetMapping("/unread/count")
    public ResponseEntity<ApiResponse<Map<String, Long>>> countUnread() {
        Long userId = currentUserId();
        long count = notificationService.countUnreadByUserId(userId);
        return ResponseEntity.ok(ApiResponse.success(Map.of("count", count)));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<PageResponse<NotificationDto>>> search(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String direction) {
        Long userId = currentUserId();
        return ResponseEntity.ok(ApiResponse.success(
                notificationService.searchByUserId(userId, keyword, page, size, sortBy, direction)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<NotificationDto>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(notificationService.findById(id)));
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<ApiResponse<NotificationDto>> markRead(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(notificationService.markRead(id, currentUserId())));
    }

    @PostMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllRead() {
        notificationService.markAllReadByUserId(currentUserId());
        return ResponseEntity.ok(ApiResponse.success("All notifications marked as read", null));
    }

    @PostMapping("/reminders")
    public ResponseEntity<ApiResponse<Void>> sendReminder(@RequestBody java.util.Map<String, Object> body) {
        Long targetUserId = Long.valueOf(body.get("targetUserId").toString());
        String periodType = (String) body.get("periodType");
        java.time.LocalDate start = java.time.LocalDate.parse((String) body.get("periodStart"));
        java.time.LocalDate end = java.time.LocalDate.parse((String) body.get("periodEnd"));
        notificationService.sendReminder(currentUserId(), targetUserId, periodType, start, end);
        return ResponseEntity.ok(ApiResponse.success("Reminder sent successfully", null));
    }
}
