import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS } from '../constants/config';

export default function LoadingScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>ThuluBazaar</Text>
      <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  logo: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 20,
  },
  loader: {
    marginTop: 20,
  },
});
