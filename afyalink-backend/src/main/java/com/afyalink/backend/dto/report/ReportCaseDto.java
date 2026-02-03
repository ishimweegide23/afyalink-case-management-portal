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
public class ReportCaseDto {
    private Long id;
    private String caseNumber;
    private String title;
    private String status;
    private Integer progressPercent;
    private LocalDateTime openedAt;
    private LocalDateTime closedAt;
    private String priority;
}
