const pool = require('../config/database');
const { generateSlugForExistingAd } = require('../utils/slugUtils');

/**
 * Backfill slugs for all existing ads that don't have one
 */
async function backfillSlugs() {
  try {
    console.log('🔄 Starting slug backfill...');

    // Get all ads without slugs
    const result = await pool.query(
      'SELECT id, title FROM ads WHERE slug IS NULL ORDER BY id'
    );

    const ads = result.rows;
    console.log(`📋 Found ${ads.length} ads without slugs`);

    if (ads.length === 0) {
      console.log('✅ All ads already have slugs!');
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    // Generate and update slugs
    for (const ad of ads) {
      try {
        const slug = await generateSlugForExistingAd(ad.id, ad.title);

        await pool.query(
          'UPDATE ads SET slug = $1 WHERE id = $2',
          [slug, ad.id]
        );

        console.log(`✅ Ad #${ad.id}: "${ad.title}" → "${slug}"`);
        successCount++;
      } catch (error) {
        console.error(`❌ Failed to generate slug for ad #${ad.id}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n📊 Backfill Summary:');
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📝 Total: ${ads.length}`);

  } catch (error) {
    console.error('❌ Fatal error during backfill:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run if executed directly
if (require.main === module) {
  backfillSlugs()
    .then(() => {
      console.log('\n🎉 Slug backfill completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Slug backfill failed:', error);
      process.exit(1);
    });
}

module.exports = backfillSlugs;
