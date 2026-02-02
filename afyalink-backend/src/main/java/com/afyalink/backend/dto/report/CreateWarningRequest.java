package com.afyalink.backend.dto.report;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateWarningRequest {

    @NotNull(message = "Recipient is required")
    private Long toUserId;

    @NotBlank(message = "Warning type is required")
    private String warningType;

    @NotBlank(message = "Message is required")
    private String message;

    private Long relatedCaseId;
}
