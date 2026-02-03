package com.afyalink.backend.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportSubmissionStatusDto {
    private Long userId;
    private String fullName;
    private String email;
    private String role;
    private int submittedCount;
    private String status; // SUBMITTED, NOT_SUBMITTED
    private List<ReportDto> reports;
    private String location;
    private int workersCount;
    private int pendingCount;
    private int missingCount;
    private List<String> overdueWorkers;
}
