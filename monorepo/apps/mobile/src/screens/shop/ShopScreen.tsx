import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { COLORS } from '../../constants/config';
import { apiClient } from '../../lib/api';

interface Shop {
  id: number;
  name: string;
  slug: string;
  description?: string;
  phone?: string;
  isVerified: boolean;
  user?: {
    fullName: string;
  };
  ads?: Ad[];
}

interface Ad {
  id: number;
  title: string;
  slug: string;
  price: number;
}

export default function ShopScreen({ route, navigation }: any) {
  const { shopSlug } = route.params;
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadShop();
  }, [shopSlug]);

  const loadShop = async () => {
    try {
      const response = await apiClient.getShopBySlug(shopSlug);
      if (response.success && response.data) {
        setShop(response.data);
      }
    } catch (error) {
      console.error('Failed to load shop:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCall = () => {
    if (shop?.phone) {
      Linking.openURL(`tel:${shop.phone}`);
    }
  };

  const handleWhatsApp = () => {
    if (shop?.phone) {
      Linking.openURL(`whatsapp://send?phone=977${shop.phone}`);
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

  if (!shop) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Shop not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Shop Header */}
        <View style={styles.header}>
          <View style={styles.shopAvatar}>
            <Text style={styles.shopAvatarText}>🏪</Text>
          </View>
          <Text style={styles.shopName}>{shop.name}</Text>
          {shop.isVerified && (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>✓ Verified Business</Text>
            </View>
          )}
          {shop.description && (
            <Text style={styles.shopDescription}>{shop.description}</Text>
          )}
        </View>

        {/* Contact Buttons */}
        {shop.phone && (
          <View style={styles.contactButtons}>
            <TouchableOpacity style={styles.callButton} onPress={handleCall}>
              <Text style={styles.callButtonText}>📞 Call</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.whatsappButton} onPress={handleWhatsApp}>
              <Text style={styles.whatsappButtonText}>💬 WhatsApp</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Shop Ads */}
        <View style={styles.adsSection}>
          <Text style={styles.sectionTitle}>
            Products ({shop.ads?.length || 0})
          </Text>
        </View>
      </ScrollView>

      {/* Ads List */}
      <FlatList
        data={shop.ads || []}
        renderItem={renderAd}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.adsList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No products listed yet</Text>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: COLORS.gray[500],
    fontSize: 16,
  },
  header: {
    backgroundColor: COLORS.white,
    alignItems: 'center',
    padding: 24,
    marginBottom: 8,
  },
  shopAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  shopAvatarText: {
    fontSize: 40,
  },
  shopName: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.gray[900],
    marginBottom: 8,
  },
  verifiedBadge: {
    backgroundColor: COLORS.success,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  verifiedText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '500',
  },
  shopDescription: {
    fontSize: 14,
    color: COLORS.gray[600],
    textAlign: 'center',
    lineHeight: 20,
  },
  contactButtons: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: COLORS.white,
    marginBottom: 8,
  },
  callButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  callButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  whatsappButton: {
    flex: 1,
    backgroundColor: '#25D366',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  whatsappButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  adsSection: {
    backgroundColor: COLORS.white,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  adsList: {
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
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.gray[500],
    fontSize: 16,
  },
});
