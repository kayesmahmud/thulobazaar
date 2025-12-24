import { prisma } from '@thulobazaar/database';
import fs from 'fs';
import path from 'path';
const IMAGES_DIR = '/Users/elw/Documents/Web/thulobazaar/Images';
const UPLOADS_DIR = '/Users/elw/Documents/Web/thulobazaar/monorepo/apps/api/uploads/ads';

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * Generate SEO-friendly slug: title-for-sale-in-location-counter
 * Matches the format used in apps/web/src/lib/urls/slug.ts
 */
async function generateSlug(title, locationId) {
  const titleSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  // Get location name
  let locationSlug = '';
  if (locationId) {
    const location = await prisma.locations.findUnique({
      where: { id: locationId },
      select: { name: true },
    });
    if (location) {
      locationSlug = location.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }
  }

  // Build base slug: title-for-sale-in-location
  const baseSlug = locationSlug
    ? `${titleSlug}-for-sale-in-${locationSlug}`
    : `${titleSlug}-for-sale`;

  // Find next available counter
  let counter = 1;
  while (counter < 1000) {
    const testSlug = `${baseSlug}-${counter}`;
    const existing = await prisma.ads.findFirst({
      where: { slug: testSlug },
      select: { id: true },
    });
    if (!existing) {
      return testSlug;
    }
    counter++;
  }

  // Fallback (should never reach here)
  return `${baseSlug}-${Date.now()}`;
}

function findImages(folderPath) {
  const images = [];
  if (!fs.existsSync(folderPath)) return images;

  const files = fs.readdirSync(folderPath);

  // Find main image first
  const mainPatterns = ['Main Image', 'main Image', 'Main image', 'main image', 'Main mage'];
  for (const pattern of mainPatterns) {
    for (const file of files) {
      if (file.toLowerCase().startsWith(pattern.toLowerCase())) {
        images.push({ file, isMain: true });
        break;
      }
    }
    if (images.length > 0) break;
  }

  // Find other images in order
  const orderPatterns = ['2nd', '3rd', '4th', '5th', '6th'];
  for (const order of orderPatterns) {
    for (const file of files) {
      if (file.toLowerCase().startsWith(order.toLowerCase())) {
        images.push({ file, isMain: false });
        break;
      }
    }
  }

  return images;
}

async function createAd(userId, title, description, price, categoryId, locationId, condition, folderName, sellerName, sellerPhone) {
  const slug = await generateSlug(title, locationId);
  const folderPath = path.join(IMAGES_DIR, folderName);

  // Create ad
  const ad = await prisma.ads.create({
    data: {
      user_id: userId,
      title,
      description,
      price,
      category_id: categoryId,
      location_id: locationId,
      condition,
      slug,
      status: 'approved',
      seller_name: sellerName,
      seller_phone: sellerPhone,
    }
  });

  console.log(`Created ad #${ad.id}: ${title}`);

  // Process images
  const images = findImages(folderPath);
  let imgOrder = 1;

  for (const img of images) {
    const srcPath = path.join(folderPath, img.file);
    const ext = path.extname(img.file);
    const newName = `${ad.id}_${imgOrder}_${Date.now()}${ext}`;
    const destPath = path.join(UPLOADS_DIR, newName);

    fs.copyFileSync(srcPath, destPath);

    await prisma.ad_images.create({
      data: {
        ad_id: ad.id,
        filename: newName,
        file_path: `/uploads/ads/${newName}`,
        is_primary: img.isMain,
        original_name: img.file,
      }
    });

    console.log(`  - Added image: ${newName}`);
    imgOrder++;
  }

  return ad;
}

