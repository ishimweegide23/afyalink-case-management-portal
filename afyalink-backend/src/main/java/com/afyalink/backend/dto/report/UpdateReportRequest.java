package com.afyalink.backend.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateReportRequest {
    private String title;
    private String reportType;
    private LocalDate periodStart;
    private LocalDate periodEnd;
    private String narrative;
    private String location;
    private Double latitude;
    private Double longitude;
    private java.util.List<AttachmentRequestDto> attachments;
}
