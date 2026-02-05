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
import java.util.Locale;

@Component
@RequiredArgsConstructor
@Slf4j
public class SupervisorTeamReportPdfExporter {

    private final ChartImageGenerator chartImageGenerator;
    private final ReportDocumentLoader reportDocumentLoader;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd MMM yyyy");
    private static final DeviceRgb TEAL = new DeviceRgb(13, 148, 136);
    private static final DeviceRgb INDIGO = new DeviceRgb(99, 102, 241);
    private static final DeviceRgb SLATE = new DeviceRgb(51, 65, 85);
    private static final DeviceRgb MUTED = new DeviceRgb(100, 116, 139);
    private static final DeviceRgb LIGHT = new DeviceRgb(248, 250, 252);

    public ResponseEntity<byte[]> export(ReportDataDto data) throws java.io.IOException {
        ReportDto report = data.getReportDto();
        TeamSummaryDto team = data.getTeamSummary();
        SocialWorkerSummaryDto summary = data.getSummary();

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(out);
        PdfDocument pdf = new PdfDocument(writer);
        Document document = new Document(pdf, PageSize.A4);
        document.setMargins(36, 36, 56, 36);
        pdf.addEventHandler(PdfDocumentEvent.END_PAGE, new FooterHandler());

        addHeader(document, report);
        addDistrictContext(document, report, team, summary);
        addExecutiveSummary(document, report);
        addTeamKpis(document, summary);
        addWorkerTable(document, team);
        addCharts(document, data);
        addAttachments(document, report);

        document.close();

        String filename = String.format("AfyaLink_team_%s_%d.pdf",
                report.getPeriodStart() != null ? report.getPeriodStart() : "report", report.getId());
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(out.toByteArray());
    }

    private void addHeader(Document document, ReportDto report) {
        String district = report.getGeneratedByDistrict() != null ? report.getGeneratedByDistrict() + " District Team" : "Supervisor Team";
        Table header = new Table(UnitValue.createPercentArray(new float[]{1})).useAllAvailableWidth();
        Cell cell = new Cell()
                .add(new Paragraph("AfyaLink Case Management").setFontSize(11).setFontColor(ColorConstants.WHITE).setTextAlignment(TextAlignment.CENTER))
                .add(new Paragraph("Supervisor Team Report").setFontSize(17).setBold().setFontColor(ColorConstants.WHITE).setTextAlignment(TextAlignment.CENTER).setMarginTop(4))
                .add(new Paragraph(district).setFontSize(12).setFontColor(ColorConstants.WHITE).setTextAlignment(TextAlignment.CENTER).setMarginTop(6))
                .add(new Paragraph(formatPeriod(report)).setFontSize(10).setFontColor(ColorConstants.WHITE).setTextAlignment(TextAlignment.CENTER).setMarginTop(6))
                .add(new Paragraph("Supervisor: " + nullSafe(report.getGeneratedByName()) + " | Status: " + nullSafe(report.getStatus()))
                        .setFontSize(8).setFontColor(ColorConstants.WHITE).setTextAlignment(TextAlignment.CENTER).setMarginTop(4))
                .setBackgroundColor(INDIGO)
                .setPadding(18)
                .setBorder(Border.NO_BORDER);
        header.addCell(cell);
        document.add(header);
        document.add(new Paragraph(" ").setMarginBottom(10));
    }

    private void addDistrictContext(Document document, ReportDto report, TeamSummaryDto team, SocialWorkerSummaryDto summary) {
        sectionHeading(document, "District Context");
        Table ctx = new Table(UnitValue.createPercentArray(new float[]{1, 1, 1, 1})).useAllAvailableWidth();
        ctx.addCell(contextCell("Assigned District", nullSafe(report.getGeneratedByDistrict())));
        int workers = team != null && team.getMembers() != null ? team.getMembers().size() : 0;
        ctx.addCell(contextCell("Workers in District", String.valueOf(workers)));
        ctx.addCell(contextCell("Active Cases", summary != null ? String.valueOf(summary.getTotalActiveCases()) : "0"));
        ctx.addCell(contextCell("Beneficiaries", summary != null ? String.valueOf(summary.getTotalBeneficiaries()) : "0"));
        document.add(ctx);
        document.add(new Paragraph(" ").setMarginBottom(8));
    }

    private Cell contextCell(String label, String value) {
        Cell c = new Cell().setBackgroundColor(LIGHT).setPadding(8).setBorder(new SolidBorder(ColorConstants.WHITE, 1));
        c.add(new Paragraph(label).setFontSize(8).setFontColor(MUTED));
        c.add(new Paragraph(value).setFontSize(12).setBold().setFontColor(INDIGO));
        return c;
    }

    private void addExecutiveSummary(Document document, ReportDto report) {
        if (report.getNarrative() == null || report.getNarrative().isBlank()) return;
        sectionHeading(document, "Executive Summary");
        document.add(new Paragraph(report.getNarrative()).setFontSize(10).setFontColor(SLATE).setMarginBottom(12));
    }

    private void addTeamKpis(Document document, SocialWorkerSummaryDto summary) {
        if (summary == null) return;
        sectionHeading(document, "Team Performance Dashboard");
        Table cards = new Table(UnitValue.createPercentArray(new float[]{1, 1, 1, 1})).useAllAvailableWidth();
        cards.addCell(kpiCell("Beneficiaries", String.valueOf(summary.getTotalBeneficiaries())));
        cards.addCell(kpiCell("Active Cases", String.valueOf(summary.getTotalActiveCases())));
        cards.addCell(kpiCell("Interventions", String.valueOf(summary.getInterventionsCompleted())));
        cards.addCell(kpiCell("Avg Progress", summary.getAvgCaseProgress() != null
                ? String.format(Locale.US, "%.0f%%", summary.getAvgCaseProgress()) : "0%"));
        document.add(cards);
        document.add(new Paragraph(" ").setMarginBottom(8));
    }

