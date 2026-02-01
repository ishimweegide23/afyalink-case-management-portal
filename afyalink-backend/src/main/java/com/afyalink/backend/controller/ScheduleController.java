package com.afyalink.backend.controller;

import com.afyalink.backend.dto.common.ApiResponse;
import com.afyalink.backend.dto.schedule.ScheduleItemDto;
import com.afyalink.backend.security.CustomUserDetailsService;
import com.afyalink.backend.service.ScheduleService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/social-worker")
@RequiredArgsConstructor
public class ScheduleController {

    private final ScheduleService scheduleService;
    private final CustomUserDetailsService customUserDetailsService;

    private Long currentUserId() {
        return customUserDetailsService.getUserIdFromUserDetails(
                (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal());
    }

    @GetMapping("/schedule")
    public ResponseEntity<ApiResponse<List<ScheduleItemDto>>> getSchedule(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        List<ScheduleItemDto> items = scheduleService.getSchedule(currentUserId(), fromDate, toDate);
        return ResponseEntity.ok(ApiResponse.success(items));
    }
}
