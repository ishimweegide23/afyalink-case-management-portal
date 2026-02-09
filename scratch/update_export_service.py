import re
import os

filepath = r"d:\AfyaLink Case Management Portal\afyalink-backend\src\main\java\com\afyalink\backend\service\ExportService.java"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add generateOrganizationPdf and helper methods
# We will insert them before exportToExcel

helper_methods = """
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
"""

# Modify exportToPdf
export_to_pdf_code = """
    public ResponseEntity<byte[]> exportToPdf(Long reportId) throws java.io.IOException {
        ReportDataDto data = reportDataService.buildReportData(reportId);
        if (data == null || data.getReportDto() == null) {
            throw new ResourceNotFoundException("Report data not found");
        }

        if ("ORGANIZATION".equals(data.getReportDto().getReportType())) {
            OrganizationReportDataDto orgData = organizationReportService.buildOrganizationReportData(
                data.getReportDto().getPeriodStart(), 
                data.getReportDto().getPeriodEnd()
            );
            return exportOrganizationPdf(reportId, data, orgData);
        }

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
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\\"report_" + reportId + ".pdf\\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(out.toByteArray());
    }
"""

# Match old exportToPdf
old_pattern = re.compile(r'public ResponseEntity<byte\[\]> exportToPdf.*?return ResponseEntity\.ok\(\).*?\.body\(out\.toByteArray\(\)\);\s*}', re.DOTALL)

if old_pattern.search(content):
    content = old_pattern.sub(export_to_pdf_code.strip(), content)
else:
    print("Could not find exportToPdf method")

# Insert helper methods before exportToExcel
excel_index = content.find('public ResponseEntity<byte[]> exportToExcel')
if excel_index != -1:
    content = content[:excel_index] + helper_methods + "\n    " + content[excel_index:]
else:
    print("Could not find exportToExcel method")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated ExportService.java")
