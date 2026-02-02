package com.afyalink.backend.dto.report;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateReportRequest {

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Report type is required")
    private String reportType;

    @NotNull(message = "Period start is required")
    private LocalDate periodStart;

    @NotNull(message = "Period end is required")
    private LocalDate periodEnd;

    private String narrative;

    private Long targetUserId;

    private Long relatedCaseId;

    private String location;

    private java.util.List<AttachmentRequestDto> attachments;
}
