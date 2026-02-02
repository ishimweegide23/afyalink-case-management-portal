package com.afyalink.backend.dto.cases;

import com.afyalink.backend.enums.CasePriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class CreateCaseRequest {
    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Beneficiary name is required")
    private String beneficiaryName;

    private String beneficiaryIdentifier;

    @NotNull(message = "Priority is required")
    private CasePriority priority;

    private Long assignedSocialWorkerId;
    private LocalDate nextFollowUpDate;
}
