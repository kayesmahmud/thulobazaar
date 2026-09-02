import 'dart:convert';
import 'dart:io';

import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:provider/single_child_widget.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Reads the real translation files off disk. The bundle's async loader never
/// completes under the test framework's fake clock; a file read does.
class _FileTranslations extends AssetLoader {
  const _FileTranslations();
  @override
  Future<Map<String, dynamic>?> load(String path, Locale locale) {
    final file = File('$path/${locale.languageCode}.json');
    return Future.value(
      jsonDecode(file.readAsStringSync()) as Map<String, dynamic>,
    );
  }
}

const localeEn = Locale('en');
const localeNe = Locale('ne');

/// Pumps [child] the way the app hosts every screen: real EN/NE translations,
/// the given providers, and a MaterialApp. Widgets under test see `.tr()`
/// resolve to real strings, so tests can assert both languages.
///
/// Plugins the screens touch on construction (secure storage, preferences)
/// are stubbed so that a screen's initState cannot fail on a missing
/// platform channel.
Future<void> pumpLocalized(
  WidgetTester tester,
  Widget child, {
  Locale locale = localeEn,
  List<SingleChildWidget> providers = const [],
}) async {
  stubPlatformChannels();
  await tester.runAsync(() => EasyLocalization.ensureInitialized());

  await tester.pumpWidget(
    EasyLocalization(
      supportedLocales: const [localeEn, localeNe],
      path: 'assets/translations',
      fallbackLocale: localeEn,
      startLocale: locale,
      saveLocale: false,
      assetLoader: const _FileTranslations(),
      child: MultiProvider(
        providers: providers.isEmpty
            ? [Provider<Object>.value(value: Object())]
            : providers,
        child: Builder(
          builder: (context) => MaterialApp(
            localizationsDelegates: context.localizationDelegates,
            supportedLocales: context.supportedLocales,
            locale: context.locale,
            home: child,
          ),
        ),
      ),
    ),
  );
  // One frame to load the translations, one to render with them.
  await tester.pump();
  await tester.pump();
}

/// In-memory stand-ins for the platform plugins screens reach for.
void stubPlatformChannels() {
  SharedPreferences.setMockInitialValues({});
  final messenger =
      TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger;
  messenger.setMockMethodCallHandler(
    const MethodChannel('plugins.it_nomads.com/flutter_secure_storage'),
    (call) async => call.method == 'readAll' ? <String, String>{} : null,
  );
  messenger.setMockMethodCallHandler(
    const MethodChannel('dev.fluttercommunity.plus/connectivity'),
    (call) async => <String>['wifi'],
  );
}
