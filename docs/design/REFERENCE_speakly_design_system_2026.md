> **PROVENANCE — READ FIRST.** This document is *not* Thulo Bazaar's design system.
> It is the design system of a different Flutter project (Speakly), preserved here
> verbatim because the owner identified it as the **target look and architecture**
> for Thulo Bazaar mobile: card-grouped layouts, pastel icon badges, weight-driven
> typography, centralized tokens, and a single-source-of-truth icon layer.
>
> Thulo Bazaar's own design system — adapted to the rose brand (#F43F5E) and to a
> marketplace rather than a social app — lives in `THULOBAZAAR_DESIGN_SYSTEM.md`
> once approved. Treat this file as **reference**, not as rules to follow literally.
> Brand colors, tint semantics, and component names differ in our adaptation.

---

# Speakly — UI Design System (2026)

> **What this is:** the authoritative record of *how we actually build UI in this
> project today* — the "modern 2026" look you see on Settings, Edit Profile,
> Partners, Profile, etc. It documents the tokens, theme, icon system, and the
> `Ds*` component kit, plus the rules for using them.

---

## 0. The one rule that makes everything work: single sources of truth

Every visual decision flows through **one file**. To re-skin the whole app, you
edit that file — never the call sites.

| Concern | Single source of truth | What it hides |
|---|---|---|
| **Icons** | lib/config/app_icons.dart | Phosphor (`phosphor_flutter`) |
| **Colors (brand + semantic)** | lib/config/theme/app_colors.dart | hex values |
| **Pastel accent tints** | ds_palette_extension.dart | 8 light/dark tint pairs |
| **Type scale + fonts** | lib/config/app_theme.dart | Inter + Noto fallback chain |
| **Spacing / radius / shadow / size / duration** | lib/config/tokens/ | raw dp numbers |
| **Components** | lib/shared/design_system/ | layout of atoms/molecules |

**Consequence:** never hardcode a hex color, a `Phosphor*` icon, a font size, or
a magic dp number at a call site. If you reach for one, it belongs in a token
file. This is the difference between "looks 2026" and "drifts over time".

---

## 1. The look in one paragraph

A **card-grouped, pastel-badge, Instagram-typography** system. Sentence-case
section headers sit *outside* rounded 16dp cards; inside each card, rows lead
with a **rounded-square pastel icon badge** (`DsIconBadge`), then a bold title,
then a grey subtitle, then a chevron. Color is used sparingly and semantically —
mostly neutral surfaces with one pastel accent per row. Type hierarchy is done
by **weight, not size** (the "Instagram trick": 16px bold title vs 16px regular
body). Everything presses with an iOS-style scale + haptic ("butter"). Blue is
the single brand accent; flag emoji carry language/country meaning.

Reference screens that embody it: **Settings**, **Edit Profile**, **Profile
"More Details"**, **Partners card**, **Signup options**.

---

## 2. Icons — Phosphor, always through `AppIcons`

**Package:** `phosphor_flutter: ^2.1.0` — 9,000+ icons, 6 weights. It is the
**only** icon system. `cupertino_icons` exists only as a Flutter dependency; do
not use it.

**The contract:** you never import `phosphor_flutter` outside
`app_icons.dart`. Every icon is referenced by a **semantic name**:

```dart
import 'package:speakly/config/app_icons.dart';

Icon(AppIcons.sendMessage)   // not PhosphorIconsDuotone.paperPlaneTilt
Icon(AppIcons.settings)      // not a raw icon
```

**Conventions baked into app_icons.dart:**
- **Default weight is Duotone** (`_D`) — warm, 2026 social-app feel.
- **Filled variants** use the `Filled` suffix and Phosphor Fill (`_F`):
  `AppIcons.favorite` / `AppIcons.favoriteFilled`, `star` / `starFilled`.
- Names describe **purpose, not shape**: `AppIcons.translate`, `AppIcons.report`,
  `AppIcons.shieldCheck` — not `AppIcons.globe2`.
- Need a new icon? **Add a semantic entry to `app_icons.dart`**, then use it.
  Never reach past the alias to `PhosphorIconsDuotone.*` at a call site.

**Why:** swapping the entire icon library later (Solar, Hugeicons, …) is a
one-file edit. The aliases `typedef _D = PhosphorIconsDuotone;` /
`typedef _F = PhosphorIconsFill;` keep that file readable.

