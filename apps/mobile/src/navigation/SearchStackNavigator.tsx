import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SearchStackParamList } from './types';
import { COLORS } from '../constants/config';

// Screens
import SearchScreen from '../screens/search/SearchScreen';
import SearchResultsScreen from '../screens/search/SearchResultsScreen';
import AdDetailScreen from '../screens/ad/AdDetailScreen';

const Stack = createNativeStackNavigator<SearchStackParamList>();

export default function SearchStackNavigator() {
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
        name="Search"
        component={SearchScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SearchResults"
        component={SearchResultsScreen}
        options={{ title: 'Results' }}
      />
      <Stack.Screen
        name="AdDetail"
        component={AdDetailScreen}
        options={{ title: 'Ad Details' }}
      />
    </Stack.Navigator>
  );
}
