const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  user: 'elw',
  host: 'localhost',
  database: 'thulobazaar',
  password: '',
  port: 5432,
});

// Ad data based on images
const adsData = [
  {
    title: "3-Tier Document Organizer Tray - Office Desktop Storage",
    description: "Keep your workspace organized with this premium 3-tier document tray. Perfect for organizing files, papers, and documents. Durable metal construction with elegant black finish. Ideal for home office or professional workspace.",
    price: 2500,
    category_id: 1003, // Office Supplies & Stationary
    location_id: 30110, // Tarakeshwar Municipality
    user_id: 2,
    condition: 'new',
    image: "3 Tier Document Tray.webp",
    specifications: JSON.stringify({
      Material: "Metal",
      Color: "Black",
      Tiers: "3",
      Brand: "Generic",
      Condition: "Brand New"
    })
  },
  {
    title: "Modern Bedroom Furniture Set - Complete Package",
    description: "Elegant modern bedroom furniture set including bed frame, side tables, and wardrobe. Premium quality wood with beautiful finish. Perfect for transforming your bedroom into a luxurious space.",
    price: 85000,
    category_id: 401, // Bedroom Furniture
    location_id: 50201, // Tansen Municipality
    user_id: 8,
    condition: 'new',
    image: "Bedroom Furniture.jpeg",
    specifications: JSON.stringify({
      Material: "Engineered Wood",
      Set_Includes: "Bed, Wardrobe, Side Tables",
      Size: "King Size",
      Color: "Dark Brown",
      Warranty: "1 Year"
    })
  },
  {
    title: "Beautiful Budgie Parakeet - Friendly Pet Bird",
    description: "Adorable and friendly budgie parakeet looking for a loving home. Hand-tamed, healthy, and playful. Comes with cage and accessories. Perfect pet for families.",
    price: 3500,
    category_id: 601, // Pets
    location_id: 10406, // Kankai Municipality
    user_id: 2,
    condition: 'used',
    image: "Bird.webp",
    specifications: JSON.stringify({
      Type: "Budgerigar",
      Age: "6 months",
      Gender: "Male",
      Health_Status: "Excellent",
      Includes: "Cage and Accessories"
    })
  },
  {
    title: "Professional Basketball - Official Size",
    description: "High-quality basketball perfect for indoor and outdoor play. Official size and weight, durable rubber construction. Great grip and bounce. Ideal for training and casual games.",
    price: 1800,
    category_id: 902, // Sports
    location_id: 20501, // Chandrapur Municipality
    user_id: 13,
    condition: 'new',
    image: "buy bascket ball.webp",
    specifications: JSON.stringify({
      Size: "Official (Size 7)",
      Material: "Rubber",
      Use: "Indoor/Outdoor",
      Brand: "Spalding Style",
      Color: "Orange"
    })
  },
  {
    title: "Sedan Car - Well Maintained Daily Driver",
    description: "Reliable sedan car in excellent condition. Perfect for daily commuting. Well maintained with full service history. Clean interior and exterior. Ready to drive.",
    price: 1250000,
    category_id: 301, // Cars
    location_id: 30110, // Tarakeshwar Municipality
    user_id: 14,
    condition: 'used',
    image: "car.jpeg",
    specifications: JSON.stringify({
      Model_Year: "2018",
      Fuel_Type: "Petrol",
      Transmission: "Manual",
      Mileage: "45,000 km",
      Color: "Silver",
      Ownership: "First Owner"
    })
  },
  {
    title: "Persian Cat - Pure Breed Kitten",
    description: "Adorable Persian kitten available for adoption. Purebred, vaccinated, and litter trained. Playful and friendly temperament. Comes with health certificate and vaccination records.",
    price: 15000,
    category_id: 601, // Pets
    location_id: 50201, // Tansen Municipality
    user_id: 8,
    condition: 'used',
    image: "cat.png",
    specifications: JSON.stringify({
      Breed: "Persian",
      Age: "3 months",
      Gender: "Female",
      Vaccination: "Complete",
      Color: "White",
      Papers: "Included"
    })
  },
  {
    title: "Elegant Party Dress for Women - Size M",
    description: "Stunning party dress perfect for special occasions. Beautiful design with quality fabric. Comfortable fit and elegant look. Size medium, barely used, in excellent condition.",
    price: 3500,
    category_id: 805, // Western Wear
    location_id: 40109, // Sahid Lakhan Rural Municipality
    user_id: 2,
    condition: 'used',
    image: "Dress woman.jpg",
    specifications: JSON.stringify({
      Size: "M (Medium)",
      Material: "Polyester Blend",
      Color: "Red",
      Occasion: "Party/Evening",
      Condition: "Like New"
    })
  },
  {
    title: "Ferrari Sports Car - Luxury Performance Vehicle",
    description: "Stunning Ferrari sports car in pristine condition. Ultimate luxury and performance combined. Well maintained with full service history. Rare opportunity for supercar enthusiasts.",
    price: 25000000,
    category_id: 301, // Cars
    location_id: 30110, // Tarakeshwar Municipality
    user_id: 15,
    condition: 'used',
    image: "Ferrari car.webp",
    specifications: JSON.stringify({
      Brand: "Ferrari",
      Model_Year: "2020",
      Engine: "V8 Twin-Turbo",
      Horsepower: "710 HP",
      Color: "Rosso Red",
      Mileage: "8,000 km"
    })
  },
  {
    title: "Beautiful House for Sale - 3 Bedroom with Garden",
    description: "Spacious 3-bedroom house with beautiful garden. Prime location with modern amenities. Well-built structure with quality finishing. Perfect for families. Clear ownership papers.",
    price: 18500000,
    category_id: 505, // Houses For Sale
    location_id: 50503, // Bhumikasthan Municipality
    user_id: 13,
    condition: 'used',
    image: "House for sell.jpg",
    specifications: JSON.stringify({
      Bedrooms: "3",
      Bathrooms: "2",
      Area: "2,500 sq ft",
      Land: "5 aana",
      Parking: "2 cars",
      Floors: "2"
    })
  },
  {
    title: "Apple iPad - Latest Model 64GB WiFi",
    description: "Brand new Apple iPad with 64GB storage. WiFi model with beautiful retina display. Perfect for entertainment, work, and creativity. Includes original charger and box.",
    price: 65000,
    category_id: 209, // Tablets & Accessories
    location_id: 20501, // Chandrapur Municipality
    user_id: 14,
    condition: 'new',
    image: "iPad.webp",
    specifications: JSON.stringify({
      Brand: "Apple",
      Model: "iPad 10th Gen",
      Storage: "64GB",
      Screen: "10.9 inch",
      Connectivity: "WiFi",
      Warranty: "1 Year"
    })
  },
  {
    title: "iPhone 14 Pro 128GB Space Black - Like New",
    description: "iPhone 14 Pro in Space Black color. 128GB storage with all original accessories. Barely used, in mint condition with screen protector and case. No scratches or dents.",
    price: 145000,
    category_id: 101, // Mobile Phones
    location_id: 30110, // Tarakeshwar Municipality
    user_id: 2,
    condition: 'used',
    image: "iPhone-14-Pro-Space-Black-1138.jpg",
    specifications: JSON.stringify({
      Brand: "Apple",
      Model: "iPhone 14 Pro",
      Storage: "128GB",
      Color: "Space Black",
      Condition: "Like New",
      Battery_Health: "98%"
    })
  },
  {
    title: "MacBook Pro 13 inch - M1 Chip 8GB RAM 256GB SSD",
    description: "Powerful MacBook Pro with M1 chip. 8GB unified memory and 256GB SSD. Excellent performance for work and creativity. Battery health excellent. Includes original charger.",
    price: 125000,
    category_id: 201, // Laptops
    location_id: 50201, // Tansen Municipality
    user_id: 8,
    condition: 'used',
    image: "Macbook.jpeg",
    specifications: JSON.stringify({
      Brand: "Apple",
      Processor: "M1 Chip",
      RAM: "8GB",
      Storage: "256GB SSD",
      Screen: "13.3 inch Retina",
      Year: "2021"
    })
  },
  {
    title: "Honda Sport Motorcycle - 150cc Excellent Condition",
    description: "Honda sport bike 150cc in excellent running condition. Well maintained with regular servicing. Perfect for daily commute and weekend rides. Clean papers, ready for transfer.",
    price: 285000,
    category_id: 302, // Motorbikes
    location_id: 10406, // Kankai Municipality
    user_id: 14,
    condition: 'used',
    image: "Motorbike.png",
    specifications: JSON.stringify({
      Brand: "Honda",
      Engine: "150cc",
      Year: "2020",
      Mileage: "18,000 km",
      Color: "Black/Red",
      Condition: "Excellent"
    })
  },
  {
    title: "Men's Casual Pants - Size 32 Slim Fit",
    description: "Stylish men's casual pants in excellent condition. Comfortable slim fit design. Perfect for office or casual wear. Size 32 waist, barely worn.",
    price: 1500,
    category_id: 706, // Pants
    location_id: 50402, // Banganga Municipality
    user_id: 2,
    condition: 'used',
    image: "pants man.jpeg",
    specifications: JSON.stringify({
      Size: "32",
      Fit: "Slim Fit",
      Material: "Cotton Blend",
      Color: "Beige",
      Brand: "Generic"
    })
  },
  {
    title: "4K UHD Smart LED TV - 55 Inch with HDR",
    description: "Premium 55-inch 4K UHD Smart LED TV with stunning picture quality. Built-in WiFi, HDR support, and multiple HDMI ports. Perfect for movies, gaming, and streaming. Like new condition.",
    price: 75000,
    category_id: 207, // TVs
    location_id: 30110, // Tarakeshwar Municipality
    user_id: 13,
    condition: 'used',
    image: "Tv-4k-uhd-led.webp",
    specifications: JSON.stringify({
      Screen_Size: "55 inch",
      Resolution: "4K UHD (3840x2160)",
      Smart_TV: "Yes",
      HDR: "Yes",
      Connectivity: "WiFi, 3x HDMI, 2x USB",
      Brand: "Samsung Style"
    })
  }
];