**App launcher icon** is separate: `flutter_launcher_icons` generates Android
adaptive + iOS icons from one source image.

---

## 3. Color

### 3.1 Brand + semantic (app_colors.dart)

```
primary    #1489FE  Speakly Blue (deep)   — CTAs, links, active states
secondary  #21A9FF  Speakly Blue (light)  — accents
success    #06D6A0   warning #F59E0B   error #E63946   info #3B82F6
```

Light/dark surface & text are paired in `AppColors.light` / `AppColors.dark`
(`surface`, `background`, `textPrimary/Secondary/Tertiary`, `border`, `divider`).

### 3.2 How to read colors at a call site — **theme-aware, never raw**

```dart
// GOOD — flips with dark mode automatically
final cs = Theme.of(context).colorScheme;        // primary, surface, onSurface, error…
color: cs.onSurfaceVariant
color: AppTheme.textGrey(context)                // theme-aware accessor
color: context.colorScheme.primary               // via ThemeContext extension

// GOOD — semantic shortcuts (ThemeContext extension in app_theme.dart)
context.successColor   context.warningColor   context.errorColor   context.infoColor

// NEVER
color: Colors.white            // breaks dark mode
color: Color(0xFF1489FE)       // hardcoded brand
```

**Only exception:** `AppColors.alwaysWhite / alwaysBlack / alwaysWhite70` — for
UI sitting on top of photos/video scrims where "always white text" is the intent.

### 3.3 The 8 pastel accent tints (DsPaletteExtension)

The signature 2026 element. Eight semantic-neutral pastel pairs, each a
`DsTint { container, on }` that flips light/dark automatically. Accessed via:

```dart
context.dsPalette.violet     // -> DsTint(container: pastel bg, on: readable fg)
```

| Tint | Suggested use |
|---|---|
| `violet` | Account / identity / profile |
| `coral` | Bio / warm content |
| `emerald` | Languages / success / "native" |
| `sky` | Chat / learning / communication |
| `amber` | Notifications / streaks / warnings |
| `indigo` | Privacy / security |
| `slate` | Locked / read-only / disabled |
| `rose` | Danger zone / destructive |

These are **decorative accents** (icon badges, chips) — distinct from the
**semantic** `success/warning/error`, which signal state. Don't use a
pastel tint to mean "error"; use `cs.error`.

---

## 4. Typography — Inter + "no-tofu" fallback, weight-driven hierarchy

**Font:** Inter via `google_fonts`. Every style carries the **Noto fallback
chain** (`AppTheme.noTofuFallback`) so CJK / Arabic / Hebrew / Devanagari /
Bengali / Tamil / Thai render per-character without missing-glyph boxes.

**The scale is 7 sizes total** (Instagram-style 2026):

| Slot | Size / weight | Use |
|---|---|---|
| `displayLarge` | 28 / w800 | onboarding hero only |
| `displayMedium` | 24 / w700 | rare big titles |
| `titleLarge` | 22 / w700 | screen titles |
| `titleMedium` | 18 / w700 | section headers |
| `titleSmall` | **16 / w700** | list-row names (bold) |
| `bodyLarge` | **16 / w400** | paragraph (same size as titleSmall, lighter) |
| `bodyMedium` | 14 / w400 | secondary text |
| `bodySmall` | 13 / w400 | subtitles |
| `labelLarge` | 14 / w600 | buttons |
| `labelMedium` | 13 / w500 | metadata, counters |
| `labelSmall` | 11 / w700 | micro pills, index bars |

**Hierarchy = weight, not size.** A bold 16 title over a regular 16 body is the
core move — see `titleSmall` vs `bodyLarge`.

```dart
Theme.of(context).textTheme.titleSmall          // the theme is the source of truth
context.typography.titleSmall                    // adds responsive scaling (tablets)
```
`AppTypography` is a thin responsive wrapper: it scales 1.0x (phone) -> 1.15x
(large/tablet) and inherits the Noto fallback. Don't define
`TextStyle(fontSize: …)` literals at call sites.

---

## 5. Spacing, radius, shadow, size, duration (lib/config/tokens/)

All on a **4dp base unit**. Import via `config/tokens/tokens.dart` (barrel).

