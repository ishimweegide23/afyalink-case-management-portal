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
public class ReportDiaryItemDto {
    private Long id;
    private String title;
    private String content;
    private String type;
    private String status;
    private LocalDateTime createdAt;
    private String caseNumber;
    private Long caseId;
    private String beneficiaryName;
}
