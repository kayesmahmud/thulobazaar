import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeStackParamList } from './types';
import { COLORS } from '../constants/config';

// Screens
import HomeScreen from '../screens/home/HomeScreen';
import AdDetailScreen from '../screens/ad/AdDetailScreen';
import CategoryListScreen from '../screens/home/CategoryListScreen';
import ShopScreen from '../screens/shop/ShopScreen';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export default function HomeStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.white,
        },
        headerTintColor: COLORS.gray[800],
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AdDetail"
        component={AdDetailScreen}
        options={{ title: 'Ad Details' }}
      />
      <Stack.Screen
        name="CategoryList"
        component={CategoryListScreen}
        options={({ route }) => ({ title: route.params.categoryName })}
      />
      <Stack.Screen
        name="Shop"
        component={ShopScreen}
        options={{ title: 'Shop' }}
      />
    </Stack.Navigator>
  );
}
