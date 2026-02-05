package com.afyalink.backend.service;

import com.afyalink.backend.dto.document.DocumentDto;
import com.afyalink.backend.dto.common.PageResponse;
import com.afyalink.backend.enums.UserRole;
import com.afyalink.backend.exception.ForbiddenException;
import com.afyalink.backend.exception.ResourceNotFoundException;
import com.afyalink.backend.model.Case;
import com.afyalink.backend.model.Document;
import com.afyalink.backend.model.Intervention;
import com.afyalink.backend.model.User;
import com.afyalink.backend.repository.CaseRepository;
import com.afyalink.backend.repository.DocumentRepository;
import com.afyalink.backend.repository.InterventionRepository;
import com.afyalink.backend.repository.ReportAttachmentRepository;
import com.afyalink.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final CaseRepository caseRepository;
    private final InterventionRepository interventionRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;
    private final ReportAttachmentRepository reportAttachmentRepository;
    private final ReportDocumentLoader reportDocumentLoader;

    @Value("${file.upload.dir:./uploads}")
    private String uploadDir;

    @Transactional
    public DocumentDto create(Long caseId, Long interventionId, MultipartFile file, Long uploadedById) throws IOException {
        Case caseRecord = caseId != null ? caseRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("Case", "id", caseId)) : null;
        Intervention intervention = interventionId != null ? interventionRepository.findById(interventionId)
                .orElseThrow(() -> new ResourceNotFoundException("Intervention", "id", interventionId)) : null;
        User uploadedBy = userRepository.getReferenceById(uploadedById);

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isBlank()) {
            originalFilename = "document";
        }
        String ext = "";
        int dot = originalFilename.lastIndexOf('.');
        if (dot > 0) {
            ext = originalFilename.substring(dot).toLowerCase();
        }
        // Allow common image and document formats
        if (!ext.isEmpty() && !isAllowedExtension(ext)) {
            throw new com.afyalink.backend.exception.BadRequestException(
                    "File type not allowed. Supported: JPG, PNG, GIF, WEBP, PDF, DOC, DOCX, XLS, XLSX");
        }
        String storedName = UUID.randomUUID().toString() + ext;
        Path dir = Paths.get(uploadDir).toAbsolutePath().normalize();
        Files.createDirectories(dir);
        Path target = dir.resolve(storedName);
        file.transferTo(target.toFile());

        Document doc = Document.builder()
                .caseRecord(caseRecord)
                .intervention(intervention)
                .uploadedBy(uploadedBy)
                .fileName(originalFilename)
                .filePath(target.toString())
                .mimeType(file.getContentType())
                .sizeBytes(file.getSize())
                .isArchived(false)
                .build();
        doc = documentRepository.save(doc);
        auditLogService.log(uploadedById, "CREATE", "Document", String.valueOf(doc.getId()), null, null);
        return toDto(doc);
    }

    public DocumentDto findById(Long id) {
        Document d = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document", "id", id));
        if (d.getDeletedAt() != null) {
            throw new ResourceNotFoundException("Document", "id", id);
        }
        return toDto(d);
    }

    public PageResponse<DocumentDto> findByCaseId(Long caseId, int page, int size, String sortBy, String direction) {
        Case caseRecord = caseRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("Case", "id", caseId));
        Sort sort = Sort.by(Sort.Direction.fromString(direction), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);
        return PageResponse.of(documentRepository.findByCaseRecordAndDeletedAtIsNull(caseRecord, pageable).map(this::toDto));
    }

    public PageResponse<DocumentDto> findByInterventionId(Long interventionId, int page, int size, String sortBy, String direction) {
        Intervention intervention = interventionRepository.findById(interventionId)
                .orElseThrow(() -> new ResourceNotFoundException("Intervention", "id", interventionId));
        Sort sort = Sort.by(Sort.Direction.fromString(direction), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);
        return PageResponse.of(documentRepository.findByIntervention(intervention, pageable).map(this::toDto));
    }

    public PageResponse<DocumentDto> search(String keyword, int page, int size, String sortBy, String direction) {
        Sort sort = Sort.by(Sort.Direction.fromString(direction), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);
        return PageResponse.of(documentRepository.searchDocuments(keyword, pageable).map(this::toDto));
    }

    @Transactional
    public void softDelete(Long id, Long userId) {
        Document doc = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document", "id", id));
        doc.setDeletedAt(LocalDateTime.now());
        documentRepository.save(doc);
        auditLogService.log(userId, "DELETE", "Document", String.valueOf(id), null, null);
    }

    @Transactional
    public DocumentDto setArchived(Long id, boolean archived, Long userId) {
        Document doc = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document", "id", id));
        doc.setArchived(archived);
        doc = documentRepository.save(doc);
        auditLogService.log(userId, "UPDATE", "Document", String.valueOf(id), null, "archived=" + archived);
        return toDto(doc);
    }

    public record DownloadPayload(byte[] bytes, String fileName, String mimeType) {}

    @Transactional(readOnly = true)
    public DownloadPayload download(Long id, Long userId, UserRole role) throws IOException {
        Document doc = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document", "id", id));
        if (doc.getDeletedAt() != null) {
            throw new ResourceNotFoundException("Document", "id", id);
        }
        if (!canUserAccessDocument(doc, userId, role)) {
            throw new ForbiddenException("You do not have permission to access this file");
        }
        byte[] bytes = reportDocumentLoader.loadDocumentBytes(id);
        String mime = doc.getMimeType() != null ? doc.getMimeType() : "application/octet-stream";
        String name = doc.getFileName() != null ? doc.getFileName() : "download";
        return new DownloadPayload(bytes, name, mime);
    }

    @Transactional(readOnly = true)
    public boolean canUserAccessDocument(Document doc, Long userId, UserRole role) {
        if (role == UserRole.ADMIN) {
            return true;
        }
        if (doc.getUploadedBy() != null && doc.getUploadedBy().getId().equals(userId)) {
            return true;
        }
        Case caseRecord = doc.getCaseRecord();
        if (caseRecord != null && caseRecord.getAssignedSocialWorker() != null) {
            User worker = caseRecord.getAssignedSocialWorker();
            if (worker.getId().equals(userId)) {
                return true;
            }
            if (role == UserRole.SUPERVISOR && worker.getSupervisor() != null
                    && worker.getSupervisor().getId().equals(userId)) {
                return true;
            }
        }
        if (reportAttachmentRepository.existsByDocument_Id(doc.getId())) {
            // Report attachments are internal — any authenticated staff member may view
            return true;
        }
        return false;
    }

    private static boolean isAllowedExtension(String ext) {
        return switch (ext.toLowerCase()) {
            case ".jpg", ".jpeg", ".png", ".gif", ".webp", ".pdf",
                 ".doc", ".docx", ".xls", ".xlsx", ".txt" -> true;
            default -> false;
        };
    }

    private DocumentDto toDto(Document d) {
        return DocumentDto.builder()
                .id(d.getId())
                .caseId(d.getCaseRecord() != null ? d.getCaseRecord().getId() : null)
                .caseNumber(d.getCaseRecord() != null ? d.getCaseRecord().getCaseNumber() : null)
                .interventionId(d.getIntervention() != null ? d.getIntervention().getId() : null)
                .uploadedById(d.getUploadedBy().getId())
                .uploadedByName(d.getUploadedBy().getFullName())
                .fileName(d.getFileName())
                .filePath(d.getFilePath())
                .mimeType(d.getMimeType())
                .sizeBytes(d.getSizeBytes())
                .isArchived(d.isArchived())
                .createdAt(d.getCreatedAt())
                .build();
    }
}
