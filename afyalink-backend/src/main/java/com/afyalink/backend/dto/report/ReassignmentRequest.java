package com.afyalink.backend.dto.report;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReassignmentRequest {

    @NotNull(message = "Social worker ID is required")
    private Long socialWorkerId;

    @NotNull(message = "New supervisor ID is required")
    private Long newSupervisorId;

    private String reason;
}
