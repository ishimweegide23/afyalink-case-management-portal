package com.afyalink.backend.dto.report;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateOrgReportRequest {

    @NotNull(message = "Period type is required (WEEKLY, MONTHLY, YEARLY)")
    private String periodType;

    @NotNull(message = "Period start is required")
    private LocalDate periodStart;

    @NotNull(message = "Period end is required")
    private LocalDate periodEnd;

    /** Optional title — auto-generated from period if blank */
    private String title;

    /** Optional district filter — null/blank = all districts */
    private String district;

    /** Admin's own executive summary — if null the backend generates one from system data */
    private String narrative;

    /** Documents already uploaded via POST /api/documents to attach to this report */
    private List<AttachmentUploadDto> attachments;

    @Data
    public static class AttachmentUploadDto {
        private Long documentId;
        private String caption;
        private String description;
        private String category;
        private Integer displayOrder;
    }
}
