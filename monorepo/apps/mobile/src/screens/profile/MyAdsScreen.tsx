import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { COLORS } from '../../constants/config';
import { ProfileScreenProps } from '../../navigation/types';
import { apiClient } from '../../lib/api';

interface Ad {
  id: number;
  title: string;
  slug: string;
  price: number;
  status: string;
  views?: number;
  createdAt: string;
}

export default function MyAdsScreen({ navigation }: ProfileScreenProps<'MyAds'>) {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMyAds();
  }, []);

  const loadMyAds = async () => {
    try {
      const response = await apiClient.getMyAds();
      if (response.success && response.data) {
        setAds(response.data);
      }
    } catch (error) {
      console.error('Failed to load my ads:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return COLORS.success;
      case 'pending':
        return COLORS.warning;
      case 'sold':
        return COLORS.gray[500];
      default:
        return COLORS.gray[400];
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
        <View style={styles.adMeta}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
          <Text style={styles.viewsText}>👁 {item.views || 0} views</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.moreButton}>
        <Text style={styles.moreIcon}>⋮</Text>
      </TouchableOpacity>
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
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No ads yet</Text>
            <Text style={styles.emptyText}>Your posted ads will appear here</Text>
            <TouchableOpacity
              style={styles.postAdButton}
              onPress={() => (navigation as any).navigate('PostAdTab')}
            >
              <Text style={styles.postAdButtonText}>Post Your First Ad</Text>
            </TouchableOpacity>
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
    padding: 16,
    flexGrow: 1,
  },
  adCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  adImagePlaceholder: {
    width: 100,
    height: 100,
    backgroundColor: COLORS.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  adImageText: {
    fontSize: 32,
  },
  adInfo: {
    flex: 1,
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
    marginBottom: 8,
  },
  adMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  viewsText: {
    fontSize: 12,
    color: COLORS.gray[500],
  },
  moreButton: {
    padding: 12,
  },
  moreIcon: {
    fontSize: 20,
    color: COLORS.gray[400],
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[800],
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.gray[500],
    marginBottom: 24,
  },
  postAdButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  postAdButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
});
