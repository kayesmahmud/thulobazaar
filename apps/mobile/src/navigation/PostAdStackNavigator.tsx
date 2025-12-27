import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PostAdStackParamList } from './types';
import { COLORS } from '../constants/config';

// Screens
import PostAdScreen from '../screens/post-ad/PostAdScreen';
import SelectCategoryScreen from '../screens/post-ad/SelectCategoryScreen';
import SelectLocationScreen from '../screens/post-ad/SelectLocationScreen';

const Stack = createNativeStackNavigator<PostAdStackParamList>();

export default function PostAdStackNavigator() {
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
        name="PostAd"
        component={PostAdScreen}
        options={{ title: 'Post an Ad' }}
      />
      <Stack.Screen
        name="SelectCategory"
        component={SelectCategoryScreen}
        options={{ title: 'Select Category' }}
      />
      <Stack.Screen
        name="SelectLocation"
        component={SelectLocationScreen}
        options={{ title: 'Select Location' }}
      />
    </Stack.Navigator>
  );
}
