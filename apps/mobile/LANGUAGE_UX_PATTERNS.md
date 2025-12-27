# Language Selection UX Patterns for ThuluBazaar Mobile

## 🎯 Recommended User Flow

### **Option 1: Smart Auto-Detection (Recommended - Best UX)**

**How it works:**
```
User opens app for first time
    ↓
App detects device language automatically
    ↓
Device in Nepali? → App opens in Nepali
Device in English? → App opens in English
    ↓
User can change anytime from Settings
```

**Why this is best:**
- ✅ Zero friction - no extra screen
- ✅ Works automatically for 95% of users
- ✅ Still allows manual override
- ✅ Remembers user preference

---

### **Option 2: Language Selection on First Launch**

**How it works:**
```
User opens app for first time
    ↓
Shows "Choose Language" welcome screen
    ↓
User picks English or नेपाली
    ↓
Goes to main app
    ↓
Can change later from Settings
```

**When to use:**
- If you want to explicitly ask users
- If device detection might be unreliable
- If this is a critical choice for your users

---

### **Option 3: Hybrid Approach (Best of Both)**

**How it works:**
```
User opens app for first time
    ↓
Auto-detect device language
    ↓
Show 2-second splash with detected language
    ↓
Small "Change Language" button at bottom
    ↓
User can tap to change or auto-proceed
    ↓
Main app loads
```

**Why this is best:**
- ✅ Fast for users who want auto-detection
- ✅ Clear for users who want to choose
- ✅ Shows user what language was detected

---

## 📱 Implementation Examples

### Option 1: Auto-Detection with Settings Toggle

This is the **recommended approach** - cleanest UX.

#### Step 1: App loads automatically in detected language

**File:** `apps/mobile/App.tsx`

```typescript
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import './src/lib/i18n'; // Auto-detects and initializes
import RootNavigator from './src/navigation/RootNavigator';
import { useTranslation } from 'react-i18next';

export default function App() {
  const { i18n } = useTranslation();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Wait for i18n to initialize
    const checkI18n = setInterval(() => {
      if (i18n.isInitialized) {
        setIsReady(true);
        clearInterval(checkI18n);
      }
    }, 100);

    return () => clearInterval(checkI18n);
  }, [i18n]);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <RootNavigator />;
}
```

**That's it!** App automatically opens in the right language.

#### Step 2: Add language toggle in Settings

**File:** `apps/mobile/src/screens/settings/SettingsScreen.tsx`

```typescript
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language;

  const languages = [
    { code: 'en', label: 'English', nativeLabel: 'English' },
    { code: 'ne', label: 'Nepali', nativeLabel: 'नेपाली' },
  ];

  const handleLanguageChange = async (languageCode: string) => {
    await i18n.changeLanguage(languageCode);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>{t('profile.settings')}</Text>

      {/* Language Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {t('common.language') || 'Language / भाषा'}
        </Text>

        {languages.map((lang) => (
          <TouchableOpacity
            key={lang.code}
            style={[
              styles.languageOption,
              currentLanguage === lang.code && styles.languageOptionActive,
            ]}
            onPress={() => handleLanguageChange(lang.code)}
          >
            <View style={styles.languageInfo}>
              <Text style={styles.languageLabel}>{lang.label}</Text>
              <Text style={styles.languageNative}>{lang.nativeLabel}</Text>
            </View>

            {currentLanguage === lang.code && (
              <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Other settings sections */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('profile.accountType')}</Text>
        {/* Account settings */}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    padding: 20,
    backgroundColor: 'white',
  },
  section: {
    backgroundColor: 'white',
    marginTop: 20,
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    paddingHorizontal: 20,
    paddingVertical: 10,
    textTransform: 'uppercase',
  },
  languageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  languageOptionActive: {
    backgroundColor: '#f8f9ff',
  },
  languageInfo: {
    flex: 1,
  },
  languageLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  languageNative: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
});
```

**User Experience:**
1. App opens in device language automatically
2. User sees content in their language immediately
3. If they want to change, they go to Settings → Language
4. Tap their preferred language
5. App instantly updates all text
6. Choice is saved for future

---

### Option 2: Language Selection on First Launch

Show a dedicated language picker screen on first launch only.

#### Step 1: Create Welcome Language Picker

**File:** `apps/mobile/src/screens/welcome/LanguagePickerScreen.tsx`

