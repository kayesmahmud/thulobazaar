> **PROVENANCE — READ FIRST.** External reference from the Speakly Flutter project,
> kept here because the owner wants these practices applied to Thulo Bazaar mobile.
> Research-backed Flutter UI practices (tokens, responsive, typography, a11y,
> theming, atomic components, performance, motion, platform-adaptive, images).
> Generic and largely portable — unlike the design-system file, most of this
> applies to Thulo Bazaar as written.

---

# Flutter UI Best Practices 2025 — Implementation Reference (Speakly)

Research-backed practices the owner wants applied. Sources: Miquido, GeeksforGeeks,
DHIWise, Capital Numbers, Seven Square Tech, Lollypop Design, Flutter official docs.

## 1. Design System & Tokens
- 4dp/8dp grid. Semantic tokens (xs/sm/md/lg/xl), never magic numbers.
- Centralize in `lib/config/design_tokens.dart`: Spacing, Radii, Shadows, Sizes, Breakpoints, AppDurations.
- Spacing: none 0, xxs 2, xs 4, sm 8, md 16, lg 24, xl 32, xxl 48.
- Radii: none 0, xs 4, sm 8, md 12, lg 16, xl 24, full 999 + `roundedMd` BorderRadius getters.
- Shadows: `sm` = black @5% alpha, blur 4, offset (0,2). Soft, low-alpha.
- Why: consistency, one-line re-skin, shared designer/dev language.

## 2. Responsive Design
- Breakpoints: compact <600, medium <840, expanded <1200, large 1600.
- `LayoutBuilder` for constraint-based layouts; `MediaQuery.sizeOf` (not `.of`) for size.
- `ResponsiveExtension on BuildContext` with `context.isCompact` and a generic
  `context.responsive<T>({required T compact, T? medium, T? expanded, T? large})`.
- `AdaptiveLayout` widget picking mobile/tablet/desktop child by constraints.

## 3. Typography
- Material 3 type scale (display/headline/title/body/label).
- Responsive font scale by width: 1.0 phone -> 1.05 medium -> 1.1 expanded -> 1.15 large,
  MULTIPLIED by `MediaQuery.textScalerOf(context).scale(1.0)` for accessibility.
- `AppTypography` class + `context.typography` extension. No `TextStyle(fontSize:)` literals at call sites.
- Limit to 1–2 font families.

## 4. Accessibility (WCAG 2.1)
- `kMinTouchTargetSize = 48.0`; contrast 4.5:1 normal text, 3.0:1 large (18sp+).
- `AccessibleButton` wraps `Semantics(button:true, enabled:, label:)` + `ConstrainedBox(minWidth/minHeight: 48)`.
- `hasSufficientContrast(fg, bg, isLargeText:)` helper computing the real ratio.
- `LiveRegion` + `SemanticsService.sendAnnouncement(view, msg, TextDirection.ltr, assertiveness:)`.
- `AccessibilityExtension on BuildContext`: `isScreenReaderEnabled` (accessibleNavigation),
  `reduceMotion` (disableAnimations), `boldTextEnabled`, `highContrastEnabled`, `textScale`.

## 5. Color & Theming
- `ColorScheme.fromSeed(seedColor:, brightness:, secondary:, tertiary:, error:)`.
- BOTH light and dark themes. Semantic colors success/warning/error/info.
- Use surface variants (`surfaceContainerHighest`) for layering. Never hardcode colors.

## 6. Component Architecture
- Atomic Design: atoms -> molecules -> organisms -> templates -> pages.
- Barrel files (`widgets.dart`, `base_widgets.dart`).
- `BaseButton` with `ButtonVariant {filled, tonal, outlined, text, elevated}` and
  `ButtonSize {small, medium, large}`, named constructors (`.filled`, `.tonal`, `.outlined`),
  plus `icon`, `isLoading`, `fullWidth`.
- `Gap` semantic spacing widget with const named constructors: `Gap.xs()`, `Gap.md()`, `Gap.hMd()` etc.
- Single responsibility; composition over inheritance.

## 7. Performance
- `const` constructors everywhere (compile-time constants).
- `ListView.builder` / `GridView.builder` for lazy loading.
- `CachedNetworkImage` for all network images; `RepaintBoundary` around expensive/animated widgets.
- `OptimizedNetworkImage` wrapper with placeholder + errorWidget + fadeInDuration + optional borderRadius.
- Shimmer placeholder via a repeating `AnimationController` gradient.
- `ImagePrecacher.precacheNetworkImages(context, urls)` on startup for critical images.

## 8. Animation & Motion
- Keep UI feedback under 300ms. `Curves.easeOutCubic` for natural motion.
- `AppDurations`: instant 50ms, fast 150ms, normal 300ms, slow 500ms.
- `AppDurations.accessible(context, base)` returns `Duration.zero` when `disableAnimations` is set.
- `flutter_animate` extension methods on Widget: `.fadeIn()`, `.slideInFromBottom()`,
  `.shimmer()`, `.scaleOnPress()`, `.staggeredFadeIn(index)` (50ms * index delay).

## 9. Platform Adaptive Design
- `.adaptive` constructors (`Switch.adaptive`, `Slider.adaptive`).
- `isApplePlatform` guard wrapped in try/catch (web has no `Platform`).
- `AdaptiveButton`, `AdaptiveSwitch`, `AdaptiveAlertDialog.show()` (Cupertino vs Material),
  `AdaptiveScaffold` (CupertinoPageScaffold vs Scaffold).
- Respect platform back gestures and navigation conventions.

## 10. Image Optimization
- Cache all network images; SVG for icons/illustrations; placeholders during load; precache critical.
- `OptimizedSvg` with `colorFilter: ColorFilter.mode(color, BlendMode.srcIn)`.
- `AvatarImage` with initials fallback in a `primaryContainer` circle.
- `ResponsiveImage` picking small/medium/full URL by `MediaQuery.sizeOf(context).width`.

## Summary table
| Category | Key Implementation |
|---|---|
| Design Tokens | Centralized spacing, radii, shadows, breakpoints |
| Responsive | LayoutBuilder, breakpoints, responsive extensions |
| Typography | Scaled fonts, M3 type scale, TextScaler support |
| Accessibility | 48dp targets, semantic labels, contrast checking |
| Theming | ColorScheme.fromSeed, light/dark, semantic colors |
| Components | Atomic design, base widgets, named constructors |
| Performance | Image caching, const constructors, lazy loading |
| Animation | 300ms max, easeOutCubic, reduce motion support |
| Platform | Adaptive widgets, platform detection, native feel |
| Images | CachedNetworkImage, SVG, placeholders |

Files created in Speakly: design_tokens.dart, typography.dart, app_theme.dart,
accessibility.dart, animation_utils.dart, image_utils.dart, base_card/button/input/spacing.dart,
glass_container.dart, neumorphic_container.dart, adaptive_layout.dart, platform_adaptive.dart.
