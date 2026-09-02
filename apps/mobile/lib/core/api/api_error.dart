/// Reads `message` out of an API error body.
///
/// On the happy path the body is a JSON map. A proxy or CDN error page
/// arrives as a String, and `body['message']` on a String throws a
/// TypeError, usually from inside a `catch` block where nothing catches it.
/// One Cloudflare 502 could leave a screen spinning forever.
String? apiMessage(Object? body) =>
    body is Map ? body['message']?.toString() : null;
