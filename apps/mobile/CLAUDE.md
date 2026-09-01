# Thulo Bazaar Mobile - Flutter Rules

## Persona & Tools
* **Role:** Expert Flutter Developer. Focus: Beautiful, performant, maintainable code.
* **Explanation:** Explain Dart features (null safety, streams, futures) for new users.
* **Tools:** ALWAYS run `dart_format`. Use `dart_fix` for cleanups. Use `analyze_files` with `flutter_lints` to catch errors early.
* **Dependencies:** Add with `flutter pub add`. Use `pub_dev_search` for discovery. Explain why a package is needed.

## MCP Servers (3 Configured)

### 1. Dart MCP (Development)
```bash
claude mcp add --transport stdio dart -- dart mcp-server --force-roots-fallback
```

| Tool | Description |
|------|-------------|
| `analyze_files` | Identify errors across projects |
| `dart_fix` | Apply automated fixes |
| `dart_format` | Format code automatically |
| `launch_app` | Start Flutter application |
| `hot_reload` | Update running app (preserves state) |
| `get_widget_tree` | Inspect UI structure |
| `get_runtime_errors` | Retrieve app errors |
| `pub_dev_search` | Search pub.dev for packages |
| `run_tests` | Execute test suites |

### 2. Marionette MCP (Runtime Testing)
```bash
claude mcp add --transport stdio marionette -- marionette_mcp
```

| Tool | Description |
|------|-------------|
| Tap elements | Simulate user taps |
| Enter text | Fill form fields |
| Scroll | Scroll lists/pages |
| Screenshots | Capture UI state |

**Note:** Requires `marionette_flutter` package (already added) and debug build.

### 3. DCM MCP (Code Quality)
```bash
claude mcp add --transport stdio dcm -- dcm start-mcp-server --force-roots-fallback
```

| Tool | Description |
|------|-------------|
| Analyze | 475+ lint rules |
| Auto-fix | Fix code issues automatically |
| Metrics | Code complexity analysis |

Requires: Dart 3.9+ / Flutter 3.35+

## Architecture & Structure
* **Entry:** Standard `lib/main.dart`.
* **Layers:** Presentation (Widgets), Domain (Logic), Data (Repo/API).
* **Features:** Group by feature (e.g., `lib/features/login/`) for scalable apps.
* **SOLID:** strictly enforced.
* **State Management:**
  * **Pattern:** Separate UI state (ephemeral) from App state.
  * **Native First:** Use `ValueNotifier`, `ChangeNotifier`.
  * **Prohibited:** NO Riverpod, Bloc, GetX unless explicitly requested.
  * **DI:** Manual constructor injection or `provider` package if requested.

## Code Style & Quality
* **Naming:** `PascalCase` (Types), `camelCase` (Members), `snake_case` (Files).
* **Conciseness:** Functions <20 lines. Avoid verbosity.
* **Null Safety:** NO `!` operator. Use `?` and flow analysis (e.g. `if (x != null)`).
* **Async:** Use `async/await` for Futures. Catch all errors with `try-catch`.
* **Logging:** Use `dart:developer` `log()` locally. NEVER use `print`.

## Flutter Best Practices
* **Build Methods:** Keep pure and fast. No side effects. No network calls.
* **Isolates:** Use `compute()` for heavy tasks like JSON parsing.
* **Lists:** `ListView.builder` or `SliverList` for performance.
* **Immutability:** `const` constructors everywhere. `StatelessWidget` preference.
* **Composition:** Break complex builds into private `class MyWidget extends StatelessWidget`.

## Routing (GoRouter)
Use `go_router` exclusively for deep linking and web support.

```dart
final _router = GoRouter(routes: [
  GoRoute(path: '/', builder: (_, __) => Home()),
  GoRoute(path: 'details/:id', builder: (_, s) => Detail(id: s.pathParameters['id']!)),
]);
MaterialApp.router(routerConfig: _router);
```

## Data Models (Equatable Pattern)
**Skip build_runner/freezed** - use AI-generated plain Dart models for readability.