```typescript
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_COMPLETED_KEY = '@thulobazaar_onboarding_completed';

interface Props {
  onComplete: () => void;
}

export default function LanguagePickerScreen({ onComplete }: Props) {
  const { i18n } = useTranslation();

  const selectLanguage = async (languageCode: 'en' | 'ne') => {
    // Set language
    await i18n.changeLanguage(languageCode);

    // Mark onboarding as completed
    await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');

    // Proceed to main app
    onComplete();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>🛍️</Text>
          <Text style={styles.appName}>ThuluBazaar</Text>
          <Text style={styles.tagline}>
            Nepal's Leading Classifieds Marketplace
          </Text>
        </View>

        {/* Language Selection */}
        <View style={styles.languageContainer}>
          <Text style={styles.title}>Choose Your Language</Text>
          <Text style={styles.subtitle}>आफ्नो भाषा छान्नुहोस्</Text>

          <TouchableOpacity
            style={styles.languageButton}
            onPress={() => selectLanguage('en')}
            activeOpacity={0.7}
          >
            <Text style={styles.languageEmoji}>🇬🇧</Text>
            <View style={styles.languageTextContainer}>
              <Text style={styles.languageText}>English</Text>
              <Text style={styles.languageSubtext}>
                Continue in English
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.languageButton}
            onPress={() => selectLanguage('ne')}
            activeOpacity={0.7}
          >
            <Text style={styles.languageEmoji}>🇳🇵</Text>
            <View style={styles.languageTextContainer}>
              <Text style={styles.languageText}>नेपाली</Text>
              <Text style={styles.languageSubtext}>
                नेपालीमा जारी राख्नुहोस्
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          You can change this later in Settings
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  logo: {
    fontSize: 80,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 16,
  },
  tagline: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  languageContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginBottom: 40,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    width: '100%',
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  languageEmoji: {
    fontSize: 40,
    marginRight: 16,
  },
  languageTextContainer: {
    flex: 1,
  },
  languageText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  languageSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  footer: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});
```

#### Step 2: Show Language Picker on First Launch

**File:** `apps/mobile/App.tsx`

```typescript
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import './src/lib/i18n';
import LanguagePickerScreen from './src/screens/welcome/LanguagePickerScreen';
import RootNavigator from './src/navigation/RootNavigator';

const ONBOARDING_COMPLETED_KEY = '@thulobazaar_onboarding_completed';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const completed = await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY);

      if (completed === 'true') {
        // User has already chosen language
        setShowLanguagePicker(false);
      } else {
        // First time user - show language picker
        setShowLanguagePicker(true);
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setShowLanguagePicker(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (showLanguagePicker) {
    return (
      <LanguagePickerScreen
        onComplete={() => setShowLanguagePicker(false)}
      />
    );
  }

  return <RootNavigator />;
}
```

**User Experience:**
1. User opens app for first time
2. Sees beautiful language picker screen
3. Taps "English" or "नेपाली"
4. App proceeds to main screens
5. Next launch: Goes directly to main app (no picker)
6. Can change language later in Settings

---

### Option 3: Hybrid with Smart Splash

Show detected language with option to change during splash screen.

**File:** `apps/mobile/src/screens/welcome/SmartSplashScreen.tsx`

```typescript
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { useTranslation } from 'react-i18next';

interface Props {
  onComplete: () => void;
}

export default function SmartSplashScreen({ onComplete }: Props) {
  const { i18n } = useTranslation();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [showLanguageHint, setShowLanguageHint] = useState(false);

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Show language hint after 1 second
    setTimeout(() => setShowLanguageHint(true), 1000);

    // Auto-proceed after 3 seconds if user doesn't change
    const timer = setTimeout(() => {
      onComplete();
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const changeLanguage = async (lang: 'en' | 'ne') => {
    await i18n.changeLanguage(lang);
    setTimeout(onComplete, 300); // Small delay for smooth transition
  };

  const detectedLanguage = i18n.language;

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>🛍️</Text>
          <Text style={styles.appName}>ThuluBazaar</Text>
        </View>

        {/* Detected Language Indicator */}
        <View style={styles.detectedContainer}>
          <Text style={styles.detectedText}>
            {detectedLanguage === 'ne'
              ? 'नेपालीमा लोड हुँदैछ...'
              : 'Loading in English...'}
          </Text>
        </View>

        {/* Language Switcher (appears after 1s) */}
        {showLanguageHint && (
          <Animated.View
            style={[
              styles.languageSwitcher,
              { opacity: fadeAnim },
            ]}
          >
            <Text style={styles.hintText}>Change language:</Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[
                  styles.langButton,
                  detectedLanguage === 'en' && styles.langButtonActive,
                ]}
                onPress={() => changeLanguage('en')}
              >
                <Text
                  style={[
                    styles.langButtonText,
                    detectedLanguage === 'en' && styles.langButtonTextActive,
                  ]}
                >
                  English
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.langButton,
                  detectedLanguage === 'ne' && styles.langButtonActive,
                ]}
                onPress={() => changeLanguage('ne')}
              >
                <Text
                  style={[
                    styles.langButtonText,
                    detectedLanguage === 'ne' && styles.langButtonTextActive,
                  ]}
                >
                  नेपाली
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 100,
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
  },
  detectedContainer: {
    marginBottom: 60,
  },
  detectedText: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.8,
  },
  languageSwitcher: {
    alignItems: 'center',
  },
  hintText: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.7,
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  langButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  langButtonActive: {
    backgroundColor: '#fff',
  },
  langButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  langButtonTextActive: {
    color: '#007AFF',
  },
});
```

