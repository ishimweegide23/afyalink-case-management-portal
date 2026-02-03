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
public class ReportDocumentDto {
    private Long id;
    private String title;
    private String content;
    private String periodType;
    private LocalDate fromDate;
    private LocalDate toDate;
    private Long createdById;
    private String createdByFullName;
    private String fileName;
    private String filePath;
    private LocalDateTime createdAt;
}
