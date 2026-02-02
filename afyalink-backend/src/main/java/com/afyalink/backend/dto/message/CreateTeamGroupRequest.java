package com.afyalink.backend.dto.message;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

@Data
public class CreateTeamGroupRequest {
    @NotBlank(message = "Group title is required")
    private String title;

    private String initialMessage;

    /** Optional subset of team worker ids; when empty, all workers under supervisor are included. */
    private List<Long> memberIds;
}
