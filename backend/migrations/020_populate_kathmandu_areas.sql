-- Migration: Populate Kathmandu Valley areas with ward-level data
-- Purpose: Add popular areas in Kathmandu, Lalitpur, and Bhaktapur
-- Date: 2025-10-11

-- First, let's get the municipality IDs
-- Kathmandu Metropolitan: 30101
-- Lalitpur Metropolitan: 30102
-- Bhaktapur Municipality: 30103

-- ====================
-- KATHMANDU METROPOLITAN AREAS
-- ====================

-- Ward 1 Areas (Thamel, Chhetrapati, Ason)
INSERT INTO areas (name, name_np, municipality_id, ward_number, is_popular, latitude, longitude, search_terms) VALUES
('Thamel', 'ठमेल', 30101, 1, true, 27.7150, 85.3131, 'thamel tourist area hotels restaurants'),
('Chhetrapati', 'छेत्रपती', 30101, 1, false, 27.7056, 85.3086, 'chhetrapati temple'),
('Ason', 'असन', 30101, 1, true, 27.7043, 85.3076, 'ason bazaar market');

-- Ward 2 Areas (Durbarmarg, Lazimpat, Maharajgunj)
INSERT INTO areas (name, name_np, municipality_id, ward_number, is_popular, latitude, longitude, search_terms) VALUES
('Durbarmarg', 'दरबारमार्ग', 30101, 2, true, 27.7056, 85.3194, 'durbar marg shopping restaurants embassies'),
('Lazimpat', 'लाजिम्पाट', 30101, 2, true, 27.7231, 85.3253, 'lazimpat hospitals schools'),
('Maharajgunj', 'महाराजगंज', 30101, 2, true, 27.7350, 85.3281, 'maharajgunj medical hospital');

-- Ward 3 Areas (Naxal, Gaushala)
INSERT INTO areas (name, name_np, municipality_id, ward_number, is_popular, latitude, longitude, search_terms) VALUES
('Naxal', 'नक्साल', 30101, 3, true, 27.7139, 85.3278, 'naxal residential area'),
('Gaushala', 'गौशाला', 30101, 3, false, 27.7150, 85.3300, 'gaushala area');

-- Ward 4 Areas (Baneshwor, Minbhawan)
INSERT INTO areas (name, name_np, municipality_id, ward_number, is_popular, latitude, longitude, search_terms) VALUES
('Baneshwor', 'बानेश्वर', 30101, 4, true, 27.6944, 85.3381, 'baneshwor shopping offices'),
('Minbhawan', 'मिनभवन', 30101, 4, false, 27.6956, 85.3339, 'minbhawan government');

-- Ward 5 Areas (New Baneshwor, Battisputali)
INSERT INTO areas (name, name_np, municipality_id, ward_number, is_popular, latitude, longitude, search_terms) VALUES
('New Baneshwor', 'नयाँ बानेश्वर', 30101, 5, true, 27.6931, 85.3422, 'new baneshwor offices IT'),
('Battisputali', 'बत्तिसपुतली', 30101, 5, false, 27.6881, 85.3353, 'battisputali bridge');

-- Ward 6 Areas (Tripureshwor, Kalimati)
INSERT INTO areas (name, name_np, municipality_id, ward_number, is_popular, latitude, longitude, search_terms) VALUES
('Tripureshwor', 'त्रिपुरेश्वर', 30101, 6, false, 27.6944, 85.3128, 'tripureshwor'),
('Kalimati', 'कालीमाटी', 30101, 6, true, 27.6975, 85.2928, 'kalimati vegetable market');

-- Ward 7 Areas (Koteshwor, Jadibuti)
INSERT INTO areas (name, name_np, municipality_id, ward_number, is_popular, latitude, longitude, search_terms) VALUES
('Koteshwor', 'कोटेश्वर', 30101, 7, true, 27.6772, 85.3475, 'koteshwor ring road'),
('Jadibuti', 'जडिबुटी', 30101, 7, false, 27.6758, 85.3547, 'jadibuti area');

-- Ward 8 Areas (Kalimati, Tahachal)
INSERT INTO areas (name, name_np, municipality_id, ward_number, is_popular, latitude, longitude, search_terms) VALUES
('Tahachal', 'ताहाचल', 30101, 8, false, 27.7014, 85.2861, 'tahachal area'),
('Balkhu', 'बल्खु', 30101, 8, true, 27.6861, 85.2947, 'balkhu ring road');

-- Ward 9 Areas (Balaju, Sorhakhutte)
INSERT INTO areas (name, name_np, municipality_id, ward_number, is_popular, latitude, longitude, search_terms) VALUES
('Balaju', 'बालाजु', 30101, 9, true, 27.7322, 85.3031, 'balaju industrial'),
('Sorhakhutte', 'सोह्रखुट्टे', 30101, 9, false, 27.7350, 85.2978, 'sorhakhutte area');

