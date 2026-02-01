package com.afyalink.backend.controller;

import com.afyalink.backend.dto.common.ApiResponse;
import com.afyalink.backend.dto.common.PageResponse;
import com.afyalink.backend.dto.system.SystemSettingDto;
import com.afyalink.backend.security.CustomUserDetailsService;
import com.afyalink.backend.service.SystemSettingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
public class SystemSettingController {

    private final SystemSettingService systemSettingService;
    private final CustomUserDetailsService customUserDetailsService;

    private Long currentUserId() {
        return customUserDetailsService.getUserIdFromUserDetails((UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal());
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<SystemSettingDto>>> findAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "key") String sortBy,
            @RequestParam(defaultValue = "ASC") String direction) {
        return ResponseEntity.ok(ApiResponse.success(systemSettingService.findAll(page, size, sortBy, direction)));
    }

    /**
     * Get all settings for a category as a single object (matches frontend prototype tabs).
     * Categories: organization, security, notifications, email, data, integration, appearance, localization.
     */
    @GetMapping("/categories/{category}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getByCategory(@PathVariable String category) {
        return ResponseEntity.ok(ApiResponse.success(systemSettingService.getByCategory(category)));
    }

    /**
     * Save all settings for a category. Body is a flat object of key-value pairs (e.g. { "name": "AMU", "shortName": "AMU" }).
     * Values can be string, number, boolean, or array; they are stored and returned in the same shape.
     */
    @PutMapping("/categories/{category}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> setByCategory(
            @PathVariable String category,
            @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(ApiResponse.success(systemSettingService.setByCategory(category, body, currentUserId())));
    }

    @GetMapping("/categories/{category}/search")
    public ResponseEntity<ApiResponse<PageResponse<SystemSettingDto>>> searchByCategory(
            @PathVariable String category,
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "key") String sortBy,
            @RequestParam(defaultValue = "ASC") String direction) {
        return ResponseEntity.ok(ApiResponse.success(systemSettingService.searchByCategory(category, keyword, page, size, sortBy, direction)));
    }

    @GetMapping("/key/{key}")
    public ResponseEntity<ApiResponse<SystemSettingDto>> getByKey(@PathVariable String key) {
        return ResponseEntity.ok(ApiResponse.success(systemSettingService.getByKey(key)));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<PageResponse<SystemSettingDto>>> search(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "key") String sortBy,
            @RequestParam(defaultValue = "ASC") String direction) {
        return ResponseEntity.ok(ApiResponse.success(systemSettingService.search(keyword, page, size, sortBy, direction)));
    }

    @PutMapping("/key/{key}")
    public ResponseEntity<ApiResponse<SystemSettingDto>> set(
            @PathVariable String key,
            @RequestBody Map<String, String> body) {
        String value = body != null && body.containsKey("value") ? body.get("value") : "";
        return ResponseEntity.ok(ApiResponse.success(systemSettingService.set(key, value, currentUserId())));
    }
}
