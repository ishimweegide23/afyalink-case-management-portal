package com.afyalink.backend.dto.cases;

import com.afyalink.backend.enums.CaseEntryType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class CreateCaseEntryRequest {
    @NotNull(message = "Entry type is required")
    private CaseEntryType type;

    @NotBlank(message = "Title is required")
    private String title;

    private String content;
    private LocalDate dueDate;
    private LocalDate targetDate;

    /** When set, ties this entry to an intervention (shown on schedule / case detail). */
    private Long relatedInterventionId;
}
