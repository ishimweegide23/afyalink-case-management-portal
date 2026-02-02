package com.afyalink.backend.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChartDataDto {
    private List<DateValueDto> progressOverTime;
    private List<LabelValueDto> interventionTypeDistribution;
    private List<DateValueDto> dailyActivity;
    private List<LabelValueDto> caseStatusDistribution;
    private List<LabelValueDto> caseProgressDistribution;
}
