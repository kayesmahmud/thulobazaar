import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { COLORS } from '../../constants/config';
import { apiClient } from '../../lib/api';

interface Category {
  id: number;
  name: string;
  slug: string;
  icon?: string;
  subcategories?: Category[];
}

export default function SelectCategoryScreen({ navigation }: any) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await apiClient.getCategories();
      if (response.success && response.data) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderCategory = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={styles.categoryItem}
      onPress={() => {
        if (item.subcategories && item.subcategories.length > 0) {
          setSelectedCategory(item);
        } else {
          // Select this category and go back
          navigation.goBack();
        }
      }}
    >
      <View style={styles.categoryInfo}>
        <Text style={styles.categoryIcon}>{item.icon || '📦'}</Text>
        <Text style={styles.categoryName}>{item.name}</Text>
      </View>
      {item.subcategories && item.subcategories.length > 0 && (
        <Text style={styles.arrow}>›</Text>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // Show subcategories if a category is selected
  if (selectedCategory) {
    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setSelectedCategory(null)}
        >
          <Text style={styles.backText}>← Back to categories</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{selectedCategory.name}</Text>
        <FlatList
          data={selectedCategory.subcategories}
          renderItem={renderCategory}
          keyExtractor={(item) => item.id.toString()}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={categories}
        renderItem={renderCategory}
        keyExtractor={(item) => item.id.toString()}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  backText: {
    fontSize: 16,
    color: COLORS.primary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[900],
    padding: 16,
    backgroundColor: COLORS.gray[50],
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  categoryName: {
    fontSize: 16,
    color: COLORS.gray[800],
  },
  arrow: {
    fontSize: 20,
    color: COLORS.gray[400],
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.gray[100],
    marginLeft: 52,
  },
});
