-- Migration: Add hierarchical location structure (Bagmati Province only for testing)
-- Structure: Province -> District -> Municipality

-- First, check current locations table structure
-- Assuming we need to add parent_id and type columns

-- Add columns if they don't exist
ALTER TABLE locations ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES locations(id) ON DELETE CASCADE;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS type VARCHAR(50); -- 'province', 'district', 'municipality'

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_locations_parent_id ON locations(parent_id);
CREATE INDEX IF NOT EXISTS idx_locations_type ON locations(type);

-- Clear existing locations (optional - comment out if you want to keep existing data)
-- DELETE FROM locations;

-- Insert Bagmati Province
INSERT INTO locations (id, name, type, parent_id) VALUES
(3, 'Bagmati Province', 'province', NULL)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type, parent_id = EXCLUDED.parent_id;

-- Insert Districts in Bagmati Province
INSERT INTO locations (id, name, type, parent_id) VALUES
(301, 'Kathmandu', 'district', 3),
(302, 'Lalitpur', 'district', 3),
(303, 'Bhaktapur', 'district', 3),
(304, 'Chitwan', 'district', 3),
(305, 'Makwanpur', 'district', 3),
(306, 'Dhading', 'district', 3),
(307, 'Nuwakot', 'district', 3),
(308, 'Rasuwa', 'district', 3),
(309, 'Sindhuli', 'district', 3),
(310, 'Ramechhap', 'district', 3),
(311, 'Dolakha', 'district', 3),
(312, 'Sindhupalchok', 'district', 3),
(313, 'Kavrepalanchok', 'district', 3)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type, parent_id = EXCLUDED.parent_id;

-- Insert Municipalities in Kathmandu District
INSERT INTO locations (id, name, type, parent_id) VALUES
(30101, 'Kathmandu Metropolitan City', 'municipality', 301),
(30102, 'Budhanilkantha Municipality', 'municipality', 301),
(30103, 'Chandragiri Municipality', 'municipality', 301),
(30104, 'Dakshinkali Municipality', 'municipality', 301),
(30105, 'Gokarneshwor Municipality', 'municipality', 301),
(30106, 'Kageshwori Manohara Municipality', 'municipality', 301),
(30107, 'Kirtipur Municipality', 'municipality', 301),
(30108, 'Nagarjun Municipality', 'municipality', 301),
(30109, 'Shankharapur Municipality', 'municipality', 301),
(30110, 'Tarakeshwar Municipality', 'municipality', 301),
(30111, 'Tokha Municipality', 'municipality', 301)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type, parent_id = EXCLUDED.parent_id;

-- Insert Municipalities in Lalitpur District
INSERT INTO locations (id, name, type, parent_id) VALUES
(30201, 'Lalitpur Metropolitan City', 'municipality', 302),
(30202, 'Godawari Municipality', 'municipality', 302),
(30203, 'Mahalaxmi Municipality', 'municipality', 302),
(30204, 'Konjyosom Rural Municipality', 'municipality', 302),
(30205, 'Bagmati Rural Municipality', 'municipality', 302),
(30206, 'Mahankal Rural Municipality', 'municipality', 302)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type, parent_id = EXCLUDED.parent_id;

-- Insert Municipalities in Bhaktapur District
INSERT INTO locations (id, name, type, parent_id) VALUES
(30301, 'Bhaktapur Municipality', 'municipality', 303),
(30302, 'Changunarayan Municipality', 'municipality', 303),
(30303, 'Madhyapur Thimi Municipality', 'municipality', 303),
(30304, 'Suryabinayak Municipality', 'municipality', 303)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type, parent_id = EXCLUDED.parent_id;

-- Insert Municipalities in Chitwan District
INSERT INTO locations (id, name, type, parent_id) VALUES
(30401, 'Bharatpur Metropolitan City', 'municipality', 304),
(30402, 'Kalika Municipality', 'municipality', 304),
(30403, 'Khairahani Municipality', 'municipality', 304),
(30404, 'Madi Municipality', 'municipality', 304),
(30405, 'Ratnanagar Municipality', 'municipality', 304),
(30406, 'Rapti Municipality', 'municipality', 304),
(30407, 'Ichchhakamana Rural Municipality', 'municipality', 304)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type, parent_id = EXCLUDED.parent_id;

