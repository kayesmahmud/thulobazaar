# i18n Implementation Guide

This guide shows how to implement internationalization (i18n) for both Web and Mobile apps using shared translations.

## 📦 Package Structure

```
packages/translations/
├── en.json                 # English translations
├── ne.json                 # Nepali translations
├── src/
│   └── index.ts           # Export translations
├── package.json
└── tsconfig.json
```

---

## 📱 Mobile Implementation (React Native)

### Step 1: Install Dependencies

```bash
cd apps/mobile
npm install i18next react-i18next expo-localization @react-native-async-storage/async-storage
```

### Step 2: Add Translations Package Dependency

```json
// apps/mobile/package.json
{
  "dependencies": {
    "@thulobazaar/translations": "*"
  }
}
```

### Step 3: Create i18n Configuration

**File:** `apps/mobile/src/lib/i18n.ts`

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations } from '@thulobazaar/translations';

const LANGUAGE_KEY = '@thulobazaar_language';

// Language detector plugin
const languageDetector = {
  type: 'languageDetector',
  async: true,
  detect: async (callback: (lng: string) => void) => {
    try {
      // 1. Check if user has saved preference
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
      if (savedLanguage) {
        return callback(savedLanguage);
      }

      // 2. Check device language
      const deviceLanguage = Localization.locale; // e.g., "ne-NP", "en-US"
      const languageCode = deviceLanguage.split('-')[0]; // "ne" or "en"

      // 3. Use device language if supported, otherwise default to English
      callback(['ne', 'en'].includes(languageCode) ? languageCode : 'en');
    } catch (error) {
      console.error('Error detecting language:', error);
      callback('en');
    }
  },
  init: () => {},
  cacheUserLanguage: async (language: string) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, language);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: translations.en },
      ne: { translation: translations.ne },
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes
    },
    react: {
      useSuspense: false, // Important for React Native
    },
  });

