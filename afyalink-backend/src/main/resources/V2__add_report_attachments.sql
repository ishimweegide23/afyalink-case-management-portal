CREATE TABLE report_attachments (
    id BIGSERIAL PRIMARY KEY,
    report_id BIGINT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    document_id BIGINT NOT NULL REFERENCES documents(id),
    caption TEXT,
    category VARCHAR(50) DEFAULT 'OTHER',
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes
CREATE INDEX idx_report_attachments_report ON report_attachments(report_id);

ALTER TABLE reports ADD COLUMN attachment_count INTEGER DEFAULT 0;
ALTER TABLE reports ADD COLUMN photo_count INTEGER DEFAULT 0;
ALTER TABLE reports ADD COLUMN location VARCHAR(255);