-- Insert Municipalities in Makwanpur District
INSERT INTO locations (id, name, type, parent_id) VALUES
(30501, 'Hetauda Sub-Metropolitan City', 'municipality', 305),
(30502, 'Thaha Municipality', 'municipality', 305),
(30503, 'Bhimphedi Rural Municipality', 'municipality', 305),
(30504, 'Makawanpurgadhi Rural Municipality', 'municipality', 305),
(30505, 'Manahari Rural Municipality', 'municipality', 305),
(30506, 'Raksirang Rural Municipality', 'municipality', 305),
(30507, 'Bakaiya Rural Municipality', 'municipality', 305),
(30508, 'Bagmati Rural Municipality', 'municipality', 305),
(30509, 'Kailash Rural Municipality', 'municipality', 305),
(30510, 'Indrasarowar Rural Municipality', 'municipality', 305)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type, parent_id = EXCLUDED.parent_id;

-- Insert Municipalities in Dhading District
INSERT INTO locations (id, name, type, parent_id) VALUES
(30601, 'Dhading Besi Municipality', 'municipality', 306),
(30602, 'Nilkantha Municipality', 'municipality', 306),
(30603, 'Khaniyabas Rural Municipality', 'municipality', 306),
(30604, 'Gajuri Rural Municipality', 'municipality', 306),
(30605, 'Galchi Rural Municipality', 'municipality', 306),
(30606, 'Gangajamuna Rural Municipality', 'municipality', 306),
(30607, 'Jwalamukhi Rural Municipality', 'municipality', 306),
(30608, 'Netrawati Dabjong Rural Municipality', 'municipality', 306),
(30609, 'Benighat Rorang Rural Municipality', 'municipality', 306),
(30610, 'Ruby Valley Rural Municipality', 'municipality', 306),
(30611, 'Siddhalek Rural Municipality', 'municipality', 306),
(30612, 'Thakre Rural Municipality', 'municipality', 306),
(30613, 'Tripura Sundari Rural Municipality', 'municipality', 306)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type, parent_id = EXCLUDED.parent_id;

-- Insert Municipalities in Nuwakot District
INSERT INTO locations (id, name, type, parent_id) VALUES
(30701, 'Bidur Municipality', 'municipality', 307),
(30702, 'Belkotgadhi Municipality', 'municipality', 307),
(30703, 'Kakani Rural Municipality', 'municipality', 307),
(30704, 'Kispang Rural Municipality', 'municipality', 307),
(30705, 'Likhu Rural Municipality', 'municipality', 307),
(30706, 'Myagang Rural Municipality', 'municipality', 307),
(30707, 'Panchakanya Rural Municipality', 'municipality', 307),
(30708, 'Shivapuri Rural Municipality', 'municipality', 307),
(30709, 'Dupcheshwor Rural Municipality', 'municipality', 307),
(30710, 'Suryagadhi Rural Municipality', 'municipality', 307),
(30711, 'Tadi Rural Municipality', 'municipality', 307),
(30712, 'Tarkeshwar Rural Municipality', 'municipality', 307)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type, parent_id = EXCLUDED.parent_id;

-- Insert Municipalities in Rasuwa District
INSERT INTO locations (id, name, type, parent_id) VALUES
(30801, 'Gosaikunda Rural Municipality', 'municipality', 308),
(30802, 'Kalika Rural Municipality', 'municipality', 308),
(30803, 'Naukunda Rural Municipality', 'municipality', 308),
(30804, 'Parbatikunda Rural Municipality', 'municipality', 308),
(30805, 'Uttargaya Rural Municipality', 'municipality', 308)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type, parent_id = EXCLUDED.parent_id;

-- Insert Municipalities in Sindhuli District
INSERT INTO locations (id, name, type, parent_id) VALUES
(30901, 'Kamalamai Municipality', 'municipality', 309),
(30902, 'Dudhouli Municipality', 'municipality', 309),
(30903, 'Golanjor Rural Municipality', 'municipality', 309),
(30904, 'Ghyanglekh Rural Municipality', 'municipality', 309),
(30905, 'Hariharpurgadhi Rural Municipality', 'municipality', 309),
(30906, 'Marin Rural Municipality', 'municipality', 309),
(30907, 'Phikkal Rural Municipality', 'municipality', 309),
(30908, 'Sunkoshi Rural Municipality', 'municipality', 309),
(30909, 'Tinpatan Rural Municipality', 'municipality', 309)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type, parent_id = EXCLUDED.parent_id;

