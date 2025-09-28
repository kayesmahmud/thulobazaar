-- Create contact_messages table
CREATE TABLE IF NOT EXISTS contact_messages (
    id SERIAL PRIMARY KEY,
    ad_id INTEGER NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
    buyer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    buyer_name VARCHAR(255) NOT NULL,
    buyer_email VARCHAR(255) NOT NULL,
    buyer_phone VARCHAR(20),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create ad_reports table
CREATE TABLE IF NOT EXISTS ad_reports (
    id SERIAL PRIMARY KEY,
    ad_id INTEGER NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
    reporter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason VARCHAR(100) NOT NULL,
    details TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contact_messages_seller_id ON contact_messages(seller_id);
CREATE INDEX IF NOT EXISTS idx_contact_messages_buyer_id ON contact_messages(buyer_id);
CREATE INDEX IF NOT EXISTS idx_contact_messages_ad_id ON contact_messages(ad_id);
CREATE INDEX IF NOT EXISTS idx_ad_reports_ad_id ON ad_reports(ad_id);
CREATE INDEX IF NOT EXISTS idx_ad_reports_reporter_id ON ad_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_ad_reports_status ON ad_reports(status);

-- Add constraint to prevent users from reporting their own ads (handled in application logic)
-- Add constraint to prevent duplicate reports from same user for same ad
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_ad_report ON ad_reports(ad_id, reporter_id);