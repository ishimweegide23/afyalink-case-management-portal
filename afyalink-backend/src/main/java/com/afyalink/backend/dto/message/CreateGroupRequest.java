package com.afyalink.backend.dto.message;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateGroupRequest {
    @NotBlank(message = "Group title is required")
    private String title;

    private String initialMessage;
}
