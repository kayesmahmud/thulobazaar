import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/api/api_config.dart';
import 'package:mobile/core/models/api_response.dart';
import 'package:mobile/core/api/support_client.dart';
import 'package:mobile/features/support/widgets/support_photo.dart';

import 'helpers/pump_localized.dart';

// A real 1x1 PNG so Image.file has something decodable to show.
const _onePixelPng =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

File _tempPhoto() {
  final dir = Directory.systemTemp.createTempSync('support_photo_test');
  addTearDown(() => dir.deleteSync(recursive: true));
  return File('${dir.path}/photo.png')
    ..writeAsBytesSync(base64Decode(_onePixelPng));
}

void main() {
  group('supportImageUrl', () {
    test('prefixes a relative upload path with the API host', () {
      final host = ApiConfig.baseUrl.replaceFirst(RegExp(r'/api$'), '');
      expect(
        supportImageUrl('/uploads/messages/msg_1.avif'),
        '$host/uploads/messages/msg_1.avif',
      );
      expect(supportImageUrl('/x.jpg'), startsWith('http'));
    });

    test('leaves an absolute URL alone', () {
      expect(
        supportImageUrl('https://cdn.example.com/a.jpg'),
        'https://cdn.example.com/a.jpg',
      );
    });
  });

  group('supportPhotoFailureText', () {
    testWidgets('words the rate limit and a generic failure differently', (
      tester,
    ) async {
      await pumpLocalized(tester, const SizedBox());
      final limited = ApiResponse<String>(
        success: false,
        error: 'Too many',
        code: SupportClient.imageLimitCode,
      );
      final other = ApiResponse<String>(success: false, error: 'boom');
      expect(
        supportPhotoFailureText(limited),
        startsWith('You can send up to 5'),
      );
      expect(
        supportPhotoFailureText(other),
        'Could not send the photo. Please try again.',
      );
    });
  });

  group('SupportPhotoBubble', () {
    testWidgets('shows the caption when there is one', (tester) async {
      await pumpLocalized(
        tester,
        const Scaffold(
          body: SupportPhotoBubble(
            url: '/uploads/messages/a.jpg',
            caption: 'Here is the receipt',
            isOwn: true,
          ),
        ),
      );
      expect(find.text('Here is the receipt'), findsOneWidget);
    });

    testWidgets('renders no caption text for a photo-only message', (
      tester,
    ) async {
      await pumpLocalized(
        tester,
        const Scaffold(
          body: SupportPhotoBubble(
            url: '/uploads/messages/a.jpg',
            caption: '',
            isOwn: false,
          ),
        ),
      );
      expect(find.byType(SupportPhotoBubble), findsOneWidget);
      expect(find.byType(Text), findsNothing);
    });
  });

  group('PendingPhotoBar', () {
    testWidgets('shows "photo ready" and fires cancel and send', (
      tester,
    ) async {
      var cancelled = 0;
      var sent = 0;
      await pumpLocalized(
        tester,
        Scaffold(
          body: PendingPhotoBar(
            file: _tempPhoto(),
            isUploading: false,
            onCancel: () => cancelled++,
            onSend: () => sent++,
          ),
        ),
      );
      expect(find.text('Photo ready to send'), findsOneWidget);
      expect(find.byType(CircularProgressIndicator), findsNothing);

      await tester.tap(find.byTooltip('Cancel'));
      await tester.tap(find.byTooltip('Photo ready to send'));
      expect(cancelled, 1);
      expect(sent, 1);
    });

    testWidgets('shows a spinner and "sending" while uploading', (
      tester,
    ) async {
      await pumpLocalized(
        tester,
        Scaffold(
          body: PendingPhotoBar(
            file: _tempPhoto(),
            isUploading: true,
            onCancel: () {},
            onSend: () {},
          ),
        ),
      );
      expect(find.text('Sending photo…'), findsOneWidget);
      expect(find.byType(CircularProgressIndicator), findsOneWidget);
      expect(find.byType(IconButton), findsNothing);
    });

    testWidgets('reads in Nepali', (tester) async {
      await pumpLocalized(
        tester,
        Scaffold(
          body: PendingPhotoBar(
            file: _tempPhoto(),
            isUploading: false,
            onCancel: () {},
            onSend: () {},
          ),
        ),
        locale: localeNe,
      );
      expect(find.text('फोटो पठाउन तयार छ'), findsOneWidget);
    });
  });
}
