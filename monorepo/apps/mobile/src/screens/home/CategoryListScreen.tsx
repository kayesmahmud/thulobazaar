import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { COLORS } from '../../constants/config';
import { HomeScreenProps } from '../../navigation/types';
import { apiClient } from '../../lib/api';

interface Ad {
  id: number;
  title: string;
  slug: string;
  price: number;
  location?: { name: string };
}

export default function CategoryListScreen({ navigation, route }: HomeScreenProps<'CategoryList'>) {
  const { categorySlug, categoryName } = route.params;
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAds();
  }, [categorySlug]);

  const loadAds = async () => {
    try {
      const response = await apiClient.getAds({ category: categorySlug });
      if (response.success && response.data) {
        setAds(response.data.ads || response.data);
      }
    } catch (error) {
      console.error('Failed to load ads:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderAd = ({ item }: { item: Ad }) => (
    <TouchableOpacity
      style={styles.adCard}
      onPress={() => navigation.navigate('AdDetail', { slug: item.slug })}
    >
      <View style={styles.adImagePlaceholder}>
        <Text style={styles.adImageText}>📷</Text>
      </View>
      <View style={styles.adInfo}>
        <Text style={styles.adTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.adPrice}>Rs. {item.price.toLocaleString()}</Text>
        <Text style={styles.adLocation}>{item.location?.name || 'Nepal'}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={ads}
        renderItem={renderAd}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No ads found in this category</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 8,
  },
  adCard: {
    flex: 1,
    margin: 8,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    overflow: 'hidden',
  },
  adImagePlaceholder: {
    height: 120,
    backgroundColor: COLORS.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  adImageText: {
    fontSize: 32,
  },
  adInfo: {
    padding: 12,
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
  emptyContainer: {
    flex: 1,
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.gray[500],
    fontSize: 16,
  },
});
