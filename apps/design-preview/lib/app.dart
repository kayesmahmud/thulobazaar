import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'auth.dart';
import 'gates.dart';
import 'mock.dart';
import 'settings.dart';
import 'tokens.dart';

/// The signed-in / signed-out app shell. Which tabs gate is driven entirely by
/// `session`, so flipping persona in the drawer re-renders the whole prototype.
class RootShell extends StatefulWidget {
  const RootShell({super.key});
  @override
  State<RootShell> createState() => _RootShellState();
}

class _RootShellState extends State<RootShell> {
  int _tab = 0;

  void _openAuth() => Navigator.push(
      context, MaterialPageRoute(builder: (_) => const SignInScreen()));

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: session,
      builder: (context, _) {
        final inn = session.signedIn;

        // Tab 2 is the FAB (post ad), handled separately.
        final body = switch (_tab) {
          0 => const OutOfScope('Home'),
          1 => const OutOfScope('Search'),
          3 => inn
              ? const OutOfScope('Messages')
              : GateScreen(kind: GateKind.messages, onSignIn: _openAuth),
          _ => inn
              ? const ProfileTab()
              : GateScreen(kind: GateKind.profile, onSignIn: _openAuth),
        };

        // The gates render their own Scaffold and their own bottom nav, so the
        // shell must not double up.
        final gated = !inn && (_tab == 3 || _tab == 4);

        return Scaffold(
          backgroundColor: const Color(0xFFF9FAFB),
          drawer: const _PrototypeDrawer(),
          appBar: gated
              ? null
              : AppBar(
                  backgroundColor: Colors.white,
                  surfaceTintColor: Colors.white,
                  elevation: 0,
                ),
          body: gated
              ? Stack(children: [
                  body,
                  // keep the drawer reachable behind the gate
                  Positioned(
                    top: MediaQuery.viewPaddingOf(context).top + 4,
                    left: 4,
                    child: IconButton(
                      icon: const Icon(LucideIcons.menu, color: Colors.white),
                      onPressed: () => Scaffold.of(context).openDrawer(),
                    ),
                  ),
                ])
              : body,
          bottomNavigationBar: gated ? null : _nav(),
          floatingActionButton: gated
              ? null
              : FloatingActionButton(
                  backgroundColor: T.brandDeep,
                  shape: const CircleBorder(),
                  onPressed: () {
                    if (!inn) {
                      Navigator.push(
                          context,
                          MaterialPageRoute(
                              builder: (_) => GateScreen(
                                  kind: GateKind.postAd,
                                  onSignIn: _openAuth)));
                    } else if (!session.user.phoneVerified) {
                      Navigator.push(
                          context,
                          MaterialPageRoute(
                              builder: (_) => const VerifyPhoneWall()));
                    } else {
                      Navigator.push(
                          context,
                          MaterialPageRoute(
                              builder: (_) => Scaffold(
                                  appBar: AppBar(
                                      backgroundColor: Colors.white,
                                      elevation: 0),
                                  body: const OutOfScope('Post an ad'))));
                    }
                  },
                  child: const Icon(LucideIcons.plus,
                      color: Colors.white, size: 30),
                ),
          floatingActionButtonLocation:
              FloatingActionButtonLocation.centerDocked,
        );
      },
    );
  }

  Widget _nav() => BottomAppBar(
        color: Colors.white,
        height: 62,
        padding: EdgeInsets.zero,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: [
            _navItem(LucideIcons.home, 'Home', 0),
            _navItem(LucideIcons.search, 'Search', 1),
            const SizedBox(width: 48),
            _navItem(LucideIcons.messageCircle, 'Chats', 3),
            _navItem(LucideIcons.user, 'Profile', 4),
          ],
        ),
      );

  Widget _navItem(IconData icon, String label, int i) {
    final on = _tab == i;
    return InkWell(
      onTap: () => setState(() => _tab = i),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          // Brand rose, not the emerald the live app uses today.
          Icon(icon, size: 22, color: on ? T.brand : T.inkFaint),
          const SizedBox(height: 3),
          Text(label,
              style: T.trustChip().copyWith(
                  fontSize: 11,
                  color: on ? T.brand : T.inkFaint,
                  fontWeight: on ? FontWeight.w700 : FontWeight.w500)),
        ]),
      ),
    );
  }
}

