// Duplicate ad detection utility to prevent spam and duplicate postings
// Checks for similar titles, descriptions, and other criteria

class DuplicateDetector {

  // Calculate similarity between two strings using Levenshtein distance
  calculateSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;

    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();

    if (s1 === s2) return 1;

    const maxLength = Math.max(s1.length, s2.length);
    if (maxLength === 0) return 1;

    const distance = this.levenshteinDistance(s1, s2);
    return (maxLength - distance) / maxLength;
  }

  // Levenshtein distance algorithm
  levenshteinDistance(str1, str2) {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  // Clean and normalize text for comparison
  normalizeText(text) {
    if (!text) return '';

    return text
      .toLowerCase()
      .trim()
      // Remove extra spaces
      .replace(/\s+/g, ' ')
      // Remove common words that don't affect uniqueness
      .replace(/\b(for|sale|selling|brand|new|used|good|excellent|condition|urgent|cheap|best|price|only|rs|rupees|nepal|kathmandu)\b/g, '')
      // Remove punctuation and special characters
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Extract key features from title for comparison
  extractKeyFeatures(title) {
    if (!title) return [];

    const normalized = this.normalizeText(title);
    const words = normalized.split(' ').filter(word => word.length > 2);

    // Return unique words sorted
    return [...new Set(words)].sort();
  }

  // Check if two ads are duplicates based on multiple criteria
  isDuplicate(newAd, existingAd, options = {}) {
    const {
      titleSimilarityThreshold = 0.85,    // 85% similar titles
      descriptionSimilarityThreshold = 0.75, // 75% similar descriptions
      priceTolerancePercent = 5,          // 5% price difference allowed
      sameCategoryRequired = true,        // Must be same category
      sameLocationRequired = false,       // Location can be different
      timeWindowHours = 24               // Check duplicates within 24 hours
    } = options;

    // Check if ads are within the time window
    if (timeWindowHours > 0) {
      const existingAdTime = new Date(existingAd.created_at);
      const currentTime = new Date();
      const hoursDiff = (currentTime - existingAdTime) / (1000 * 60 * 60);

      if (hoursDiff > timeWindowHours) {
        return { isDuplicate: false, reason: 'Outside time window' };
      }
    }

    // Check category (if required)
    if (sameCategoryRequired && newAd.categoryId !== existingAd.category_id) {
      return { isDuplicate: false, reason: 'Different categories' };
    }

    // Check location (if required)
    if (sameLocationRequired && newAd.locationId !== existingAd.location_id) {
      return { isDuplicate: false, reason: 'Different locations' };
    }

    // Calculate title similarity
    const titleSimilarity = this.calculateSimilarity(newAd.title, existingAd.title);
    console.log(`🔍 Title similarity: ${titleSimilarity} ("${newAd.title}" vs "${existingAd.title}")`);

    // Calculate description similarity
    const descriptionSimilarity = this.calculateSimilarity(newAd.description, existingAd.description);
    console.log(`🔍 Description similarity: ${descriptionSimilarity}`);

    // Check price similarity
    const newPrice = parseFloat(newAd.price);
    const existingPrice = parseFloat(existingAd.price);
    const priceDiffPercent = Math.abs(newPrice - existingPrice) / existingPrice * 100;

    // Determine if it's a duplicate
    const reasons = [];
    let duplicateScore = 0;

    if (titleSimilarity >= titleSimilarityThreshold) {
      reasons.push(`Title ${Math.round(titleSimilarity * 100)}% similar`);
      duplicateScore += 0.4;
    }

    if (descriptionSimilarity >= descriptionSimilarityThreshold) {
      reasons.push(`Description ${Math.round(descriptionSimilarity * 100)}% similar`);
      duplicateScore += 0.3;
    }

    if (priceDiffPercent <= priceTolerancePercent) {
      reasons.push(`Price within ${Math.round(priceDiffPercent)}% difference`);
      duplicateScore += 0.2;
    }

    // Check for exact key features match
    const newFeatures = this.extractKeyFeatures(newAd.title);
    const existingFeatures = this.extractKeyFeatures(existingAd.title);
    const commonFeatures = newFeatures.filter(feature => existingFeatures.includes(feature));
    const featureMatchRatio = commonFeatures.length / Math.max(newFeatures.length, existingFeatures.length, 1);

    if (featureMatchRatio >= 0.8) {
      reasons.push(`${Math.round(featureMatchRatio * 100)}% key features match`);
      duplicateScore += 0.1;
    }

    const isDuplicate = duplicateScore >= 0.6; // 60% or higher score indicates duplicate

    const finalScore = Math.round(duplicateScore * 100);

    return {
      isDuplicate,
      duplicateScore: finalScore,
      reasons,
      details: {
        titleSimilarity: Math.round(titleSimilarity * 100),
        descriptionSimilarity: Math.round(descriptionSimilarity * 100),
        priceDifference: Math.round(priceDiffPercent),
        featureMatch: Math.round(featureMatchRatio * 100),
        existingAdId: existingAd.id,
        existingAdTitle: existingAd.title
      }
    };
  }

  // Main function to check for duplicates against user's existing ads
  async checkForDuplicates(pool, newAd, userId, options = {}) {
    try {
      console.log(`🔍 Checking for duplicate ads for user ${userId}...`);

      // Get user's recent ads (last 30 days by default)
      const timeWindowHours = options.timeWindowHours || 24 * 30; // 30 days
      const query = `
        SELECT id, title, description, price, category_id, location_id, created_at
        FROM ads
        WHERE user_id = $1
          AND status = 'approved'
          AND created_at > NOW() - INTERVAL '${timeWindowHours} hours'
        ORDER BY created_at DESC
        LIMIT 50
      `;

      const result = await pool.query(query, [userId]);
      const existingAds = result.rows;

      console.log(`📊 Found ${existingAds.length} existing ads to check against`);

      if (existingAds.length === 0) {
        return {
          hasDuplicates: false,
          duplicates: [],
          message: 'No existing ads to compare'
        };
      }

      const duplicates = [];

      // Check new ad against each existing ad
      for (const existingAd of existingAds) {
        const duplicateCheck = this.isDuplicate(newAd, existingAd, options);

        console.log(`🔍 Comparing with ad #${existingAd.id} "${existingAd.title}" - Score: ${duplicateCheck.duplicateScore}%`);

        if (duplicateCheck.isDuplicate) {
          duplicates.push(duplicateCheck);
          console.log(`⚠️  Potential duplicate found: ${duplicateCheck.duplicateScore}% similarity with ad #${existingAd.id}`);
        }
      }

      return {
        hasDuplicates: duplicates.length > 0,
        duplicates,
        message: duplicates.length > 0
          ? `Found ${duplicates.length} potential duplicate(s)`
          : 'No duplicates detected'
      };

    } catch (error) {
      console.error('❌ Error checking for duplicates:', error);
      // Don't block ad creation if duplicate check fails
      return {
        hasDuplicates: false,
        duplicates: [],
        message: 'Duplicate check failed, allowing ad creation',
        error: error.message
      };
    }
  }

  // Generate user-friendly warning message
  generateDuplicateWarning(duplicateResult) {
    if (!duplicateResult.hasDuplicates) return null;

    const bestMatch = duplicateResult.duplicates[0]; // Get the most similar one

    return {
      type: 'duplicate_ad',
      severity: bestMatch.duplicateScore >= 90 ? 'high' : 'medium',
      title: bestMatch.duplicateScore >= 90 ? 'Duplicate Ad Detected' : 'Similar Ad Found',
      message: bestMatch.duplicateScore >= 90
        ? 'You already have an exact same post. Please check your existing ads before posting duplicates.'
        : `You have a similar ad: "${bestMatch.details.existingAdTitle}"`,
      suggestion: bestMatch.duplicateScore >= 90
        ? 'Go to your dashboard to view and manage your existing ads instead of creating duplicates.'
        : 'Consider updating your existing ad instead of creating a new one, or make this ad more unique.',
      details: {
        similarity: `${bestMatch.duplicateScore}% similar`,
        reasons: bestMatch.reasons,
        existingAdTitle: bestMatch.details.existingAdTitle,
        existingAdId: bestMatch.details.existingAdId
      },
      action: bestMatch.duplicateScore >= 90 ? 'blocked' : 'warning'
    };
  }
}

module.exports = new DuplicateDetector();