import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { COLORS } from '../../constants/config';
import { AuthScreenProps } from '../../navigation/types';

export default function WelcomeScreen({ navigation }: AuthScreenProps<'Welcome'>) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <Text style={styles.logo}>ThuluBazaar</Text>
          <Text style={styles.tagline}>Nepal's Leading Classifieds Marketplace</Text>
        </View>

        {/* Buttons Section */}
        <View style={styles.buttonSection}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.primaryButtonText}>Login</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.secondaryButtonText}>Create Account</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.phoneButton}
            onPress={() => navigation.navigate('PhoneLogin')}
          >
            <Text style={styles.phoneButtonText}>Login with Phone</Text>
          </TouchableOpacity>
        </View>

        {/* Skip Option */}
        <TouchableOpacity style={styles.skipButton}>
          <Text style={styles.skipText}>Browse without account</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logo: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: COLORS.gray[500],
    textAlign: 'center',
  },
  buttonSection: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: COLORS.white,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  phoneButton: {
    backgroundColor: COLORS.gray[100],
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  phoneButtonText: {
    color: COLORS.gray[700],
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  skipText: {
    color: COLORS.gray[500],
    fontSize: 14,
  },
});