export default i18n;
```

### Step 4: Initialize i18n in App Entry

**File:** `apps/mobile/App.tsx`

```typescript
import React from 'react';
import './src/lib/i18n'; // Import to initialize
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return <RootNavigator />;
}
```

### Step 5: Create Language Context (Optional but Recommended)

**File:** `apps/mobile/src/contexts/LanguageContext.tsx`

```typescript
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Language = 'en' | 'ne';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation();
  const [language, setLanguageState] = useState<Language>('en');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Wait for i18n to initialize
    if (i18n.language) {
      setLanguageState(i18n.language as Language);
      setIsLoading(false);
    }
  }, [i18n.language]);

  const setLanguage = async (lang: Language) => {
    try {
      await i18n.changeLanguage(lang);
      await AsyncStorage.setItem('@thulobazaar_language', lang);
      setLanguageState(lang);
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, isLoading }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
```

### Step 6: Usage in Components

**Example: HomeScreen**

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function HomeScreen() {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('home.title')}</Text>
      <Text style={styles.subtitle}>{t('home.subtitle')}</Text>

      <Text>{t('common.search')}</Text>
      <Text>{t('ads.postAd')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold' },
  subtitle: { fontSize: 16, color: '#666' },
});
```

**Example: Language Switcher Component**

```typescript
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useLanguage } from '../contexts/LanguageContext';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, language === 'en' && styles.active]}
        onPress={() => setLanguage('en')}
      >
        <Text style={styles.text}>English</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, language === 'ne' && styles.active]}
        onPress={() => setLanguage('ne')}
      >
        <Text style={styles.text}>नेपाली</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  active: {
    backgroundColor: '#007AFF',
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
  },
});
```

**Example: With Interpolation**

```typescript
import { useTranslation } from 'react-i18next';

export default function ValidationExample() {
  const { t } = useTranslation();

  // Using variables in translations
  const minLengthError = t('validation.minLength', { count: 5 });
  // English: "Minimum 5 characters required"
  // Nepali: "न्यूनतम 5 अक्षरहरू आवश्यक छ"

  return <Text>{minLengthError}</Text>;
}
```

---

## 🌐 Web Implementation (Next.js)

### Step 1: Install next-intl

```bash
cd apps/web
npm install next-intl
```

### Step 2: Add Translations Package Dependency

```json
// apps/web/package.json
{
  "dependencies": {
    "@thulobazaar/translations": "*"
  }
}
```

### Step 3: Configure next-intl

**File:** `apps/web/src/i18n/request.ts`

```typescript
import { getRequestConfig } from 'next-intl/server';
import { translations } from '@thulobazaar/translations';

export default getRequestConfig(async ({ locale }) => ({
  messages: translations[locale as 'en' | 'ne'],
}));
```

**File:** `apps/web/next.config.ts`

```typescript
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig = {
  // ... other config
};

export default withNextIntl(nextConfig);
```

**File:** `apps/web/src/middleware.ts`

```typescript
import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['en', 'ne'],
  defaultLocale: 'en',
});

export const config = {
  matcher: ['/', '/(en|ne)/:path*'],
};
```

### Step 4: Usage in Next.js Components

**Server Component:**

```typescript
import { useTranslations } from 'next-intl';

export default function HomePage() {
  const t = useTranslations('home');

  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('subtitle')}</p>
    </div>
  );
}
```

**Client Component:**

```typescript
'use client';

import { useTranslations } from 'next-intl';

export default function AdForm() {
  const t = useTranslations('postAd');

  return (
    <form>
      <h2>{t('title')}</h2>
      <input placeholder={t('adTitle')} />
    </form>
  );
}
```

---

## 🔧 Advanced Features

### 1. Pluralization

Add to translation files:

```json
{
  "ads": {
    "count": "{{count}} ad",
    "count_other": "{{count}} ads"
  }
}
```

Usage:

```typescript
const { t } = useTranslation();
t('ads.count', { count: 1 });  // "1 ad"
t('ads.count', { count: 5 });  // "5 ads"
```

### 2. Date/Number Formatting

```typescript
import { useTranslation } from 'react-i18next';

const { i18n } = useTranslation();

// Format numbers
const price = new Intl.NumberFormat(i18n.language, {
  style: 'currency',
  currency: 'NPR',
}).format(50000);

// Format dates
const date = new Intl.DateTimeFormat(i18n.language, {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
}).format(new Date());
```

### 3. Nepali Font Support

**For React Native:**

Install custom fonts:

```bash
npx expo install expo-font @expo-google-fonts/noto-sans-devanagari
```

Usage:

```typescript
import { useFonts, NotoSansDevanagari_400Regular } from '@expo-google-fonts/noto-sans-devanagari';

export default function App() {
  const [fontsLoaded] = useFonts({
    NotoSansDevanagari_400Regular,
  });

  // Use font
  <Text style={{ fontFamily: 'NotoSansDevanagari_400Regular' }}>
    नेपाली पाठ
  </Text>
}
```

**For Web:**

Add to `globals.css`:

```css
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap');

body {
  font-family: 'Noto Sans Devanagari', system-ui, sans-serif;
}
```

---

## 🎯 Best Practices

### 1. Organize Translations by Domain

```json
{
  "auth": { "login": "Login" },
  "ads": { "postAd": "Post Ad" },
  "profile": { "myProfile": "My Profile" }
}
```

### 2. Use Namespaces in Code

```typescript
const t = useTranslations('auth'); // Scoped to auth
t('login'); // auth.login
```

### 3. Type Safety (Optional but Recommended)

Create type definitions:

```typescript
// packages/translations/src/types.ts
import type en from '../en.json';

export type TranslationKeys = typeof en;
```

### 4. Add Translation Keys Helper

```typescript
// Get all translation keys for autocomplete
type Keys = keyof typeof translations.en;
```

---

## 🚀 Migration Steps for Existing Code

### Step 1: Build Translations Package

```bash
cd packages/translations
npm install
npm run build
```

### Step 2: Install in Apps

```bash
# Web
cd apps/web
npm install

# Mobile
cd apps/mobile
npm install
```

### Step 3: Replace Hardcoded Strings

**Before:**

```typescript
<Text>Welcome to ThuluBazaar</Text>
```

**After:**

```typescript
const { t } = useTranslation();
<Text>{t('auth.welcome')}</Text>
```

---

## 📝 Adding New Translations

1. Add to both `en.json` and `ne.json`
2. Run `npm run build` in `packages/translations`
3. Use `t('new.key')` in your components

---

## ✅ Testing i18n

### Test Language Switching

```typescript
import { render, screen, fireEvent } from '@testing-library/react-native';
import i18n from '../lib/i18n';

test('changes language', async () => {
  await i18n.changeLanguage('ne');
  expect(i18n.language).toBe('ne');

  await i18n.changeLanguage('en');
  expect(i18n.language).toBe('en');
});
```

---

## 🎉 Complete Example: LoginScreen

```typescript
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function LoginScreen() {
  const { t } = useTranslation();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('auth.welcome')}</Text>

      <TextInput
        style={styles.input}
        placeholder={t('auth.enterPhone')}
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />

      <TextInput
        style={styles.input}
        placeholder={t('auth.enterOTP')}
        value={otp}
        onChangeText={setOtp}
        keyboardType="number-pad"
      />

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>{t('auth.login')}</Text>
      </TouchableOpacity>

      <TouchableOpacity>
        <Text style={styles.link}>{t('auth.resendOTP')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 32 },
  input: { borderWidth: 1, padding: 12, borderRadius: 8, marginBottom: 16 },
  button: { backgroundColor: '#007AFF', padding: 16, borderRadius: 8 },
  buttonText: { color: 'white', textAlign: 'center', fontWeight: 'bold' },
  link: { color: '#007AFF', textAlign: 'center', marginTop: 16 },
});
```

When language is 'ne', all text automatically switches to Nepali!

---

## 🎯 Summary

✅ Shared translation files in `packages/translations`
✅ Mobile uses `react-i18next` + `expo-localization`
✅ Web uses `next-intl`
✅ Automatic language detection based on device
✅ User preference saved in AsyncStorage
✅ Type-safe with TypeScript
✅ Easy to maintain and extend

This approach gives you the **best of both worlds** - shared translations with platform-optimized implementations!
