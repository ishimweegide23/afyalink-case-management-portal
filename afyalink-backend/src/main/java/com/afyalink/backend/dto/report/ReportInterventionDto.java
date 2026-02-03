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
public class ReportInterventionDto {
    private Long id;
    private String interventionCode;
    private String title;
    private String type;
    private String status;
    private String caseNumber;
    private Long caseId;
    private String beneficiaryName;
    private LocalDateTime plannedStartDatetime;
    private LocalDateTime createdAt;
    private String location;
    /** Social worker who planned the intervention (useful in merged team reports). */
    private String plannedByName;
}
