-- Migration: Add areas/places for granular location search
-- Province > District > Municipality > Ward > Area/Place

-- Create areas table
CREATE TABLE IF NOT EXISTS areas (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  name_np VARCHAR(255), -- Nepali name
  municipality_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  ward_number INTEGER,
  area_type VARCHAR(50) DEFAULT 'neighborhood', -- 'neighborhood', 'landmark', 'street', 'locality'
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  is_popular BOOLEAN DEFAULT false,
  search_terms TEXT, -- For additional search keywords
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for fast searching
CREATE INDEX idx_areas_municipality ON areas(municipality_id);
CREATE INDEX idx_areas_name ON areas(name);
CREATE INDEX idx_areas_name_pattern ON areas(name text_pattern_ops);
CREATE INDEX idx_areas_popular ON areas(is_popular);
CREATE INDEX idx_areas_ward ON areas(ward_number);

-- Full-text search index
CREATE INDEX idx_areas_search ON areas USING GIN(to_tsvector('english', name || ' ' || COALESCE(name_np, '')));

-- ========================================
-- KATHMANDU METROPOLITAN CITY (ID: 30101)
-- 32 Wards with 3-4 areas each
-- ========================================

INSERT INTO areas (name, name_np, municipality_id, ward_number, area_type, is_popular) VALUES

-- WARD 1
('Naxal', 'नक्साल', 30101, 1, 'neighborhood', true),
('Gairidhara', 'गैरीधारा', 30101, 1, 'neighborhood', true),
('Teku Marg', 'टेकु मार्ग', 30101, 1, 'street', true),

-- WARD 2
('Lazimpat', 'लाजिम्पाट', 30101, 2, 'neighborhood', true),
('Thamel Marg', 'थमेल मार्ग', 30101, 2, 'street', true),
('Hotel Area', 'होटल क्षेत्र', 30101, 2, 'locality', true),

-- WARD 3
('Maharajgunj', 'महाराजगंज', 30101, 3, 'neighborhood', true),
('Shree Gopal Marg', 'श्री गोपाल मार्ग', 30101, 3, 'street', true),
('Balaju', 'बालाजु', 30101, 3, 'neighborhood', true),

-- WARD 4
('Baluwatar', 'बालुवाटार', 30101, 4, 'neighborhood', true),
('Chappal Karkhana', 'चप्पल कारखाना', 30101, 4, 'locality', true),
('Chundevi', 'चुण्डेवी', 30101, 4, 'neighborhood', false),
('Dhumbarahi', 'धुम्बाराही', 30101, 4, 'neighborhood', true),

-- WARD 5
('Hadigaun', 'हाडीगाउँ', 30101, 5, 'neighborhood', true),
('Kapan', 'कपन', 30101, 5, 'neighborhood', true),
('Chapali', 'चापली', 30101, 5, 'neighborhood', false),
('Bhadrakali', 'भद्रकाली', 30101, 5, 'landmark', true),

-- WARD 6
('Bouddha', 'बौद्ध', 30101, 6, 'landmark', true),
('Bauddha Stupa Area', 'बौद्ध स्तुप क्षेत्र', 30101, 6, 'locality', true),
('Boudhanath Marg', 'बौद्धनाथ मार्ग', 30101, 6, 'street', true),

-- WARD 7
('Mitraparak', 'मित्रपार्क', 30101, 7, 'neighborhood', true),
('Chhauni', 'छाउनी', 30101, 7, 'neighborhood', true),
('Golfutar', 'गोल्फुटार', 30101, 7, 'neighborhood', false);

-- Note: Wards 8-32 can be added later following the same format
-- Each ward should have 3-4 areas

-- ========================================
-- Template for adding more wards:
-- ========================================
-- -- WARD X
-- ('Area Name', 'नेपाली नाम', 30101, X, 'area_type', is_popular),
-- ('Area Name 2', 'नेपाली नाम', 30101, X, 'area_type', is_popular),
-- ('Area Name 3', 'नेपाली नाम', 30101, X, 'area_type', is_popular);

-- ========================================
-- OTHER MUNICIPALITIES (Add as needed)
-- ========================================
-- Use the same format but change municipality_id
-- Lalitpur Metropolitan City: 30201
-- Bhaktapur Municipality: 30301
-- Pokhara Metropolitan City: TBD
-- etc.

-- Add more areas as needed

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_areas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER areas_updated_at_trigger
BEFORE UPDATE ON areas
FOR EACH ROW
EXECUTE FUNCTION update_areas_updated_at();

-- View for easy location hierarchy lookup
CREATE OR REPLACE VIEW areas_full_hierarchy AS
SELECT
  a.id,
  a.name as area_name,
  a.name_np as area_name_np,
  a.ward_number,
  a.area_type,
  a.is_popular,
  m.name as municipality_name,
  m.id as municipality_id,
  d.name as district_name,
  d.id as district_id,
  p.name as province_name,
  p.id as province_id,
  a.latitude,
  a.longitude,
  CASE
    WHEN a.ward_number IS NOT NULL THEN
      a.name || ', Ward ' || a.ward_number || ', ' || m.name
    ELSE
      a.name || ', ' || m.name
  END as display_text
FROM areas a
JOIN locations m ON a.municipality_id = m.id AND m.type = 'municipality'
JOIN locations d ON m.parent_id = d.id AND d.type = 'district'
JOIN locations p ON d.parent_id = p.id AND p.type = 'province';

COMMENT ON TABLE areas IS 'Stores granular location data (neighborhoods, streets, landmarks) within municipalities';
COMMENT ON VIEW areas_full_hierarchy IS 'Provides full location hierarchy for areas with formatted display text';