// ---------------------------------------------------------------------------

/// OUT OF SCOPE for this design review.
///
/// Home, Search, Ad detail, Messages and Post Ad are deliberately left empty.
/// The review covers only what a signed-out user is blocked by, plus Profile,
/// Settings and the Drawer. These stubs keep the navigation intact so the app
/// still builds and runs, and so it is obvious later that nothing was designed
/// here rather than that a design was lost.
class OutOfScope extends StatelessWidget {
  final String name;
  const OutOfScope(this.name, {super.key});

  @override
  Widget build(BuildContext context) => Container(
        color: Colors.white,
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(36),
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              const Icon(LucideIcons.squareDashedBottom,
                  size: 40, color: T.hairline),
              const SizedBox(height: 16),
              Text(name,
                  textAlign: TextAlign.center,
                  style: T.benefit(false).copyWith(
                      fontSize: 17, fontWeight: FontWeight.w700)),
              const SizedBox(height: 8),
              Text('Not part of this design review.',
                  textAlign: TextAlign.center, style: T.benefitSub(false)),
              const SizedBox(height: 4),
              Text('Left empty on purpose.',
                  textAlign: TextAlign.center,
                  style: T.benefitSub(false).copyWith(fontSize: 12)),
            ]),
          ),
        ),
      );
}

class ProfileTab extends StatelessWidget {
  const ProfileTab({super.key});

  @override
  Widget build(BuildContext context) {
    final u = session.user;
    return ListView(
      padding: const EdgeInsets.only(bottom: 90),
      children: [
        Container(
          color: Colors.white,
          padding: const EdgeInsets.all(20),
          child: Row(children: [
            CircleAvatar(
                radius: 30,
                backgroundColor: const Color(0xFFF3F4F6),
                child: Text(u.avatarEmoji, style: const TextStyle(fontSize: 30))),
            const SizedBox(width: 14),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [
                  Flexible(
                      child: Text(u.name,
                          style: T.benefit(false).copyWith(
                              fontSize: 18, fontWeight: FontWeight.w800))),
                  if (u.businessVerified) ...[
                    const SizedBox(width: 6),
                    const Icon(LucideIcons.badgeCheck,
                        size: 17, color: Brand.verifiedBusiness),
                  ] else if (u.idVerified) ...[
                    const SizedBox(width: 6),
                    const Icon(LucideIcons.badgeCheck,
                        size: 17, color: Brand.verifiedIndividual),
                  ],
                ]),
                const SizedBox(height: 2),
                Text(u.phone ?? u.email ?? '', style: T.benefitSub(false)),
                if (!u.phoneVerified) ...[
                  const SizedBox(height: 6),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                        color: const Color(0xFFF59E0B).withValues(alpha: 0.14),
                        borderRadius: BorderRadius.circular(6)),
                    child: Text('Phone not verified',
                        style: T.trustChip().copyWith(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: const Color(0xFF92400E))),
                  ),
                ],
              ]),
            ),
            IconButton(
              icon: const Icon(LucideIcons.settings, color: T.ink),
              onPressed: () => Navigator.push(context,
                  MaterialPageRoute(builder: (_) => const SettingsScreen())),
            ),
          ]),
        ),
        const SizedBox(height: 12),
        _row(context, LucideIcons.layoutList, 'My ads', trailing: '3'),
        _row(context, LucideIcons.heart, 'Saved ads', trailing: '12'),
        _row(context, LucideIcons.badgeCheck, 'Get verified'),
        _row(context, LucideIcons.settings, 'Settings',
            dest: const SettingsScreen()),
      ],
    );
  }

  Widget _row(BuildContext context, IconData icon, String title,
          {String? trailing, Widget? dest}) =>
      Container(
        color: Colors.white,
        child: ListTile(
          leading: Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(
                color: Brand.primary.withValues(alpha: 0.10),
                borderRadius: BorderRadius.circular(T.rChip)),
            child: Icon(icon, size: 19, color: Brand.ink),
          ),
          title: Text(title, style: T.benefit(false)),
          trailing: Row(mainAxisSize: MainAxisSize.min, children: [
            if (trailing != null)
              Text(trailing, style: T.benefitSub(false).copyWith(fontSize: 14)),
            const SizedBox(width: 6),
            const Icon(LucideIcons.chevronRight, size: 18, color: T.inkFaint),
          ]),
          onTap: dest == null
              ? null
              : () => Navigator.push(
                  context, MaterialPageRoute(builder: (_) => dest)),
        ),
      );
}

