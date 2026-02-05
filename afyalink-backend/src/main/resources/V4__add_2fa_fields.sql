-- Add 2FA fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_method VARCHAR(50) DEFAULT 'EMAIL';
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_verified_at TIMESTAMP;

-- Create otp_codes table
CREATE TABLE IF NOT EXISTS otp_codes (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code VARCHAR(10) NOT NULL,
    purpose VARCHAR(50) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT FALSE NOT NULL,
    attempts INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP NOT NULL
);

-- Index for faster lookup
CREATE INDEX IF NOT EXISTS idx_otp_codes_user_purpose ON otp_codes(user_id, purpose);
