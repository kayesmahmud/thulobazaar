# ThuluBazaar Unified Icon System

## Current Icon Usage (Before Migration)

### Libraries Currently Used

| Library | Package | Usage | RN Compatible? |
|---------|---------|-------|----------------|
| **Inline SVG (Heroicons-style)** | None (raw SVG paths) | Most UI icons (user, lock, heart, etc.) | No |
| **FontAwesome** | `@fortawesome/react-fontawesome` | Social icons (WhatsApp, Facebook, X) | No |
| **Lucide React** | `lucide-react` | Some UI elements | No (needs `lucide-react-native`) |
| **UIcons** | CSS/Font files | Various UI icons | No |

### Current Icon Locations

```
apps/web/src/
├── app/[lang]/shop/[shopSlug]/ShopSidebar.tsx  → FontAwesome (WhatsApp)
├── app/[lang]/ad/[slug]/AdActions.tsx          → FontAwesome (WhatsApp, Facebook, X)
├── app/[lang]/profile/page.tsx                 → Inline SVG (Heroicons)
├── components/                                  → Mixed (Inline SVG, Lucide)
```

### Problems with Current Setup

1. **Multiple icon libraries** - Inconsistent styles, larger bundle size
2. **Not RN compatible** - Need to rewrite all icons for mobile app
3. **Inline SVGs** - Verbose, hard to maintain
4. **No unified API** - Different syntax for each library

---

## Decision: Phosphor Icons

After research, **Phosphor Icons** is the best choice for our React + React Native monorepo.

## Why Phosphor Icons?

| Feature | Phosphor Icons |
|---------|----------------|
| Total Icons | 9,000+ |
| Weights | 6 (thin, light, regular, bold, fill, duotone) |
| Web Package | `@phosphor-icons/react` |
| React Native Package | `phosphor-react-native` |
| Tree-shaking | Yes |
| Brand Icons (WhatsApp, FB, X) | Yes (built-in) |
| API Consistency | Identical across platforms |
| SSR Support | Yes (Next.js optimized) |

## Packages to Install

### Web (Next.js)
```bash
npm install @phosphor-icons/react
```

### React Native
```bash
npm install phosphor-react-native react-native-svg
```

## Usage

### Basic Usage (Same API for both platforms)
```tsx
import { User, Lock, Heart, Storefront } from '@phosphor-icons/react';
// or for RN: import { User, Lock, Heart, Storefront } from 'phosphor-react-native';

<User size={24} />
<Lock size={24} weight="bold" />
<Heart size={24} weight="fill" color="#ef4444" />
```

### Weight Options
- `thin` - Thinnest stroke
- `light` - Light stroke
- `regular` - Default (no need to specify)
- `bold` - Thicker stroke
- `fill` - Solid filled
- `duotone` - Two-tone style

### Brand/Social Icons
```tsx
import {
  WhatsappLogo,
  FacebookLogo,
  XLogo,
  InstagramLogo,
  YoutubeLogo
} from '@phosphor-icons/react';

<WhatsappLogo size={24} weight="fill" color="#25D366" />
<FacebookLogo size={24} weight="fill" color="#1877F2" />
<XLogo size={24} weight="fill" color="#000000" />
```

## Migration Mapping

### Current → Phosphor Replacement

| Current Usage | Phosphor Equivalent |
|---------------|---------------------|
| Inline SVG (User icon) | `<User />` |
| Inline SVG (Lock icon) | `<Lock />` |
| Inline SVG (Heart icon) | `<Heart />` |
| Inline SVG (Building/Shop) | `<Storefront />` |
| FontAwesome `faSquareWhatsapp` | `<WhatsappLogo weight="fill" />` |
| FontAwesome `faFacebook` | `<FacebookLogo weight="fill" />` |
| FontAwesome `faXTwitter` | `<XLogo weight="fill" />` |

## Next.js Configuration

Add to `next.config.js` for better tree-shaking:
```js
module.exports = {
  experimental: {
    optimizePackageImports: ['@phosphor-icons/react'],
  },
};
```

For SSR/Server Components, import from SSR submodule:
```tsx
import { User } from '@phosphor-icons/react/dist/ssr';
```

## Monorepo Structure (Future)

```
packages/
  ui/
    src/
      icons/
        index.ts          # Re-exports all icons
        Icon.tsx          # Optional wrapper component
```

### Shared Icon Wrapper (Optional)
```tsx
// packages/ui/src/icons/Icon.tsx
import * as PhosphorIcons from '@phosphor-icons/react';

type IconName = keyof typeof PhosphorIcons;

interface IconProps {
  name: IconName;
  size?: number;
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
  color?: string;
}

export function Icon({ name, size = 24, weight = 'regular', color }: IconProps) {
  const IconComponent = PhosphorIcons[name];
  return <IconComponent size={size} weight={weight} color={color} />;
}

// Usage: <Icon name="User" size={24} weight="bold" />
```

## Common Icons Reference

### Navigation & UI
- `House` - Home
- `User` - Profile
- `Lock` - Security
- `Storefront` - Shop
- `Heart` - Favorites/Saved
- `MagnifyingGlass` - Search
- `Bell` - Notifications
- `Gear` - Settings

### Actions
- `Plus` - Add
- `Trash` - Delete
- `PencilSimple` - Edit
- `Check` - Success/Confirm
- `X` - Close/Cancel
- `ArrowLeft` - Back
- `Share` - Share

### Status
- `CheckCircle` - Verified/Success
- `WarningCircle` - Warning
- `XCircle` - Error
- `Info` - Information
- `ShieldCheck` - Verified badge

### E-commerce
- `Tag` - Price/Category
- `MapPin` - Location
- `Phone` - Contact
- `Envelope` - Email
- `Camera` - Photo
- `Image` - Image
- `CurrencyDollar` - Price

### Social/Brand
- `WhatsappLogo` - WhatsApp
- `FacebookLogo` - Facebook
- `XLogo` - X (Twitter)
- `InstagramLogo` - Instagram
- `GoogleLogo` - Google

## Resources

- [Phosphor Icons Website](https://phosphoricons.com/) - Browse all icons
- [Phosphor React GitHub](https://github.com/phosphor-icons/react)
- [Phosphor React Native npm](https://www.npmjs.com/package/phosphor-react-native)

## Migration Status

- [ ] Install `@phosphor-icons/react` package
- [ ] Replace inline SVGs with Phosphor components
- [ ] Replace FontAwesome social icons with Phosphor brand icons
- [ ] Remove unused icon packages (FontAwesome, Lucide)
- [ ] Update Next.js config for optimization
- [ ] Test all icon usages
