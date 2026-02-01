package com.afyalink.backend.controller;

import com.afyalink.backend.dto.common.ApiResponse;
import com.afyalink.backend.util.DateRangeValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/system")
@RequiredArgsConstructor
public class SystemController {

    @GetMapping("/date")
    public ResponseEntity<ApiResponse<Map<String, String>>> getServerDate() {
        LocalDate today = LocalDate.now();
        Map<String, String> body = new LinkedHashMap<>();
        body.put("currentDate", today.toString());
        body.put("currentDateTime", LocalDateTime.now().toString());
        body.put("systemStartDate", DateRangeValidator.SYSTEM_START_DATE.toString());
        body.put("currentYear", String.valueOf(today.getYear()));
        body.put("currentMonth", String.format("%d-%02d", today.getYear(), today.getMonthValue()));
        return ResponseEntity.ok(ApiResponse.success(body));
    }
}
