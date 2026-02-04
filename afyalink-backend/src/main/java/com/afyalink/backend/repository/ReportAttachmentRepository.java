package com.afyalink.backend.repository;

import com.afyalink.backend.model.ReportAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReportAttachmentRepository extends JpaRepository<ReportAttachment, Long> {
    List<ReportAttachment> findByReportIdOrderByDisplayOrderAsc(Long reportId);

    boolean existsByDocument_Id(Long documentId);
}
