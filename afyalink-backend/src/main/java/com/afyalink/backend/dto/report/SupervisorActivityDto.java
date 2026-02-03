package com.afyalink.backend.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupervisorActivityDto {
    private Long userId;
    private String fullName;
    private String email;
    private LocalDateTime lastLoginAt;
    private long reportSubmissionCount;
}
