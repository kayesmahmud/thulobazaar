import 'package:flutter_test/flutter_test.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:mobile/core/providers/auth_provider.dart';
import 'package:mobile/features/profile/profile_screen.dart';
import 'package:provider/provider.dart';

import 'helpers/pump_localized.dart';

const _seller = <String, dynamic>{
  'id': 42,
  'fullName': 'Bikash Thapa',
  'phone': '9841023118',
  'phoneVerified': true,
  'createdAt': '2026-03-01T00:00:00.000Z',
};

void main() {
  testWidgets('profile has the person and saved-ads tabs only', (tester) async {
    await pumpLocalized(
      tester,
      const ProfileScreen(),
      providers: [
        ChangeNotifierProvider<AuthProvider>(
          create: (_) => AuthProvider.withUser(_seller),
        ),
      ],
    );
    await tester.pump();

    expect(find.text('Bikash Thapa'), findsWidgets);
    expect(find.byIcon(LucideIcons.user), findsWidgets);
    expect(find.byIcon(LucideIcons.heart), findsOneWidget);
    // Security moved to Settings: no lock tab, no Security Center row.
    expect(find.byIcon(LucideIcons.lock), findsNothing);
    expect(find.text('Security Center'), findsNothing);

    // The header's staggered fade-ins schedule short timers; let them run
    // out before the tree is torn down.
    await tester.pump(const Duration(seconds: 3));
  });
}