-- Insert Municipalities in Ramechhap District
INSERT INTO locations (id, name, type, parent_id) VALUES
(31001, 'Ramechhap Municipality', 'municipality', 310),
(31002, 'Manthali Municipality', 'municipality', 310),
(31003, 'Umakunda Rural Municipality', 'municipality', 310),
(31004, 'Khandadevi Rural Municipality', 'municipality', 310),
(31005, 'Likhu Tamakoshi Rural Municipality', 'municipality', 310),
(31006, 'Doramba Rural Municipality', 'municipality', 310),
(31007, 'Gokulganga Rural Municipality', 'municipality', 310),
(31008, 'Sunapati Rural Municipality', 'municipality', 310)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type, parent_id = EXCLUDED.parent_id;

-- Insert Municipalities in Dolakha District
INSERT INTO locations (id, name, type, parent_id) VALUES
(31101, 'Bhimeshwar Municipality', 'municipality', 311),
(31102, 'Jiri Municipality', 'municipality', 311),
(31103, 'Baiteshwor Rural Municipality', 'municipality', 311),
(31104, 'Bigu Rural Municipality', 'municipality', 311),
(31105, 'Gaurishankar Rural Municipality', 'municipality', 311),
(31106, 'Kalinchok Rural Municipality', 'municipality', 311),
(31107, 'Melung Rural Municipality', 'municipality', 311),
(31108, 'Sailung Rural Municipality', 'municipality', 311),
(31109, 'Tamakoshi Rural Municipality', 'municipality', 311)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type, parent_id = EXCLUDED.parent_id;

-- Insert Municipalities in Sindhupalchok District
INSERT INTO locations (id, name, type, parent_id) VALUES
(31201, 'Chautara Sangachokgadhi Municipality', 'municipality', 312),
(31202, 'Barhabise Municipality', 'municipality', 312),
(31203, 'Melamchi Municipality', 'municipality', 312),
(31204, 'Balefi Rural Municipality', 'municipality', 312),
(31205, 'Bhotekoshi Rural Municipality', 'municipality', 312),
(31206, 'Helambu Rural Municipality', 'municipality', 312),
(31207, 'Indrawati Rural Municipality', 'municipality', 312),
(31208, 'Jugal Rural Municipality', 'municipality', 312),
(31209, 'Lisankhu Pakhar Rural Municipality', 'municipality', 312),
(31210, 'Panchpokhari Thangpal Rural Municipality', 'municipality', 312),
(31211, 'Sunkoshi Rural Municipality', 'municipality', 312),
(31212, 'Tripurasundari Rural Municipality', 'municipality', 312)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type, parent_id = EXCLUDED.parent_id;

-- Insert Municipalities in Kavrepalanchok District
INSERT INTO locations (id, name, type, parent_id) VALUES
(31301, 'Dhulikhel Municipality', 'municipality', 313),
(31302, 'Banepa Municipality', 'municipality', 313),
(31303, 'Panauti Municipality', 'municipality', 313),
(31304, 'Panchkhal Municipality', 'municipality', 313),
(31305, 'Namobuddha Municipality', 'municipality', 313),
(31306, 'Mandan Deupur Municipality', 'municipality', 313),
(31307, 'Khanikhola Rural Municipality', 'municipality', 313),
(31308, 'Chauri Deurali Rural Municipality', 'municipality', 313),
(31309, 'Temal Rural Municipality', 'municipality', 313),
(31310, 'Bethanchok Rural Municipality', 'municipality', 313),
(31311, 'Bhumlu Rural Municipality', 'municipality', 313),
(31312, 'Mahabharat Rural Municipality', 'municipality', 313),
(31313, 'Roshi Rural Municipality', 'municipality', 313)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type, parent_id = EXCLUDED.parent_id;

-- Update sequence to ensure future IDs don't conflict
SELECT setval('locations_id_seq', (SELECT MAX(id) FROM locations) + 1, false);
