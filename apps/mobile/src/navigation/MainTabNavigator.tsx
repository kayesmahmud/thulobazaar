import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from './types';
import { COLORS } from '../constants/config';

// Stack Navigators
import HomeStackNavigator from './HomeStackNavigator';
import SearchStackNavigator from './SearchStackNavigator';
import PostAdStackNavigator from './PostAdStackNavigator';
import ProfileStackNavigator from './ProfileStackNavigator';

// Placeholder for Favorites (can be a simple screen)
import FavoritesScreen from '../screens/home/FavoritesScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray[400],
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopColor: COLORS.gray[200],
          paddingTop: 5,
          paddingBottom: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            // Using emoji as placeholder - replace with proper icon library
            <TabIcon emoji="🏠" color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="SearchTab"
        component={SearchStackNavigator}
        options={{
          tabBarLabel: 'Search',
          tabBarIcon: ({ color, size }) => (
            <TabIcon emoji="🔍" color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="PostAdTab"
        component={PostAdStackNavigator}
        options={{
          tabBarLabel: 'Sell',
          tabBarIcon: ({ color, size }) => (
            <TabIcon emoji="➕" color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="FavoritesTab"
        component={FavoritesScreen}
        options={{
          tabBarLabel: 'Saved',
          tabBarIcon: ({ color, size }) => (
            <TabIcon emoji="❤️" color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <TabIcon emoji="👤" color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// Simple emoji icon component (replace with proper icons later)
function TabIcon({ emoji, color }: { emoji: string; color: string }) {
  return (
    <React.Fragment>
      {/* Text component would go here - keeping simple for foundation */}
    </React.Fragment>
  );
}
