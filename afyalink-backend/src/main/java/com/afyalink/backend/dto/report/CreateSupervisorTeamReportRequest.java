package com.afyalink.backend.dto.report;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateSupervisorTeamReportRequest {

    @NotNull(message = "Period start is required")
    private LocalDate periodStart;

    @NotNull(message = "Period end is required")
    private LocalDate periodEnd;

    /** Optional; if blank, a default title is generated (min 5 chars). */
    @Size(min = 5, max = 200, message = "Title must be between 5 and 200 characters when provided")
    private String title;

    @Size(max = 4000)
    private String additionalNotes;
}
