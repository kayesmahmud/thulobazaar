import 'dart:async';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:lucide_icons/lucide_icons.dart';

import 'app.dart';
import 'tokens.dart';

/// PROTOTYPE ONLY. A floating, blurred bottom tab bar over a scrolling feed,
/// built with stock widgets (ClipRRect + BackdropFilter), so its real cost can
/// be measured on a phone: the chip at the top reports frame times from
/// [SchedulerBinding.addTimingsCallback]; `dumpsys gfxinfo` / `meminfo` give
/// the OS view. Toggle "Blur" to compare against the same bar without the
/// BackdropFilter, which is the fallback for weak phones.
enum DockStyle { instagram, ios26, static }

class GlassDockDemo extends StatefulWidget {
  const GlassDockDemo({super.key});
  @override
  State<GlassDockDemo> createState() => _GlassDockDemoState();
}

class _GlassDockDemoState extends State<GlassDockDemo> {
  bool _blur = true;
  bool _expandOnStop = true;
  bool _compact = false;
  DockStyle _style = DockStyle.instagram;
  int _tab = 0;

  double _lastPixels = 0;
  Timer? _idle;

  // ---- frame timing ------------------------------------------------------
  final List<double> _raster = [];
  final List<double> _build = [];
  int _frames = 0, _janky = 0;
  double _budgetMs = 16.7;
  DateTime _lastStatsPaint = DateTime.now();

  @override
  void initState() {
    super.initState();
    SchedulerBinding.instance.addTimingsCallback(_onTimings);
    final display =
        WidgetsBinding.instance.platformDispatcher.views.first.display;
    final hz = display.refreshRate;
    if (hz > 0) _budgetMs = 1000 / hz;
  }

  @override
  void dispose() {
    SchedulerBinding.instance.removeTimingsCallback(_onTimings);
    _idle?.cancel();
    super.dispose();
  }

  void _onTimings(List<FrameTiming> timings) {
    for (final t in timings) {
      _raster.add(t.rasterDuration.inMicroseconds / 1000);
      _build.add(t.buildDuration.inMicroseconds / 1000);
      _frames++;
      if (t.totalSpan.inMicroseconds / 1000 > _budgetMs) _janky++;
    }
    while (_raster.length > 240) {
      _raster.removeAt(0);
      _build.removeAt(0);
    }
    // Repaint the chip at most twice a second; it must not become the load.
    if (DateTime.now().difference(_lastStatsPaint).inMilliseconds > 500 &&
        mounted) {
      _lastStatsPaint = DateTime.now();
      setState(() {});
    }
  }

  double _p(List<double> xs, double q) {
    if (xs.isEmpty) return 0;
    final s = [...xs]..sort();
    return s[((s.length - 1) * q).round()];
  }

  void _resetStats() => setState(() {
    _raster.clear();
    _build.clear();
    _frames = 0;
    _janky = 0;
  });

  // ---- scroll -> compact ---------------------------------------------------
  bool _onScroll(ScrollNotification n) {
    if (_style == DockStyle.static) return false;
    if (n is ScrollUpdateNotification) {
      final px = n.metrics.pixels;
      final d = px - _lastPixels;
      _lastPixels = px;
      if (d > 3 && px > 60) _setCompact(true);
      if (d < -3) _setCompact(false);
      _idle?.cancel();
      if (_expandOnStop) {
        _idle = Timer(
          const Duration(milliseconds: 220),
          () => _setCompact(false),
        );
      }
    }
    return false;
  }

  void _setCompact(bool v) {
    if (_compact == v || !mounted) return;
    setState(() => _compact = v);
  }

