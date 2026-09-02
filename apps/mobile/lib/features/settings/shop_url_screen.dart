import 'dart:async';

import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';

import 'package:mobile/core/api/shop_client.dart';
import 'package:mobile/core/providers/auth_provider.dart';
import 'package:mobile/core/theme/app_font.dart';
import 'package:mobile/core/theme/app_tokens.dart';
import 'package:mobile/core/utils/shop_slug.dart';

/// The public address of a verified business's shop, editable with a live
/// availability check. Mirrors the website's Shop tab.
class ShopUrlScreen extends StatefulWidget {
  const ShopUrlScreen({super.key});
  @override
  State<ShopUrlScreen> createState() => _ShopUrlScreenState();
}

enum _Check { idle, invalid, checking, available, taken }

class _ShopUrlScreenState extends State<ShopUrlScreen> {
  final _shop = ShopClient();
  late final TextEditingController _field;
  late final String _current;
  _Check _check = _Check.idle;
  Timer? _debounce;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final user = context.read<AuthProvider>().user ?? const <String, dynamic>{};
    _current =
        (user['customShopSlug'] as String?) ??
        (user['shopSlug'] as String?) ??
        '';
    _field = TextEditingController(text: _current);
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _field.dispose();
    super.dispose();
  }

  String get _slug => normalizeShopSlug(_field.text);

  String _address(BuildContext context, String slug) =>
      'thulobazaar.com.np/${context.locale.languageCode}/shop/$slug';

  void _onChanged(String _) {
    _debounce?.cancel();
    final slug = _slug;
    if (slug == _current) {
      setState(() => _check = _Check.idle);
      return;
    }
    if (!isValidShopSlug(slug)) {
      setState(() => _check = _Check.invalid);
      return;
    }
    setState(() => _check = _Check.checking);
    _debounce = Timer(const Duration(milliseconds: 450), () => _lookUp(slug));
  }

  Future<void> _lookUp(String slug) async {
    final result = await _shop.checkSlug(slug);
    if (!mounted || _slug != slug) return;
    setState(() {
      _check = result.data == true ? _Check.available : _Check.taken;
    });
  }

  Future<void> _save() async {
    final slug = _slug;
    final auth = context.read<AuthProvider>();
    final messenger = ScaffoldMessenger.of(context);
    final navigator = Navigator.of(context);
    setState(() => _saving = true);
    final result = await _shop.updateShopSlug(slug);
    if (!mounted) return;
    setState(() => _saving = false);
    if (!result.success) {
      messenger.showSnackBar(SnackBar(content: Text(result.error ?? '')));
      return;
    }
    await auth.refreshProfile();
    messenger.showSnackBar(
      SnackBar(content: Text('settings.shopUrlSaved'.tr())),
    );
    navigator.pop();
  }

  Future<void> _copy() async {
    final messenger = ScaffoldMessenger.of(context);
    await Clipboard.setData(
      ClipboardData(text: 'https://${_address(context, _current)}'),
    );
    messenger.showSnackBar(
      SnackBar(content: Text('settings.shopUrlCopied'.tr())),
    );
  }

  @override
  Widget build(BuildContext context) {
    final canSave = _check == _Check.available && !_saving;
    return Scaffold(
      backgroundColor: AppTokens.canvas,
      appBar: AppBar(
        backgroundColor: AppTokens.surface,
        surfaceTintColor: AppTokens.surface,
        elevation: 0,
        title: Text(
          'settings.shopUrl'.tr(),
          style: AppFont.inter(fontSize: 18, fontWeight: FontWeight.w800),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Text(
            'settings.shopUrlIntro'.tr(),
            style: AppFont.inter(
              fontSize: 14,
              color: AppTokens.inkMuted,
              height: 1.5,
            ),
          ),
          const SizedBox(height: 20),
          _CurrentAddress(address: _address(context, _current), onCopy: _copy),
          const SizedBox(height: 20),
          TextField(
            key: const ValueKey('shop_slug_field'),
            controller: _field,
            onChanged: _onChanged,
            autocorrect: false,
            textInputAction: TextInputAction.done,
            inputFormatters: [
              FilteringTextInputFormatter.allow(RegExp(r'[A-Za-z0-9\- ]')),
              LengthLimitingTextInputFormatter(shopSlugMaxLength),
            ],
            decoration: InputDecoration(
              labelText: 'settings.shopUrl'.tr(),
              prefixText: '/shop/',
              helperText: _helper(),
              helperStyle: AppFont.inter(fontSize: 12.5, color: _helperColor()),
              suffixIcon: _suffix(),
            ),
          ),
          const SizedBox(height: 24),
          FilledButton(
            key: const ValueKey('shop_slug_save'),
            onPressed: canSave ? _save : null,
            style: FilledButton.styleFrom(
              backgroundColor: AppTokens.brand,
              minimumSize: const Size(double.infinity, 50),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
            ),
            child: _saving
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Colors.white,
                    ),
                  )
                : Text(
                    'common.save'.tr(),
                    style: AppFont.inter(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
          ),
        ],
      ),
    );
  }

  String? _helper() => switch (_check) {
    _Check.idle => null,
    _Check.invalid => 'settings.shopUrlInvalid'.tr(),
    _Check.checking => 'settings.shopUrlChecking'.tr(),
    _Check.available => 'settings.shopUrlAvailable'.tr(),
    _Check.taken => 'settings.shopUrlTaken'.tr(),
  };

  Color _helperColor() => switch (_check) {
    _Check.available => AppTokens.successInk,
    _Check.taken || _Check.invalid => AppTokens.danger,
    _ => AppTokens.inkFaint,
  };

  Widget? _suffix() => switch (_check) {
    _Check.checking => const Padding(
      padding: EdgeInsets.all(12),
      child: SizedBox(
        width: 18,
        height: 18,
        child: CircularProgressIndicator(strokeWidth: 2),
      ),
    ),
    _Check.available => const Icon(
      LucideIcons.checkCircle2,
      color: AppTokens.successInk,
    ),
    _Check.taken ||
    _Check.invalid => const Icon(LucideIcons.xCircle, color: AppTokens.danger),
    _ => null,
  };
}

class _CurrentAddress extends StatelessWidget {
  final String address;
  final VoidCallback onCopy;
  const _CurrentAddress({required this.address, required this.onCopy});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(14, 12, 6, 12),
      decoration: BoxDecoration(
        color: AppTokens.surface,
        borderRadius: BorderRadius.circular(AppTokens.radiusCard),
        border: Border.all(color: AppTokens.hairline),
      ),
      child: Row(
        children: [
          const Icon(LucideIcons.link, size: 18, color: AppTokens.inkFaint),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              address,
              style: AppFont.inter(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: AppTokens.ink,
              ),
            ),
          ),
          IconButton(
            tooltip: 'settings.copyLink'.tr(),
            icon: const Icon(LucideIcons.copy, size: 18),
            onPressed: onCopy,
          ),
        ],
      ),
    );
  }
}