```dart
// Spacing (4dp base)
Spacing.xxs 2 - xs 4 - sm 8 - md 16 - lg 24 - xl 32 - xxl 48 - xxxl 64
Insets.md / .screenPadding / .horizontalMd …          // EdgeInsets presets

// Radius — cards use lg(16); pills/avatars use full
Radii.sm 8 - md 12 - lg 16 - xl 24 - xxl 32 - full 999
Radii.roundedLg / .roundedFull                         // BorderRadius getters

// Shadow — soft, low-alpha (the 2026 "barely there" elevation)
Shadows.sm/md/lg/xl - Shadows.colored(color)           // sm = black @5%, blur 4

// Size — icon/avatar/button/touch-target constants
Sizes.iconMd 24 - avatarLg 56 - buttonLg 48 - minTouchTarget 48 - bottomNavHeight 80

// Duration
AppDurations.fast 150ms - normal 300ms - slow 500ms - .accessible(ctx, base)
```

**Canonical values you'll reuse constantly:** card radius **16** (`Radii.lg`),
screen padding **16** (`Spacing.md`), icon badge **40dp**, pill radius **full**.

---

## 6. The `Ds*` component kit (lib/shared/design_system/)

Import the barrel: `import 'package:speakly/shared/design_system/design_system.dart';`

This is the **assembled vocabulary**. Build screens from these — don't hand-roll
cards/rows. Canonical pattern:

```dart
DsSectionHeader(title: 'Account'),          // sentence-case, OUTSIDE the card
DsCard(children: [
  DsListTile(
    icon: AppIcons.lock,
    tint: context.dsPalette.indigo,
    title: 'Privacy',
    subtitle: 'Manage who can find you',
    onTap: () => context.push('/settings/privacy'),
  ),
  DsListTile(icon: AppIcons.signOut, tint: context.dsPalette.rose,
             title: 'Log out', destructive: true, onTap: _logout),
]),
```

### Atoms
| Component | What it is |
|---|---|
| **`DsIconBadge`** | Rounded-square pastel icon badge. The visual anchor. `40dp` default; `.small` 32, `.large` 56. Corner radius = `size*0.28`, icon = `size*0.55`. |
| **`DsChip`** | Tiny status pill ("Native", "B1", "Beta"). `Radii.full`, `labelSmall` w600. Tint optional — neutral surface if null. |
| **`DsSectionHeader`** | Sentence-case title that lives *above* a card (no all-caps). Optional right-aligned `actionLabel`/`onAction`. |
| **`DsRedDot`** | 8dp `error`-color dot for "needs attention" (incomplete field) — quieter than a banner. |
| **`DsSocialButton`** | OAuth "Continue with X" pill. `isPrimary` -> filled; else outlined/surface. Brand-accurate icon color. |

### Molecules
| Component | What it is |
|---|---|
| **`DsCard`** | Grouped container: 16dp radius, surface tone, 0.5px hairline border, internal dividers between children (indented past the icon badge). Owns its own outer margin so cards stack with a consistent gap. |
| **`DsListTile`** | Badge + title + subtitle + (chevron / chip / `badgeCount` / red dot). Light haptic on tap. `destructive:true` -> error-colored title. |
| **`DsDataRow`** | Label-above-value row ("Name" / "Kayes"). For Edit Profile read/edit rows. |
| **`DsSwitchTile`** | Badge + title + subtitle + M3 `Switch`. Disabled when `onChanged` null. |
| **`DsBentoTile`** | Square-ish 2-up grid cell (badge + title + subtitle). `selected:true` -> tinted bg + 1.5px accent border (pickers). |
| **`DsStickyActionBar`** | Safe-area bottom bar: gradient primary CTA + optional secondary. |

### Signature shared widgets
- **`LanguagePairPills`** — one widget, six screens, so it's identical everywhere.
- **`VerifiedBadge`** — tier check next to paid names (PRO = X-blue, GOLD = metallic gold).
- **`LanguageLevelChips`**, **`LanguageProficiencyCard`**, **`ProfileMoreDetailsCard`**, **`CityPickerSheet`**.

---

## 7. Interaction layer — "Butter"

Every tappable presses with an iOS-style scale + tap-**down** haptic, and pages
slide with edge-swipe-back on **both** platforms.

