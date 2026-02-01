package com.afyalink.backend.controller;

import com.afyalink.backend.dto.common.ApiResponse;
import com.afyalink.backend.dto.user.UserPreferencesDto;
import com.afyalink.backend.security.CustomUserDetailsService;
import com.afyalink.backend.service.UserPreferencesService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserPreferencesController {

    private final UserPreferencesService preferencesService;
    private final CustomUserDetailsService customUserDetailsService;

    private Long currentUserId() {
        return customUserDetailsService.getUserIdFromUserDetails(
                (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal());
    }

    @GetMapping("/me/preferences")
    public ResponseEntity<ApiResponse<UserPreferencesDto>> getMyPreferences() {
        Long userId = currentUserId();
        return ResponseEntity.ok(ApiResponse.success(preferencesService.getPreferences(userId, userId)));
    }

    @PutMapping("/me/preferences")
    public ResponseEntity<ApiResponse<UserPreferencesDto>> updateMyPreferences(
            @RequestBody UserPreferencesDto dto) {
        Long userId = currentUserId();
        return ResponseEntity.ok(ApiResponse.success(preferencesService.updatePreferences(userId, dto, userId)));
    }
}
