import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { COLORS } from '../../constants/config';
import { AuthScreenProps } from '../../navigation/types';
import { apiClient } from '../../lib/api';

export default function PhoneLoginScreen({ navigation }: AuthScreenProps<'PhoneLogin'>) {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    // Validate phone (Nepal format)
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10 || !cleanPhone.startsWith('9')) {
      Alert.alert('Error', 'Please enter a valid 10-digit Nepal phone number');
      return;
    }

    setLoading(true);
    const result = await apiClient.sendOtp(cleanPhone);
    setLoading(false);

    if (result.success) {
      navigation.navigate('OtpVerification', { phone: cleanPhone });
    } else {
      Alert.alert('Error', result.error || 'Failed to send OTP');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.backButton}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Phone Login</Text>
            <Text style={styles.subtitle}>
              We'll send you a one-time verification code
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={styles.phoneInputContainer}>
                <View style={styles.countryCode}>
                  <Text style={styles.countryCodeText}>+977</Text>
                </View>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="98XXXXXXXX"
                  placeholderTextColor={COLORS.gray[400]}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.sendButton, loading && styles.sendButtonDisabled]}
              onPress={handleSendOtp}
              disabled={loading}
            >
              <Text style={styles.sendButtonText}>
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Info */}
          <View style={styles.info}>
            <Text style={styles.infoText}>
              By continuing, you agree to our Terms of Service and Privacy Policy
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  header: {
    marginBottom: 32,
  },
  backButton: {
    fontSize: 16,
    color: COLORS.primary,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.gray[900],
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.gray[500],
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray[700],
    marginBottom: 8,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  countryCode: {
    backgroundColor: COLORS.gray[100],
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: 'center',
  },
  countryCodeText: {
    fontSize: 16,
    color: COLORS.gray[700],
    fontWeight: '500',
  },
  phoneInput: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.gray[900],
  },
  sendButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  info: {
    marginTop: 24,
  },
  infoText: {
    color: COLORS.gray[400],
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
