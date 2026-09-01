import 'package:flutter/material.dart';
import 'package:mobile/core/theme/app_font.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import '../providers/notification_provider.dart';
import '../../features/notifications/notification_screen.dart';

class MainAppBar extends StatelessWidget implements PreferredSizeWidget {
  final PreferredSizeWidget? bottom;
  final Widget? leading;

  const MainAppBar({super.key, this.bottom, this.leading});

  @override
  Widget build(BuildContext context) {
    return AppBar(
      backgroundColor: Colors.white,
      elevation: 0,
      centerTitle: true,
      leading:
          leading ??
          IconButton(
            icon: const Icon(LucideIcons.menu, color: Colors.black),
            onPressed: () {
              Scaffold.of(context).openDrawer();
            },
          ),
      title: Image.asset(
        'assets/images/logo.png',
        height: 28,
        fit: BoxFit.contain,
        errorBuilder: (context, error, stackTrace) => Text(
          "THULO BAZAAR",
          style: AppFont.poppins(
            color: const Color(0xFFDC2626),
            fontWeight: FontWeight.w900,
            fontSize: 20,
            letterSpacing: -0.5,
          ),
        ),
      ),
      actions: [
        Consumer<NotificationProvider>(
          builder: (context, provider, _) {
            return IconButton(
              icon: Stack(
                clipBehavior: Clip.none,
                children: [
                  const Icon(LucideIcons.bell, color: Colors.black87, size: 22),
                  if (provider.unreadCount > 0)
                    Positioned(
                      right: -4,
                      top: -4,
                      child: TweenAnimationBuilder<double>(
                        key: ValueKey(provider.unreadCount),
                        tween: Tween(begin: 1.4, end: 1.0),
                        duration: const Duration(milliseconds: 400),
                        curve: Curves.elasticOut,
                        builder: (context, scale, child) =>
                            Transform.scale(scale: scale, child: child),
                        child: Container(
                          padding: const EdgeInsets.all(2),
                          decoration: const BoxDecoration(
                            color: Color(0xFFF43F5E),
                            shape: BoxShape.circle,
                          ),
                          constraints: const BoxConstraints(
                            minWidth: 16,
                            minHeight: 16,
                          ),
                          child: Text(
                            provider.unreadCount > 99
                                ? '99+'
                                : '${provider.unreadCount}',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 9,
                              fontWeight: FontWeight.bold,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const NotificationScreen()),
                );
              },
            );
          },
        ),
        const SizedBox(width: 4),
      ],
      bottom: bottom,
    );
  }

  @override
  Size get preferredSize =>
      Size.fromHeight(kToolbarHeight + (bottom?.preferredSize.height ?? 0));
}
