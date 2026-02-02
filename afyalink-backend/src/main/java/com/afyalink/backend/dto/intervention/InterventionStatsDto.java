package com.afyalink.backend.dto.intervention;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InterventionStatsDto {
    private long total;
    private long planned;
    private long scheduled;
    private long inProgress;
    private long completed;
}
