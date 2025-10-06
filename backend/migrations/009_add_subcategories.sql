-- Migration: Add subcategories support
-- Add parent_id column to categories table

ALTER TABLE categories ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES categories(id) ON DELETE CASCADE;

-- Create index for faster subcategory lookups
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);

-- Update existing categories with new icons and names
UPDATE categories SET icon = '💻' WHERE name = 'Electronics';
UPDATE categories SET name = 'Home & Living', icon = '🏠' WHERE name = 'Property';
UPDATE categories SET icon = '💼' WHERE name = 'Jobs';
UPDATE categories SET icon = '🔧' WHERE name = 'Services';
UPDATE categories SET name = 'Women''s Fashion & Beauty', icon = '👗' WHERE name = 'Fashion';
UPDATE categories SET name = 'Pets & Animals', icon = '🐾' WHERE name = 'Pets';

-- Migrate ads from old "Furniture" category to "Home & Living"
UPDATE ads SET category_id = 4 WHERE category_id = 7;

-- Now delete old Furniture category (will be replaced with Home & Living)
DELETE FROM categories WHERE name = 'Furniture';

-- Insert new top-level categories (only if they don't exist)
INSERT INTO categories (id, name, icon, slug) VALUES
(1, 'Mobiles', '📱', 'mobiles'),
(2, 'Electronics', '💻', 'electronics'),
(3, 'Vehicles', '🚗', 'vehicles'),
(4, 'Home & Living', '🏠', 'home-living'),
(5, 'Property', '🏢', 'property'),
(6, 'Pets & Animals', '🐾', 'pets-animals'),
(7, 'Men''s Fashion & Grooming', '👔', 'mens-fashion-grooming'),
(8, 'Women''s Fashion & Beauty', '👗', 'womens-fashion-beauty'),
(9, 'Hobbies, Sports & Kids', '⚽', 'hobbies-sports-kids'),
(10, 'Business & Industry', '🏭', 'business-industry'),
(11, 'Education', '📚', 'education'),
(12, 'Essentials', '🛒', 'essentials'),
(13, 'Jobs', '💼', 'jobs'),
(14, 'Services', '🔧', 'services'),
(15, 'Agriculture', '🌾', 'agriculture'),
(16, 'Overseas Jobs', '✈️', 'overseas-jobs')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  icon = EXCLUDED.icon,
  slug = EXCLUDED.slug;

-- Insert subcategories for Mobiles
INSERT INTO categories (id, name, slug, parent_id) VALUES
(101, 'Mobile Phones', 'mobile-phones', 1),
(102, 'Mobile Phone Accessories', 'mobile-phone-accessories', 1),
(103, 'Wearables', 'wearables', 1),
(104, 'SIM Cards', 'sim-cards', 1),
(105, 'Mobile Phone Services', 'mobile-phone-services', 1)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug, parent_id = EXCLUDED.parent_id;

-- Insert subcategories for Electronics
INSERT INTO categories (id, name, slug, parent_id) VALUES
(201, 'Laptops', 'laptops', 2),
(202, 'Laptop & Computer Accessories', 'laptop-computer-accessories', 2),
(203, 'Desktop Computers', 'desktop-computers', 2),
(204, 'Home Appliances', 'home-appliances', 2),
(205, 'ACs & Home Electronics', 'acs-home-electronics', 2),
(206, 'Audio & Sound Systems', 'audio-sound-systems', 2),
(207, 'TVs', 'tvs', 2),
(208, 'Cameras, Camcorders & Accessories', 'cameras-camcorders-accessories', 2),
(209, 'Tablets & Accessories', 'tablets-accessories', 2),
(210, 'TV & Video Accessories', 'tv-video-accessories', 2),
(211, 'Other Electronics', 'other-electronics', 2),
(212, 'Video Game Consoles & Accessories', 'video-game-consoles-accessories', 2),
(213, 'Photocopiers', 'photocopiers', 2)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug, parent_id = EXCLUDED.parent_id;

-- Insert subcategories for Vehicles
INSERT INTO categories (id, name, slug, parent_id) VALUES
(301, 'Cars', 'cars', 3),
(302, 'Motorbikes', 'motorbikes', 3),
(303, 'Bicycles', 'bicycles', 3),
(304, 'Auto Parts & Accessories', 'auto-parts-accessories', 3),
(305, 'Rentals', 'rentals', 3),
(306, 'Three Wheelers', 'three-wheelers', 3),
(307, 'Trucks', 'trucks', 3),
(308, 'Vans', 'vans', 3),
(309, 'Heavy Duty', 'heavy-duty', 3),
(310, 'Water Transport', 'water-transport', 3),
(311, 'Buses', 'buses', 3),
(312, 'Auto Services', 'auto-services', 3),
(313, 'Maintenance and Repair', 'maintenance-repair', 3)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug, parent_id = EXCLUDED.parent_id;

-- Insert subcategories for Home & Living
INSERT INTO categories (id, name, slug, parent_id) VALUES
(401, 'Bedroom Furniture', 'bedroom-furniture', 4),
(402, 'Living Room Furniture', 'living-room-furniture', 4),
(403, 'Office & Shop Furniture', 'office-shop-furniture', 4),
(404, 'Home Textiles & Decoration', 'home-textiles-decoration', 4),
(405, 'Household Items', 'household-items', 4),
(406, 'Kitchen & Dining Furniture', 'kitchen-dining-furniture', 4),
(407, 'Children''s Furniture', 'childrens-furniture', 4),
(408, 'Doors', 'doors', 4),
(409, 'Bathroom Products', 'bathroom-products', 4)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug, parent_id = EXCLUDED.parent_id;

-- Insert subcategories for Property
INSERT INTO categories (id, name, slug, parent_id) VALUES
(501, 'Land For Sale', 'land-for-sale', 5),
(502, 'Apartments For Sale', 'apartments-for-sale', 5),
(503, 'Apartment Rentals', 'apartment-rentals', 5),
(504, 'Commercial Property Rentals', 'commercial-property-rentals', 5),
(505, 'Houses For Sale', 'houses-for-sale', 5),
(506, 'Commercial Properties For Sale', 'commercial-properties-for-sale', 5),
(507, 'Room Rentals', 'room-rentals', 5),
(508, 'House Rentals', 'house-rentals', 5),
(509, 'Land Rentals', 'land-rentals', 5),
(510, 'New projects on PropertyGuide', 'new-projects-propertyguide', 5)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug, parent_id = EXCLUDED.parent_id;

-- Insert subcategories for Pets & Animals
INSERT INTO categories (id, name, slug, parent_id) VALUES
(601, 'Pets', 'pets', 6),
(602, 'Farm Animals', 'farm-animals', 6),
(603, 'Pet & Animal Accessories', 'pet-animal-accessories', 6),
(604, 'Pet & Animal food', 'pet-animal-food', 6),
(605, 'Other Pets & Animals', 'other-pets-animals', 6)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug, parent_id = EXCLUDED.parent_id;

-- Insert subcategories for Men's Fashion & Grooming
INSERT INTO categories (id, name, slug, parent_id) VALUES
(701, 'Watches', 'watches', 7),
(702, 'Shirts & T-Shirts', 'shirts-tshirts', 7),
(703, 'Footwear', 'footwear', 7),
(704, 'Bags & Accessories', 'bags-accessories', 7),
(705, 'Grooming & Bodycare', 'grooming-bodycare', 7),
(706, 'Pants', 'pants', 7),
(707, 'Traditional Clothing', 'traditional-clothing', 7),
(708, 'Jacket & Coat', 'jacket-coat', 7),
(709, 'Optical & Sunglasses', 'optical-sunglasses', 7),
(710, 'Baby Boy''s Fashion', 'baby-boys-fashion', 7),
(711, 'Wholesale - Bulk', 'wholesale-bulk', 7)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug, parent_id = EXCLUDED.parent_id;

-- Insert subcategories for Women's Fashion & Beauty
INSERT INTO categories (id, name, slug, parent_id) VALUES
(801, 'Traditional Wear', 'traditional-wear', 8),
(802, 'Beauty & Personal Care', 'beauty-personal-care', 8),
(803, 'Jewellery & Watches', 'jewellery-watches', 8),
(804, 'Bags & Accessories', 'bags-accessories-women', 8),
(805, 'Western Wear', 'western-wear', 8),
(806, 'Baby Girl''s Fashion', 'baby-girls-fashion', 8),
(807, 'Footwear', 'footwear-women', 8),
(808, 'Lingerie & Sleepwear', 'lingerie-sleepwear', 8),
(809, 'Wholesale - Bulk', 'wholesale-bulk-women', 8),
(810, 'Winter Wear', 'winter-wear', 8),
(811, 'Optical & Sunglasses', 'optical-sunglasses-women', 8)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug, parent_id = EXCLUDED.parent_id;

-- Insert subcategories for Hobbies, Sports & Kids
INSERT INTO categories (id, name, slug, parent_id) VALUES
(901, 'Musical Instruments', 'musical-instruments', 9),
(902, 'Sports', 'sports', 9),
(903, 'Children''s Items', 'childrens-items', 9),
(904, 'Other Hobby, Sport & Kids items', 'other-hobby-sport-kids', 9),
(905, 'Fitness & Gym', 'fitness-gym', 9),
(906, 'Music, Books & Movies', 'music-books-movies', 9)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug, parent_id = EXCLUDED.parent_id;

-- Insert subcategories for Business & Industry
INSERT INTO categories (id, name, slug, parent_id) VALUES
(1001, 'Industry Machinery & Tools', 'industry-machinery-tools', 10),
(1002, 'Other Business & Industry Items', 'other-business-industry', 10),
(1003, 'Office Supplies & Stationary', 'office-supplies-stationary', 10),
(1004, 'Medical Equipment & Supplies', 'medical-equipment-supplies', 10),
(1005, 'Raw Materials & Industrial Supplies', 'raw-materials-industrial-supplies', 10),
(1006, 'Licences, Titles & Tenders', 'licences-titles-tenders', 10),
(1007, 'Safety & Security', 'safety-security', 10)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug, parent_id = EXCLUDED.parent_id;

-- Insert subcategories for Education
INSERT INTO categories (id, name, slug, parent_id) VALUES
(1101, 'Textbooks', 'textbooks', 11),
(1102, 'Tuition', 'tuition', 11),
(1103, 'Courses', 'courses', 11),
(1104, 'Study Abroad', 'study-abroad', 11),
(1105, 'Other Education', 'other-education', 11)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug, parent_id = EXCLUDED.parent_id;

-- Insert subcategories for Essentials
INSERT INTO categories (id, name, slug, parent_id) VALUES
(1201, 'Grocery', 'grocery', 12),
(1202, 'Healthcare', 'healthcare', 12),
(1203, 'Other Essentials', 'other-essentials', 12),
(1204, 'Household', 'household', 12),
(1205, 'Baby Products', 'baby-products', 12),
(1206, 'Fruits & Vegetables', 'fruits-vegetables', 12),
(1207, 'Meat & Seafood', 'meat-seafood', 12)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug, parent_id = EXCLUDED.parent_id;

-- Insert subcategories for Jobs
INSERT INTO categories (id, name, slug, parent_id) VALUES
(1301, 'Accounting & Finance', 'accounting-finance', 13),
(1302, 'Administrative & Office', 'administrative-office', 13),
(1303, 'Construction & Trades', 'construction-trades', 13),
(1304, 'Healthcare & Medical', 'healthcare-medical', 13),
(1305, 'IT & Technology', 'it-technology', 13),
(1306, 'Retail & Sales', 'retail-sales', 13),
(1307, 'Transportation & Logistics', 'transportation-logistics', 13),
(1308, 'Other Jobs', 'other-jobs', 13)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug, parent_id = EXCLUDED.parent_id;

-- Insert subcategories for Services
INSERT INTO categories (id, name, slug, parent_id) VALUES
(1401, 'Servicing & Repair', 'servicing-repair', 14),
(1402, 'Media & Event Management Services', 'media-event-management', 14),
(1403, 'Tours & Travels', 'tours-travels', 14),
(1404, 'IT Services', 'it-services', 14),
(1405, 'Building maintenance', 'building-maintenance', 14),
(1406, 'Professional Services', 'professional-services', 14),
(1407, 'Matrimonials', 'matrimonials', 14),
(1408, 'Fitness & Beauty Services', 'fitness-beauty-services', 14),
(1409, 'Domestic & Daycare Services', 'domestic-daycare-services', 14)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug, parent_id = EXCLUDED.parent_id;

-- Insert subcategories for Agriculture
INSERT INTO categories (id, name, slug, parent_id) VALUES
(1501, 'Crops, Seeds & Plants', 'crops-seeds-plants', 15),
(1502, 'Farming Tools & Machinery', 'farming-tools-machinery', 15),
(1503, 'Other Agriculture', 'other-agriculture', 15)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug, parent_id = EXCLUDED.parent_id;

-- Insert subcategories for Overseas Jobs
INSERT INTO categories (id, name, slug, parent_id) VALUES
(1601, 'Bulgaria', 'bulgaria', 16),
(1602, 'Croatia', 'croatia', 16),
(1603, 'Serbia', 'serbia', 16),
(1604, 'Saudi Arabia', 'saudi-arabia', 16),
(1605, 'UAE', 'uae', 16),
(1606, 'Qatar', 'qatar', 16),
(1607, 'Malaysia', 'malaysia', 16),
(1608, 'Singapore', 'singapore', 16)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug, parent_id = EXCLUDED.parent_id;

-- Update sequence to ensure future IDs don't conflict
SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories) + 1, false);
