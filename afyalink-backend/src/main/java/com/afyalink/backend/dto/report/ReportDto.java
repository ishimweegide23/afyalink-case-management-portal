package com.afyalink.backend.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportDto {
    private Long id;
    private String title;
    private String reportType;
    private LocalDate periodStart;
    private LocalDate periodEnd;
    private String narrative;
    private String status;
    private Long generatedByUserId;
    private String generatedByName;
    private String generatedByRole;
    private String generatedByDistrict;
    private String generatedBySector;
    private String generatedByCell;
    private String generatedByVillage;
    private Long targetUserId;
    private String targetUserName;
    private Long relatedCaseId;
    private String relatedCaseNumber;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Attachments & Extras
    private Integer attachmentCount;
    private Integer photoCount;
    private String location;
    private String orgPeriodType;
    private Double latitude;
    private Double longitude;
    private String supervisorFeedback;
    private java.util.List<ReportAttachmentDto> attachments;
}