| Primitive | Use when | Behavior |
|---|---|---|
| **`Tappable`** | bare tappable (nav item, card, custom CTA) with no gesture of its own | replaces gesture: scale 0.96 + tap-down haptic, **no** ink |
| **`PressableInk`** | surface that should keep Material ink ripple (list rows, tiles, bento) | drop-in `InkWell` + press-scale 0.97 + haptic |
| **`PressableScale`** | wrapping a stock Material button (`ElevatedButton`, `IconButton`, `FAB`…) | `Listener`-based scale + haptic; button still owns the tap |

App-wide wiring:
- `AppTheme._butterPageTransitions` — Cupertino slide on Android **and** iOS, inherited by every `MaterialPageRoute` / GoRouter `MaterialPage`.
- `BouncyScrollBehavior` on `MaterialApp.router` — iOS momentum + bounce overscroll everywhere.

The `Ds*` molecules already embed the right primitive.

---

## 8. Glassmorphism (Liquid Glass)

Used selectively for floating/overlay surfaces — not everywhere (performance on
mid-range Android matters):
- **`GlassContainer`** — iOS 26-style blur + refraction, tint, border, shadows.
- **`ModernGlassContainer`** — lighter glassmorphic container.

Reach for glass on bottom sheets, floating bars, and hero overlays — not on
standard list/card screens (those use `DsCard`).

---

## 9. Motion

- `flutter_animate: ^4.5.2` for micro-interactions — list-item fade/slide-in entrances, subtle emphasis. Keep it light; no Lottie/3D on every screen.
- Durations come from `AppDurations`; honor reduced-motion via `AppDurations.accessible(context, base)`.

---

## 10. Composition & file rules

- **Extract a widget class when `build()` > ~100 lines.** No `Widget _buildX()` helper methods — they break `const`.
- **Max ~300 lines / file**, one public widget per file, `snake_case.dart`.
- **Folders:** shared reusable -> `lib/shared/widgets/` or `lib/shared/design_system/`; feature-specific -> `lib/features/<f>/presentation/widgets/`.
- **Check `lib/shared/widgets/` + `design_system/` before building anything new.** 80%+ match -> extend (add a param), don't duplicate.
- **`const` constructors everywhere**, `super.key` last, `required` named params for 2+ args.
- **`ListView.builder`/`GridView.builder`** for >10 items; `ValueKey(id)` in dynamic lists; `CachedNetworkImage` for network images; `RepaintBoundary` around animations.

---

## 11. Quick checklist before writing UI

- [ ] Icon via `AppIcons.*` (not raw Phosphor)?
- [ ] Color via `colorScheme` / `AppTheme.*(context)` / `dsPalette` (no `Colors.white`, no hex)?
- [ ] Text via `textTheme` / `context.typography` (no `fontSize:` literal)?
- [ ] Spacing/radius via `Spacing.*` / `Radii.*` (no magic dp)?
- [ ] Built from `Ds*` components instead of hand-rolled?
- [ ] Tappable wrapped in the right Butter primitive?
- [ ] Verified in **both** light and dark mode?
- [ ] New shared widget? Checked it doesn't already exist first.

---

## 12. Where each piece lives (map)

```
lib/config/
  app_icons.dart                 -> ALL icons (Phosphor behind semantic names)
  app_theme.dart                 -> TextTheme, light/dark ThemeData, font fallback, Butter transitions
  typography.dart                -> responsive scaling wrapper (AppTypography)
  theme/app_colors.dart          -> brand + semantic + light/dark palettes
  tokens/                        -> Spacing, Radii, Shadows, Sizes, AppDurations, breakpoints
    tokens.dart                  -> barrel (import this)

lib/shared/design_system/
  design_system.dart             -> barrel (import this)
  theme/ds_palette_extension.dart-> 8 pastel tints (DsTint, context.dsPalette.*)
  atoms/                         -> DsIconBadge, DsChip, DsSectionHeader, DsRedDot, DsSocialButton
  molecules/                     -> DsCard, DsListTile, DsDataRow, DsSwitchTile, DsBentoTile, DsStickyActionBar

lib/shared/widgets/
  tappable.dart - pressable_ink.dart - pressable_scale.dart   -> Butter primitives
  language_pair_pills.dart - verified_badge.dart - …          -> signature shared widgets
  modern_widgets.dart                                          -> glassmorphic containers

lib/widgets/  (legacy — prefer shared/)
  glass_container.dart           -> Liquid Glass
```
