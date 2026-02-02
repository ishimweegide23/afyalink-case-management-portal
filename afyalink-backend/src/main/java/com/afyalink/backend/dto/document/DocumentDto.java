package com.afyalink.backend.dto.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class DocumentDto {
    private Long id;
    private Long caseId;
    private String caseNumber;
    private Long interventionId;
    private Long uploadedById;
    private String uploadedByName;
    private String fileName;
    private String filePath;
    private String mimeType;
    private Long sizeBytes;
    private boolean isArchived;
    private LocalDateTime createdAt;
}
