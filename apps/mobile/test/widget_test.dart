import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/providers/auth_provider.dart';
import 'package:mobile/core/providers/chat_provider.dart';
import 'package:mobile/core/providers/notification_provider.dart';
import 'package:mobile/core/widgets/floating_tab_bar.dart';
import 'package:mobile/features/main_nav/main_nav_screen.dart';
import 'package:provider/provider.dart';

import 'helpers/pump_localized.dart';

void main() {
  testWidgets('the nav shell opens on Home with the floating bar', (
    tester,
  ) async {
    await pumpLocalized(
      tester,
      const MainNavScreen(),
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => ChatProvider()),
        ChangeNotifierProvider(create: (_) => NotificationProvider()),
      ],
    );
    // The feed polls for new ads on a timer, so never pumpAndSettle here.
    await tester.pump(const Duration(milliseconds: 500));

    expect(find.byType(MainNavScreen), findsOneWidget);
    expect(find.byType(FloatingTabBar), findsOneWidget);
    // The feed itself needs the network, which the test sandbox refuses, so
    // Home shows its error state here; the shell around it is what we check.
    for (final label in ['Home', 'Search', 'Messages', 'Profile']) {
      expect(find.text(label), findsOneWidget);
    }
  });
}
