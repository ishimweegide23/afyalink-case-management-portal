package com.afyalink.backend.service;

import com.afyalink.backend.dto.report.*;
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
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class SocialWorkerReportPdfExporter {

    private final ChartImageGenerator chartImageGenerator;
    private final ReportDocumentLoader reportDocumentLoader;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd MMM yyyy");
    private static final DeviceRgb TEAL = new DeviceRgb(13, 148, 136);
    private static final DeviceRgb INDIGO = new DeviceRgb(99, 102, 241);
    private static final DeviceRgb AMBER = new DeviceRgb(245, 158, 11);
    private static final DeviceRgb SLATE = new DeviceRgb(51, 65, 85);
    private static final DeviceRgb LIGHT = new DeviceRgb(248, 250, 252);
    private static final DeviceRgb MUTED = new DeviceRgb(100, 116, 139);

    public ResponseEntity<byte[]> export(ReportDataDto data) throws java.io.IOException {
        ReportDto report = data.getReportDto();
        PeriodLayout layout = resolveLayout(report.getReportType());

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(out);
        PdfDocument pdf = new PdfDocument(writer);
        Document document = new Document(pdf, PageSize.A4);
        document.setMargins(36, 36, 56, 36);
        pdf.addEventHandler(PdfDocumentEvent.END_PAGE, new FooterHandler(report.getReportType()));

        addPeriodHeader(document, report, layout);
        addWorkerLocationBadge(document, report);
        addNarrativeSection(document, report, layout);
        addKpiCards(document, data.getSummary(), layout.kpiColumns);
        addChartsSection(document, data, layout);
        addDataSections(document, data, layout);
        addAttachmentsSection(document, report);

        document.close();

        String filename = buildFilename(report);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(out.toByteArray());
    }

    private String buildFilename(ReportDto report) {
        String type = report.getReportType() != null ? report.getReportType().toLowerCase() : "report";
        String period = report.getPeriodStart() != null ? report.getPeriodStart().toString() : "export";
        return String.format("AfyaLink_%s_%s_%d.pdf", type, period, report.getId());
    }

    private PeriodLayout resolveLayout(String reportType) {
        if (reportType == null) return PeriodLayout.standard();
        return switch (reportType.toUpperCase()) {
            case "DAILY" -> new PeriodLayout(
                    "Daily Field Report",
                    TEAL,
                    "Snapshot of today's casework, visits, and outcomes.",
                    4,
                    true,
                    true,
                    true,
                    true,
                    10,
                    12
            );
            case "WEEKLY" -> new PeriodLayout(
                    "Weekly Activity Report",
                    INDIGO,
                    "Seven-day summary of progress, interventions, and team deliverables.",
                    4,
                    true,
                    true,
                    true,
                    true,
                    12,
                    15
            );
            case "MONTHLY" -> new PeriodLayout(
                    "Monthly Performance Report",
                    TEAL,
                    "Comprehensive monthly overview for supervision and district reporting.",
                    4,
                    true,
                    true,
                    true,
                    true,
                    25,
                    30
            );
            case "YEARLY" -> new PeriodLayout(
                    "Annual Social Work Report",
                    new DeviceRgb(30, 64, 175),
                    "Full-year record of beneficiaries served, cases managed, and field evidence.",
                    6,
                    true,
                    true,
                    true,
                    true,
                    50,
                    80
            );
            case "SUPERVISOR_TEAM" -> new PeriodLayout(
                    "Team Consolidated Report",
                    INDIGO,
                    "District team performance and combined field activity for the period.",
                    6,
                    true,
                    true,
                    true,
                    true,
                    40,
                    50
            );
            default -> PeriodLayout.standard();
        };
    }

    private void addPeriodHeader(Document document, ReportDto report, PeriodLayout layout) {
        Table header = new Table(UnitValue.createPercentArray(new float[]{1})).useAllAvailableWidth();
        Cell cell = new Cell()
                .add(new Paragraph("AfyaLink Case Management").setFontSize(11).setFontColor(ColorConstants.WHITE).setTextAlignment(TextAlignment.CENTER))
                .add(new Paragraph(layout.badge).setFontSize(18).setBold().setFontColor(ColorConstants.WHITE).setTextAlignment(TextAlignment.CENTER).setMarginTop(4))
                .add(new Paragraph(report.getTitle() != null ? report.getTitle() : "Social Worker Report")
                        .setFontSize(12).setFontColor(ColorConstants.WHITE).setTextAlignment(TextAlignment.CENTER).setMarginTop(6))
                .add(new Paragraph(formatPeriod(report)).setFontSize(10).setFontColor(ColorConstants.WHITE).setTextAlignment(TextAlignment.CENTER).setMarginTop(8))
                .add(new Paragraph("Prepared by: " + nullSafe(report.getGeneratedByName()) + " · " + nullSafe(report.getGeneratedByRole()))
                        .setFontSize(9).setFontColor(ColorConstants.WHITE).setTextAlignment(TextAlignment.CENTER).setMarginTop(4))
                .setBackgroundColor(layout.accentColor)
                .setPadding(18)
                .setBorder(Border.NO_BORDER);
        header.addCell(cell);
        document.add(header);

        document.add(new Paragraph(layout.subtitle)
                .setFontSize(9)
                .setFontColor(MUTED)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginBottom(16));
    }

    private void addWorkerLocationBadge(Document document, ReportDto report) {
        if (report.getGeneratedByDistrict() == null && report.getGeneratedBySector() == null) return;
        String loc = String.join(" · ",
                List.of(
                        report.getGeneratedByDistrict() != null ? "District: " + report.getGeneratedByDistrict() : null,
                        report.getGeneratedBySector() != null ? "Sector: " + report.getGeneratedBySector() : null,
                        report.getGeneratedByCell() != null ? "Cell: " + report.getGeneratedByCell() : null
                ).stream().filter(s -> s != null).toList());
        Table t = new Table(UnitValue.createPercentArray(new float[]{1})).useAllAvailableWidth();
        t.addCell(new Cell().add(new Paragraph(loc).setFontSize(9).setFontColor(SLATE))
                .setBackgroundColor(LIGHT)
                .setPadding(8)
                .setBorder(new SolidBorder(TEAL, 1)));
        document.add(t);
        document.add(new Paragraph(" ").setMarginBottom(8));
    }

    private void addNarrativeSection(Document document, ReportDto report, PeriodLayout layout) {
        if (report.getNarrative() == null || report.getNarrative().isBlank()) return;
        sectionHeading(document, layout.badge.contains("Daily") ? "Today's Summary" : "Executive Summary");
        document.add(new Paragraph(report.getNarrative())
                .setFontSize(layout.badge.contains("Annual") ? 10 : 10)
                .setFontColor(SLATE)
                .setMarginBottom(14));
    }

    private void addKpiCards(Document document, SocialWorkerSummaryDto summary, int columns) {
        if (summary == null) return;
        sectionHeading(document, "Key Performance Indicators");
        float[] widths = new float[columns];
        for (int i = 0; i < columns; i++) widths[i] = 1f;
        Table cards = new Table(UnitValue.createPercentArray(widths)).useAllAvailableWidth();
        cards.addCell(kpiCell("Beneficiaries", String.valueOf(summary.getTotalBeneficiaries())));
        cards.addCell(kpiCell("Active Cases", String.valueOf(summary.getTotalActiveCases())));
        cards.addCell(kpiCell("Interventions", String.valueOf(summary.getInterventionsCompleted())));
        cards.addCell(kpiCell("Tasks Done", String.valueOf(summary.getTasksCompleted())));
        if (columns >= 6) {
            cards.addCell(kpiCell("New Cases", String.valueOf(summary.getNewCasesInPeriod())));
            cards.addCell(kpiCell("Avg Progress", summary.getAvgCaseProgress() != null
                    ? String.format("%.0f%%", summary.getAvgCaseProgress()) : "0%"));
        }
        document.add(cards);
        document.add(new Paragraph(" ").setMarginBottom(10));
    }

    private Cell kpiCell(String label, String value) {
        Cell c = new Cell().setBackgroundColor(LIGHT).setPadding(10).setBorder(new SolidBorder(ColorConstants.WHITE, 2));
        c.add(new Paragraph(label).setFontSize(8).setFontColor(MUTED).setTextAlignment(TextAlignment.CENTER));
        c.add(new Paragraph(value).setFontSize(15).setBold().setFontColor(TEAL).setTextAlignment(TextAlignment.CENTER));
        return c;
    }

    private void addChartsSection(Document document, ReportDataDto data, PeriodLayout layout) {
        if (!layout.includeCharts || data.getChartData() == null) return;
        ChartDataDto charts = data.getChartData();
        sectionHeading(document, "Analytics & Charts");

        try {
            if (charts.getDailyActivity() != null && !charts.getDailyActivity().isEmpty()) {
                byte[] img = chartImageGenerator.createLineChart(
                        charts.getDailyActivity(),
                        layout.badge.contains("Annual") ? "Activity Trend" : "Daily Activity",
                        520, layout.badge.contains("Daily") ? 200 : 240);
                addChartImage(document, img, "Figure 1: Activity over the reporting period");
            }
        } catch (Exception e) {
            log.warn("Daily activity chart failed: {}", e.getMessage());
        }

        Table chartRow = new Table(UnitValue.createPercentArray(new float[]{1, 1})).useAllAvailableWidth();
        chartRow.setMarginBottom(12);

        try {
            if (charts.getInterventionTypeDistribution() != null && !charts.getInterventionTypeDistribution().isEmpty()) {
                byte[] pie = chartImageGenerator.createPieChart(
                        charts.getInterventionTypeDistribution(), "Interventions by Type", 260, 220);
                chartRow.addCell(chartCell(pie, "Intervention mix"));
            } else {
                chartRow.addCell(emptyChartCell());
            }
        } catch (Exception e) {
            chartRow.addCell(emptyChartCell());
        }

        try {
            List<LabelValueDto> progress = charts.getCaseProgressDistribution();
            if (progress != null && !progress.isEmpty()) {
                byte[] bar = chartImageGenerator.createBarChart(progress, "Case Progress Distribution", 260, 220);
                chartRow.addCell(chartCell(bar, "Progress bands"));
            } else {
                chartRow.addCell(emptyChartCell());
            }
        } catch (Exception e) {
            chartRow.addCell(emptyChartCell());
        }

        document.add(chartRow);
    }

    private Cell chartCell(byte[] png, String caption) {
        Cell c = new Cell().setBorder(Border.NO_BORDER).setPadding(4);
        c.add(new Image(ImageDataFactory.create(png)).setAutoScale(true).setHorizontalAlignment(HorizontalAlignment.CENTER));
        c.add(new Paragraph(caption).setFontSize(8).setFontColor(MUTED).setTextAlignment(TextAlignment.CENTER));
        return c;
    }

    private Cell emptyChartCell() {
        return new Cell().add(new Paragraph("—").setFontSize(8).setTextAlignment(TextAlignment.CENTER))
                .setBorder(Border.NO_BORDER);
    }

    private void addChartImage(Document document, byte[] png, String caption) {
        document.add(new Image(ImageDataFactory.create(png))
                .setAutoScale(true)
                .setHorizontalAlignment(HorizontalAlignment.CENTER)
                .setMarginBottom(4));
        document.add(new Paragraph(caption).setFontSize(8).setFontColor(MUTED).setTextAlignment(TextAlignment.CENTER).setMarginBottom(12));
    }

    private void addDataSections(Document document, ReportDataDto data, PeriodLayout layout) {
        if (layout.includeBeneficiaries && data.getBeneficiaries() != null && !data.getBeneficiaries().isEmpty()) {
            sectionHeading(document, "Beneficiaries");
            addBeneficiariesTable(document, data.getBeneficiaries(), layout.maxBeneficiaryRows);
        }
        if (layout.includeCases && data.getCases() != null && !data.getCases().isEmpty()) {
            sectionHeading(document, "Cases Overview");
            addCasesTable(document, data.getCases(), layout.maxCaseRows);
        }
        if (layout.includeInterventions && data.getInterventions() != null && !data.getInterventions().isEmpty()) {
            sectionHeading(document, "Interventions");
            addInterventionsTable(document, data.getInterventions(), Math.min(layout.maxCaseRows, 20));
        }
        if (data.getCaseEntries() != null && !data.getCaseEntries().isEmpty() && !layout.badge.contains("Daily")) {
            sectionHeading(document, "Case Notes & Diary");
            addDiaryTable(document, data.getCaseEntries(), 15);
        }
    }

    private void addBeneficiariesTable(Document document, List<BeneficiaryProgressDto> list, int maxRows) {
        Table table = new Table(UnitValue.createPercentArray(new float[]{3, 2, 1, 2})).useAllAvailableWidth();
        tableHeader(table, "Name", "Case #", "Progress", "District");
        int count = 0;
        for (BeneficiaryProgressDto b : list) {
            if (count++ >= maxRows) break;
            table.addCell(dataCell(b.getFullName()));
            table.addCell(dataCell(b.getCaseNumber()));
            table.addCell(dataCell(b.getCaseProgressPercent() != null ? b.getCaseProgressPercent() + "%" : "—"));
            table.addCell(dataCell(b.getDistrict()));
        }
        if (list.size() > maxRows) {
            document.add(new Paragraph("Showing " + maxRows + " of " + list.size() + " beneficiaries.")
                    .setFontSize(8).setFontColor(MUTED).setMarginBottom(4));
        }
        document.add(table);
    }

    private void addCasesTable(Document document, List<ReportCaseDto> list, int maxRows) {
        Table table = new Table(UnitValue.createPercentArray(new float[]{2, 3, 1, 1})).useAllAvailableWidth();
        tableHeader(table, "Case #", "Title", "Status", "Progress");
        int count = 0;
        for (ReportCaseDto c : list) {
            if (count++ >= maxRows) break;
            table.addCell(dataCell(c.getCaseNumber()));
            table.addCell(dataCell(c.getTitle()));
            table.addCell(dataCell(c.getStatus()));
            table.addCell(dataCell(c.getProgressPercent() != null ? c.getProgressPercent() + "%" : "—"));
        }
        document.add(table);
    }

    private void addInterventionsTable(Document document, List<ReportInterventionDto> list, int maxRows) {
        Table table = new Table(UnitValue.createPercentArray(new float[]{2, 3, 2, 2})).useAllAvailableWidth();
        tableHeader(table, "Code", "Title", "Type", "Status");
        int count = 0;
        for (ReportInterventionDto i : list) {
            if (count++ >= maxRows) break;
            table.addCell(dataCell(i.getInterventionCode()));
            table.addCell(dataCell(i.getTitle()));
            table.addCell(dataCell(i.getType()));
            table.addCell(dataCell(i.getStatus()));
        }
        document.add(table);
    }

    private void addDiaryTable(Document document, List<ReportDiaryItemDto> list, int maxRows) {
        Table table = new Table(UnitValue.createPercentArray(new float[]{2, 2, 4})).useAllAvailableWidth();
        tableHeader(table, "Date", "Type", "Entry");
        int count = 0;
        for (ReportDiaryItemDto e : list) {
            if (count++ >= maxRows) break;
            table.addCell(dataCell(e.getCreatedAt() != null ? e.getCreatedAt().toLocalDate().format(DATE_FMT) : "—"));
            table.addCell(dataCell(e.getType()));
            String content = e.getTitle() != null ? e.getTitle() : "";
            if (e.getContent() != null && e.getContent().length() > 120) {
                content = e.getContent().substring(0, 117) + "...";
            } else if (e.getContent() != null) {
                content = e.getContent();
            }
            table.addCell(dataCell(content));
        }
        document.add(table);
    }

    private void addAttachmentsSection(Document document, ReportDto report) {
        if (report.getAttachments() == null || report.getAttachments().isEmpty()) return;

        List<ReportAttachmentDto> photos = new ArrayList<>();
        List<ReportAttachmentDto> documents = new ArrayList<>();
        for (ReportAttachmentDto att : report.getAttachments()) {
            if (isPhotoAttachment(att)) {
                photos.add(att);
            } else {
                documents.add(att);
            }
        }

        if (!photos.isEmpty()) {
            document.add(new AreaBreak());
            sectionHeading(document, "Field Photos & Visual Evidence");
            Table gallery = new Table(UnitValue.createPercentArray(new float[]{1, 1})).useAllAvailableWidth();
            int col = 0;
            for (ReportAttachmentDto att : photos) {
                try {
                    byte[] bytes = reportDocumentLoader.loadDocumentBytes(att.getDocumentId());
                    Image img = new Image(ImageDataFactory.create(bytes));
                    img.setMaxWidth(240);
                    img.setMaxHeight(180);
                    img.setAutoScale(true);
                    Cell cell = new Cell().setBorder(new SolidBorder(LIGHT, 1)).setPadding(8);
                    cell.add(img.setHorizontalAlignment(HorizontalAlignment.CENTER));
                    cell.add(new Paragraph(categoryLabel(att.getCategory()))
                            .setFontSize(8).setBold().setFontColor(TEAL).setTextAlignment(TextAlignment.CENTER));
                    if (att.getCaption() != null && !att.getCaption().isBlank()) {
                        cell.add(new Paragraph(att.getCaption())
                                .setFontSize(9).setFontColor(SLATE).setTextAlignment(TextAlignment.CENTER).setMarginTop(4));
                    }
                    if (att.getDocumentName() != null) {
                        cell.add(new Paragraph(att.getDocumentName())
                                .setFontSize(7).setFontColor(MUTED).setTextAlignment(TextAlignment.CENTER));
                    }
                    gallery.addCell(cell);
                    col++;
                } catch (Exception e) {
                    log.warn("Could not embed photo {}: {}", att.getDocumentId(), e.getMessage());
                }
            }
            if (col % 2 == 1) {
                gallery.addCell(new Cell().setBorder(Border.NO_BORDER));
            }
            document.add(gallery);
        }

        if (!documents.isEmpty()) {
            sectionHeading(document, "Attached Documents (Medical Results, Reports & Files)");
            Table docTable = new Table(UnitValue.createPercentArray(new float[]{2, 2, 4})).useAllAvailableWidth();
            tableHeader(docTable, "Category", "File Name", "Description");
            for (ReportAttachmentDto att : documents) {
                docTable.addCell(dataCell(categoryLabel(att.getCategory())));
                docTable.addCell(dataCell(att.getDocumentName()));
                docTable.addCell(dataCell(att.getCaption() != null ? att.getCaption() : "—"));
            }
            document.add(docTable);
            document.add(new Paragraph(
                    "Supporting documents are stored in the system and listed here for audit and supervision review.")
                    .setFontSize(8).setFontColor(MUTED).setMarginTop(6));
        }
    }

    private boolean isPhotoAttachment(ReportAttachmentDto att) {
        if (isPhotoCategory(att.getCategory())) return true;
        if (att.getDocumentId() == null) return false;
        try {
            return reportDocumentLoader.isImageDocument(att.getDocumentId());
        } catch (Exception e) {
            return false;
        }
    }

    private boolean isPhotoCategory(String category) {
        if (category == null) return false;
        String c = category.toUpperCase();
        return "PHOTO".equals(c) || "HOME_VISIT".equals(c) || "FIELD_PHOTO".equals(c);
    }

    private String categoryLabel(String category) {
        if (category == null) return "Attachment";
        return switch (category.toUpperCase()) {
            case "MEDICAL_RESULT" -> "Medical Result";
            case "LAB_RESULT" -> "Lab Result";
            case "HOME_VISIT" -> "Home Visit Photo";
            case "PHOTO" -> "Field Photo";
            case "LEGAL" -> "Legal Document";
            case "CASE_DOCUMENT" -> "Case Document";
            default -> category.replace('_', ' ');
        };
    }

    private void sectionHeading(Document document, String title) {
        document.add(new Paragraph(title)
                .setFontSize(13)
                .setBold()
                .setFontColor(TEAL)
                .setMarginTop(12)
                .setMarginBottom(8)
                .setBorderBottom(new SolidBorder(ColorConstants.LIGHT_GRAY, 1)));
    }

    private void tableHeader(Table table, String... headers) {
        for (String h : headers) {
            table.addCell(new Cell().add(new Paragraph(h).setBold().setFontColor(ColorConstants.WHITE).setFontSize(9))
                    .setBackgroundColor(TEAL).setPadding(5));
        }
    }

    private Cell dataCell(String text) {
        return new Cell().add(new Paragraph(text != null ? text : "—").setFontSize(8).setFontColor(SLATE)).setPadding(4);
    }

    private String formatPeriod(ReportDto report) {
        if (report.getPeriodStart() == null) return "";
        String start = report.getPeriodStart().format(DATE_FMT);
        String end = report.getPeriodEnd() != null ? report.getPeriodEnd().format(DATE_FMT) : start;
        if (start.equals(end)) return "Period: " + start;
        return "Period: " + start + " — " + end;
    }

    private String nullSafe(String s) {
        return s != null ? s : "";
    }

    private record PeriodLayout(
            String badge,
            DeviceRgb accentColor,
            String subtitle,
            int kpiColumns,
            boolean includeCharts,
            boolean includeBeneficiaries,
            boolean includeCases,
            boolean includeInterventions,
            int maxBeneficiaryRows,
            int maxCaseRows
    ) {
        static PeriodLayout standard() {
            return new PeriodLayout("Social Worker Report", TEAL,
                    "Professional casework report for AfyaLink.", 4, true, true, true, true, 25, 30);
        }
    }

    private static class FooterHandler implements IEventHandler {
        private final String reportType;

        FooterHandler(String reportType) {
            this.reportType = reportType != null ? reportType : "REPORT";
        }

        @Override
        public void handleEvent(Event event) {
            PdfDocumentEvent docEvent = (PdfDocumentEvent) event;
            PdfDocument pdf = docEvent.getDocument();
            PdfPage page = docEvent.getPage();
            PdfCanvas canvas = new PdfCanvas(page.newContentStreamBefore(), page.getResources(), pdf);
            float x = pdf.getDefaultPageSize().getWidth() / 2;
            canvas.beginText()
                    .setFontAndSize(pdf.getDefaultFont(), 8)
                    .setColor(MUTED, true)
                    .moveText(x - 100, 20)
                    .showText("AfyaLink · " + reportType + " · Confidential · Page " + pdf.getPageNumber(page))
                    .endText();
            canvas.release();
        }
    }
}