-- Ward 10 Areas (Gongabu, Samakhusi)
INSERT INTO areas (name, name_np, municipality_id, ward_number, is_popular, latitude, longitude, search_terms) VALUES
('Gongabu', 'गोंगबु', 30101, 10, false, 27.7333, 85.3114, 'gongabu bus park'),
('Samakhusi', 'समाखुसी', 30101, 10, true, 27.7328, 85.3167, 'samakhusi residential');

-- Ward 11 Areas (Buddhanagar, Bansbari)
INSERT INTO areas (name, name_np, municipality_id, ward_number, is_popular, latitude, longitude, search_terms) VALUES
('Buddhanagar', 'बुद्धनगर', 30101, 11, true, 27.7211, 85.3569, 'buddhanagar residential'),
('Bansbari', 'बाँसबारी', 30101, 11, false, 27.7256, 85.3592, 'bansbari area');

-- Ward 12 Areas (Chabahil)
INSERT INTO areas (name, name_np, municipality_id, ward_number, is_popular, latitude, longitude, search_terms) VALUES
('Chabahil', 'चाबहिल', 30101, 12, true, 27.7139, 85.3461, 'chabahil stupa'),
('Gongabu', 'गोंगबु', 30101, 12, false, 27.7178, 85.3419, 'gongabu chowk');

-- Ward 13 Areas (Kapan, Budhanilkantha)
INSERT INTO areas (name, name_np, municipality_id, ward_number, is_popular, latitude, longitude, search_terms) VALUES
('Kapan', 'कपन', 30101, 13, false, 27.7406, 85.3619, 'kapan monastery'),
('Budhanilkantha', 'बुढानिलकण्ठ', 30101, 13, true, 27.7633, 85.3650, 'budhanilkantha temple');

-- ====================
-- LALITPUR METROPOLITAN AREAS
-- ====================

-- Ward 1 Areas (Lagankhel)
INSERT INTO areas (name, name_np, municipality_id, ward_number, is_popular, latitude, longitude, search_terms) VALUES
('Lagankhel', 'लगनखेल', 30102, 1, true, 27.6714, 85.3258, 'lagankhel bus park satdobato');

-- Ward 2 Areas (Pulchowk, Mangal Bazaar)
INSERT INTO areas (name, name_np, municipality_id, ward_number, is_popular, latitude, longitude, search_terms) VALUES
('Pulchowk', 'पुल्चोक', 30102, 2, true, 27.6828, 85.3189, 'pulchowk engineering college IOE'),
('Mangal Bazaar', 'मंगल बजार', 30102, 2, true, 27.6733, 85.3247, 'mangal bazaar patan durbar');

-- Ward 3 Areas (Kupondole, Sanepa)
INSERT INTO areas (name, name_np, municipality_id, ward_number, is_popular, latitude, longitude, search_terms) VALUES
('Kupondole', 'कुपन्डोल', 30102, 3, true, 27.6894, 85.3147, 'kupondole lalitpur'),
('Sanepa', 'सानेपा', 30102, 3, true, 27.6886, 85.3036, 'sanepa residential');

-- Ward 4 Areas (Jhamsikhel, Jawalakhel)
INSERT INTO areas (name, name_np, municipality_id, ward_number, is_popular, latitude, longitude, search_terms) VALUES
('Jhamsikhel', 'झम्सिखेल', 30102, 4, true, 27.6858, 85.3089, 'jhamsikhel restaurants cafes'),
('Jawalakhel', 'जावलाखेल', 30102, 4, true, 27.6758, 85.3128, 'jawalakhel zoo chowk');

-- ====================
-- BHAKTAPUR MUNICIPALITY AREAS
-- ====================

-- Ward 1 Areas (Durbar Square area)
INSERT INTO areas (name, name_np, municipality_id, ward_number, is_popular, latitude, longitude, search_terms) VALUES
('Durbar Square', 'दरबार स्क्वायर', 30103, 1, true, 27.6722, 85.4278, 'bhaktapur durbar square heritage'),
('Taumadhi', 'तौमढी', 30103, 1, false, 27.6717, 85.4289, 'taumadhi square nyatapola');

-- Ward 2 Areas (Suryabinayak)
INSERT INTO areas (name, name_np, municipality_id, ward_number, is_popular, latitude, longitude, search_terms) VALUES
('Suryabinayak', 'सूर्यबिनायक', 30103, 2, true, 27.6619, 85.4447, 'suryabinayak temple'),
('Gundu', 'गुन्डु', 30103, 2, false, 27.6653, 85.4406, 'gundu area');

-- Update listing counts (will be 0 initially)
SELECT update_area_listing_counts();

-- Show summary
SELECT
  l.name as municipality,
  COUNT(*) as area_count,
  COUNT(*) FILTER (WHERE a.is_popular = true) as popular_count
FROM areas a
JOIN locations l ON a.municipality_id = l.id
GROUP BY l.name
ORDER BY area_count DESC;

SELECT 'Kathmandu Valley areas populated successfully' AS status;
