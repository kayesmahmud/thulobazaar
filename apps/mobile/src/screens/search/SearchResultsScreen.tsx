import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { COLORS } from '../../constants/config';
import { SearchScreenProps } from '../../navigation/types';
import { apiClient } from '../../lib/api';

interface Ad {
  id: number;
  title: string;
  slug: string;
  price: number;
  location?: { name: string };
}

export default function SearchResultsScreen({ navigation, route }: SearchScreenProps<'SearchResults'>) {
  const { query, category, location } = route.params;
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResults();
  }, [query, category, location]);

  const loadResults = async () => {
    try {
      const response = await apiClient.getAds({
        search: query,
        category,
        location,
      });
      if (response.success && response.data) {
        setAds(response.data.ads || response.data);
      }
    } catch (error) {
      console.error('Failed to load results:', error);
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

  return (
    <View style={styles.container}>
      {/* Filters Bar */}
      <View style={styles.filtersBar}>
        <TouchableOpacity style={styles.filterChip}>
          <Text style={styles.filterChipText}>Filter</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterChip}>
          <Text style={styles.filterChipText}>Sort</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterChip}>
          <Text style={styles.filterChipText}>Location</Text>
        </TouchableOpacity>
      </View>

      {/* Results Count */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {loading ? 'Searching...' : `${ads.length} results`}
          {query && ` for "${query}"`}
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={ads}
          renderItem={renderAd}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyTitle}>No results found</Text>
              <Text style={styles.emptyText}>Try different keywords or filters</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  filtersBar: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: COLORS.white,
    gap: 8,
  },
  filterChip: {
    backgroundColor: COLORS.gray[100],
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterChipText: {
    fontSize: 13,
    color: COLORS.gray[700],
  },
  resultsHeader: {
    padding: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  resultsCount: {
    fontSize: 14,
    color: COLORS.gray[500],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 8,
    flexGrow: 1,
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
  },
});
