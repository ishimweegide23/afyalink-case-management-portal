package com.afyalink.backend.dto.report;

import lombok.Data;

@Data
public class AttachmentRequestDto {
    private Long documentId;
    private String caption;
    private String category; // PHOTO, DOCUMENT, OTHER
    private Integer displayOrder;
}
