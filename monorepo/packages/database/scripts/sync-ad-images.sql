-- Sync ad_images to actual filesystem files
-- The DB has old filenames (ad-1759...) but filesystem has newer ones (ad-1761...)

-- First, clear old records that point to non-existent files
DELETE FROM ad_images;

-- Insert new records linking ads to actual files on disk
-- Files available (from ls apps/web/public/uploads/ads/):
-- ad-1761021546580-361291216.png
-- ad-1761021571326-19150883.png
-- ad-1761021775216-537377216.jpg
-- ad-1761022849356-148055632.jpg
-- ad-1761042982075-273737560.jpg
-- ad-1761043924823-852162138.jpg
-- etc.

-- Assign images to ads sequentially - just for test data
INSERT INTO ad_images (ad_id, filename, original_name, file_path, is_primary, created_at)
SELECT
  a.id,
  f.filename,
  f.filename,
  'uploads/ads/' || f.filename,
  true,
  NOW()
FROM ads a
CROSS JOIN LATERAL (
  SELECT filename FROM (VALUES
    ('ad-1761021546580-361291216.png'),
    ('ad-1761021571326-19150883.png'),
    ('ad-1761021775216-537377216.jpg'),
    ('ad-1761022849356-148055632.jpg'),
    ('ad-1761042982075-273737560.jpg'),
    ('ad-1761043924823-852162138.jpg'),
    ('ad-1761056396632-236250260.jpg'),
    ('ad-1761056396632-59647143.jpeg'),
    ('ad-1761056396632-886410752.jpg'),
    ('ad-1761059779582-743720815.jpeg'),
    ('ad-1761059815881-52401252.webp'),
    ('ad-1761093709243-589524983.webp'),
    ('ad-1761113582678-458264295.jpg'),
    ('ad-1761201360559-6459008.jpeg'),
    ('ad-1761669835897-543389266.jpg'),
    ('ad-1761670521881-170852583.jpg'),
    ('ad-1761670577223-384559087.jpg'),
    ('ad-1761756875877-665153333.jpg'),
    ('ad-1761819436442-659943675.jpg'),
    ('ad-1761824135481-200135858.jpg'),
    ('ad-1761824281656-247009361.jpg'),
    ('ad-1761824364096-131016234.jpg'),
    ('ad-1761924686878-135629555.jpg'),
    ('ad-1761940451668-131463091.webp'),
    ('ad-1762049497152-566055296.webp'),
    ('ad-1762051153455-750892295.jpg'),
    ('ad-1762051213929-695379009.webp'),
    ('ad-1762051284816-831614178.jpg'),
    ('ad-1762051338361-152082891.jpg'),
    ('ad-1762051385920-605012971.webp'),
    ('ad-1762051467591-168628917.jpg'),
    ('ad-1762122785704-608765621.jpg'),
    ('ad-1762124005461-612024078.webp'),
    ('ad-1762130099619-788181073.jpg'),
    ('ad-1762185595379-508088476.webp'),
    ('ad-1762256419893-195839866.jpg')
  ) AS files(filename)
  -- Use modulo to cycle through images
  OFFSET (a.id - 1) % 36
  LIMIT 1
) f
WHERE a.status = 'approved';
