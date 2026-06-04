// Added extra validation checks here
package com.afyalink.backend.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CaseTrendDto {
    private String period;
    private long casesOpened;
    private long casesClosed;
    private long activeCases;
}
