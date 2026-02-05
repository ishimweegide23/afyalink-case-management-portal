package com.afyalink.backend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.UUID;

@Service
@Slf4j
public class MessageAttachmentService {

    @Value("${file.upload.dir:./uploads}")
    private String uploadDir;

    private static final String MESSAGES_SUBDIR = "messages";

    /**
     * Save an attachment for messaging (image, document, etc.). Returns a relative URL path
     * that the frontend can use with the API base URL to load the file.
     */
    public Map<String, String> upload(MultipartFile file) throws IOException {
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isBlank()) {
            originalFilename = "attachment";
        }
        String ext = "";
        int dot = originalFilename.lastIndexOf('.');
        if (dot > 0) {
            ext = originalFilename.substring(dot);
        }
        String storedName = UUID.randomUUID().toString() + ext;
        Path dir = Paths.get(uploadDir, MESSAGES_SUBDIR).toAbsolutePath().normalize();
        Files.createDirectories(dir);
        Path target = dir.resolve(storedName);
        file.transferTo(target.toFile());

        String urlPath = "/api/messages/files/" + storedName;
        String contentType = file.getContentType() != null ? file.getContentType() : "application/octet-stream";
        return Map.of(
                "url", urlPath,
                "name", originalFilename,
                "type", contentType
        );
    }

    public Path resolveFile(String filename) {
        return Paths.get(uploadDir, MESSAGES_SUBDIR).toAbsolutePath().normalize().resolve(filename);
    }

    public String uploadGroupAvatar(MultipartFile file) throws IOException {
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isBlank()) {
            originalFilename = "avatar";
        }
        String ext = "";
        int dot = originalFilename.lastIndexOf('.');
        if (dot > 0) {
            ext = originalFilename.substring(dot);
        }
        String storedName = "grp_" + UUID.randomUUID().toString() + ext;
        Path dir = Paths.get(uploadDir, MESSAGES_SUBDIR).toAbsolutePath().normalize();
        Files.createDirectories(dir);
        Path target = dir.resolve(storedName);
        file.transferTo(target.toFile());

        return "/api/messages/files/" + storedName;
    }
}
