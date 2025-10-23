import { prisma } from './client';

async function testDatabaseConnection() {
  console.log('🧪 Testing database connection...\n');

  try {
    // Test 1: Count total ads
    console.log('📊 Test 1: Counting ads...');
    const adsCount = await prisma.ads.count();
    console.log(`✅ Found ${adsCount} ads in database\n`);

    // Test 2: Count users
    console.log('👥 Test 2: Counting users...');
    const usersCount = await prisma.users.count();
    console.log(`✅ Found ${usersCount} users in database\n`);

    // Test 3: Count categories
    console.log('📁 Test 3: Counting categories...');
    const categoriesCount = await prisma.categories.count();
    console.log(`✅ Found ${categoriesCount} categories in database\n`);

    // Test 4: Count locations
    console.log('🗺️  Test 4: Counting locations...');
    const locationsCount = await prisma.locations.count();
    console.log(`✅ Found ${locationsCount} locations in database\n`);

    // Test 5: Fetch latest 5 ads with relations (complex query)
    console.log('🔍 Test 5: Fetching latest 5 ads with user and category...');
    const latestAds = await prisma.ads.findMany({
      take: 5,
      orderBy: {
        created_at: 'desc',
      },
      include: {
        users_ads_user_idTousers: {
          select: {
            id: true,
            email: true,
            full_name: true,
          },
        },
        categories: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    console.log(`✅ Fetched ${latestAds.length} ads with relations:`);
    latestAds.forEach((ad, index) => {
      console.log(`  ${index + 1}. "${ad.title}" by ${ad.users_ads_user_idTousers.full_name} in ${ad.categories.name}`);
    });

    console.log('\n✅ All tests passed! Database connection is working perfectly.\n');
    console.log('📈 Summary:');
    console.log(`   - Ads: ${adsCount}`);
    console.log(`   - Users: ${usersCount}`);
    console.log(`   - Categories: ${categoriesCount}`);
    console.log(`   - Locations: ${locationsCount}`);
    console.log('\n🎉 You can now use @thulobazaar/database in your Next.js app!\n');

  } catch (error) {
    console.error('❌ Database test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabaseConnection();