async function migrateAds() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    console.log('🗑️  Step 1: Deleting existing ads and images...');
    await client.query('DELETE FROM ad_images');
    await client.query('DELETE FROM ads');
    await client.query('ALTER SEQUENCE ads_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE ad_images_id_seq RESTART WITH 1');
    console.log('✅ Deleted all existing ads\n');

    console.log('📁 Step 2: Copying images to uploads folder...');
    const uploadsDir = '/Users/elw/Documents/Web/thulobazaar/backend/uploads/ads';
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const sourceDir = '/Users/elw/Documents/Web/thulobazaar/monorepo/Ads-img';

    for (const ad of adsData) {
      const sourcePath = path.join(sourceDir, ad.image);
      const destPath = path.join(uploadsDir, ad.image);

      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, destPath);
        console.log(`  ✓ Copied ${ad.image}`);
      } else {
        console.log(`  ⚠️  Image not found: ${ad.image}`);
      }
    }
    console.log('✅ Images copied\n');

    console.log('📝 Step 3: Creating 15 new ads...');

    for (let i = 0; i < adsData.length; i++) {
      const ad = adsData[i];

      // Generate slug
      const slug = ad.title.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim() + `-${i + 1}`;

      // Create full description with specifications
      const specs = JSON.parse(ad.specifications);
      const specsText = Object.entries(specs)
        .map(([key, value]) => `${key.replace(/_/g, ' ')}: ${value}`)
        .join('\n');
      const fullDescription = `${ad.description}\n\nSpecifications:\n${specsText}`;

      // Insert ad
      const adResult = await client.query(
        `INSERT INTO ads (
          user_id, title, description, price, category_id, location_id,
          condition, status, slug, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
        RETURNING id`,
        [
          ad.user_id,
          ad.title,
          fullDescription,
          ad.price,
          ad.category_id,
          ad.location_id,
          ad.condition,
          'approved',
          slug
        ]
      );

      const adId = adResult.rows[0].id;

      // Get file stats
      const filePath = path.join(uploadsDir, ad.image);
      const stats = fs.statSync(filePath);
      const fileSize = stats.size;

      // Determine MIME type
      const ext = path.extname(ad.image).toLowerCase();
      const mimeTypes = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.webp': 'image/webp'
      };
      const mimeType = mimeTypes[ext] || 'image/jpeg';

      // Insert image
      await client.query(
        `INSERT INTO ad_images (
          ad_id, filename, original_name, file_path, file_size, mime_type, is_primary, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
        [
          adId,
          ad.image,
          ad.image,
          `uploads/ads/${ad.image}`,
          fileSize,
          mimeType,
          true
        ]
      );

      console.log(`  ✓ Created ad ${adId}: ${ad.title}`);
    }

    await client.query('COMMIT');

    console.log('\n✅ Migration completed successfully!');
    console.log(`📊 Total ads created: ${adsData.length}`);

    // Show summary
    const countResult = await client.query(`
      SELECT
        c.name as category,
        COUNT(*) as count
      FROM ads a
      JOIN categories c ON a.category_id = c.id
      GROUP BY c.name
      ORDER BY count DESC
    `);

    console.log('\n📈 Ads by category:');
    countResult.rows.forEach(row => {
      console.log(`  ${row.category}: ${row.count} ads`);
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error during migration:', error);
    throw error;
  } finally {
    client.release();
    pool.end();
  }
}

migrateAds().catch(console.error);