### Model Generation Prompt
When creating models, ask:
```
Fix models with: Equatable, copyWith, fromJson, toJson, fromMap, toMap
```

### Example Model
```dart
import 'package:equatable/equatable.dart';
import 'dart:convert';

class Ad extends Equatable {
  final int id;
  final String title;
  final double price;
  final String? imageUrl;

  const Ad({required this.id, required this.title, required this.price, this.imageUrl});

  Ad copyWith({int? id, String? title, double? price, String? imageUrl}) {
    return Ad(
      id: id ?? this.id,
      title: title ?? this.title,
      price: price ?? this.price,
      imageUrl: imageUrl ?? this.imageUrl,
    );
  }

  factory Ad.fromJson(String str) => Ad.fromMap(json.decode(str));
  String toJson() => json.encode(toMap());

  factory Ad.fromMap(Map<String, dynamic> json) => Ad(
    id: json["id"],
    title: json["title"],
    price: (json["price"] as num).toDouble(),
    imageUrl: json["imageUrl"],
  );

  Map<String, dynamic> toMap() => {"id": id, "title": title, "price": price, "imageUrl": imageUrl};

  @override
  List<Object?> get props => [id, title, price, imageUrl];
}
```

## Visual Design (Material 3)
* **Aesthetics:** Premium, custom look. "Wow" the user. Avoid default blue.
* **Theme:** Use `ThemeData` with `ColorScheme.fromSeed`.
* **Modes:** Support Light & Dark modes (`ThemeMode.system`).
* **Typography:** ALWAYS `AppFont.inter(...)` / `AppFont.poppins(...)` from
  `lib/core/theme/app_font.dart`, NEVER `GoogleFonts.*` at a call site. Inter has
  no Devanagari; AppFont appends the bundled Mukta family as the per-glyph
  fallback so Nepali text renders in the same face on every phone. A test in
  `test/app_font_test.dart` fails the build on any direct `GoogleFonts.` call.
* **Layout:** `LayoutBuilder` for responsiveness. `OverlayPortal` for popups.
* **Components:** Use `ThemeExtension` for custom tokens (colors/sizes).

## Testing
* **Tools:** `flutter test` (Unit), `flutter_test` (Widget), `integration_test` (E2E).
* **Mocks:** Prefer Fakes. Use `mockito` sparingly.
* **Pattern:** Arrange-Act-Assert.
* **Assertions:** Use `package:checks`.

## Accessibility (A11Y)
* **Contrast:** 4.5:1 minimum for text.
* **Semantics:** Label all interactive elements specifically.
* **Scale:** Test dynamic font sizes (up to 200%).
* **Screen Readers:** Verify with TalkBack/VoiceOver.

## Debugging Prompts
Effective prompts for common issues:

| Task | Prompt |
|------|--------|
| Fix layout | "Check for and fix static and runtime analysis issues. Check for and fix any layout issues." |
| Fix overflow | "Fix RenderFlex overflow in the ProductList widget" |
| Add feature | "Add pull-to-refresh to the home screen ListView" |
| Find package | "Find a suitable package for handling image caching with placeholder support" |

**Avoid vague prompts** like "fix it" or "make it faster" - be specific.

## Commands Reference
```bash
# Run tests (prefer MCP run_tests tool)
flutter test .

# Analyze code
flutter analyze .

# Format code
dart format .

# Add dependency
flutter pub add <package_name>

# Run app
flutter run

# Hot reload (use MCP hot_reload tool when available)
r  # in terminal while app running
```

## Thulo Bazaar-Specific

### API Integration
* Backend runs on `localhost:5000` (see root CLAUDE.md)
* API returns camelCase (transformed from DB snake_case)
* Match model field names to API response (camelCase)

### Shared Types
* Reuse types from `packages/types` where applicable
* Keep mobile-specific models in `lib/core/models/`

### AI Guardrails
Always verify AI-generated code:
* Run `flutter analyze` after changes
* Test generated models with real API responses
* Review serialization logic (fromMap/toMap) carefully
