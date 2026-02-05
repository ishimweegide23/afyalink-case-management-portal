package com.afyalink.backend.service;

import com.afyalink.backend.dto.report.LabelValueDto;
import com.afyalink.backend.dto.report.OrganizationReportDataDto;
import com.afyalink.backend.dto.report.ReportDto;
import com.itextpdf.io.image.ImageDataFactory;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.events.Event;
import com.itextpdf.kernel.events.IEventHandler;
import com.itextpdf.kernel.events.PdfDocumentEvent;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfPage;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.kernel.pdf.canvas.PdfCanvas;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.borders.SolidBorder;
import com.itextpdf.layout.element.AreaBreak;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Image;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.HorizontalAlignment;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class OrganizationReportPdfExporter {

    private final ChartImageGenerator chartImageGenerator;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd MMM yyyy");
    private static final DeviceRgb TEAL = new DeviceRgb(13, 148, 136);
    private static final DeviceRgb INDIGO = new DeviceRgb(99, 102, 241);
    private static final DeviceRgb SLATE = new DeviceRgb(51, 65, 85);
    private static final DeviceRgb MUTED = new DeviceRgb(100, 116, 139);
    private static final DeviceRgb LIGHT = new DeviceRgb(248, 250, 252);

    public ResponseEntity<byte[]> export(ReportDto report, OrganizationReportDataDto orgData) throws java.io.IOException {
        String periodType = resolvePeriodType(report);

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(out);
        PdfDocument pdf = new PdfDocument(writer);
        Document document = new Document(pdf, PageSize.A4);
        document.setMargins(36, 36, 56, 36);
        pdf.addEventHandler(PdfDocumentEvent.END_PAGE, new OrgFooterHandler(periodType, report.getPeriodStart() != null ? report.getPeriodStart().getYear() : 0));

        addOrgHeader(document, report, orgData, periodType);
        addExecutiveSummary(document, report);
        addOrgKpis(document, orgData, periodType);
        addChartsSection(document, orgData, periodType);
        addDistrictSection(document, orgData, periodType);
        addRecoverySection(document, orgData, periodType);

        if ("YEARLY".equals(periodType)) {
            addYoySection(document, orgData, report);
            addRecommendations(document, orgData, report);
            if (orgData.getSuccessStories() != null && !orgData.getSuccessStories().isEmpty()) {
                addSuccessStories(document, orgData);
            }
        } else if ("MONTHLY".equals(periodType)) {
            addInterventionSection(document, orgData);
            addStaffRanking(document, orgData);
        } else {
            addAlertsSection(document, orgData);
        }

        if (report.getLatitude() != null && report.getLongitude() != null) {
            document.add(new Paragraph(String.format(Locale.US, "Report location: %.5f, %.5f", report.getLatitude(), report.getLongitude()))
                    .setFontSize(8).setFontColor(MUTED).setMarginTop(8));
        }

        document.close();

        String filename = String.format("AfyaLink_org_%s_%s_%d.pdf",
                periodType.toLowerCase(),
                report.getPeriodStart() != null ? report.getPeriodStart() : "export",
                report.getId());
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(out.toByteArray());
    }

    private String resolvePeriodType(ReportDto report) {
        if (report.getOrgPeriodType() != null && !report.getOrgPeriodType().isBlank()) {
            return report.getOrgPeriodType().toUpperCase();
        }
        if (report.getPeriodStart() == null || report.getPeriodEnd() == null) return "YEARLY";
        long days = ChronoUnit.DAYS.between(report.getPeriodStart(), report.getPeriodEnd()) + 1;
        if (days <= 10) return "WEEKLY";
        if (days <= 45) return "MONTHLY";
        return "YEARLY";
    }

    private void addOrgHeader(Document document, ReportDto report, OrganizationReportDataDto orgData, String periodType) {
        String badge = switch (periodType) {
            case "WEEKLY" -> "Weekly Organization Report";
            case "MONTHLY" -> "Monthly Organization Report";
            default -> "Annual Organization Report";
        };
        String audience = "WEEKLY".equals(periodType) ? "Operations Management"
                : ("MONTHLY".equals(periodType) ? "Board of Directors" : "MINALOC and Donors");

        Table header = new Table(UnitValue.createPercentArray(new float[]{1})).useAllAvailableWidth();
        Cell cell = new Cell()
                .add(new Paragraph("AfyaLink Case Management").setFontSize(11).setFontColor(ColorConstants.WHITE).setTextAlignment(TextAlignment.CENTER))
                .add(new Paragraph(badge).setFontSize(17).setBold().setFontColor(ColorConstants.WHITE).setTextAlignment(TextAlignment.CENTER).setMarginTop(4))
                .add(new Paragraph(formatPeriod(report)).setFontSize(10).setFontColor(ColorConstants.WHITE).setTextAlignment(TextAlignment.CENTER).setMarginTop(8))
                .add(new Paragraph("Prepared for: " + audience).setFontSize(9).setFontColor(ColorConstants.WHITE).setTextAlignment(TextAlignment.CENTER).setMarginTop(4))
                .add(new Paragraph("Generated by: " + nullSafe(report.getGeneratedByName())).setFontSize(8).setFontColor(ColorConstants.WHITE).setTextAlignment(TextAlignment.CENTER).setMarginTop(2))
                .setBackgroundColor("YEARLY".equals(periodType) ? new DeviceRgb(30, 64, 175) : TEAL)
                .setPadding(18)
                .setBorder(Border.NO_BORDER);
        header.addCell(cell);
        document.add(header);

        if (orgData.getTopDistrictByCases() != null) {
            document.add(new Paragraph("Highest case volume: " + orgData.getTopDistrictByCases()
                    + (orgData.getTopDistrictByBeneficiaries() != null ? " | Most beneficiaries: " + orgData.getTopDistrictByBeneficiaries() : ""))
                    .setFontSize(9).setFontColor(MUTED).setTextAlignment(TextAlignment.CENTER).setMarginBottom(12));
        }
    }

    private void addExecutiveSummary(Document document, ReportDto report) {
        sectionHeading(document, "Executive Summary");
        String text = report.getNarrative() != null ? report.getNarrative() : "No executive summary provided.";
        document.add(new Paragraph(text).setFontSize(10).setFontColor(SLATE).setMarginBottom(14));
    }

    private void addOrgKpis(Document document, OrganizationReportDataDto org, String periodType) {
        sectionHeading(document, "WEEKLY".equals(periodType) ? "Quick KPIs" : "Organization KPI Dashboard");
        int cols = "YEARLY".equals(periodType) ? 6 : 4;
        float[] widths = new float[cols];
        for (int i = 0; i < cols; i++) widths[i] = 1f;
        Table cards = new Table(UnitValue.createPercentArray(widths)).useAllAvailableWidth();

        cards.addCell(kpiCell("Beneficiaries", String.valueOf(org.getTotalBeneficiariesServed())));
        cards.addCell(kpiCell("Cases", String.valueOf(org.getTotalCasesManaged())));
        cards.addCell(kpiCell("Success Rate", String.format(Locale.US, "%.0f%%", org.getOverallSuccessRate())));
        cards.addCell(kpiCell("Compliance", String.format(Locale.US, "%.0f%%", org.getOverallComplianceRate())));
        if (cols >= 6) {
            cards.addCell(kpiCell("Workers", String.valueOf(org.getTotalSocialWorkers())));
            cards.addCell(kpiCell("Interventions", String.valueOf(org.getTotalInterventionsCompleted())));
        } else {
            cards.addCell(kpiCell("Interventions", String.valueOf(org.getTotalInterventionsCompleted())));
            cards.addCell(kpiCell("Workers", String.valueOf(org.getTotalSocialWorkers())));
        }
        document.add(cards);
        document.add(new Paragraph(" ").setMarginBottom(8));
    }

    private void addChartsSection(Document document, OrganizationReportDataDto org, String periodType) {
        sectionHeading(document, "Analytics");
        try {
            if (org.getCasesByPriority() != null && !org.getCasesByPriority().isEmpty()) {
                List<LabelValueDto> priority = org.getCasesByPriority().stream()
                        .map(p -> LabelValueDto.builder().label(p.getLabel()).value(p.getValue() != null ? p.getValue().longValue() : 0L).build())
                        .collect(java.util.stream.Collectors.toList());
                byte[] pie = chartImageGenerator.createPieChart(priority, "Cases by Priority", 260, 220);
                document.add(new Image(ImageDataFactory.create(pie)).setAutoScale(true).setHorizontalAlignment(HorizontalAlignment.CENTER));
                document.add(new Paragraph("Cases by priority").setFontSize(8).setFontColor(MUTED).setTextAlignment(TextAlignment.CENTER).setMarginBottom(10));
            }
        } catch (Exception e) {
            log.warn("Priority chart failed: {}", e.getMessage());
        }
        if (!"WEEKLY".equals(periodType) && org.getCasesByCategory() != null && !org.getCasesByCategory().isEmpty()) {
            try {
                List<LabelValueDto> cats = org.getCasesByCategory().stream()
                        .map(c -> LabelValueDto.builder().label(c.getLabel()).value(c.getValue() != null ? c.getValue().longValue() : 0L).build())
                        .collect(java.util.stream.Collectors.toList());
                byte[] bar = chartImageGenerator.createHorizontalBarChart(cats, "Cases by Category", 520, 220);
                document.add(new Image(ImageDataFactory.create(bar)).setAutoScale(true).setHorizontalAlignment(HorizontalAlignment.CENTER));
                document.add(new Paragraph("Case categories in the system").setFontSize(8).setFontColor(MUTED).setTextAlignment(TextAlignment.CENTER).setMarginBottom(10));
            } catch (Exception e) {
                log.warn("Category chart failed: {}", e.getMessage());
            }
        }
    }

    private void addDistrictSection(Document document, OrganizationReportDataDto org, String periodType) {
        if (org.getDistrictPerformance() == null || org.getDistrictPerformance().isEmpty()) return;
        sectionHeading(document, "YEARLY".equals(periodType) ? "District Performance (All Districts)" : "District Performance");

        try {
            List<LabelValueDto> caseBars = org.getDistrictPerformance().stream().limit("WEEKLY".equals(periodType) ? 8 : 15)
                    .map(d -> LabelValueDto.builder().label(d.getDistrict()).value(d.getCases()).build())
                    .collect(java.util.stream.Collectors.toList());
            byte[] bar = chartImageGenerator.createHorizontalBarChart(caseBars, "Cases by District", 520, Math.min(320, 40 + caseBars.size() * 22));
            document.add(new Image(ImageDataFactory.create(bar)).setAutoScale(true).setHorizontalAlignment(HorizontalAlignment.CENTER).setMarginBottom(8));
        } catch (Exception e) {
            log.warn("District bar chart failed: {}", e.getMessage());
        }

        int maxRows = "YEARLY".equals(periodType) ? 30 : ("MONTHLY".equals(periodType) ? 15 : 8);
        Table table = new Table(UnitValue.createPercentArray(new float[]{2, 1, 1, 1, 1, 1})).useAllAvailableWidth();
        tableHeader(table, "District", "Beneficiaries", "Cases", "Active", "Success %", "Workers");
        int count = 0;
        for (OrganizationReportDataDto.DistrictPerformanceDto d : org.getDistrictPerformance()) {
            if (count++ >= maxRows) break;
            table.addCell(dataCell(d.getDistrict()));
            table.addCell(dataCell(String.valueOf(d.getBeneficiaries())));
            table.addCell(dataCell(String.valueOf(d.getCases())));
            table.addCell(dataCell(String.valueOf(d.getActiveCases())));
            table.addCell(dataCell(String.format(Locale.US, "%.0f%%", d.getSuccessRate())));
            table.addCell(dataCell(String.valueOf(d.getSocialWorkersCount())));
        }
        document.add(table);
    }

    private void addRecoverySection(Document document, OrganizationReportDataDto org, String periodType) {
        sectionHeading(document, "Beneficiary Recovery Progress");
        document.add(new Paragraph(String.format(Locale.US, "Average case progress in period: %.1f%%", org.getAverageBeneficiaryProgress()))
                .setFontSize(10).setFontColor(SLATE).setMarginBottom(8));

        if (org.getBeneficiaryRecoveryBands() != null && !org.getBeneficiaryRecoveryBands().isEmpty()) {
            try {
                List<LabelValueDto> bands = org.getBeneficiaryRecoveryBands().stream()
                        .map(b -> LabelValueDto.builder().label(b.getLabel()).value(b.getValue() != null ? b.getValue().longValue() : 0L).build())
                        .collect(java.util.stream.Collectors.toList());
                byte[] bar = chartImageGenerator.createBarChart(bands, "Progress Distribution", 480, 200);
                document.add(new Image(ImageDataFactory.create(bar)).setAutoScale(true).setHorizontalAlignment(HorizontalAlignment.CENTER).setMarginBottom(6));
            } catch (Exception e) {
                log.warn("Recovery bands chart failed: {}", e.getMessage());
            }
        }
        if (!"WEEKLY".equals(periodType) && org.getRecoveryProgressTrend() != null && !org.getRecoveryProgressTrend().isEmpty()) {
            try {
                List<com.afyalink.backend.dto.report.DateValueDto> trend = org.getRecoveryProgressTrend().stream()
                        .map(t -> com.afyalink.backend.dto.report.DateValueDto.builder()
                                .date(t.getLabel())
                                .value(t.getValue() != null ? t.getValue().doubleValue() : 0.0)
                                .build())
                        .collect(java.util.stream.Collectors.toList());
                byte[] line = chartImageGenerator.createLineChart(trend, "Recovery Trend", 520, 220);
                document.add(new Image(ImageDataFactory.create(line)).setAutoScale(true).setHorizontalAlignment(HorizontalAlignment.CENTER));
            } catch (Exception e) {
                log.warn("Recovery trend chart failed: {}", e.getMessage());
            }
        }
    }

    private void addAlertsSection(Document document, OrganizationReportDataDto org) {
        if (org.getAlerts() == null || org.getAlerts().isEmpty()) return;
        sectionHeading(document, "Alerts and Actions Needed");
        for (String alert : org.getAlerts()) {
            document.add(new Paragraph("• " + alert).setFontSize(9).setFontColor(SLATE).setMarginBottom(4));
        }
    }

    private void addYoySection(Document document, OrganizationReportDataDto org, ReportDto report) {
        if (org.getYoyMetrics() == null || org.getYoyMetrics().isEmpty()) return;
        document.add(new AreaBreak());
        sectionHeading(document, "Year-over-Year Comparison");
        int year = report.getPeriodStart() != null ? report.getPeriodStart().getYear() : LocalDate.now().getYear();
        Table table = new Table(UnitValue.createPercentArray(new float[]{3, 2, 2, 2})).useAllAvailableWidth();
        tableHeader(table, "Metric", String.valueOf(year - 1), String.valueOf(year), "Change");
        addYoyRow(table, "Beneficiaries Served", org.getYoyMetrics().get("beneficiaries"));
        addYoyRow(table, "Cases Managed", org.getYoyMetrics().get("cases"));
        addYoyRow(table, "Interventions Completed", org.getYoyMetrics().get("interventions"));
        addYoyRow(table, "Success Rate (%)", org.getYoyMetrics().get("success_rate"));
        addYoyRow(table, "Social Workers", org.getYoyMetrics().get("social_workers"));
        document.add(table);
    }

    private void addInterventionSection(Document document, OrganizationReportDataDto org) {
        if (org.getInterventionStats() == null || org.getInterventionStats().isEmpty()) return;
        sectionHeading(document, "Intervention Effectiveness by Type");
        Table table = new Table(UnitValue.createPercentArray(new float[]{3, 1, 2})).useAllAvailableWidth();
        tableHeader(table, "Type", "Count", "Success Rate");
        for (OrganizationReportDataDto.InterventionStatsDto s : org.getInterventionStats()) {
            table.addCell(dataCell(s.getType()));
            table.addCell(dataCell(String.valueOf(s.getCount())));
            table.addCell(dataCell(String.format(Locale.US, "%.0f%%", s.getSuccessRate())));
        }
        document.add(table);
    }

    private void addStaffRanking(Document document, OrganizationReportDataDto org) {
        if (org.getTopPerformers() == null || org.getTopPerformers().isEmpty()) return;
        sectionHeading(document, "Staff Performance Ranking");
        Table table = new Table(UnitValue.createPercentArray(new float[]{3, 2, 1, 2})).useAllAvailableWidth();
        tableHeader(table, "Worker", "District", "Cases", "Success");
        int rank = 1;
        for (OrganizationReportDataDto.StaffPerformanceDto s : org.getTopPerformers()) {
            if (rank > 10) break;
            table.addCell(dataCell(s.getName()));
            table.addCell(dataCell(s.getDistrict()));
            table.addCell(dataCell(String.valueOf(s.getCasesManaged())));
            table.addCell(dataCell(String.format(Locale.US, "%.0f%%", s.getSuccessRate())));
            rank++;
        }
        document.add(table);
    }

    private void addRecommendations(Document document, OrganizationReportDataDto org, ReportDto report) {
        sectionHeading(document, (report.getPeriodStart() != null ? report.getPeriodStart().getYear() + 1 : "Next") + " Recommendations");
        document.add(new Paragraph("• Maintain " + Math.min(100, Math.round(org.getOverallComplianceRate()) + 5) + "%+ report compliance across districts.")
                .setFontSize(10).setFontColor(SLATE));
        document.add(new Paragraph("• Target improved success rate toward " + Math.min(100, Math.round(org.getOverallSuccessRate()) + 5) + "%.")
                .setFontSize(10).setFontColor(SLATE));
        if (org.getDistrictPerformance() != null && !org.getDistrictPerformance().isEmpty()) {
            var lowest = org.getDistrictPerformance().get(org.getDistrictPerformance().size() - 1);
            document.add(new Paragraph("• Priority district for support: " + lowest.getDistrict()
                    + " (current success " + Math.round(lowest.getSuccessRate()) + "%).")
                    .setFontSize(10).setFontColor(SLATE));
        }
    }

    private void addSuccessStories(Document document, OrganizationReportDataDto org) {
        sectionHeading(document, "Success Stories");
        int n = 1;
        for (OrganizationReportDataDto.SuccessStoryDto s : org.getSuccessStories()) {
            document.add(new Paragraph("Case " + n + ": " + nullSafe(s.getTitle())).setBold().setFontSize(11).setFontColor(TEAL));
            document.add(new Paragraph(nullSafe(s.getDescription())).setFontSize(9).setFontColor(SLATE));
            if (s.getImpact() != null) {
                document.add(new Paragraph("Impact: " + s.getImpact()).setFontSize(9).setMarginBottom(8));
            }
            n++;
        }
    }

    private void addYoyRow(Table table, String label, OrganizationReportDataDto.YoYMetric yoy) {
        table.addCell(dataCell(label));
        table.addCell(dataCell(yoy != null ? String.valueOf(Math.round(yoy.getPreviousYearValue())) : "0"));
        table.addCell(dataCell(yoy != null ? String.valueOf(Math.round(yoy.getCurrentYearValue())) : "0"));
        String change = "0%";
        if (yoy != null) {
            double p = yoy.getPercentageChange();
            change = (p >= 0 ? "+" : "") + String.format(Locale.US, "%.0f%%", p);
        }
        table.addCell(dataCell(change));
    }

    private Cell kpiCell(String label, String value) {
        Cell c = new Cell().setBackgroundColor(LIGHT).setPadding(8).setBorder(new SolidBorder(ColorConstants.WHITE, 2));
        c.add(new Paragraph(label).setFontSize(7).setFontColor(MUTED).setTextAlignment(TextAlignment.CENTER));
        c.add(new Paragraph(value).setFontSize(13).setBold().setFontColor(TEAL).setTextAlignment(TextAlignment.CENTER));
        return c;
    }

    private void sectionHeading(Document document, String title) {
        document.add(new Paragraph(title).setFontSize(13).setBold().setFontColor(TEAL)
                .setMarginTop(12).setMarginBottom(8).setBorderBottom(new SolidBorder(ColorConstants.LIGHT_GRAY, 1)));
    }

    private void tableHeader(Table table, String... headers) {
        for (String h : headers) {
            table.addCell(new Cell().add(new Paragraph(h).setBold().setFontColor(ColorConstants.WHITE).setFontSize(8))
                    .setBackgroundColor(TEAL).setPadding(4));
        }
    }

    private Cell dataCell(String text) {
        return new Cell().add(new Paragraph(text != null ? text : "—").setFontSize(8).setFontColor(SLATE)).setPadding(3);
    }

    private String formatPeriod(ReportDto report) {
        if (report.getPeriodStart() == null) return "";
        String start = report.getPeriodStart().format(DATE_FMT);
        String end = report.getPeriodEnd() != null ? report.getPeriodEnd().format(DATE_FMT) : start;
        return start.equals(end) ? "Period: " + start : "Period: " + start + " — " + end;
    }

    private String nullSafe(String s) {
        return s != null ? s : "";
    }

    private static class OrgFooterHandler implements IEventHandler {
        private final String periodType;
        private final int year;

        OrgFooterHandler(String periodType, int year) {
            this.periodType = periodType;
            this.year = year;
        }

        @Override
        public void handleEvent(Event event) {
            PdfDocumentEvent docEvent = (PdfDocumentEvent) event;
            PdfDocument pdf = docEvent.getDocument();
            PdfPage page = docEvent.getPage();
            PdfCanvas canvas = new PdfCanvas(page.newContentStreamBefore(), page.getResources(), pdf);
            canvas.beginText()
                    .setFontAndSize(pdf.getDefaultFont(), 8)
                    .setColor(MUTED, true)
                    .moveText(36, 20)
                    .showText("AfyaLink Organization Report | " + periodType + " | " + year + " | Confidential | Page " + pdf.getPageNumber(page))
                    .endText();
            canvas.release();
        }
    }
}