async function main() {
  console.log('==========================================');
  console.log('Creating Demo Ads');
  console.log('==========================================\n');

  // ==========================================
  // DIJA FASHION SHOP (ID: 62) - Fashion Items
  // ==========================================
  console.log('>>> Creating Fashion Ads for Dija Fashion Shop (ID: 62)\n');

  const fashionAds = [
    { title: 'Double-Breasted Trench Coat', desc: 'Elegant double-breasted trench coat perfect for autumn and spring. Features classic styling with modern details. High-quality fabric with water-resistant finish.', price: 12500, cat: 810, folder: 'Double-Breasted Trench Coat' },
    { title: 'Ramie Shirt with Pockets', desc: 'Comfortable ramie shirt featuring convenient front pockets. Breathable natural fabric perfect for warm weather. Relaxed fit with button-down front.', price: 3500, cat: 805, folder: 'Ramie Shirt with Pockets' },
    { title: 'Shoulder Straps Fitted Top', desc: 'Stylish fitted top with elegant shoulder straps. Perfect for parties and evening events. Comfortable stretch fabric.', price: 2800, cat: 805, folder: 'Shoulder Straps Fitted Top' },
    { title: 'Crossback Halter Dress', desc: 'Beautiful crossback halter dress for special occasions. Elegant design with flattering silhouette. Premium quality fabric.', price: 8500, cat: 805, folder: 'Crossback Halter Dress' },
    { title: 'Foil Spot Mini Dress', desc: 'Trendy foil spot mini dress that shines at any party. Eye-catching metallic spots on quality fabric.', price: 6500, cat: 805, folder: 'Foil spot mini dress' },
    { title: 'Sequin Textured Knit A-Line Gown', desc: 'Stunning sequin textured knit A-line gown for glamorous events. Beautiful sparkle effect with comfortable knit fabric.', price: 15000, cat: 805, folder: 'Sequin Textured Knit A-Line Gown' },
    { title: 'Excursion Hooded Long Sleeve Dress', desc: 'Versatile hooded long sleeve dress for active lifestyle. Comfortable fabric with practical hood.', price: 5500, cat: 805, folder: 'Excursion Hooded Long Sleeve Dress' },
    { title: 'High Waist Denim Shorts', desc: 'Classic high waist denim shorts for summer style. Flattering high-rise fit with quality denim fabric.', price: 3200, cat: 805, folder: 'High Waist Denim Shorts' },
    { title: 'Octavia V-Waist Sweater Skirt', desc: 'Elegant V-waist sweater skirt for cooler days. Soft knit fabric with flattering V-waist design.', price: 4200, cat: 805, folder: 'Octavia V-Waist Sweater Skirt' },
    { title: 'Kate Crystal Embellished Pointed Toe Pump Shoes', desc: 'Luxurious crystal embellished pointed toe pump shoes. Elegant design with sparkling crystal details.', price: 9500, cat: 807, folder: 'Kate Crystal Embellished Pointed Toe Pump Shoes' },
    { title: 'Crystal Embellished Platform Slide Sandal', desc: 'Glamorous crystal embellished platform slide sandals. Eye-catching crystals on comfortable platform base.', price: 7500, cat: 807, folder: 'Crystal Embellished Pointed Toe Platform Slide Sandal' },
    { title: 'Abstract Print Cotton Blouse', desc: 'Artistic abstract print cotton blouse for unique style. Breathable cotton fabric with vibrant print.', price: 2900, cat: 805, folder: 'Abstract Print Cotton Blouse' },
    { title: 'Cashmere Tank and Bag Set', desc: 'Luxurious cashmere tank top with matching bag. Premium quality cashmere for ultimate comfort.', price: 11000, cat: 805, folder: 'Cashmere Tank + Bag Women' },
    { title: 'V-Neck Pure Cotton T-shirt', desc: 'Essential V-neck pure cotton T-shirt for everyday comfort. Soft breathable cotton fabric.', price: 1800, cat: 805, folder: 'V-Neck Pure Cotton T-shirt' },
    { title: 'Washed Denim Men Shirt', desc: 'Classic washed denim shirt for men. Soft washed fabric with vintage appeal.', price: 3800, cat: 702, folder: 'Washed Denim Men Shirt' },
  ];

  const locations = [71166, 71167, 71168, 71169, 71170, 71171, 71172, 71173, 71174, 71175, 71176, 71177, 71178, 71179, 71180];

  for (let i = 0; i < fashionAds.length; i++) {
    const ad = fashionAds[i];
    await createAd(62, ad.title, ad.desc, ad.price, ad.cat, locations[i % locations.length], 'new', ad.folder, 'Dija Fashion Shop', '9706657812');
  }

  console.log('\n>>> Creating Mobile Ads for Alina Gurung (ID: 63)\n');

  const mobileAds = [
    { title: 'Apple iPhone 17 256GB - Sage', desc: 'Brand new Apple iPhone 17 in beautiful Sage color. 256GB storage. Latest A18 chip with incredible performance. Advanced camera system.', price: 185000, folder: 'Apple - iPhone 17 256GB - Sage' },
    { title: 'Google Pixel 10 Pro 128GB', desc: 'Google Pixel 10 Pro with 128GB storage. Best-in-class camera with AI features. Pure Android experience.', price: 125000, folder: 'Google - Pixel 10 Pro 128GB' },
    { title: 'Motorola Moto G Play 2024 64GB', desc: 'Affordable Motorola Moto G Play 2024. 64GB storage, great battery life. Perfect for everyday use.', price: 18000, folder: 'Motorola - moto g play 2024 64GB' },
    { title: 'Samsung Galaxy S25+ 256GB', desc: 'Samsung Galaxy S25+ flagship phone. 256GB storage, stunning display, powerful processor.', price: 145000, folder: 'Samsung - Galaxy S25+ 256GB' },
  ];

  for (let i = 0; i < mobileAds.length; i++) {
    const ad = mobileAds[i];
    await createAd(63, ad.title, ad.desc, ad.price, 101, locations[(i + 5) % locations.length], 'new', ad.folder, 'Alina Gurung', '9803093361');
  }

  console.log('\n>>> Creating Laptop Ads for Ananda Shahi (ID: 59)\n');

  const laptopAds = [
    { title: 'Acer Swift Edge 16" Laptop Ryzen 7', desc: 'Refurbished Excellent - Acer Swift Edge 16" with AMD Ryzen 7 7735U, 16GB RAM, 1TB SSD. Lightweight and powerful.', price: 95000, folder: 'Acer - Refurbished Excellent - Swift Edge - 16" Laptop AMD Ryzen 7 7735U 2.7GHz 16GB RAM 1TB SSD' },
    { title: 'Apple MacBook Air 13" M4 Chip 16GB 512GB', desc: 'Apple MacBook Air 13-inch with M4 chip. Built for Apple Intelligence. 16GB Memory, 512GB SSD.', price: 185000, folder: 'Apple - MacBook Air 13-inch Laptop - Apple M4 chip Built for Apple Intelligence - 16GB Memory - 512GB SSD ' },
    { title: 'Dell Premium 16" 4K RTX 5060 Laptop', desc: 'Dell Premium 16" 4K Touchscreen with Intel Core Ultra 9, 32GB RAM, RTX 5060, 1TB SSD. Ultimate performance.', price: 285000, folder: 'Dell - Premium - 16" 4K Touchscreen Laptop - Intel Core Ultra 9 285H - 32GB Memory - NVIDIA GeForce RTX 5060 - 1TB Storage' },
    { title: 'Lenovo IdeaPad Slim 3 15.6" Touchscreen', desc: 'Lenovo IdeaPad Slim 3 with AMD Ryzen 7, 16GB RAM, 512GB SSD. Full HD Touchscreen.', price: 75000, folder: 'Lenovo - IdeaPad Slim 3 15.6" Full HD Touchscreen Laptop - AMD Ryzen 7 5825U 2025 - 16GB Memory - 512GB SSD ' },
    { title: 'Samsung Galaxy Book5 360 15.6" AMOLED', desc: 'Samsung Galaxy Book5 360 Copilot+ PC. 15.6" FHD AMOLED Touch, Intel Core Ultra 7, 16GB, 512GB SSD.', price: 165000, folder: 'Samsung - Galaxy Book5 360 - Copilot+ PC - 15.6" FHD AMOLED Touch-Screen Laptop - Intel Core Ultra 7 - 16GB Memory - 512GB SSD' },
    { title: 'Samsung Galaxy Chromebook Go 14"', desc: 'Samsung Galaxy Chromebook Go 14" LED with Intel Celeron. Perfect for students and basic tasks.', price: 35000, folder: 'Samsung - Galaxy Chromebook Go - 14" LED Laptop - Intel Celeron' },
  ];

  for (let i = 0; i < laptopAds.length; i++) {
    const ad = laptopAds[i];
    await createAd(59, ad.title, ad.desc, ad.price, 201, locations[(i + 3) % locations.length], 'new', ad.folder, 'Ananda Shahi', '9843963410');
  }

  console.log('\n>>> Creating Car Ads for Akash Subedi (ID: 47)\n');

  const carAds = [
    { title: '2013 Kia Optima EX', desc: '2013 Kia Optima EX in excellent condition. Well-maintained, single owner. Fuel efficient and comfortable.', price: 2850000, folder: '2013 Kia Optima EX car' },
    { title: '2015 Audi Q5 3.0T quattro Premium Plus', desc: '2015 Audi Q5 3.0T quattro Premium Plus. Luxury SUV with powerful engine. All-wheel drive.', price: 4500000, folder: '2015 Audi Q5 3.0T quattro Premium Plus Car' },
    { title: '2021 Mercedes-Benz S-Class S 580', desc: '2021 Mercedes-Benz S-Class S 580. Ultimate luxury sedan. Fully loaded with premium features.', price: 18500000, folder: '2021 Mercedes-Benz S-Class S 580' },
    { title: '2023 Land Rover Defender', desc: '2023 Land Rover Defender. Iconic off-road capability with modern luxury. Adventure ready.', price: 15500000, folder: '2023 Land Rover Defender ' },
    { title: '2025 Chevrolet New Model', desc: 'Brand new 2025 Chevrolet. Latest model with modern features. Factory warranty included.', price: 6500000, folder: 'Chevrolet 2025 car' },
  ];

  for (let i = 0; i < carAds.length; i++) {
    const ad = carAds[i];
    await createAd(47, ad.title, ad.desc, ad.price, 301, locations[(i + 7) % locations.length], 'used', ad.folder, 'Akash Subedi', '9823241785');
  }

  console.log('\n>>> Creating Real Estate Ads for Amit Sharma (ID: 60)\n');

  await createAd(60, 'Beautiful Bungalow For Sale',
    'Spacious bungalow in prime location. 4 bedrooms, 3 bathrooms, large garden. Modern kitchen and living areas. Peaceful neighborhood. Ready to move in.',
    35000000, 505, 71182, 'new', 'Bungalow on sale', 'Amit Sharma', '9844463084');

  console.log('\n==========================================');
  console.log('All demo ads created successfully!');
  console.log('==========================================');
}

main().catch(console.error);