/// What a Google/email buyer sees when they tap Post Ad: not a login gate —
/// they ARE logged in — but a phone-verification wall.
class VerifyPhoneWall extends StatelessWidget {
  const VerifyPhoneWall({super.key});
  @override
  Widget build(BuildContext context) => AuthShell(
        title: 'Add your phone to post',
        subtitle: 'Sellers need a verified Nepali number.',
        children: [
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
                color: const Color(0xFFFFFBEB),
                borderRadius: BorderRadius.circular(T.rTile),
                border: Border.all(color: const Color(0xFFFDE68A))),
            child: Row(children: [
              const Icon(LucideIcons.info, size: 18, color: Color(0xFF92400E)),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                    'Browsing, saving and messaging work. Posting needs a verified number.',
                    style: T.benefitSub(false)
                        .copyWith(color: const Color(0xFF92400E))),
              ),
            ]),
          ),
          const SizedBox(height: 18),
          const AuthField(
              label: 'Phone number', hint: '98XXXXXXXX', prefix: '+977'),
          const SizedBox(height: 20),
          authButton('Send code', () => Navigator.pop(context)),
        ],
      );
}

class _PrototypeDrawer extends StatelessWidget {
  const _PrototypeDrawer();

  @override
  Widget build(BuildContext context) {
    return Drawer(
      backgroundColor: Colors.white,
      child: AnimatedBuilder(
        animation: session,
        builder: (context, _) {
          final inn = session.signedIn;
          final u = session.user;
          return SafeArea(
            child: ListView(
              padding: EdgeInsets.zero,
              children: [
                // ---- identity -------------------------------------------
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 18, 20, 14),
                  child: Row(children: [
                    CircleAvatar(
                      radius: 24,
                      backgroundColor: const Color(0xFFF3F4F6),
                      child: Text(inn ? u.avatarEmoji : '👤',
                          style: const TextStyle(fontSize: 22)),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(inn ? u.name : 'Not signed in',
                          style: T.benefit(false).copyWith(
                              fontSize: 16, fontWeight: FontWeight.w700)),
                    ),
                  ]),
                ),

                // ---- GET VERIFIED: the one thing that should pull the eye.
                // Same destination as today, promoted from a plain text row
                // to a card so it stops competing with Help Center and FAQ.
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
                  child: InkWell(
                    borderRadius: BorderRadius.circular(T.rCard),
                    onTap: () => Navigator.pop(context),
                    child: Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [Brand.primary, Brand.deep],
                        ),
                        borderRadius: BorderRadius.circular(T.rCard),
                      ),
                      child: Row(children: [
                        const Icon(LucideIcons.badgeCheck,
                            color: Colors.white, size: 24),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text('Get verified',
                              style: T.benefit(false).copyWith(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w800)),
                        ),
                        // The FREE badge the live drawer already shows when
                        // eligible — green, because green is the "free" cue.
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 9, vertical: 4),
                          decoration: BoxDecoration(
                              color: Brand.green,
                              borderRadius: BorderRadius.circular(999)),
                          child: Text('FREE',
                              style: T.trustChip().copyWith(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w800,
                                  color: Colors.white)),
                        ),
                      ]),
                    ),
                  ),
                ),

                const SizedBox(height: 6),
                if (inn) ...[
                  _item(context, LucideIcons.user, 'My profile'),
                  _item(context, LucideIcons.layoutDashboard, 'Dashboard'),
                  _item(context, LucideIcons.store, 'My shop'),
                  const _Sep(),
                ],
                // Help center and Contact us moved into Settings — the drawer
                // keeps only the two ways to reach a human.
                _item(context, LucideIcons.messagesSquare, 'Live chat'),
                _item(context, LucideIcons.ticket, 'Support tickets'),
                const _Sep(),

                // ---- language: unchanged feature, same two options -------
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 4, 20, 6),
                  child: Row(children: [
                    _lang('English', !session.nepali),
                    const SizedBox(width: 8),
                    _lang('नेपाली', session.nepali),
                  ]),
                ),

                const _Sep(),
                // ---- prototype-only controls ----------------------------
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 8, 20, 4),
                  child: Text('PROTOTYPE ONLY',
                      style: T.trustChip().copyWith(fontWeight: FontWeight.w700)),
                ),
                for (final p in Persona.values)
                  ListTile(
                    dense: true,
                    leading: Icon(
                        inn && session.persona == p
                            ? LucideIcons.checkCircle2
                            : LucideIcons.circle,
                        size: 18,
                        color: inn && session.persona == p
                            ? Brand.rose
                            : T.inkFaint),
                    title: Text(mockUsers[p]!.name, style: T.benefitSub(false)),
                    onTap: () {
                      session.signIn(p);
                      Navigator.pop(context);
                    },
                  ),
                ListTile(
                  dense: true,
                  leading: const Icon(LucideIcons.logOut, size: 18),
                  title: Text(inn ? 'Sign out' : 'Sign in',
                      style: T.benefitSub(false)),
                  onTap: () {
                    Navigator.pop(context);
                    if (inn) {
                      session.signOut();
                    } else {
                      Navigator.push(context,
                          MaterialPageRoute(builder: (_) => const SignInScreen()));
                    }
                  },
                ),
                for (final k in GateKind.values)
                  ListTile(
                    dense: true,
                    visualDensity: VisualDensity.compact,
                    title: Text('gate: ${k.name}',
                        style: T.trustChip().copyWith(fontSize: 12)),
                    onTap: () {
                      Navigator.pop(context);
                      Navigator.push(
                          context,
                          MaterialPageRoute(
                              builder: (_) => GateScreen(
                                  kind: k,
                                  onSignIn: () => Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                          builder: (_) =>
                                              const SignInScreen())))));
                    },
                  ),
                const SizedBox(height: 20),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _item(BuildContext context, IconData icon, String label) => ListTile(
        leading: Icon(icon, size: 20, color: T.inkMuted),
        title: Text(label, style: T.benefit(false).copyWith(fontSize: 15)),
        onTap: () => Navigator.pop(context),
      );

  Widget _lang(String label, bool on) => Expanded(
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 9),
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: on ? Brand.rose.withValues(alpha: 0.10) : Colors.white,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: on ? Brand.rose : T.hairline),
          ),
          child: Text(label,
              style: T.benefitSub(false).copyWith(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: on ? T.brandInk : T.inkMuted)),
        ),
      );
}

class _Sep extends StatelessWidget {
  const _Sep();
  @override
  Widget build(BuildContext context) => const Padding(
        padding: EdgeInsets.symmetric(horizontal: 20, vertical: 8),
        child: Divider(height: 1, color: T.hairline),
      );
}
