-- Migration: Create areas table with ward-level granularity
-- Purpose: Support Province → District → Municipality → Ward → Area hierarchy
-- Date: 2025-10-11

-- Create areas table with full hierarchy support
CREATE TABLE IF NOT EXISTS areas (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  name_np VARCHAR(255),
  municipality_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  ward_number INTEGER,
  area_type VARCHAR(50) DEFAULT 'neighborhood',
  latitude NUMERIC(10,8),
  longitude NUMERIC(11,8),
  is_popular BOOLEAN DEFAULT false,
  listing_count INTEGER DEFAULT 0,
  search_terms TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_areas_municipality ON areas(municipality_id);
CREATE INDEX idx_areas_ward ON areas(ward_number);
CREATE INDEX idx_areas_popular ON areas(is_popular);
CREATE INDEX idx_areas_name ON areas(name);
CREATE INDEX idx_areas_name_pattern ON areas(name text_pattern_ops);
CREATE INDEX idx_areas_search ON areas USING gin(to_tsvector('english', name || ' ' || COALESCE(name_np, '')));

-- Add area_id back to ads table
ALTER TABLE ads
ADD COLUMN IF NOT EXISTS area_id INTEGER REFERENCES areas(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_ads_area_id ON ads(area_id);

-- Create view for full location hierarchy (Province → District → Municipality → Ward → Area)
CREATE OR REPLACE VIEW areas_full_hierarchy AS
SELECT
  a.id as area_id,
  a.name as area_name,
  a.name_np as area_name_np,
  a.ward_number,
  a.is_popular,
  a.listing_count,
  a.latitude as area_latitude,
  a.longitude as area_longitude,

  -- Municipality level
  m.id as municipality_id,
  m.name as municipality_name,
  m.type as municipality_type,

  -- District level
  d.id as district_id,
  d.name as district_name,

  -- Province level
  p.id as province_id,
  p.name as province_name,

  -- Search display text
  a.name || ', Ward ' || a.ward_number || ', ' || m.name || ', ' || d.name as display_text,

  -- Searchable text
  a.name || ' ' || COALESCE(a.name_np, '') || ' ' || m.name || ' ' || d.name || ' ' || p.name as search_text
FROM areas a
JOIN locations m ON a.municipality_id = m.id
JOIN locations d ON m.parent_id = d.id
JOIN locations p ON d.parent_id = p.id
WHERE m.type IN ('municipality', 'metropolitan', 'sub_metropolitan')
  AND d.type = 'district'
  AND p.type = 'province';

-- Function to update area listing counts
CREATE OR REPLACE FUNCTION update_area_listing_counts()
RETURNS void AS $$
BEGIN
  UPDATE areas
  SET listing_count = (
    SELECT COUNT(*)
    FROM ads
    WHERE ads.area_id = areas.id
      AND ads.status = 'approved'
  );
END;
$$ LANGUAGE plpgsql;

-- Trigger to update areas.updated_at
CREATE OR REPLACE FUNCTION update_areas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER areas_updated_at_trigger
BEFORE UPDATE ON areas
FOR EACH ROW
EXECUTE FUNCTION update_areas_updated_at();

-- Show confirmation
SELECT 'Areas table with ward hierarchy created successfully' AS status;
