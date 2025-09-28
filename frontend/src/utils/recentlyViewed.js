const RECENTLY_VIEWED_KEY = 'thulobazaar_recently_viewed';
const MAX_RECENTLY_VIEWED = 10;

export const recentlyViewedUtils = {
  // Add an ad to recently viewed
  addToRecentlyViewed: (ad) => {
    try {
      const existing = recentlyViewedUtils.getRecentlyViewed();

      // Remove if already exists to avoid duplicates
      const filtered = existing.filter(item => item.id !== ad.id);

      // Add to beginning of array
      const updated = [ad, ...filtered];

      // Keep only the most recent MAX_RECENTLY_VIEWED items
      const trimmed = updated.slice(0, MAX_RECENTLY_VIEWED);

      localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(trimmed));

      console.log(`✅ Added to recently viewed: ${ad.title}`);
    } catch (error) {
      console.error('❌ Error adding to recently viewed:', error);
    }
  },

  // Get recently viewed ads
  getRecentlyViewed: () => {
    try {
      const stored = localStorage.getItem(RECENTLY_VIEWED_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('❌ Error getting recently viewed:', error);
      return [];
    }
  },

  // Remove an ad from recently viewed
  removeFromRecentlyViewed: (adId) => {
    try {
      const existing = recentlyViewedUtils.getRecentlyViewed();
      const filtered = existing.filter(item => item.id !== adId);
      localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(filtered));

      console.log(`✅ Removed from recently viewed: ${adId}`);
    } catch (error) {
      console.error('❌ Error removing from recently viewed:', error);
    }
  },

  // Clear all recently viewed
  clearRecentlyViewed: () => {
    try {
      localStorage.removeItem(RECENTLY_VIEWED_KEY);
      console.log('✅ Cleared recently viewed ads');
    } catch (error) {
      console.error('❌ Error clearing recently viewed:', error);
    }
  },

  // Get count of recently viewed
  getRecentlyViewedCount: () => {
    return recentlyViewedUtils.getRecentlyViewed().length;
  }
};