import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { COLORS } from '../../constants/config';
import { apiClient } from '../../lib/api';
import { useNavigation } from '@react-navigation/native';

interface Ad {
  id: number;
  title: string;
  slug: string;
  price: number;
  location?: { name: string };
}

export default function FavoritesScreen() {
  const navigation = useNavigation();
  const [favorites, setFavorites] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const response = await apiClient.getFavorites();
      if (response.success && response.data) {
        setFavorites(response.data);
      }
    } catch (error) {
      console.error('Failed to load favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderAd = ({ item }: { item: Ad }) => (
    <TouchableOpacity
      style={styles.adCard}
      onPress={() => (navigation as any).navigate('HomeTab', {
        screen: 'AdDetail',
        params: { slug: item.slug }
      })}
    >
      <View style={styles.adImagePlaceholder}>
        <Text style={styles.adImageText}>📷</Text>
      </View>
      <View style={styles.adInfo}>
        <Text style={styles.adTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.adPrice}>Rs. {item.price.toLocaleString()}</Text>
        <Text style={styles.adLocation}>{item.location?.name || 'Nepal'}</Text>
      </View>
      <TouchableOpacity style={styles.heartButton}>
        <Text style={styles.heartIcon}>❤️</Text>
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Saved Ads</Text>
      </View>
      <FlatList
        data={favorites}
        renderItem={renderAd}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>❤️</Text>
            <Text style={styles.emptyTitle}>No saved ads yet</Text>
            <Text style={styles.emptyText}>
              Save ads you like by tapping the heart icon
            </Text>
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
  header: {
    padding: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.gray[900],
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
    marginBottom: 2,
  },
  adLocation: {
    fontSize: 12,
    color: COLORS.gray[500],
  },
  heartButton: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  heartIcon: {
    fontSize: 20,
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
    textAlign: 'center',
  },
});
