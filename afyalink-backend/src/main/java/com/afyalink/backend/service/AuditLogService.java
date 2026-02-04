package com.afyalink.backend.service;

import com.afyalink.backend.dto.common.AuditLogDto;
import com.afyalink.backend.dto.common.PageResponse;
import com.afyalink.backend.model.AuditLog;
import com.afyalink.backend.model.User;
import com.afyalink.backend.repository.AuditLogRepository;
import com.afyalink.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.afyalink.backend.dto.common.AuditStatsDto;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.element.Cell;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private static final Logger logger = LoggerFactory.getLogger(AuditLogService.class);
    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(Long userId, String action, String objectType,
            String objectId, String oldValues,
            String newValues, String ipAddress) {
        try {
            User userRef = null;
            if (userId != null) {
                userRef = userRepository.findById(userId)
                    .orElse(null);
            }
            AuditLog auditLog = AuditLog.builder()
                    .user(userRef)
                    .action(action)
                    .objectType(objectType)
                    .objectId(objectId)
                    .oldValues(oldValues)
                    .newValues(newValues)
                    .ipAddress(ipAddress)
                    .build();
            auditLogRepository.save(auditLog);
        } catch (Exception e) {
            logger.warn("Async audit log failed silently: {}",
                e.getMessage());
        }
    }

    public void log(Long userId, String action, String objectType, String objectId, String oldValues, String newValues) {
        log(userId, action, objectType, objectId, oldValues, newValues, null);
    }

    public Page<AuditLog> findAll(Pageable pageable) {
        return auditLogRepository.findAll(pageable);
    }

    public Page<AuditLog> search(String keyword, Pageable pageable) {
        return auditLogRepository.searchAuditLogs(keyword, pageable);
    }

    @Transactional(readOnly = true)
    public PageResponse<AuditLogDto> findAllDtos(int page, int size, String sortBy, String direction,
            String action, String entityType, Long userId, LocalDate startDate, LocalDate endDate) {
        // Use snake_case for native query ordering
        String dbSortBy = sortBy.equals("createdAt") ? "created_at" : sortBy;
        Sort sort = Sort.by(Sort.Direction.fromString(direction), dbSortBy);
        Pageable pageable = PageRequest.of(page, size, sort);
        LocalDateTime start = startDate != null ? startDate.atStartOfDay() : LocalDateTime.of(1970, 1, 1, 0, 0);
        LocalDateTime end = endDate != null ? endDate.atTime(23, 59, 59) : LocalDateTime.of(2100, 12, 31, 23, 59, 59);
        String kw = "";
        String act = action == null ? "" : action;
        String type = entityType == null ? "" : entityType;
        Long uid = userId != null ? userId : -1L;
        return PageResponse.of(auditLogRepository.findWithFilters(kw, act, type, uid, start, end, pageable).map(this::toDto));
    }

    @Transactional(readOnly = true)
    public PageResponse<AuditLogDto> searchDtos(String keyword, int page, int size, String sortBy, String direction,
            String action, String entityType, Long userId, LocalDate startDate, LocalDate endDate) {
        String dbSortBy = sortBy.equals("createdAt") ? "created_at" : sortBy;
        Sort sort = Sort.by(Sort.Direction.fromString(direction), dbSortBy);
        Pageable pageable = PageRequest.of(page, size, sort);
        LocalDateTime start = startDate != null ? startDate.atStartOfDay() : LocalDateTime.of(1970, 1, 1, 0, 0);
        LocalDateTime end = endDate != null ? endDate.atTime(23, 59, 59) : LocalDateTime.of(2100, 12, 31, 23, 59, 59);
        String kw = keyword == null ? "" : keyword;
        String act = action == null ? "" : action;
        String type = entityType == null ? "" : entityType;
        Long uid = userId != null ? userId : -1L;
        return PageResponse.of(auditLogRepository.findWithFilters(kw, act, type, uid, start, end, pageable).map(this::toDto));
    }

    @Transactional(readOnly = true)
    public AuditStatsDto getStats() {
        return AuditStatsDto.builder()
                .totalLogs(auditLogRepository.count())
                .todayLogs(auditLogRepository.countTodayLogs())
                .uniqueUsers(auditLogRepository.countUniqueUsers())
                .mostActiveEntity(auditLogRepository.findMostActiveEntity())
                .build();
    }

    @Transactional(readOnly = true)
    public byte[] exportLogs(String format, String keyword, String action, String entityType, Long userId, LocalDate startDate, LocalDate endDate) throws IOException {
        LocalDateTime start = startDate != null ? startDate.atStartOfDay() : LocalDateTime.of(1970, 1, 1, 0, 0);
        LocalDateTime end = endDate != null ? endDate.atTime(23, 59, 59) : LocalDateTime.of(2100, 12, 31, 23, 59, 59);
        String kw = keyword == null ? "" : keyword;
        String act = action == null ? "" : action;
        String type = entityType == null ? "" : entityType;
        Long uid = userId != null ? userId : -1L;
        
        // Fetch up to 10,000 records for export to prevent OOM
        Pageable exportPageable = PageRequest.of(0, 10000, Sort.by(Sort.Direction.DESC, "created_at"));
        Page<AuditLog> page = auditLogRepository.findWithFilters(kw, act, type, uid, start, end, exportPageable);
        List<AuditLog> logs = page.getContent();

        if ("pdf".equalsIgnoreCase(format)) {
            return exportToPdf(logs);
        } else if ("csv".equalsIgnoreCase(format)) {
            return exportToCsv(logs);
        } else {
            return exportToExcel(logs);
        }
    }

    private byte[] exportToCsv(List<AuditLog> logs) {
        StringBuilder csv = new StringBuilder();
        csv.append("Time,Action,Performed By,Email,Entity Type,Entity ID,Details\n");
        for (AuditLog log : logs) {
            String time = log.getCreatedAt() != null ? log.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) : "";
            String act = log.getAction() != null ? log.getAction() : "";
            String by = log.getUser() != null ? log.getUser().getFullName() : "";
            String email = log.getUser() != null ? log.getUser().getEmail() : "";
            String type = log.getObjectType() != null ? log.getObjectType() : "";
            String id = log.getObjectId() != null ? log.getObjectId() : "";
            String details = (log.getOldValues() != null && log.getNewValues() != null) ? "Updated" :
                             (log.getNewValues() != null) ? "Created" : "Deleted";
            csv.append(String.format("\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\"\n",
                    time, act, by, email, type, id, details));
        }
        return csv.toString().getBytes();
    }

    private byte[] exportToExcel(List<AuditLog> logs) throws IOException {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Audit Logs");
            Row headerRow = sheet.createRow(0);
            String[] headers = {"Time", "Action", "Performed By", "Email", "Entity Type", "Entity ID", "Details"};
            for (int i = 0; i < headers.length; i++) {
                org.apache.poi.ss.usermodel.Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
            }
            int rowNum = 1;
            for (AuditLog log : logs) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(log.getCreatedAt() != null ? log.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) : "");
                row.createCell(1).setCellValue(log.getAction() != null ? log.getAction() : "");
                row.createCell(2).setCellValue(log.getUser() != null ? log.getUser().getFullName() : "");
                row.createCell(3).setCellValue(log.getUser() != null ? log.getUser().getEmail() : "");
                row.createCell(4).setCellValue(log.getObjectType() != null ? log.getObjectType() : "");
                row.createCell(5).setCellValue(log.getObjectId() != null ? log.getObjectId() : "");
                String details = (log.getOldValues() != null && log.getNewValues() != null) ? "Updated" :
                                 (log.getNewValues() != null) ? "Created" : "Deleted";
                row.createCell(6).setCellValue(details);
            }
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }
            workbook.write(out);
            return out.toByteArray();
        }
    }

    private byte[] exportToPdf(List<AuditLog> logs) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(out);
        PdfDocument pdf = new PdfDocument(writer);
        Document document = new Document(pdf);
        
        document.add(new Paragraph("Audit Logs Export").setBold().setFontSize(16));
        
        Table table = new Table(new float[]{3, 2, 3, 2, 2});
        table.setWidth(com.itextpdf.layout.properties.UnitValue.createPercentValue(100));
        
        String[] headers = {"Time", "Action", "Performed By", "Entity", "Details"};
        for (String h : headers) {
            table.addHeaderCell(new Cell().add(new Paragraph(h).setBold()));
        }
        
        for (AuditLog log : logs) {
            String time = log.getCreatedAt() != null ? log.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE) : "";
            String act = log.getAction() != null ? log.getAction() : "";
            String by = log.getUser() != null ? log.getUser().getFullName() : "";
            String entity = (log.getObjectType() != null ? log.getObjectType() : "") + " " + (log.getObjectId() != null ? log.getObjectId() : "");
            String details = (log.getOldValues() != null && log.getNewValues() != null) ? "Updated" :
                             (log.getNewValues() != null) ? "Created" : "Deleted";
            
            table.addCell(new Cell().add(new Paragraph(time).setFontSize(9)));
            table.addCell(new Cell().add(new Paragraph(act).setFontSize(9)));
            table.addCell(new Cell().add(new Paragraph(by).setFontSize(9)));
            table.addCell(new Cell().add(new Paragraph(entity).setFontSize(9)));
            table.addCell(new Cell().add(new Paragraph(details).setFontSize(9)));
        }
        
        document.add(table);
        document.close();
        return out.toByteArray();
    }

    private AuditLogDto toDto(AuditLog log) {
        User user = log.getUser();
        return AuditLogDto.builder()
                .id(log.getId())
                .userId(user != null ? user.getId() : null)
                .userEmail(user != null ? user.getEmail() : null)
                .performedByName(user != null ? user.getFullName() : null)
                .action(log.getAction())
                .objectType(log.getObjectType())
                .objectId(log.getObjectId())
                .oldValues(log.getOldValues())
                .newValues(log.getNewValues())
                .ipAddress(log.getIpAddress())
                .createdAt(log.getCreatedAt())
                .build();
    }
}
