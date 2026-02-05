package com.afyalink.backend.service;

import com.afyalink.backend.dto.report.ReportDocumentDto;
import com.afyalink.backend.model.ReportDocument;
import com.afyalink.backend.model.User;
import com.afyalink.backend.repository.ReportDocumentRepository;
import com.afyalink.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReportDocumentService {

    private final ReportDocumentRepository reportDocumentRepository;
    private final UserRepository userRepository;

    @Value("${file.upload.dir:./uploads}")
    private String uploadDir;

    private static final String REPORTS_SUBDIR = "reports";

    @Transactional
    public ReportDocumentDto create(String title, String content, String periodType, LocalDate fromDate, LocalDate toDate, Long createdById, MultipartFile file) throws IOException {
        User user = userRepository.getReferenceById(createdById);
        ReportDocument doc = ReportDocument.builder()
                .title(title != null ? title : "Report")
                .content(content)
                .periodType(periodType)
                .fromDate(fromDate)
                .toDate(toDate)
                .createdBy(user)
                .build();
        if (file != null && !file.isEmpty()) {
            String originalFilename = file.getOriginalFilename();
            if (originalFilename == null || originalFilename.isBlank()) originalFilename = "attachment";
            String ext = "";
            int dot = originalFilename.lastIndexOf('.');
            if (dot > 0) ext = originalFilename.substring(dot);
            String storedName = UUID.randomUUID().toString() + ext;
            Path dir = Paths.get(uploadDir, REPORTS_SUBDIR).toAbsolutePath().normalize();
            Files.createDirectories(dir);
            Path target = dir.resolve(storedName);
            file.transferTo(target.toFile());
            doc.setFileName(originalFilename);
            doc.setFilePath(storedName);
        }
        doc = reportDocumentRepository.save(doc);
        return toDto(doc);
    }

    @Transactional(readOnly = true)
    public Page<ReportDocumentDto> findByCreatedBy(Long userId, int page, int size) {
        User user = userRepository.getReferenceById(userId);
        return reportDocumentRepository.findByCreatedByOrderByCreatedAtDesc(user, PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")))
                .map(this::toDto);
    }

    public Path resolveFile(String storedName) {
        return Paths.get(uploadDir, REPORTS_SUBDIR).toAbsolutePath().normalize().resolve(storedName);
    }

    private ReportDocumentDto toDto(ReportDocument d) {
        return ReportDocumentDto.builder()
                .id(d.getId())
                .title(d.getTitle())
                .content(d.getContent())
                .periodType(d.getPeriodType())
                .fromDate(d.getFromDate())
                .toDate(d.getToDate())
                .createdById(d.getCreatedBy().getId())
                .createdByFullName(d.getCreatedBy().getFullName())
                .fileName(d.getFileName())
                .filePath(d.getFilePath())
                .createdAt(d.getCreatedAt())
                .build();
    }
}
