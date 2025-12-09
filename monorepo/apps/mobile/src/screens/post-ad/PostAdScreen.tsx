import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { COLORS } from '../../constants/config';

export default function PostAdScreen({ navigation }: any) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    location: '',
    isNegotiable: false,
  });

  const handleSubmit = () => {
    if (!formData.title || !formData.price || !formData.category) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    // TODO: Implement ad creation
    Alert.alert('Success', 'Feature coming soon!');
  };

  return (
    <ScrollView style={styles.container}>
      {/* Category Selection */}
      <TouchableOpacity
        style={styles.selectButton}
        onPress={() => navigation.navigate('SelectCategory')}
      >
        <Text style={styles.selectLabel}>Category *</Text>
        <View style={styles.selectValue}>
          <Text style={formData.category ? styles.selectValueText : styles.selectPlaceholder}>
            {formData.category || 'Select a category'}
          </Text>
          <Text style={styles.selectArrow}>›</Text>
        </View>
      </TouchableOpacity>

      {/* Title */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Ad Title *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., iPhone 15 Pro Max 256GB"
          placeholderTextColor={COLORS.gray[400]}
          value={formData.title}
          onChangeText={(text) => setFormData({ ...formData, title: text })}
          maxLength={100}
        />
        <Text style={styles.charCount}>{formData.title.length}/100</Text>
      </View>

      {/* Description */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Description *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe your item in detail..."
          placeholderTextColor={COLORS.gray[400]}
          value={formData.description}
          onChangeText={(text) => setFormData({ ...formData, description: text })}
          multiline
          numberOfLines={6}
          maxLength={5000}
          textAlignVertical="top"
        />
        <Text style={styles.charCount}>{formData.description.length}/5000</Text>
      </View>

      {/* Price */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Price (NPR) *</Text>
        <TextInput
          style={styles.input}
          placeholder="50000"
          placeholderTextColor={COLORS.gray[400]}
          value={formData.price}
          onChangeText={(text) => setFormData({ ...formData, price: text })}
          keyboardType="numeric"
        />
      </View>

      {/* Negotiable */}
      <TouchableOpacity
        style={styles.checkboxRow}
        onPress={() => setFormData({ ...formData, isNegotiable: !formData.isNegotiable })}
      >
        <View style={[styles.checkbox, formData.isNegotiable && styles.checkboxChecked]}>
          {formData.isNegotiable && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={styles.checkboxLabel}>Price is negotiable</Text>
      </TouchableOpacity>

      {/* Location Selection */}
      <TouchableOpacity
        style={styles.selectButton}
        onPress={() => navigation.navigate('SelectLocation')}
      >
        <Text style={styles.selectLabel}>Location *</Text>
        <View style={styles.selectValue}>
          <Text style={formData.location ? styles.selectValueText : styles.selectPlaceholder}>
            {formData.location || 'Select location'}
          </Text>
          <Text style={styles.selectArrow}>›</Text>
        </View>
      </TouchableOpacity>

      {/* Photos */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Photos *</Text>
        <TouchableOpacity style={styles.photoUpload}>
          <Text style={styles.photoUploadIcon}>📷</Text>
          <Text style={styles.photoUploadText}>Add Photos</Text>
          <Text style={styles.photoUploadHint}>Up to 10 photos</Text>
        </TouchableOpacity>
      </View>

      {/* Submit Button */}
      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>Post Ad</Text>
      </TouchableOpacity>

      {/* Bottom Padding */}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  inputGroup: {
    backgroundColor: COLORS.white,
    padding: 16,
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray[700],
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.gray[50],
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.gray[900],
  },
  textArea: {
    height: 150,
    paddingTop: 14,
  },
  charCount: {
    fontSize: 12,
    color: COLORS.gray[400],
    textAlign: 'right',
    marginTop: 4,
  },
  selectButton: {
    backgroundColor: COLORS.white,
    padding: 16,
    marginBottom: 8,
  },
  selectLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray[700],
    marginBottom: 8,
  },
  selectValue: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.gray[50],
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  selectValueText: {
    fontSize: 16,
    color: COLORS.gray[900],
  },
  selectPlaceholder: {
    fontSize: 16,
    color: COLORS.gray[400],
  },
  selectArrow: {
    fontSize: 20,
    color: COLORS.gray[400],
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    marginBottom: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: COLORS.gray[300],
    borderRadius: 6,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkmark: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
  checkboxLabel: {
    fontSize: 16,
    color: COLORS.gray[700],
  },
  photoUpload: {
    backgroundColor: COLORS.gray[50],
    borderWidth: 2,
    borderColor: COLORS.gray[200],
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  photoUploadIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  photoUploadText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.gray[700],
    marginBottom: 4,
  },
  photoUploadHint: {
    fontSize: 12,
    color: COLORS.gray[400],
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    margin: 16,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
  },
});
