package com.afyalink.backend.service;

import com.afyalink.backend.exception.ResourceNotFoundException;
import com.afyalink.backend.model.Document;
import com.afyalink.backend.repository.DocumentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Service
@RequiredArgsConstructor
public class ReportDocumentLoader {

    private final DocumentRepository documentRepository;

    @Value("${file.upload.dir:./uploads}")
    private String uploadDir;

    public byte[] loadDocumentBytes(Long documentId) throws IOException {
        Document doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document", "id", documentId));
        if (doc.getDeletedAt() != null) {
            throw new ResourceNotFoundException("Document", "id", documentId);
        }
        Path path = resolvePath(doc.getFilePath());
        if (!Files.exists(path)) {
            throw new ResourceNotFoundException("Document file", "path", path.toString());
        }
        return Files.readAllBytes(path);
    }

    public boolean isImage(Document doc) {
        if (doc.getMimeType() != null && doc.getMimeType().startsWith("image/")) {
            return true;
        }
        String name = doc.getFileName() != null ? doc.getFileName().toLowerCase() : "";
        return name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".png")
                || name.endsWith(".gif") || name.endsWith(".webp");
    }

    public boolean isImageDocument(Long documentId) {
        Document doc = documentRepository.findById(documentId).orElse(null);
        return doc != null && doc.getDeletedAt() == null && isImage(doc);
    }

    public boolean isImageMime(String mime, String fileName) {
        if (mime != null && mime.startsWith("image/")) return true;
        if (fileName == null) return false;
        String n = fileName.toLowerCase();
        return n.endsWith(".jpg") || n.endsWith(".jpeg") || n.endsWith(".png")
                || n.endsWith(".gif") || n.endsWith(".webp");
    }

    private Path resolvePath(String filePath) {
        Path p = Paths.get(filePath).normalize();
        if (Files.exists(p)) {
            return p;
        }
        Path relative = Paths.get(uploadDir).resolve(filePath).normalize();
        if (Files.exists(relative)) {
            return relative;
        }
        return p;
    }
}