---

## 🎨 Quick Language Switcher Component

For users who frequently switch languages, add a quick toggle.

### Header Language Toggle

**File:** `apps/mobile/src/components/LanguageToggle.tsx`

```typescript
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function LanguageToggle() {
  const { i18n } = useTranslation();

  const toggleLanguage = async () => {
    const newLang = i18n.language === 'en' ? 'ne' : 'en';
    await i18n.changeLanguage(newLang);
  };

  return (
    <TouchableOpacity style={styles.container} onPress={toggleLanguage}>
      <Text style={styles.text}>
        {i18n.language === 'en' ? 'ने' : 'EN'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    marginRight: 8,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
});
```

**Usage in navigation header:**

```typescript
import LanguageToggle from '../components/LanguageToggle';

<Stack.Screen
  name="Home"
  component={HomeScreen}
  options={{
    headerRight: () => <LanguageToggle />,
  }}
/>
```

---

## 📊 Comparison Table

| Approach | First Launch | Language Change | Best For |
|----------|--------------|-----------------|----------|
| **Auto-Detection** | Automatic, zero friction | Settings menu | Most users, clean UX |
| **First Launch Picker** | User chooses explicitly | Settings menu | When choice is important |
| **Smart Splash** | Auto + quick override | Settings menu | Best of both worlds |
| **Header Toggle** | Automatic | Tap header button | Frequent switchers |

---

## 🎯 My Recommendation

**Use Option 1 (Auto-Detection) + Header Toggle**

**Why:**
- ✅ 95% of users never need to think about it
- ✅ Zero extra screens to click through
- ✅ Advanced users can quickly toggle
- ✅ Cleanest, most modern UX

**Implementation:**
```typescript
// 1. i18n auto-detects on launch (already done)
// 2. Add LanguageToggle to navigation header
// 3. Add language section in Settings (for clarity)
// 4. Done!
```

---

## 🚀 Quick Start

Choose your preferred option and implement:

### For Auto-Detection (Recommended):
```bash
# Already works! Just add settings screen
# Copy SettingsScreen.tsx code from Option 1 above
```

### For First Launch Picker:
```bash
# Copy LanguagePickerScreen.tsx and App.tsx from Option 2
```

### For Smart Splash:
```bash
# Copy SmartSplashScreen.tsx from Option 3
```

---

## 📱 Complete User Journey Examples

### Journey 1: Nepali User (Auto-Detection)
```
1. Opens app first time
   → Device language: Nepali
   → App auto-loads in Nepali ✅

2. Uses app in Nepali

3. Wants to try English
   → Goes to Settings → Language
   → Taps "English"
   → App instantly switches ✅

4. Next launch
   → Opens in English (remembered) ✅
```

### Journey 2: English User with Nepali Friends
```
1. Opens app (device in English)
   → App loads in English ✅

2. Showing app to Nepali friend
   → Taps header language toggle "ने"
   → Instantly switches to Nepali ✅

3. Shows features

4. Switches back
   → Taps header toggle "EN"
   → Back to English ✅
```

---

## 💡 Pro Tips

### 1. Show Language Name in Both Languages
```typescript
// Good
"English" with subtitle "English"
"नेपाली" with subtitle "Nepali"

// Users understand regardless of current language
```

### 2. Persist Across App Updates
```typescript
// Using AsyncStorage ensures language choice survives:
- App updates
- Phone restarts
- Reinstalls (if using iCloud/Google backup)
```

### 3. Respect System Language Changes
```typescript
// If user changes device language:
AppState.addEventListener('change', async (state) => {
  if (state === 'active') {
    const deviceLang = Localization.locale.split('-')[0];
    // Optionally update if no user preference saved
  }
});
```

---

## 🎉 Summary

**Best Approach for ThuluBazaar:**

✅ **Auto-detect on first launch** (no extra screen)
✅ **Header toggle for quick switching** (power users)
✅ **Settings page for formal change** (clarity)

**This gives you:**
- Fastest experience for new users
- Flexibility for advanced users
- Clear control for everyone
- Industry-standard UX pattern

**Want me to implement any of these patterns in your actual mobile app?** Just let me know which option you prefer! 🚀
