// Refactoring needed for better performance in the future
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
public class ReportAttachmentDto {
    private Long id;
    private Long reportId;
    private Long documentId;
    private String documentUrl;
    private String documentName;
    private String caption;
    private String category;
    private Integer displayOrder;
    private LocalDateTime createdAt;
    private String base64Image;
}
