import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { COLORS } from '../../constants/config';
import { HomeScreenProps } from '../../navigation/types';
import { apiClient } from '../../lib/api';

interface Category {
  id: number;
  name: string;
  slug: string;
  icon?: string;
}

interface Ad {
  id: number;
  title: string;
  slug: string;
  price: number;
  location?: { name: string };
}

export default function HomeScreen({ navigation }: HomeScreenProps<'Home'>) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [recentAds, setRecentAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [categoriesRes, adsRes] = await Promise.all([
        apiClient.getCategories(),
        apiClient.getAds({ limit: 10 }),
      ]);

      if (categoriesRes.success && categoriesRes.data) {
        setCategories(categoriesRes.data);
      }
      if (adsRes.success && adsRes.data) {
        setRecentAds(adsRes.data.ads || adsRes.data);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>ThuluBazaar</Text>
        <TouchableOpacity style={styles.locationButton}>
          <Text style={styles.locationText}>All Nepal ▼</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <TouchableOpacity
        style={styles.searchBar}
        onPress={() => navigation.navigate('SearchTab' as any)}
      >
        <Text style={styles.searchPlaceholder}>Search for anything...</Text>
      </TouchableOpacity>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Categories Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <View style={styles.categoriesGrid}>
            {categories.slice(0, 8).map((category) => (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryItem}
                onPress={() =>
                  navigation.navigate('CategoryList', {
                    categorySlug: category.slug,
                    categoryName: category.name,
                  })
                }
              >
                <Text style={styles.categoryIcon}>{category.icon || '📦'}</Text>
                <Text style={styles.categoryName} numberOfLines={1}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Ads Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Ads</Text>
          {loading ? (
            <Text style={styles.loadingText}>Loading...</Text>
          ) : (
            <View style={styles.adsGrid}>
              {recentAds.map((ad) => (
                <TouchableOpacity
                  key={ad.id}
                  style={styles.adCard}
                  onPress={() => navigation.navigate('AdDetail', { slug: ad.slug })}
                >
                  <View style={styles.adImagePlaceholder}>
                    <Text style={styles.adImageText}>📷</Text>
                  </View>
                  <View style={styles.adInfo}>
                    <Text style={styles.adTitle} numberOfLines={2}>
                      {ad.title}
                    </Text>
                    <Text style={styles.adPrice}>Rs. {ad.price.toLocaleString()}</Text>
                    <Text style={styles.adLocation}>{ad.location?.name || 'Nepal'}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
  },
  logo: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.primary,
  },
  locationButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.gray[100],
    borderRadius: 20,
  },
  locationText: {
    fontSize: 14,
    color: COLORS.gray[700],
  },
  searchBar: {
    margin: 16,
    padding: 14,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  searchPlaceholder: {
    color: COLORS.gray[400],
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginHorizontal: 16,
    marginBottom: 12,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
  },
  categoryItem: {
    width: '25%',
    alignItems: 'center',
    padding: 8,
  },
  categoryIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 12,
    color: COLORS.gray[700],
    textAlign: 'center',
  },
  adsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
  },
  adCard: {
    width: '50%',
    padding: 8,
  },
  adImagePlaceholder: {
    height: 120,
    backgroundColor: COLORS.gray[200],
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adImageText: {
    fontSize: 32,
  },
  adInfo: {
    padding: 8,
  },
  adTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray[800],
    marginBottom: 4,
  },
  adPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 2,
  },
  adLocation: {
    fontSize: 12,
    color: COLORS.gray[500],
  },
  loadingText: {
    textAlign: 'center',
    color: COLORS.gray[500],
    padding: 20,
  },
});