    private void addWorkerTable(Document document, TeamSummaryDto team) {
        if (team == null || team.getMembers() == null || team.getMembers().isEmpty()) return;
        sectionHeading(document, "Worker Performance by Sector");
        Table table = new Table(UnitValue.createPercentArray(new float[]{2, 3, 1, 1, 2})).useAllAvailableWidth();
        tableHeader(table, "Sector", "Worker", "Cases", "Progress", "Coverage");
        for (SocialWorkerSummaryDto m : team.getMembers()) {
            table.addCell(dataCell(m.getSector()));
            table.addCell(dataCell(m.getWorkerName()));
            table.addCell(dataCell(String.valueOf(m.getTotalActiveCases())));
            table.addCell(dataCell(m.getAvgCaseProgress() != null ? String.format(Locale.US, "%.0f%%", m.getAvgCaseProgress()) : "—"));
            String coverage = String.join(", ",
                    List.of(
                            m.getCell() != null ? "Cell: " + m.getCell() : null,
                            m.getVillage() != null ? "Village: " + m.getVillage() : null
                    ).stream().filter(s -> s != null).toList());
            table.addCell(dataCell(coverage.isEmpty() ? "—" : coverage));
        }
        document.add(table);
    }

    private void addCharts(Document document, ReportDataDto data) {
        if (data.getChartData() == null) return;
        sectionHeading(document, "Team Analytics");
        ChartDataDto charts = data.getChartData();
        try {
            if (charts.getInterventionTypeDistribution() != null && !charts.getInterventionTypeDistribution().isEmpty()) {
                byte[] pie = chartImageGenerator.createPieChart(charts.getInterventionTypeDistribution(), "Interventions by Type", 400, 260);
                document.add(new Image(ImageDataFactory.create(pie)).setAutoScale(true).setHorizontalAlignment(HorizontalAlignment.CENTER).setMarginBottom(8));
            }
            if (charts.getCaseProgressDistribution() != null && !charts.getCaseProgressDistribution().isEmpty()) {
                byte[] bar = chartImageGenerator.createBarChart(charts.getCaseProgressDistribution(), "Case Progress Bands", 400, 240);
                document.add(new Image(ImageDataFactory.create(bar)).setAutoScale(true).setHorizontalAlignment(HorizontalAlignment.CENTER));
            }
        } catch (Exception e) {
            log.warn("Team chart failed: {}", e.getMessage());
        }
    }

    private void addAttachments(Document document, ReportDto report) {
        if (report.getAttachments() == null || report.getAttachments().isEmpty()) return;
        document.add(new AreaBreak());
        sectionHeading(document, "Field Visit Evidence");
        List<ReportAttachmentDto> photos = new ArrayList<>();
        for (ReportAttachmentDto att : report.getAttachments()) {
            if (isPhoto(att)) photos.add(att);
        }
        if (!photos.isEmpty()) {
            Table gallery = new Table(UnitValue.createPercentArray(new float[]{1, 1})).useAllAvailableWidth();
            for (ReportAttachmentDto att : photos) {
                try {
                    byte[] bytes = reportDocumentLoader.loadDocumentBytes(att.getDocumentId());
                    Cell cell = new Cell().setPadding(6).setBorder(new SolidBorder(LIGHT, 1));
                    cell.add(new Image(ImageDataFactory.create(bytes)).setMaxWidth(220).setMaxHeight(160).setAutoScale(true)
                            .setHorizontalAlignment(HorizontalAlignment.CENTER));
                    if (att.getCaption() != null) {
                        cell.add(new Paragraph(att.getCaption()).setFontSize(8).setTextAlignment(TextAlignment.CENTER));
                    }
                    gallery.addCell(cell);
                } catch (Exception e) {
                    log.warn("Photo embed failed: {}", e.getMessage());
                }
            }
            document.add(gallery);
        }
    }

    private boolean isPhoto(ReportAttachmentDto att) {
        if (att.getCategory() != null) {
            String c = att.getCategory().toUpperCase();
            if ("PHOTO".equals(c) || "HOME_VISIT".equals(c)) return true;
        }
        return att.getDocumentId() != null && reportDocumentLoader.isImageDocument(att.getDocumentId());
    }

    private Cell kpiCell(String label, String value) {
        Cell c = new Cell().setBackgroundColor(LIGHT).setPadding(8).setBorder(new SolidBorder(ColorConstants.WHITE, 2));
        c.add(new Paragraph(label).setFontSize(8).setFontColor(MUTED).setTextAlignment(TextAlignment.CENTER));
        c.add(new Paragraph(value).setFontSize(14).setBold().setFontColor(INDIGO).setTextAlignment(TextAlignment.CENTER));
        return c;
    }

    private void sectionHeading(Document document, String title) {
        document.add(new Paragraph(title).setFontSize(13).setBold().setFontColor(INDIGO)
                .setMarginTop(10).setMarginBottom(6).setBorderBottom(new SolidBorder(ColorConstants.LIGHT_GRAY, 1)));
    }

    private void tableHeader(Table table, String... headers) {
        for (String h : headers) {
            table.addCell(new Cell().add(new Paragraph(h).setBold().setFontColor(ColorConstants.WHITE).setFontSize(8))
                    .setBackgroundColor(INDIGO).setPadding(4));
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

    private static class FooterHandler implements IEventHandler {
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
                    .showText("AfyaLink Supervisor Team Report | Confidential | Page " + pdf.getPageNumber(page))
                    .endText();
            canvas.release();
        }
    }
}
