package com.afyalink.backend.service;

import com.afyalink.backend.dto.report.BeneficiaryProgressDto;
import com.afyalink.backend.dto.report.ChartDataDto;
import com.afyalink.backend.dto.report.ReportAttachmentDto;
import com.afyalink.backend.dto.report.ReportCaseDto;
import com.afyalink.backend.dto.report.ReportDataDto;
import com.afyalink.backend.dto.report.ReportDto;
import com.afyalink.backend.dto.report.ReportInterventionDto;
import com.afyalink.backend.dto.report.SocialWorkerSummaryDto;
import com.afyalink.backend.dto.report.OrganizationReportDataDto;
import com.afyalink.backend.exception.ResourceNotFoundException;
import com.itextpdf.io.image.ImageData;
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
import com.itextpdf.layout.element.Div;
import com.itextpdf.layout.element.Image;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.itextpdf.layout.properties.VerticalAlignment;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.ClientAnchor;
import org.apache.poi.ss.usermodel.CreationHelper;
import org.apache.poi.ss.usermodel.Drawing;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.apache.poi.util.Units;
import org.apache.poi.xwpf.usermodel.*;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;
import java.util.Base64;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExportService {

    private final ReportDataService reportDataService;
    private final OrganizationReportService organizationReportService;
    private final SocialWorkerReportPdfExporter socialWorkerReportPdfExporter;
    private final OrganizationReportPdfExporter organizationReportPdfExporter;
    private final SupervisorTeamReportPdfExporter supervisorTeamReportPdfExporter;
    private final ChartImageGenerator chartImageGenerator;
    private final ReportDocumentLoader reportDocumentLoader;
    private final AuditLogService auditLogService;
    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
    
    // Brand Colors
    private static final DeviceRgb TEAL = new DeviceRgb(13, 148, 136);
    private static final DeviceRgb INDIGO = new DeviceRgb(99, 102, 241);
    private static final DeviceRgb LIGHT_GRAY = new DeviceRgb(243, 244, 246);
    private static final DeviceRgb TEXT_GRAY = new DeviceRgb(75, 85, 99);

    public ResponseEntity<byte[]> exportToPdf(Long reportId) throws java.io.IOException {
        return exportToPdf(reportId, null);
    }

    public ResponseEntity<byte[]> exportToPdf(Long reportId, Long exportedByUserId) throws java.io.IOException {
        ReportDataDto data = reportDataService.buildReportData(reportId);
        if (data == null || data.getReportDto() == null) {
            throw new ResourceNotFoundException("Report data not found");
        }

        ResponseEntity<byte[]> response;

        if ("ORGANIZATION".equals(data.getReportDto().getReportType())) {
            OrganizationReportDataDto orgData = data.getOrganizationData() != null
                    ? data.getOrganizationData()
                    : organizationReportService.buildOrganizationReportData(
                            data.getReportDto().getPeriodStart(),
                            data.getReportDto().getPeriodEnd());
            response = organizationReportPdfExporter.export(data.getReportDto(), orgData);
        } else if ("SUPERVISOR_TEAM".equals(data.getReportDto().getReportType())) {
            response = supervisorTeamReportPdfExporter.export(data);
        } else if (isPeriodBasedWorkerReport(data.getReportDto().getReportType())) {
            response = socialWorkerReportPdfExporter.export(data);
        } else {
            response = exportLegacyPdf(reportId, data);
        }

        if (exportedByUserId != null) {
            auditLogService.log(exportedByUserId, "EXPORT", "Report",
                    String.valueOf(reportId), null, "PDF|" + data.getReportDto().getReportType());
        }
        return response;
    }

    private ResponseEntity<byte[]> exportLegacyPdf(Long reportId, ReportDataDto data) throws java.io.IOException {

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(out);
        PdfDocument pdf = new PdfDocument(writer);
        Document document = new Document(pdf, PageSize.A4);
        document.setMargins(40, 40, 60, 40);

        // Add footer handler
        pdf.addEventHandler(PdfDocumentEvent.END_PAGE, new FooterEventHandler());

        // Header Section
        addPdfHeader(document, data.getReportDto());

        // Executive Summary
        if (data.getReportDto().getNarrative() != null && !data.getReportDto().getNarrative().isEmpty()) {
            addPdfSectionHeading(document, "Executive Summary");
            Paragraph p = new Paragraph(data.getReportDto().getNarrative())
                    .setFontSize(10)
                    .setFontColor(TEXT_GRAY)
                    .setMarginBottom(20);
            document.add(p);
        }

        // Statistics Cards
        if (data.getSummary() != null) {
            addPdfSectionHeading(document, "Performance Metrics");
            addPdfStatisticsCards(document, data);
        }

        // Beneficiaries Table
        if (data.getBeneficiaries() != null && !data.getBeneficiaries().isEmpty()) {
            addPdfSectionHeading(document, "Beneficiaries Progress");
            addPdfBeneficiariesTable(document, data);
        }

        // Cases Table
        if (data.getCases() != null && !data.getCases().isEmpty() && !"ORGANIZATION".equals(data.getReportDto().getReportType())) {
            addPdfSectionHeading(document, "Active Cases Overview");
            addPdfCasesTable(document, data);
        }

        // Photo Gallery
        if (data.getReportDto().getAttachments() != null && !data.getReportDto().getAttachments().isEmpty()) {
            document.add(new AreaBreak());
            addPdfSectionHeading(document, "Field Visit Evidence");
            addPdfPhotoGallery(document, data);
        }

        document.close();

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"report_" + reportId + ".pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(out.toByteArray());
    }

    private void addPdfHeader(Document document, ReportDto report) {
        // Title block with Teal background
        Table headerTable = new Table(UnitValue.createPercentArray(new float[]{1})).useAllAvailableWidth();
        headerTable.setMarginBottom(20);
        
        Cell titleCell = new Cell()
            .add(new Paragraph("AfyaLink Case Management System").setFontSize(16).setBold().setFontColor(ColorConstants.WHITE))
            .add(new Paragraph(report.getTitle()).setFontSize(12).setFontColor(ColorConstants.WHITE))
            .setBackgroundColor(TEAL)
            .setPadding(15)
            .setBorder(Border.NO_BORDER);
        headerTable.addCell(titleCell);
        document.add(headerTable);

        // Metadata table
        Table metaTable = new Table(UnitValue.createPercentArray(new float[]{1, 2})).useAllAvailableWidth();
        metaTable.setMarginBottom(20);
        
        addMetaRow(metaTable, "Period:", report.getPeriodStart() + " to " + report.getPeriodEnd());
        addMetaRow(metaTable, "Generated By:", report.getGeneratedByName() + " (" + report.getGeneratedByRole() + ")");
        addMetaRow(metaTable, "Status:", report.getStatus());
        addMetaRow(metaTable, "Date:", report.getCreatedAt() != null ? report.getCreatedAt().format(DATE_TIME_FORMATTER) : "");
        
        document.add(metaTable);
    }

    private void addMetaRow(Table table, String label, String value) {
        table.addCell(new Cell().add(new Paragraph(label).setBold().setFontSize(10).setFontColor(TEXT_GRAY)).setBorder(Border.NO_BORDER));
        table.addCell(new Cell().add(new Paragraph(value).setFontSize(10).setFontColor(ColorConstants.BLACK)).setBorder(Border.NO_BORDER));
    }

    private void addPdfSectionHeading(Document document, String title) {
        document.add(new Paragraph(title)
                .setFontSize(14)
                .setBold()
                .setFontColor(TEAL)
                .setMarginTop(15)
                .setMarginBottom(10)
                .setBorderBottom(new SolidBorder(ColorConstants.LIGHT_GRAY, 1)));
    }

    private void addPdfStatisticsCards(Document document, ReportDataDto data) {
        SocialWorkerSummaryDto summary = data.getSummary();
        Table cardsTable = new Table(UnitValue.createPercentArray(new float[]{1, 1, 1, 1})).useAllAvailableWidth();
        cardsTable.setMarginBottom(20);

        cardsTable.addCell(createStatCard("Total Beneficiaries", String.valueOf(summary.getTotalBeneficiaries())));
        cardsTable.addCell(createStatCard("Active Cases", String.valueOf(summary.getTotalActiveCases())));
        cardsTable.addCell(createStatCard("Interventions", String.valueOf(summary.getInterventionsCompleted())));
        cardsTable.addCell(createStatCard("Tasks Completed", String.valueOf(summary.getTasksCompleted())));

        document.add(cardsTable);
    }

    private Cell createStatCard(String title, String value) {
        Cell cell = new Cell().setBackgroundColor(LIGHT_GRAY).setPadding(10).setBorder(new SolidBorder(ColorConstants.WHITE, 2));
        cell.add(new Paragraph(title).setFontSize(9).setFontColor(TEXT_GRAY).setTextAlignment(TextAlignment.CENTER));
        cell.add(new Paragraph(value).setFontSize(16).setBold().setFontColor(TEAL).setTextAlignment(TextAlignment.CENTER));
        return cell;
    }

    private void addPdfOrgStatsCards(Document document, OrganizationReportDataDto data) {
        Table cardsTable = new Table(UnitValue.createPercentArray(new float[]{1, 1, 1, 1, 1, 1})).useAllAvailableWidth();
        cardsTable.setMarginBottom(20);

        cardsTable.addCell(createStatCard("Beneficiaries", String.valueOf(data.getTotalBeneficiariesServed())));
        cardsTable.addCell(createStatCard("Total Cases", String.valueOf(data.getTotalCasesManaged())));
        cardsTable.addCell(createStatCard("Success Rate", String.format("%.1f%%", data.getOverallSuccessRate())));
        cardsTable.addCell(createStatCard("Compliance", String.format("%.1f%%", data.getOverallComplianceRate())));
        cardsTable.addCell(createStatCard("Social Workers", String.valueOf(data.getTotalSocialWorkers())));
        cardsTable.addCell(createStatCard("Supervisors", String.valueOf(data.getTotalSupervisors())));

        document.add(cardsTable);
    }

    private void addPdfDistrictPerformanceTable(Document document, OrganizationReportDataDto data) {
        if (data.getDistrictPerformance() == null || data.getDistrictPerformance().isEmpty()) {
            return;
        }

        Table table = new Table(UnitValue.createPercentArray(new float[]{2, 1, 1, 3, 1})).useAllAvailableWidth();
        table.setMarginBottom(20);

        addPdfTableHeader(table, "District", "Cases", "Workers", "Success Rate (%)", "Compliance");

        boolean alternate = false;
        for (OrganizationReportDataDto.DistrictPerformanceDto d : data.getDistrictPerformance()) {
            com.itextpdf.kernel.colors.Color bg = alternate ? LIGHT_GRAY : ColorConstants.WHITE;
            
            table.addCell(new Cell().add(new Paragraph(d.getDistrict() != null ? d.getDistrict() : "")).setBackgroundColor(bg).setFontSize(9));
            table.addCell(new Cell().add(new Paragraph(String.valueOf(d.getCases()))).setBackgroundColor(bg).setFontSize(9));
            table.addCell(new Cell().add(new Paragraph(String.valueOf(d.getSocialWorkersCount()))).setBackgroundColor(bg).setFontSize(9));
            
            Cell progressCell = new Cell().setBackgroundColor(bg);
            int successRate = (int) d.getSuccessRate();
            progressCell.add(createPdfProgressBar(successRate));
            table.addCell(progressCell);
            
            table.addCell(new Cell().add(new Paragraph(String.format("%.1f%%", d.getComplianceRate()))).setBackgroundColor(bg).setFontSize(9));
            
            alternate = !alternate;
        }
        document.add(table);
    }

    private void addPdfBeneficiariesTable(Document document, ReportDataDto data) {
        Table table = new Table(UnitValue.createPercentArray(new float[]{3, 2, 2})).useAllAvailableWidth();
        table.setMarginBottom(20);

        // Header
        addPdfTableHeader(table, "Beneficiary Name", "Case Number", "Progress");

        // Data
        boolean alternate = false;
        for (BeneficiaryProgressDto b : data.getBeneficiaries()) {
            com.itextpdf.kernel.colors.Color bg = alternate ? LIGHT_GRAY : ColorConstants.WHITE;
            
            table.addCell(new Cell().add(new Paragraph(b.getFullName() != null ? b.getFullName() : "")).setBackgroundColor(bg).setFontSize(9));
            table.addCell(new Cell().add(new Paragraph(b.getCaseNumber() != null ? b.getCaseNumber() : "")).setBackgroundColor(bg).setFontSize(9));
            
            // Progress Bar Cell
            Cell progressCell = new Cell().setBackgroundColor(bg);
            int progress = b.getCaseProgressPercent() != null ? b.getCaseProgressPercent() : 0;
            progressCell.add(createPdfProgressBar(progress));
            table.addCell(progressCell);
            
            alternate = !alternate;
        }
        document.add(table);
    }

    private void addPdfCasesTable(Document document, ReportDataDto data) {
        Table table = new Table(UnitValue.createPercentArray(new float[]{2, 3, 1, 1, 2})).useAllAvailableWidth();
        table.setMarginBottom(20);

        // Header
        addPdfTableHeader(table, "Case Number", "Title", "Priority", "Status", "Progress");

        boolean alternate = false;
        for (ReportCaseDto c : data.getCases()) {
            com.itextpdf.kernel.colors.Color bg = alternate ? LIGHT_GRAY : ColorConstants.WHITE;
            
            table.addCell(new Cell().add(new Paragraph(c.getCaseNumber() != null ? c.getCaseNumber() : "")).setBackgroundColor(bg).setFontSize(9));
            table.addCell(new Cell().add(new Paragraph(c.getTitle() != null ? c.getTitle() : "")).setBackgroundColor(bg).setFontSize(9));
            table.addCell(new Cell().add(new Paragraph(c.getPriority() != null ? c.getPriority() : "")).setBackgroundColor(bg).setFontSize(9));
            table.addCell(new Cell().add(new Paragraph(c.getStatus() != null ? c.getStatus() : "")).setBackgroundColor(bg).setFontSize(9));
            
            Cell progressCell = new Cell().setBackgroundColor(bg);
            int progress = c.getProgressPercent() != null ? c.getProgressPercent() : 0;
            progressCell.add(createPdfProgressBar(progress));
            table.addCell(progressCell);
            
            alternate = !alternate;
        }
        document.add(table);
    }

    private Div createPdfProgressBar(int percentage) {
        Div container = new Div().setWidth(UnitValue.createPercentValue(100)).setBackgroundColor(ColorConstants.LIGHT_GRAY).setHeight(10);
        Div fill = new Div().setWidth(UnitValue.createPercentValue(percentage)).setBackgroundColor(TEAL).setHeight(10);
        container.add(fill);
        
        Div outer = new Div();
        outer.add(new Paragraph(percentage + "%").setFontSize(8).setTextAlignment(TextAlignment.RIGHT).setMarginBottom(2));
        outer.add(container);
        return outer;
    }

    private void addPdfTableHeader(Table table, String... headers) {
        for (String header : headers) {
            table.addCell(new Cell()
                    .add(new Paragraph(header).setBold().setFontColor(ColorConstants.WHITE))
                    .setBackgroundColor(TEAL)
                    .setPadding(5));
        }
    }

    private void addPdfPhotoGallery(Document document, ReportDataDto data) {
        Table galleryTable = new Table(UnitValue.createPercentArray(new float[]{1, 1})).useAllAvailableWidth();
        
        for (ReportAttachmentDto att : data.getReportDto().getAttachments()) {
            if (att.getBase64Image() != null && !att.getBase64Image().isEmpty()) {
                try {
                    String base64Data = att.getBase64Image();
                    if (base64Data.contains(",")) {
                        base64Data = base64Data.split(",")[1];
                    }
                    byte[] imageBytes = Base64.getDecoder().decode(base64Data);
                    ImageData imageData = ImageDataFactory.create(imageBytes);
                    Image img = new Image(imageData);
                    img.setAutoScale(true);
                    
                    Cell cell = new Cell().add(img).setBorder(Border.NO_BORDER).setPadding(5);
                    if (att.getCaption() != null) {
                        cell.add(new Paragraph(att.getCaption()).setFontSize(8).setTextAlignment(TextAlignment.CENTER));
                    }
                    galleryTable.addCell(cell);
                } catch (Exception e) {
                    log.error("Failed to decode image for PDF: " + e.getMessage());
                }
            }
        }
        
        // If uneven, add empty cell
        if (data.getReportDto().getAttachments().size() % 2 != 0) {
            galleryTable.addCell(new Cell().setBorder(Border.NO_BORDER));
        }
        
        document.add(galleryTable);
    }

    // PDF Footer Event Handler
    private static class FooterEventHandler implements IEventHandler {
        @Override
        public void handleEvent(Event event) {
            PdfDocumentEvent docEvent = (PdfDocumentEvent) event;
            PdfDocument pdfDoc = docEvent.getDocument();
            PdfPage page = docEvent.getPage();
            PdfCanvas canvas = new PdfCanvas(page.newContentStreamBefore(), page.getResources(), pdfDoc);
            
            float x = pdfDoc.getDefaultPageSize().getWidth() / 2;
            float y = 20;
            
            canvas.beginText()
                    .setFontAndSize(pdfDoc.getDefaultFont(), 8)
                    .setColor(TEXT_GRAY, true)
                    .moveText(x - 60, y)
                    .showText("AfyaLink - Confidential Report | Page " + pdfDoc.getPageNumber(page))
                    .endText();
            canvas.release();
        }
    }


    // ---------------------------------------------------------------------------------------------
    // EXCEL EXPORT
    // ---------------------------------------------------------------------------------------------
    
    private ResponseEntity<byte[]> exportOrganizationPdf(Long reportId, ReportDataDto data, OrganizationReportDataDto orgData) throws java.io.IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(out);
        PdfDocument pdf = new PdfDocument(writer);
        Document document = new Document(pdf, PageSize.A4);
        document.setMargins(40, 40, 60, 40);
        pdf.addEventHandler(PdfDocumentEvent.END_PAGE, new FooterEventHandler());

        ReportDto report = data.getReportDto();

        // Title block with Teal background
        Table headerTable = new Table(UnitValue.createPercentArray(new float[]{1})).useAllAvailableWidth();
        headerTable.setMarginBottom(20);
        
        Cell titleCell = new Cell()
            .add(new Paragraph("AFYALINK CASE MANAGEMENT").setFontSize(16).setBold().setFontColor(ColorConstants.WHITE).setTextAlignment(TextAlignment.CENTER))
            .add(new Paragraph("ANNUAL ORGANIZATION REPORT").setFontSize(14).setBold().setFontColor(ColorConstants.WHITE).setTextAlignment(TextAlignment.CENTER))
            .add(new Paragraph(String.valueOf(report.getPeriodStart().getYear())).setFontSize(14).setFontColor(ColorConstants.WHITE).setTextAlignment(TextAlignment.CENTER))
            .add(new Paragraph("Prepared for: MINALOC & Board of Directors").setFontSize(10).setFontColor(ColorConstants.WHITE).setTextAlignment(TextAlignment.CENTER).setMarginTop(10))
            .setBackgroundColor(TEAL)
            .setPadding(20)
            .setBorder(Border.NO_BORDER);
        headerTable.addCell(titleCell);
        document.add(headerTable);

        // Executive Summary
        if (report.getNarrative() != null && !report.getNarrative().isEmpty()) {
            addPdfSectionHeading(document, "📌 EXECUTIVE SUMMARY");
            Div box = new Div().setBorder(new SolidBorder(ColorConstants.LIGHT_GRAY, 1)).setPadding(10).setMarginBottom(20);
            Paragraph p = new Paragraph(report.getNarrative())
                    .setFontSize(10)
                    .setFontColor(TEXT_GRAY);
            box.add(p);
            document.add(box);
        }

        // KPI Dashboard
        addPdfSectionHeading(document, "📊 ORGANIZATION KPI DASHBOARD - " + report.getPeriodStart().getYear());
        Table kpiTable = new Table(UnitValue.createPercentArray(new float[]{1, 1, 1, 1, 1})).useAllAvailableWidth();
        kpiTable.setMarginBottom(20);

        kpiTable.addCell(createYoyStatCard("Social Workers", String.valueOf(orgData.getTotalSocialWorkers()), orgData.getYoyMetrics().get("social_workers")));
        kpiTable.addCell(createYoyStatCard("Supervisors", String.valueOf(orgData.getTotalSupervisors()), null));
        kpiTable.addCell(createYoyStatCard("Beneficiaries", String.valueOf(orgData.getTotalBeneficiariesServed()), orgData.getYoyMetrics().get("beneficiaries")));
        kpiTable.addCell(createYoyStatCard("Cases Managed", String.valueOf(orgData.getTotalCasesManaged()), orgData.getYoyMetrics().get("cases")));
        kpiTable.addCell(createYoyStatCard("Success Rate", String.format(java.util.Locale.US, "%.0f%%", orgData.getOverallSuccessRate()), orgData.getYoyMetrics().get("success_rate")));
        document.add(kpiTable);

        // District Performance
        addPdfSectionHeading(document, "🗺️ DISTRICT PERFORMANCE COMPARISON - " + report.getPeriodStart().getYear());
        Table distTable = new Table(UnitValue.createPercentArray(new float[]{2, 5, 1})).useAllAvailableWidth();
        distTable.setMarginBottom(20);
        for (OrganizationReportDataDto.DistrictPerformanceDto d : orgData.getDistrictPerformance()) {
            distTable.addCell(new Cell().add(new Paragraph(d.getDistrict() != null ? d.getDistrict() + " District" : "Unknown District").setFontSize(10).setBold()).setBorder(Border.NO_BORDER));
            
            Cell barCell = new Cell().setBorder(Border.NO_BORDER).setVerticalAlignment(VerticalAlignment.MIDDLE);
            Div container = new Div().setWidth(UnitValue.createPercentValue(100)).setBackgroundColor(ColorConstants.LIGHT_GRAY).setHeight(12);
            Div fill = new Div().setWidth(UnitValue.createPercentValue((float)d.getSuccessRate())).setBackgroundColor(TEAL).setHeight(12);
            container.add(fill);
            barCell.add(container);
            barCell.add(new Paragraph(d.getBeneficiaries() + " beneficiaries | " + d.getCases() + " cases | " + Math.round(d.getComplianceRate()) + "% compliance").setFontSize(8).setFontColor(TEXT_GRAY));
            distTable.addCell(barCell);
            
            distTable.addCell(new Cell().add(new Paragraph(Math.round(d.getSuccessRate()) + "% success").setFontSize(9).setBold()).setBorder(Border.NO_BORDER).setTextAlignment(TextAlignment.RIGHT));
        }
        document.add(distTable);

        // Cases Analytics
        addPdfSectionHeading(document, "📈 CASES ANALYTICS - " + report.getPeriodStart().getYear());
        Table caseTable = new Table(UnitValue.createPercentArray(new float[]{1, 1})).useAllAvailableWidth();
        caseTable.setMarginBottom(20);
        
        // Priority cell
        Cell pCell = new Cell().setBorder(new SolidBorder(ColorConstants.LIGHT_GRAY, 1)).setPadding(10);
        pCell.add(new Paragraph("Cases by Priority").setBold().setFontSize(10));
        for (OrganizationReportDataDto.ChartDataPoint pt : orgData.getCasesByPriority()) {
            pCell.add(new Paragraph(pt.getLabel() + ": " + pt.getValue()).setFontSize(9));
        }
        caseTable.addCell(pCell);
        
        // Status cell
        Cell sCell = new Cell().setBorder(new SolidBorder(ColorConstants.LIGHT_GRAY, 1)).setPadding(10);
        sCell.add(new Paragraph("Cases by Status").setBold().setFontSize(10));
        for (OrganizationReportDataDto.ChartDataPoint pt : orgData.getCasesByStatus()) {
            sCell.add(new Paragraph(pt.getLabel() + ": " + pt.getValue()).setFontSize(9));
        }
        caseTable.addCell(sCell);
        document.add(caseTable);

        // Staff Performance Ranking
        if (orgData.getTopPerformers() != null && !orgData.getTopPerformers().isEmpty()) {
            addPdfSectionHeading(document, "👥 STAFF PERFORMANCE RANKING - TOP 5 (" + report.getPeriodStart().getYear() + ")");
            Table staffTable = new Table(UnitValue.createPercentArray(new float[]{1, 3, 2, 1, 1, 2})).useAllAvailableWidth();
            staffTable.setMarginBottom(20);
            addPdfTableHeader(staffTable, "Rank", "Worker", "District", "Cases", "Success", "Recognition");
            int rank = 1;
            for (OrganizationReportDataDto.StaffPerformanceDto sp : orgData.getTopPerformers()) {
                String rankStr = rank == 1 ? "1" : (rank == 2 ? "2" : (rank == 3 ? "3" : String.valueOf(rank)));
                staffTable.addCell(new Cell().add(new Paragraph(rankStr).setFontSize(9)).setBackgroundColor(ColorConstants.WHITE));
                staffTable.addCell(new Cell().add(new Paragraph(sp.getName()).setFontSize(9)).setBackgroundColor(ColorConstants.WHITE));
                staffTable.addCell(new Cell().add(new Paragraph(sp.getDistrict()).setFontSize(9)).setBackgroundColor(ColorConstants.WHITE));
                staffTable.addCell(new Cell().add(new Paragraph(String.valueOf(sp.getCasesManaged())).setFontSize(9)).setBackgroundColor(ColorConstants.WHITE));
                staffTable.addCell(new Cell().add(new Paragraph(Math.round(sp.getSuccessRate()) + "%").setFontSize(9)).setBackgroundColor(ColorConstants.WHITE));
                staffTable.addCell(new Cell().add(new Paragraph(sp.getRecognition()).setFontSize(9)).setBackgroundColor(ColorConstants.WHITE));
                rank++;
            }
            document.add(staffTable);
        }

        // Compliance Report
        if (orgData.getComplianceStats() != null && !orgData.getComplianceStats().isEmpty()) {
            addPdfSectionHeading(document, "✅ COMPLIANCE & SUBMISSION REPORT - " + report.getPeriodStart().getYear());
            Div compBox = new Div().setBorder(new SolidBorder(ColorConstants.LIGHT_GRAY, 1)).setPadding(10).setMarginBottom(20);
            compBox.add(new Paragraph("Monthly Report Submission Compliance:").setFontSize(10).setBold().setMarginBottom(5));
            for (OrganizationReportDataDto.ComplianceStatsDto c : orgData.getComplianceStats()) {
                Paragraph cp = new Paragraph().setFontSize(9).setMarginBottom(2);
                cp.add(new com.itextpdf.layout.element.Text(c.getMonth() + ": ").setBold());
                int p = (int) Math.round(c.getRate());
                cp.add(new com.itextpdf.layout.element.Text(p + "% (" + c.getSubmitted() + "/" + c.getTotal() + ")"));
                if (p < 90) cp.add(new com.itextpdf.layout.element.Text(" [WARNING]").setFontColor(ColorConstants.RED));
                compBox.add(cp);
            }
            compBox.add(new Paragraph("Yearly Average Compliance: " + Math.round(orgData.getOverallComplianceRate()) + "%").setFontSize(10).setBold().setMarginTop(10));
            document.add(compBox);
        }

        // Success Stories
        if (orgData.getSuccessStories() != null && !orgData.getSuccessStories().isEmpty()) {
            document.add(new AreaBreak());
            addPdfSectionHeading(document, "📸 SUCCESS STORIES - " + report.getPeriodStart().getYear() + " HIGHLIGHTS");
            int scount = 1;
            for (OrganizationReportDataDto.SuccessStoryDto ss : orgData.getSuccessStories()) {
                Div sbox = new Div().setBorder(new SolidBorder(ColorConstants.LIGHT_GRAY, 1)).setPadding(10).setMarginBottom(15);
                sbox.add(new Paragraph("⭐ CASE #" + scount + ": " + ss.getTitle()).setFontSize(11).setBold().setFontColor(TEAL));
                sbox.add(new Paragraph(ss.getDescription()).setFontSize(10).setMarginBottom(5));
                sbox.add(new Paragraph("Impact: " + ss.getImpact()).setFontSize(10).setBold().setMarginTop(5));
                document.add(sbox);
                scount++;
            }
        }

        // Year over Year
        if (orgData.getYoyMetrics() != null && !orgData.getYoyMetrics().isEmpty()) {
            addPdfSectionHeading(document, "📊 YEAR-OVER-YEAR COMPARISON (" + (report.getPeriodStart().getYear() - 1) + " vs " + report.getPeriodStart().getYear() + ")");
            Table yoyTable = new Table(UnitValue.createPercentArray(new float[]{2, 1, 1, 1})).useAllAvailableWidth();
            yoyTable.setMarginBottom(20);
            addPdfTableHeader(yoyTable, "Metric", String.valueOf(report.getPeriodStart().getYear() - 1), String.valueOf(report.getPeriodStart().getYear()), "Change");
            
            addYoyRow(yoyTable, "Beneficiaries Served", orgData.getYoyMetrics().get("beneficiaries"));
            addYoyRow(yoyTable, "Cases Managed", orgData.getYoyMetrics().get("cases"));
            addYoyRow(yoyTable, "Interventions Completed", orgData.getYoyMetrics().get("interventions"));
            addYoyRow(yoyTable, "Success Rate", orgData.getYoyMetrics().get("success_rate"));
            addYoyRow(yoyTable, "Social Workers", orgData.getYoyMetrics().get("social_workers"));
            document.add(yoyTable);
        }
        
        // Targets
        addPdfSectionHeading(document, "🎯 " + (report.getPeriodStart().getYear() + 1) + " RECOMMENDATIONS & TARGETS");
        Div recBox = new Div().setBorder(new SolidBorder(ColorConstants.LIGHT_GRAY, 1)).setPadding(10).setMarginBottom(20);
        recBox.add(new Paragraph("1. Maintain " + Math.min(100, Math.round(orgData.getOverallComplianceRate()) + 5) + "%+ report compliance across all districts.").setFontSize(10));
        recBox.add(new Paragraph("2. Expand intervention coverage to support an additional 20% beneficiaries.").setFontSize(10));
        if (orgData.getDistrictPerformance() != null && orgData.getDistrictPerformance().size() > 0) {
            String lowestDist = orgData.getDistrictPerformance().get(orgData.getDistrictPerformance().size() - 1).getDistrict();
            double lowestRate = orgData.getDistrictPerformance().get(orgData.getDistrictPerformance().size() - 1).getSuccessRate();
            recBox.add(new Paragraph("3. Improve " + lowestDist + " district success rate from " + Math.round(lowestRate) + "% to at least " + Math.min(100, Math.round(lowestRate + 10)) + "% via targeted staff training.").setFontSize(10));
        }
        recBox.add(new Paragraph("4. Increase overall success rate to " + Math.min(100, Math.round(orgData.getOverallSuccessRate()) + 5) + "%.").setFontSize(10));
        document.add(recBox);

        document.close();

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"annual_report_" + report.getPeriodStart().getYear() + ".pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(out.toByteArray());
    }

    private Cell createYoyStatCard(String title, String value, OrganizationReportDataDto.YoYMetric yoy) {
        Cell cell = new Cell().setBackgroundColor(LIGHT_GRAY).setPadding(5).setBorder(new SolidBorder(ColorConstants.WHITE, 2));
        cell.add(new Paragraph(title).setFontSize(8).setFontColor(TEXT_GRAY).setTextAlignment(TextAlignment.CENTER));
        cell.add(new Paragraph(value).setFontSize(14).setBold().setFontColor(TEAL).setTextAlignment(TextAlignment.CENTER));
        if (yoy != null) {
            String arr = yoy.getPercentageChange() > 0 ? "↑" : (yoy.getPercentageChange() < 0 ? "↓" : "→");
            DeviceRgb col = yoy.getPercentageChange() >= 0 ? new DeviceRgb(22, 163, 74) : new DeviceRgb(220, 38, 38);
            cell.add(new Paragraph(arr + " " + Math.round(Math.abs(yoy.getPercentageChange())) + "%").setFontSize(8).setFontColor(col).setTextAlignment(TextAlignment.CENTER));
        } else {
            cell.add(new Paragraph("→").setFontSize(8).setFontColor(TEXT_GRAY).setTextAlignment(TextAlignment.CENTER));
        }
        return cell;
    }

    private void addYoyRow(Table table, String metric, OrganizationReportDataDto.YoYMetric yoy) {
        table.addCell(new Cell().add(new Paragraph(metric).setFontSize(9)).setBackgroundColor(ColorConstants.WHITE));
        table.addCell(new Cell().add(new Paragraph(yoy != null ? String.valueOf(Math.round(yoy.getPreviousYearValue())) : "0").setFontSize(9)).setBackgroundColor(ColorConstants.WHITE));
        table.addCell(new Cell().add(new Paragraph(yoy != null ? String.valueOf(Math.round(yoy.getCurrentYearValue())) : "0").setFontSize(9)).setBackgroundColor(ColorConstants.WHITE));
        
        String changeStr = "0%";
        DeviceRgb col = TEXT_GRAY;
        if (yoy != null) {
            String arr = yoy.getPercentageChange() > 0 ? "↑" : (yoy.getPercentageChange() < 0 ? "↓" : "→");
            col = yoy.getPercentageChange() >= 0 ? new DeviceRgb(22, 163, 74) : new DeviceRgb(220, 38, 38);
            changeStr = arr + " " + Math.round(Math.abs(yoy.getPercentageChange())) + "%";
        }
        table.addCell(new Cell().add(new Paragraph(changeStr).setFontSize(9).setFontColor(col)).setBackgroundColor(ColorConstants.WHITE));
    }

    public ResponseEntity<byte[]> exportToExcel(Long reportId) throws java.io.IOException {
        return exportToExcel(reportId, null);
    }

    public ResponseEntity<byte[]> exportToExcel(Long reportId, Long exportedByUserId) throws java.io.IOException {
        ReportDataDto data = reportDataService.buildReportData(reportId);
        if (data == null || data.getReportDto() == null) {
            throw new ResourceNotFoundException("Report data not found");
        }

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            
            createExecutiveSummarySheet(workbook, data);

            if (isPeriodBasedWorkerReport(data.getReportDto().getReportType()) && data.getChartData() != null) {
                createChartsSheet(workbook, data);
            }
            
            if (data.getBeneficiaries() != null && !data.getBeneficiaries().isEmpty()) {
                createBeneficiariesSheet(workbook, data);
            }
            
            if (data.getCases() != null && !data.getCases().isEmpty() && !"ORGANIZATION".equals(data.getReportDto().getReportType())) {
                createCasesSheet(workbook, data);
            }

            if (data.getInterventions() != null && !data.getInterventions().isEmpty()
                    && isPeriodBasedWorkerReport(data.getReportDto().getReportType())) {
                createInterventionsSheet(workbook, data);
            }

            if (data.getReportDto().getAttachments() != null && !data.getReportDto().getAttachments().isEmpty()) {
                createAttachmentsSheet(workbook, data);
            }
            
            if ("ORGANIZATION".equals(data.getReportDto().getReportType())) {
                OrganizationReportDataDto orgData = data.getOrganizationData() != null
                        ? data.getOrganizationData()
                        : organizationReportService.buildOrganizationReportData(
                                data.getReportDto().getPeriodStart(), data.getReportDto().getPeriodEnd());
                createOrganizationSheet(workbook, orgData);
                createOrgRecoverySheet(workbook, orgData);
            }

            workbook.write(out);
            if (exportedByUserId != null) {
                auditLogService.log(exportedByUserId, "EXPORT", "Report",
                        String.valueOf(reportId), null, "EXCEL|" + data.getReportDto().getReportType());
            }
            String filename = buildExportFilename(data.getReportDto(), reportId, "xlsx");
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .body(out.toByteArray());
        }
    }

    private void createExecutiveSummarySheet(Workbook workbook, ReportDataDto data) {
        Sheet sheet = workbook.createSheet("Executive Summary");
        ReportDto report = data.getReportDto();
        SocialWorkerSummaryDto summary = data.getSummary();

        // Styles
        CellStyle titleStyle = workbook.createCellStyle();
        Font titleFont = workbook.createFont();
        titleFont.setBold(true);
        titleFont.setFontHeightInPoints((short) 16);
        titleStyle.setFont(titleFont);
        
        CellStyle headerStyle = workbook.createCellStyle();
        headerStyle.setFillForegroundColor(IndexedColors.TEAL.getIndex());
        headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        Font headerFont = workbook.createFont();
        headerFont.setBold(true);
        headerFont.setColor(IndexedColors.WHITE.getIndex());
        headerStyle.setFont(headerFont);

        int rowNum = 0;
        
        // Title
        Row titleRow = sheet.createRow(rowNum++);
        titleRow.createCell(0).setCellValue("AfyaLink Report: " + report.getTitle());
        titleRow.getCell(0).setCellStyle(titleStyle);
        sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 3));
        rowNum++; // Empty row

        // Meta Data
        sheet.createRow(rowNum++).createCell(0).setCellValue("Period: " + report.getPeriodStart() + " to " + report.getPeriodEnd());
        sheet.createRow(rowNum++).createCell(0).setCellValue("Generated By: " + report.getGeneratedByName());
        rowNum++;

        // Executive Summary
        if (report.getNarrative() != null) {
            sheet.createRow(rowNum++).createCell(0).setCellValue("Executive Summary");
            Row descRow = sheet.createRow(rowNum++);
            descRow.createCell(0).setCellValue(report.getNarrative());
            sheet.addMergedRegion(new CellRangeAddress(descRow.getRowNum(), descRow.getRowNum(), 0, 5));
            descRow.setHeightInPoints(40);
            rowNum++;
        }

        // Stats Cards (Rendered as a small grid)
        if (summary != null) {
            Row statHeader = sheet.createRow(rowNum++);
            statHeader.createCell(0).setCellValue("Metric");
            statHeader.getCell(0).setCellStyle(headerStyle);
            statHeader.createCell(1).setCellValue("Value");
            statHeader.getCell(1).setCellStyle(headerStyle);

            addExcelStatRow(sheet, rowNum++, "Total Beneficiaries", summary.getTotalBeneficiaries());
            addExcelStatRow(sheet, rowNum++, "Active Cases", summary.getTotalActiveCases());
            addExcelStatRow(sheet, rowNum++, "Interventions Completed", summary.getInterventionsCompleted());
            addExcelStatRow(sheet, rowNum++, "Tasks Completed", summary.getTasksCompleted());
            addExcelStatRow(sheet, rowNum++, "Average Case Progress", summary.getAvgCaseProgress() != null ? summary.getAvgCaseProgress() + "%" : "0%");
        }

        sheet.autoSizeColumn(0);
        sheet.autoSizeColumn(1);
    }

    private void addExcelStatRow(Sheet sheet, int rowNum, String label, Object value) {
        Row row = sheet.createRow(rowNum);
        row.createCell(0).setCellValue(label);
        if (value instanceof Number) {
            row.createCell(1).setCellValue(((Number) value).doubleValue());
        } else {
            row.createCell(1).setCellValue(String.valueOf(value));
        }
    }

    private void createBeneficiariesSheet(Workbook workbook, ReportDataDto data) {
        Sheet sheet = workbook.createSheet("Beneficiaries");
        
        CellStyle headerStyle = createExcelHeaderStyle(workbook);
        
        Row headerRow = sheet.createRow(0);
        String[] headers = {"Beneficiary Name", "Case Number", "Progress (%)"};
        for (int i = 0; i < headers.length; i++) {
            org.apache.poi.ss.usermodel.Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
        }

        int rowNum = 1;
        for (BeneficiaryProgressDto b : data.getBeneficiaries()) {
            Row row = sheet.createRow(rowNum++);
            row.createCell(0).setCellValue(b.getFullName() != null ? b.getFullName() : "");
            row.createCell(1).setCellValue(b.getCaseNumber() != null ? b.getCaseNumber() : "");
            row.createCell(2).setCellValue(b.getCaseProgressPercent() != null ? b.getCaseProgressPercent() : 0);
        }

        sheet.createFreezePane(0, 1);
        sheet.setAutoFilter(new CellRangeAddress(0, rowNum - 1, 0, headers.length - 1));
        
        for (int i = 0; i < headers.length; i++) {
            sheet.autoSizeColumn(i);
        }
    }

    private void createCasesSheet(Workbook workbook, ReportDataDto data) {
        Sheet sheet = workbook.createSheet("Cases");
        
        CellStyle headerStyle = createExcelHeaderStyle(workbook);
        
        Row headerRow = sheet.createRow(0);
        String[] headers = {"Case Number", "Title", "Priority", "Status", "Progress (%)"};
        for (int i = 0; i < headers.length; i++) {
            org.apache.poi.ss.usermodel.Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
        }

        int rowNum = 1;
        for (ReportCaseDto c : data.getCases()) {
            Row row = sheet.createRow(rowNum++);
            row.createCell(0).setCellValue(c.getCaseNumber() != null ? c.getCaseNumber() : "");
            row.createCell(1).setCellValue(c.getTitle() != null ? c.getTitle() : "");
            row.createCell(2).setCellValue(c.getPriority() != null ? c.getPriority() : "");
            row.createCell(3).setCellValue(c.getStatus() != null ? c.getStatus() : "");
            row.createCell(4).setCellValue(c.getProgressPercent() != null ? c.getProgressPercent() : 0);
        }

        sheet.createFreezePane(0, 1);
        sheet.setAutoFilter(new CellRangeAddress(0, rowNum - 1, 0, headers.length - 1));
        
        for (int i = 0; i < headers.length; i++) {
            sheet.autoSizeColumn(i);
        }
    }

    private void createOrganizationSheet(Workbook workbook, OrganizationReportDataDto data) {
        Sheet sheet = workbook.createSheet("Organization Dashboard");
        
        CellStyle headerStyle = createExcelHeaderStyle(workbook);
        
        int rowNum = 0;
        
        // Stats
        Row statsHeader = sheet.createRow(rowNum++);
        statsHeader.createCell(0).setCellValue("Organization KPIs");
        statsHeader.getCell(0).setCellStyle(headerStyle);
        sheet.addMergedRegion(new CellRangeAddress(rowNum - 1, rowNum - 1, 0, 1));
        
        addExcelStatRow(sheet, rowNum++, "Total Beneficiaries", data.getTotalBeneficiariesServed());
        addExcelStatRow(sheet, rowNum++, "Total Cases", data.getTotalCasesManaged());
        addExcelStatRow(sheet, rowNum++, "Overall Success Rate", String.format("%.1f%%", data.getOverallSuccessRate()));
        addExcelStatRow(sheet, rowNum++, "Compliance Rate", String.format("%.1f%%", data.getOverallComplianceRate()));
        addExcelStatRow(sheet, rowNum++, "Total Social Workers", data.getTotalSocialWorkers());
        addExcelStatRow(sheet, rowNum++, "Total Supervisors", data.getTotalSupervisors());
        
        rowNum++;
        
        if (data.getDistrictPerformance() != null && !data.getDistrictPerformance().isEmpty()) {
            Row distHeaderRow = sheet.createRow(rowNum++);
            String[] distHeaders = {"District", "Cases", "Active", "Closed", "Workers", "Success (%)", "Compliance (%)"};
            for (int i = 0; i < distHeaders.length; i++) {
                org.apache.poi.ss.usermodel.Cell cell = distHeaderRow.createCell(i);
                cell.setCellValue(distHeaders[i]);
                cell.setCellStyle(headerStyle);
            }
            
            for (OrganizationReportDataDto.DistrictPerformanceDto d : data.getDistrictPerformance()) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(d.getDistrict() != null ? d.getDistrict() : "");
                row.createCell(1).setCellValue(d.getCases());
                row.createCell(2).setCellValue(d.getActiveCases());
                row.createCell(3).setCellValue(d.getClosedCases());
                row.createCell(4).setCellValue(d.getSocialWorkersCount());
                row.createCell(5).setCellValue(d.getSuccessRate());
                row.createCell(6).setCellValue(d.getComplianceRate());
            }
        }
        
        sheet.autoSizeColumn(0);
        sheet.autoSizeColumn(1);
        sheet.autoSizeColumn(2);
        sheet.autoSizeColumn(3);
        sheet.autoSizeColumn(4);
        sheet.autoSizeColumn(5);
        sheet.autoSizeColumn(6);
    }

    private CellStyle createExcelHeaderStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        style.setFillForegroundColor(IndexedColors.TEAL.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        Font font = workbook.createFont();
        font.setBold(true);
        font.setColor(IndexedColors.WHITE.getIndex());
        style.setFont(font);
        return style;
    }


    // ---------------------------------------------------------------------------------------------
    // WORD EXPORT
    // ---------------------------------------------------------------------------------------------
    public ResponseEntity<byte[]> exportToWord(Long reportId) throws java.io.IOException {
        return exportToWord(reportId, null);
    }

    public ResponseEntity<byte[]> exportToWord(Long reportId, Long exportedByUserId) throws java.io.IOException {
        ReportDataDto data = reportDataService.buildReportData(reportId);
        if (data == null || data.getReportDto() == null) {
            throw new ResourceNotFoundException("Report data not found");
        }

        try (XWPFDocument doc = new XWPFDocument(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            
            // Cover Page
            XWPFParagraph titlePara = doc.createParagraph();
            titlePara.setAlignment(ParagraphAlignment.CENTER);
            titlePara.setSpacingAfter(400);
            titlePara.setSpacingBefore(1000);
            XWPFRun titleRun = titlePara.createRun();
            titleRun.setText("AfyaLink Case Management System");
            titleRun.setBold(true);
            titleRun.setFontSize(24);
            titleRun.setColor("0D9488"); // Teal
            
            XWPFParagraph subTitlePara = doc.createParagraph();
            subTitlePara.setAlignment(ParagraphAlignment.CENTER);
            XWPFRun subTitleRun = subTitlePara.createRun();
            subTitleRun.setText("Report: " + data.getReportDto().getTitle());
            subTitleRun.setFontSize(16);
            
            XWPFParagraph metaPara = doc.createParagraph();
            metaPara.setAlignment(ParagraphAlignment.CENTER);
            metaPara.setSpacingBefore(400);
            XWPFRun metaRun = metaPara.createRun();
            metaRun.setText("Period: " + data.getReportDto().getPeriodStart() + " to " + data.getReportDto().getPeriodEnd());
            metaRun.addBreak();
            metaRun.setText("Generated By: " + data.getReportDto().getGeneratedByName());
            
            // Page Break
            metaPara.setPageBreak(true);

            // Executive Summary
            if (data.getReportDto().getNarrative() != null) {
                addWordHeading(doc, "Executive Summary");
                XWPFParagraph execPara = doc.createParagraph();
                execPara.createRun().setText(data.getReportDto().getNarrative());
            }

            // Statistics Table
            if (data.getSummary() != null) {
                addWordHeading(doc, "Performance Metrics");
                XWPFTable table = doc.createTable(5, 2);
                table.setWidth("100%");
                
                styleWordCell(table.getRow(0).getCell(0), "Metric", true, "FFFFFF", "0D9488");
                styleWordCell(table.getRow(0).getCell(1), "Value", true, "FFFFFF", "0D9488");
                
                styleWordCell(table.getRow(1).getCell(0), "Total Beneficiaries", false, null, null);
                styleWordCell(table.getRow(1).getCell(1), String.valueOf(data.getSummary().getTotalBeneficiaries()), false, null, null);
                
                styleWordCell(table.getRow(2).getCell(0), "Active Cases", false, null, null);
                styleWordCell(table.getRow(2).getCell(1), String.valueOf(data.getSummary().getTotalActiveCases()), false, null, null);
                
                styleWordCell(table.getRow(3).getCell(0), "Interventions", false, null, null);
                styleWordCell(table.getRow(3).getCell(1), String.valueOf(data.getSummary().getInterventionsCompleted()), false, null, null);
                
                styleWordCell(table.getRow(4).getCell(0), "Tasks Completed", false, null, null);
                styleWordCell(table.getRow(4).getCell(1), String.valueOf(data.getSummary().getTasksCompleted()), false, null, null);
            }

            // Cases Table
            if (data.getCases() != null && !data.getCases().isEmpty() && !"ORGANIZATION".equals(data.getReportDto().getReportType())) {
                addWordHeading(doc, "Cases Overview");
                XWPFTable table = doc.createTable(data.getCases().size() + 1, 4);
                table.setWidth("100%");
                
                styleWordCell(table.getRow(0).getCell(0), "Case Number", true, "FFFFFF", "0D9488");
                styleWordCell(table.getRow(0).getCell(1), "Title", true, "FFFFFF", "0D9488");
                styleWordCell(table.getRow(0).getCell(2), "Status", true, "FFFFFF", "0D9488");
                styleWordCell(table.getRow(0).getCell(3), "Progress", true, "FFFFFF", "0D9488");
                
                int r = 1;
                for (ReportCaseDto c : data.getCases()) {
                    styleWordCell(table.getRow(r).getCell(0), c.getCaseNumber(), false, null, null);
                    styleWordCell(table.getRow(r).getCell(1), c.getTitle(), false, null, null);
                    styleWordCell(table.getRow(r).getCell(2), c.getStatus(), false, null, null);
                    styleWordCell(table.getRow(r).getCell(3), c.getProgressPercent() + "%", false, null, null);
                    r++;
                }
            }

            // Organization Dashboard
            if ("ORGANIZATION".equals(data.getReportDto().getReportType())) {
                OrganizationReportDataDto orgData = organizationReportService.buildOrganizationReportData(
                    data.getReportDto().getPeriodStart(), 
                    data.getReportDto().getPeriodEnd()
                );
                
                addWordHeading(doc, "Organization KPI Dashboard");
                XWPFTable orgTable = doc.createTable(4, 2);
                orgTable.setWidth("100%");
                styleWordCell(orgTable.getRow(0).getCell(0), "Metric", true, "FFFFFF", "0D9488");
                styleWordCell(orgTable.getRow(0).getCell(1), "Value", true, "FFFFFF", "0D9488");
                styleWordCell(orgTable.getRow(1).getCell(0), "Beneficiaries Served", false, null, null);
                styleWordCell(orgTable.getRow(1).getCell(1), String.valueOf(orgData.getTotalBeneficiariesServed()), false, null, null);
                styleWordCell(orgTable.getRow(2).getCell(0), "Total Cases Managed", false, null, null);
                styleWordCell(orgTable.getRow(2).getCell(1), String.valueOf(orgData.getTotalCasesManaged()), false, null, null);
                styleWordCell(orgTable.getRow(3).getCell(0), "Success Rate", false, null, null);
                styleWordCell(orgTable.getRow(3).getCell(1), String.format("%.1f%%", orgData.getOverallSuccessRate()), false, null, null);

                if (orgData.getDistrictPerformance() != null && !orgData.getDistrictPerformance().isEmpty()) {
                    addWordHeading(doc, "District Performance");
                    XWPFTable distTable = doc.createTable(orgData.getDistrictPerformance().size() + 1, 5);
                    distTable.setWidth("100%");
                    styleWordCell(distTable.getRow(0).getCell(0), "District", true, "FFFFFF", "0D9488");
                    styleWordCell(distTable.getRow(0).getCell(1), "Cases", true, "FFFFFF", "0D9488");
                    styleWordCell(distTable.getRow(0).getCell(2), "Workers", true, "FFFFFF", "0D9488");
                    styleWordCell(distTable.getRow(0).getCell(3), "Success", true, "FFFFFF", "0D9488");
                    styleWordCell(distTable.getRow(0).getCell(4), "Compliance", true, "FFFFFF", "0D9488");
                    
                    int r = 1;
                    for (OrganizationReportDataDto.DistrictPerformanceDto d : orgData.getDistrictPerformance()) {
                        styleWordCell(distTable.getRow(r).getCell(0), d.getDistrict() != null ? d.getDistrict() : "", false, null, null);
                        styleWordCell(distTable.getRow(r).getCell(1), String.valueOf(d.getCases()), false, null, null);
                        styleWordCell(distTable.getRow(r).getCell(2), String.valueOf(d.getSocialWorkersCount()), false, null, null);
                        styleWordCell(distTable.getRow(r).getCell(3), String.format("%.1f%%", d.getSuccessRate()), false, null, null);
                        styleWordCell(distTable.getRow(r).getCell(4), String.format("%.1f%%", d.getComplianceRate()), false, null, null);
                        r++;
                    }
                }
            }

            if (isPeriodBasedWorkerReport(data.getReportDto().getReportType())) {
                addWordChartsSection(doc, data);
            }

            addWordAttachmentsSection(doc, data);

            doc.write(out);
            if (exportedByUserId != null) {
                auditLogService.log(exportedByUserId, "EXPORT", "Report",
                        String.valueOf(reportId), null, "WORD|" + data.getReportDto().getReportType());
            }
            String filename = buildExportFilename(data.getReportDto(), reportId, "docx");
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.wordprocessingml.document"))
                    .body(out.toByteArray());
        }
    }

    private void createOrgRecoverySheet(Workbook workbook, OrganizationReportDataDto org) {
        Sheet sheet = workbook.createSheet("Recovery Progress");
        int rowNum = 0;
        Row h = sheet.createRow(rowNum++);
        h.createCell(0).setCellValue("Progress Band");
        h.createCell(1).setCellValue("Cases");
        if (org.getBeneficiaryRecoveryBands() != null) {
            for (OrganizationReportDataDto.ChartDataPoint b : org.getBeneficiaryRecoveryBands()) {
                Row r = sheet.createRow(rowNum++);
                r.createCell(0).setCellValue(b.getLabel());
                r.createCell(1).setCellValue(b.getValue() != null ? b.getValue().doubleValue() : 0);
            }
        }
        rowNum++;
        sheet.createRow(rowNum++).createCell(0).setCellValue("Average progress %");
        sheet.getRow(rowNum - 1).createCell(1).setCellValue(org.getAverageBeneficiaryProgress());
        sheet.autoSizeColumn(0);
        sheet.autoSizeColumn(1);
    }

    private boolean isPeriodBasedWorkerReport(String reportType) {
        if (reportType == null) return false;
        return switch (reportType.toUpperCase()) {
            case "DAILY", "WEEKLY", "MONTHLY", "YEARLY" -> true;
            default -> false;
        };
    }

    private String buildExportFilename(ReportDto report, Long reportId, String ext) {
        String type = report.getReportType() != null ? report.getReportType().toLowerCase() : "report";
        String period = report.getPeriodStart() != null ? report.getPeriodStart().toString() : String.valueOf(reportId);
        return String.format("AfyaLink_%s_%s_%d.%s", type, period, reportId, ext);
    }

    private void createChartsSheet(Workbook workbook, ReportDataDto data) throws java.io.IOException {
        ChartDataDto charts = data.getChartData();
        if (charts == null) return;
        Sheet sheet = workbook.createSheet("Charts & Analytics");
        CreationHelper helper = workbook.getCreationHelper();
        Drawing<?> drawing = sheet.createDrawingPatriarch();
        int row = 0;

        sheet.createRow(row++).createCell(0).setCellValue("AfyaLink — " + data.getReportDto().getReportType() + " analytics");

        if (charts.getDailyActivity() != null && !charts.getDailyActivity().isEmpty()) {
            byte[] png = chartImageGenerator.createLineChart(charts.getDailyActivity(), "Activity Trend", 640, 280);
            row = embedChartInSheet(sheet, drawing, helper, workbook, png, row, "Daily / period activity");
        }
        if (charts.getInterventionTypeDistribution() != null && !charts.getInterventionTypeDistribution().isEmpty()) {
            byte[] png = chartImageGenerator.createPieChart(charts.getInterventionTypeDistribution(), "Interventions by Type", 400, 300);
            row = embedChartInSheet(sheet, drawing, helper, workbook, png, row, "Intervention types");
        }
        if (charts.getCaseProgressDistribution() != null && !charts.getCaseProgressDistribution().isEmpty()) {
            byte[] png = chartImageGenerator.createBarChart(charts.getCaseProgressDistribution(), "Case Progress", 400, 300);
            row = embedChartInSheet(sheet, drawing, helper, workbook, png, row, "Case progress distribution");
        }
        sheet.setColumnWidth(0, 80 * 256);
    }

    private int embedChartInSheet(Sheet sheet, Drawing<?> drawing, CreationHelper helper, Workbook workbook,
                                  byte[] png, int startRow, String label) {
        Row labelRow = sheet.createRow(startRow++);
        labelRow.createCell(0).setCellValue(label);
        int pictureIdx = workbook.addPicture(png, Workbook.PICTURE_TYPE_PNG);
        ClientAnchor anchor = helper.createClientAnchor();
        anchor.setCol1(0);
        anchor.setRow1(startRow);
        anchor.setCol2(10);
        anchor.setRow2(startRow + 18);
        drawing.createPicture(anchor, pictureIdx);
        return startRow + 20;
    }

    private void createInterventionsSheet(Workbook workbook, ReportDataDto data) {
        Sheet sheet = workbook.createSheet("Interventions");
        CellStyle headerStyle = createExcelHeaderStyle(workbook);
        Row headerRow = sheet.createRow(0);
        String[] headers = {"Code", "Title", "Type", "Status", "Beneficiary"};
        for (int i = 0; i < headers.length; i++) {
            org.apache.poi.ss.usermodel.Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
        }
        int rowNum = 1;
        for (ReportInterventionDto i : data.getInterventions()) {
            Row row = sheet.createRow(rowNum++);
            row.createCell(0).setCellValue(i.getInterventionCode() != null ? i.getInterventionCode() : "");
            row.createCell(1).setCellValue(i.getTitle() != null ? i.getTitle() : "");
            row.createCell(2).setCellValue(i.getType() != null ? i.getType() : "");
            row.createCell(3).setCellValue(i.getStatus() != null ? i.getStatus() : "");
            row.createCell(4).setCellValue(i.getBeneficiaryName() != null ? i.getBeneficiaryName() : "");
        }
        sheet.createFreezePane(0, 1);
        for (int i = 0; i < headers.length; i++) sheet.autoSizeColumn(i);
    }

    private void createAttachmentsSheet(Workbook workbook, ReportDataDto data) {
        Sheet sheet = workbook.createSheet("Attachments");
        CellStyle headerStyle = createExcelHeaderStyle(workbook);
        Row headerRow = sheet.createRow(0);
        String[] headers = {"Category", "File Name", "Description / Caption", "Type"};
        for (int i = 0; i < headers.length; i++) {
            org.apache.poi.ss.usermodel.Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
        }
        int rowNum = 1;
        for (ReportAttachmentDto att : data.getReportDto().getAttachments()) {
            Row row = sheet.createRow(rowNum++);
            row.createCell(0).setCellValue(att.getCategory() != null ? att.getCategory() : "");
            row.createCell(1).setCellValue(att.getDocumentName() != null ? att.getDocumentName() : "");
            row.createCell(2).setCellValue(att.getCaption() != null ? att.getCaption() : "");
            boolean image = isPhotoAttachment(att);
            row.createCell(3).setCellValue(image ? "Image (embedded in PDF/Word)" : "Document");
        }
        for (int i = 0; i < headers.length; i++) sheet.autoSizeColumn(i);
    }

    private void addWordChartsSection(XWPFDocument doc, ReportDataDto data) {
        ChartDataDto charts = data.getChartData();
        if (charts == null) return;
        addWordHeading(doc, "Analytics & Charts");
        try {
            if (charts.getDailyActivity() != null && !charts.getDailyActivity().isEmpty()) {
                byte[] png = chartImageGenerator.createLineChart(charts.getDailyActivity(), "Activity Trend", 520, 240);
                embedWordImage(doc, png, "image-chart-line.png", "Activity over reporting period");
            }
            if (charts.getInterventionTypeDistribution() != null && !charts.getInterventionTypeDistribution().isEmpty()) {
                byte[] png = chartImageGenerator.createPieChart(charts.getInterventionTypeDistribution(), "Interventions", 400, 280);
                embedWordImage(doc, png, "image-chart-pie.png", "Intervention type distribution");
            }
        } catch (Exception e) {
            log.warn("Word chart embed failed: {}", e.getMessage());
        }
    }

    private void addWordAttachmentsSection(XWPFDocument doc, ReportDataDto data) {
        if (data.getReportDto().getAttachments() == null || data.getReportDto().getAttachments().isEmpty()) return;

        addWordHeading(doc, "Field Photos & Attachments");
        for (ReportAttachmentDto att : data.getReportDto().getAttachments()) {
            if (isPhotoAttachment(att)) {
                try {
                    byte[] imageBytes = reportDocumentLoader.loadDocumentBytes(att.getDocumentId());
                    embedWordImage(doc, imageBytes, att.getDocumentName(), att.getCaption());
                    if (att.getCategory() != null) {
                        XWPFParagraph cat = doc.createParagraph();
                        cat.setAlignment(ParagraphAlignment.CENTER);
                        cat.createRun().setText("[" + att.getCategory() + "]");
                        cat.createRun().setFontSize(8);
                    }
                } catch (Exception e) {
                    log.warn("Word photo embed failed for {}: {}", att.getDocumentId(), e.getMessage());
                }
            } else {
                XWPFParagraph p = doc.createParagraph();
                p.createRun().setText("Document: " + (att.getDocumentName() != null ? att.getDocumentName() : "file"));
                p.createRun().addBreak();
                p.createRun().setText("Category: " + (att.getCategory() != null ? att.getCategory() : "DOCUMENT"));
                if (att.getCaption() != null && !att.getCaption().isBlank()) {
                    p.createRun().addBreak();
                    p.createRun().setText("Description: " + att.getCaption());
                }
            }
        }
    }

    private void embedWordImage(XWPFDocument doc, byte[] imageBytes, String fileName, String caption) throws Exception {
        XWPFParagraph picPara = doc.createParagraph();
        picPara.setAlignment(ParagraphAlignment.CENTER);
        XWPFRun picRun = picPara.createRun();
        int pictureType = wordPictureType(fileName);
        picRun.addPicture(new java.io.ByteArrayInputStream(imageBytes), pictureType,
                fileName != null ? fileName : "image.png", Units.toEMU(420), Units.toEMU(300));
        if (caption != null && !caption.isBlank()) {
            XWPFParagraph capPara = doc.createParagraph();
            capPara.setAlignment(ParagraphAlignment.CENTER);
            capPara.createRun().setText(caption);
        }
    }

    private int wordPictureType(String fileName) {
        if (fileName == null) return org.apache.poi.xwpf.usermodel.Document.PICTURE_TYPE_PNG;
        String n = fileName.toLowerCase();
        if (n.endsWith(".png")) return org.apache.poi.xwpf.usermodel.Document.PICTURE_TYPE_PNG;
        if (n.endsWith(".gif")) return org.apache.poi.xwpf.usermodel.Document.PICTURE_TYPE_GIF;
        return org.apache.poi.xwpf.usermodel.Document.PICTURE_TYPE_JPEG;
    }

    private boolean isPhotoAttachment(ReportAttachmentDto att) {
        if (att.getDocumentId() == null) return false;
        if (isPhotoCategory(att.getCategory())) return true;
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

    private void addWordHeading(XWPFDocument doc, String text) {
        XWPFParagraph para = doc.createParagraph();
        para.setSpacingBefore(300);
        para.setSpacingAfter(100);
        XWPFRun run = para.createRun();
        run.setText(text);
        run.setBold(true);
        run.setFontSize(14);
        run.setColor("0D9488");
    }

    private void styleWordCell(XWPFTableCell cell, String text, boolean bold, String fontColor, String bgColor) {
        if (cell.getParagraphs().isEmpty()) {
            cell.addParagraph();
        }
        XWPFParagraph p = cell.getParagraphs().get(0);
        XWPFRun r = p.getRuns().isEmpty() ? p.createRun() : p.getRuns().get(0);
        r.setText(text != null ? text : "");
        r.setBold(bold);
        if (fontColor != null) r.setColor(fontColor);
        if (bgColor != null) cell.setColor(bgColor);
    }
}
