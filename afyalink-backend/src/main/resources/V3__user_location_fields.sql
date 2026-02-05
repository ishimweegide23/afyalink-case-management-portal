-- User location and supervisor assignment (also applied via spring.jpa.hibernate.ddl-auto=update)
ALTER TABLE users ADD COLUMN IF NOT EXISTS province VARCHAR(64);
ALTER TABLE users ADD COLUMN IF NOT EXISTS sector VARCHAR(64);
ALTER TABLE users ADD COLUMN IF NOT EXISTS cell VARCHAR(64);
ALTER TABLE users ADD COLUMN IF NOT EXISTS village VARCHAR(64);
ALTER TABLE users ADD COLUMN IF NOT EXISTS assigned_district VARCHAR(64);
ALTER TABLE users ADD COLUMN IF NOT EXISTS assigned_province VARCHAR(64);

CREATE INDEX IF NOT EXISTS idx_users_district ON users(district);
CREATE INDEX IF NOT EXISTS idx_users_assigned_district ON users(assigned_district);
