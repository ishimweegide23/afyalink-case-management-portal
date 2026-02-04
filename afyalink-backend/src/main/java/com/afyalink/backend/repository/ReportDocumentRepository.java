package com.afyalink.backend.repository;

import com.afyalink.backend.model.ReportDocument;
import com.afyalink.backend.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReportDocumentRepository extends JpaRepository<ReportDocument, Long> {
    Page<ReportDocument> findByCreatedByOrderByCreatedAtDesc(User createdBy, Pageable pageable);
}
