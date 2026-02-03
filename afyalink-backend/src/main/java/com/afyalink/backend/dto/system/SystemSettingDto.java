package com.afyalink.backend.dto.system;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class SystemSettingDto {
    private Long id;
    private String category;
    private String key;
    private String value;
    private Long updatedById;
    private String updatedByName;
    private LocalDateTime updatedAt;
}
