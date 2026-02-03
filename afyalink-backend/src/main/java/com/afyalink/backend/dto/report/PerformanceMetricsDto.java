package com.afyalink.backend.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PerformanceMetricsDto {

    private Long id;
    private String fullName;
    private String email;
    private String role;
    private Long supervisorId; // for social workers only

    private MetricsDto metrics;
}
