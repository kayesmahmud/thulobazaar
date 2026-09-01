import 'package:flutter/material.dart';
import 'package:mobile/core/theme/app_font.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:mobile/core/widgets/app_cached_image.dart';

/// Fullscreen, swipeable image viewer with pinch + double-tap zoom.
///
/// Opened from the ad detail gallery on tap. It lives in its own route with no
/// parent scrollable, so zoom gestures work reliably on Android — unlike the
/// inline gallery, whose `InteractiveViewer` is starved of gestures by the
/// collapsing `SliverAppBar`/`FlexibleSpaceBar` it sits inside.
class FullscreenImageViewer extends StatefulWidget {
  final List<String> images;
  final int initialIndex;
  final String? heroTag;

  const FullscreenImageViewer({
    super.key,
    required this.images,
    this.initialIndex = 0,
    this.heroTag,
  });

  @override
  State<FullscreenImageViewer> createState() => _FullscreenImageViewerState();
}

class _FullscreenImageViewerState extends State<FullscreenImageViewer> {
  late final PageController _pageController;
  late int _currentIndex;
  bool _isZoomed = false;

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialIndex;
    _pageController = PageController(initialPage: widget.initialIndex);
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final topPad = MediaQuery.of(context).padding.top;
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          PageView.builder(
            controller: _pageController,
            itemCount: widget.images.length,
            // Disable horizontal swipe while zoomed so panning a zoomed image
            // doesn't accidentally flip to the next photo.
            physics: _isZoomed
                ? const NeverScrollableScrollPhysics()
                : const PageScrollPhysics(),
            onPageChanged: (idx) => setState(() {
              _currentIndex = idx;
              _isZoomed = false;
            }),
            itemBuilder: (context, index) => _ZoomableImage(
              imageUrl: widget.images[index],
              heroTag: index == 0 ? widget.heroTag : null,
              onZoomChanged: (zoomed) {
                if (zoomed != _isZoomed) setState(() => _isZoomed = zoomed);
              },
            ),
          ),

          // Close button
          Positioned(
            top: topPad + 8,
            left: 8,
            child: _CircleButton(
              icon: LucideIcons.x,
              onTap: () => Navigator.of(context).pop(),
            ),
          ),

          // Counter (only when there are multiple images)
          if (widget.images.length > 1)
            Positioned(
              top: topPad + 14,
              right: 16,
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 5,
                ),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Text(
                  '${_currentIndex + 1}/${widget.images.length}',
                  style: AppFont.inter(
                    color: Colors.white,
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

/// A single fullscreen image that supports pinch-to-zoom (InteractiveViewer)
/// and double-tap-to-zoom toward the tapped point. Owns its own transform so
/// each page in the gallery zooms independently.
class _ZoomableImage extends StatefulWidget {
  final String imageUrl;
  final String? heroTag;
  final ValueChanged<bool> onZoomChanged;

  const _ZoomableImage({
    required this.imageUrl,
    required this.onZoomChanged,
    this.heroTag,
  });

  @override
  State<_ZoomableImage> createState() => _ZoomableImageState();
}

class _ZoomableImageState extends State<_ZoomableImage>
    with SingleTickerProviderStateMixin {
  final TransformationController _transformController =
      TransformationController();
  late final AnimationController _zoomAnimController;
  Animation<Matrix4>? _zoomAnimation;
  TapDownDetails? _doubleTapDetails;

  static const double _doubleTapScale = 2.5;

  @override
  void initState() {
    super.initState();
    _zoomAnimController =
        AnimationController(
          vsync: this,
          duration: const Duration(milliseconds: 250),
        )..addListener(() {
          final anim = _zoomAnimation;
          if (anim != null) _transformController.value = anim.value;
        });
  }

  @override
  void dispose() {
    _zoomAnimController.dispose();
    _transformController.dispose();
    super.dispose();
  }

  bool get _isZoomedIn => _transformController.value.getMaxScaleOnAxis() > 1.05;

  void _animateZoomTo(Matrix4 target) {
    _zoomAnimation =
        Matrix4Tween(begin: _transformController.value, end: target).animate(
          CurvedAnimation(parent: _zoomAnimController, curve: Curves.easeOut),
        );
    _zoomAnimController.forward(from: 0);
  }

  void _handleDoubleTap() {
    final zoomedIn = _isZoomedIn;
    final Matrix4 target;
    if (zoomedIn) {
      target = Matrix4.identity();
    } else {
      // Zoom in centered on the tapped point: scale on the diagonal, with a
      // translation that keeps `pos` fixed (t = -pos * (scale - 1)).
      final pos = _doubleTapDetails?.localPosition ?? Offset.zero;
      target = Matrix4.identity()
        ..setEntry(0, 0, _doubleTapScale)
        ..setEntry(1, 1, _doubleTapScale)
        ..setEntry(0, 3, -pos.dx * (_doubleTapScale - 1))
        ..setEntry(1, 3, -pos.dy * (_doubleTapScale - 1));
    }
    _animateZoomTo(target);
    widget.onZoomChanged(!zoomedIn);
  }

  @override
  Widget build(BuildContext context) {
    final Widget content = GestureDetector(
      onDoubleTapDown: (details) => _doubleTapDetails = details,
      onDoubleTap: _handleDoubleTap,
      child: InteractiveViewer(
        transformationController: _transformController,
        minScale: 1.0,
        maxScale: 4.0,
        onInteractionEnd: (_) => widget.onZoomChanged(_isZoomedIn),
        child: Center(
          child: AppCachedImage(
            imageUrl: widget.imageUrl,
            fit: BoxFit.contain,
            placeholder: const ColoredBox(color: Colors.black),
            errorWidget: const Center(
              child: Icon(Icons.broken_image, color: Colors.white24, size: 64),
            ),
          ),
        ),
      ),
    );

    if (widget.heroTag != null) {
      return Hero(tag: widget.heroTag!, child: content);
    }
    return content;
  }
}

class _CircleButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;

  const _CircleButton({required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.black.withValues(alpha: 0.4),
      shape: const CircleBorder(),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: SizedBox(
          width: 40,
          height: 40,
          child: Icon(icon, color: Colors.white, size: 22),
        ),
      ),
    );
  }
}