  // ---- build ---------------------------------------------------------------
  @override
  Widget build(BuildContext context) {
    final top = MediaQuery.viewPaddingOf(context).top;
    return Scaffold(
      extendBody: true,
      backgroundColor: const Color(0xFFF3F4F6),
      body: Stack(
        fit: StackFit.expand,
        children: [
          NotificationListener<ScrollNotification>(
            onNotification: _onScroll,
            child: GridView.builder(
              padding: EdgeInsets.fromLTRB(12, top + 150, 12, 140),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                mainAxisSpacing: 10,
                crossAxisSpacing: 10,
                childAspectRatio: 0.72,
              ),
              itemCount: 400,
              itemBuilder: (_, i) => _AdCard(_ads[i % _ads.length], i),
            ),
          ),
          Positioned(top: 0, left: 0, right: 0, child: _controls(top)),
          Positioned(
            left: 0,
            right: 0,
            bottom: MediaQuery.viewPaddingOf(context).bottom + 14,
            child: RepaintBoundary(child: _dock()),
          ),
        ],
      ),
    );
  }

  Widget _controls(double top) {
    final p90 = _p(_raster, 0.9), b90 = _p(_build, 0.9);
    final jank = _frames == 0 ? 0 : (_janky * 100 / _frames).round();
    return Container(
      padding: EdgeInsets.fromLTRB(12, top + 6, 12, 10),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Color(0xFFF3F4F6), Color(0xFFF3F4F6), Color(0x00F3F4F6)],
          stops: [0, .8, 1],
        ),
      ),
      child: Column(
        children: [
          Row(
            children: [
              IconButton(
                key: const ValueKey('exit_demo'),
                onPressed: () => Navigator.pushReplacement(
                  context,
                  MaterialPageRoute(builder: (_) => const RootShell()),
                ),
                icon: const Icon(LucideIcons.x),
              ),
              Expanded(
                child: SegmentedButton<DockStyle>(
                  segments: const [
                    ButtonSegment(
                      value: DockStyle.instagram,
                      label: Text('Instagram'),
                    ),
                    ButtonSegment(
                      value: DockStyle.ios26,
                      label: Text('iOS 26'),
                    ),
                    ButtonSegment(
                      value: DockStyle.static,
                      label: Text('Static'),
                    ),
                  ],
                  selected: {_style},
                  showSelectedIcon: false,
                  onSelectionChanged: (s) => setState(() {
                    _style = s.first;
                    _compact = false;
                  }),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Row(
            children: [
              _toggle(
                'Blur',
                _blur,
                (v) => setState(() => _blur = v),
                key: 'blur_toggle',
              ),
              const SizedBox(width: 8),
              _toggle(
                'Expand on stop',
                _expandOnStop,
                (v) => setState(() => _expandOnStop = v),
              ),
              const Spacer(),
              GestureDetector(
                onTap: _resetStats,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: jank > 10
                        ? const Color(0xFFFEE2E2)
                        : const Color(0xFFD1FAE5),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    'raster p90 ${p90.toStringAsFixed(1)} · build p90 ${b90.toStringAsFixed(1)}\n'
                    'jank $jank% of $_frames  (budget ${_budgetMs.toStringAsFixed(1)} ms)',
                    style: T.trustChip().copyWith(fontSize: 10.5, height: 1.3),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _toggle(
    String label,
    bool on,
    ValueChanged<bool> onChanged, {
    String? key,
  }) => FilterChip(
    key: key == null ? null : ValueKey(key),
    label: Text(label),
    selected: on,
    onSelected: onChanged,
    selectedColor: T.brand.withValues(alpha: .14),
    checkmarkColor: T.brand,
  );

  Widget _dock() {
    final ios = _style == DockStyle.ios26;
    final compact = _compact;
    final h = compact ? 50.0 : 66.0;
    final side = compact ? (ios ? 0.0 : 36.0) : 16.0;
    final curve = Curves.easeOutBack;
    const dur = Duration(milliseconds: 340);

    final items = <Widget>[
      _item(0, LucideIcons.home, 'Home', compact),
      _item(1, LucideIcons.search, 'Search', compact),
      _fab(compact),
      _item(2, LucideIcons.messageCircle, 'Chats', compact, badge: 3),
      _item(3, LucideIcons.user, 'Profile', compact),
    ];

    final bar = Container(
      height: h,
      decoration: BoxDecoration(
        color: _blur
            ? Colors.white.withValues(alpha: .62)
            : Colors.white.withValues(alpha: .96),
        borderRadius: BorderRadius.circular(h / 2),
        border: Border.all(color: Colors.white.withValues(alpha: .75)),
      ),
      child: ios && compact
          ? Center(child: _item(_tab, _iconFor(_tab), '', true))
          : Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: items,
            ),
    );

    final glass = _blur
        ? ClipRRect(
            borderRadius: BorderRadius.circular(h / 2),
            child: BackdropFilter(
              filter: ui.ImageFilter.blur(sigmaX: 18, sigmaY: 18),
              child: bar,
            ),
          )
        : bar;

    return AnimatedContainer(
      duration: dur,
      curve: curve,
      alignment: ios && compact ? Alignment.centerRight : Alignment.center,
      padding: EdgeInsets.symmetric(horizontal: ios && compact ? 16 : side),
      child: AnimatedContainer(
        duration: dur,
        curve: curve,
        width: ios && compact ? 50 : double.infinity,
        height: h,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(h / 2),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF111827).withValues(alpha: .18),
              blurRadius: 30,
              offset: const Offset(0, 10),
            ),
          ],
        ),
        child: GestureDetector(
          onTap: compact ? () => _setCompact(false) : null,
          child: glass,
        ),
      ),
    );
  }

  IconData _iconFor(int i) => const [
    LucideIcons.home,
    LucideIcons.search,
    LucideIcons.messageCircle,
    LucideIcons.user,
  ][i];

  Widget _item(int i, IconData icon, String label, bool compact, {int? badge}) {
    final on = _tab == i;
    final color = on ? T.brand : T.inkFaint;
    return Expanded(
      flex: label.isEmpty ? 0 : 1,
      child: InkWell(
        onTap: compact ? null : () => setState(() => _tab = i),
        child: SizedBox(
          height: 50,
          width: label.isEmpty ? 50 : null,
          child: Stack(
            alignment: Alignment.center,
            children: [
              Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(icon, size: compact ? 21 : 24, color: color),
                  AnimatedSize(
                    duration: const Duration(milliseconds: 200),
                    child: compact || label.isEmpty
                        ? const SizedBox.shrink()
                        : Padding(
                            padding: const EdgeInsets.only(top: 3),
                            child: Text(
                              label,
                              style: T.trustChip().copyWith(
                                fontSize: 10.5,
                                fontWeight: FontWeight.w600,
                                color: color,
                              ),
                            ),
                          ),
                  ),
                ],
              ),
              if (badge != null)
                Positioned(
                  top: compact ? 4 : 8,
                  right: 18,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    height: 16,
                    decoration: BoxDecoration(
                      color: T.brand,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      '$badge',
                      style: T.trustChip().copyWith(
                        fontSize: 9.5,
                        color: Colors.white,
                        fontWeight: FontWeight.w700,
                        height: 1.7,
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _fab(bool compact) => AnimatedContainer(
    duration: const Duration(milliseconds: 300),
    curve: Curves.easeOutBack,
    width: compact ? 38 : 50,
    height: compact ? 38 : 50,
    margin: const EdgeInsets.symmetric(horizontal: 6),
    decoration: BoxDecoration(
      color: T.brand,
      shape: BoxShape.circle,
      boxShadow: [
        BoxShadow(
          color: T.brand.withValues(alpha: .38),
          blurRadius: 16,
          offset: const Offset(0, 6),
        ),
      ],
    ),
    child: Icon(LucideIcons.plus, color: Colors.white, size: compact ? 20 : 26),
  );
}

// ---------------------------------------------------------------------------

class _Ad {
  final String title, price, place, age;
  final int hue;
  final String? tag;
  const _Ad(this.title, this.price, this.place, this.age, this.hue, [this.tag]);
}

const _ads = [
  _Ad(
    'iPhone 13 128GB, box + bill',
    'Rs. 62,000',
    'Kathmandu',
    '2h',
    0,
    'FEATURED',
  ),
  _Ad('Honda Shine 125 2021', 'Rs. 1,85,000', 'Lalitpur', '4h', 1),
  _Ad('2 BHK flat, Baneshwor', 'Rs. 22,000/mo', 'Kathmandu', '5h', 2),
  _Ad('Dell Latitude 5420 i5', 'Rs. 58,000', 'Pokhara', '6h', 3, 'URGENT'),
  _Ad('Royal Enfield Classic 350', 'Rs. 4,10,000', 'Bhaktapur', '8h', 1),
  _Ad('5-seater sofa set, teak', 'Rs. 38,000', 'Chitwan', '9h', 4),
  _Ad('Samsung 43" Crystal UHD TV', 'Rs. 52,500', 'Kathmandu', '12h', 3),
  _Ad(
    '4 aana land, Suryabinayak',
    'Rs. 1.2 Cr',
    'Bhaktapur',
    '1d',
    2,
    'FEATURED',
  ),
  _Ad('Hyundai Creta 2019 SX', 'Rs. 47,50,000', 'Lalitpur', '1d', 1),
  _Ad('Labrador puppies, 2 months', 'Rs. 18,000', 'Butwal', '1d', 5),
  _Ad('Redmi Note 13 Pro 256GB', 'Rs. 31,000', 'Biratnagar', '1d', 0),
  _Ad('TVS Ntorq 125 2022', 'Rs. 2,15,000', 'Dharan', '2d', 1),
  _Ad('MacBook Air M2 8/256', 'Rs. 1,35,000', 'Kathmandu', '2d', 3, 'URGENT'),
  _Ad('Office chair, mesh', 'Rs. 7,500', 'Lalitpur', '2d', 4),
  _Ad('Shop space 300 sq ft, Newroad', 'Rs. 45,000/mo', 'Kathmandu', '3d', 2),
  _Ad('Canon EOS 200D + 18-55', 'Rs. 48,000', 'Pokhara', '3d', 3),
];

const _hues = [
  [Color(0xFFC7D2FE), Color(0xFF6366F1)],
  [Color(0xFFFED7AA), Color(0xFFEA580C)],
  [Color(0xFFA7F3D0), Color(0xFF0D9488)],
  [Color(0xFFBAE6FD), Color(0xFF0284C7)],
  [Color(0xFFFDE68A), Color(0xFFB45309)],
  [Color(0xFFFBCFE8), Color(0xFFDB2777)],
];

class _AdCard extends StatelessWidget {
  final _Ad ad;
  final int i;
  const _AdCard(this.ad, this.i);

  @override
  Widget build(BuildContext context) {
    final h = _hues[ad.hue];
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: T.hairline),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Container(
              alignment: Alignment.bottomLeft,
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment(0.3 + (i % 5) * 0.2, 1),
                  colors: h,
                ),
              ),
              child: ad.tag == null
                  ? null
                  : Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 7,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: ad.tag == 'URGENT'
                            ? const Color(0xFFF59E0B)
                            : T.brand,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        ad.tag!,
                        style: T.trustChip().copyWith(
                          fontSize: 10,
                          color: Colors.white,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(10, 8, 10, 10),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  ad.title,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: T
                      .benefitSub(false)
                      .copyWith(color: T.ink, fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 3),
                Text(
                  ad.price,
                  style: T.tierTitle().copyWith(
                    fontSize: 14,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                Text(
                  '${ad.place} · ${ad.age}',
                  style: T.benefitSub(false).copyWith(fontSize: 11.5),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
