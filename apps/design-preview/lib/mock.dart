import 'package:flutter/material.dart';

/// The entire "backend" of the prototype. No network, no database, no auth.
/// Everything lives in memory and resets when the app restarts.

enum Persona {
  /// Signed up with Google. No phone verified -> can browse, save and message,
  /// but CANNOT post an ad or request verification. This is the persona that
  /// makes the login gates visible.
  buyer,

  /// Phone-verified individual seller with live ads.
  seller,

  /// Phone-verified business, gold badge.
  business,
}

class MockUser {
  final String name, handle, avatarEmoji;
  final bool phoneVerified, idVerified, businessVerified;
  final String? phone, email;
  const MockUser({
    required this.name,
    required this.handle,
    required this.avatarEmoji,
    required this.phoneVerified,
    this.idVerified = false,
    this.businessVerified = false,
    this.phone,
    this.email,
  });
}

const mockUsers = <Persona, MockUser>{
  Persona.buyer: MockUser(
    name: 'Sujata Rai',
    handle: 'sujata',
    avatarEmoji: '🧕',
    phoneVerified: false,
    email: 'sujata.rai@gmail.com',
  ),
  Persona.seller: MockUser(
    name: 'Bikash Thapa',
    handle: 'bikash',
    avatarEmoji: '🧑',
    phoneVerified: true,
    idVerified: true,
    phone: '+977 9841 023 118',
    email: 'bikash.thapa@gmail.com',
  ),
  Persona.business: MockUser(
    name: 'Everest Electronics',
    handle: 'everest-electronics',
    avatarEmoji: '🏪',
    phoneVerified: true,
    idVerified: true,
    businessVerified: true,
    phone: '+977 9801 447 260',
    email: 'sales@everestelectronics.com.np',
  ),
};

// Ad, category and chat mock data removed: Home, Search, Ad detail and
// Messages are out of scope for this review.

/// The session. `signedIn == false` is what makes every gate appear.
class Session extends ChangeNotifier {
  bool signedIn = false;
  Persona persona = Persona.seller;
  bool nepali = false;

  MockUser get user => mockUsers[persona]!;

  /// "Fake login" — no password, no network. Pick a persona and you are in.
  void signIn(Persona p) {
    persona = p;
    signedIn = true;
    notifyListeners();
  }

  void signOut() {
    signedIn = false;
    notifyListeners();
  }

  void toggleLocale() {
    nepali = !nepali;
    notifyListeners();
  }

  void switchPersona(Persona p) {
    persona = p;
    notifyListeners();
  }
}

/// Single global instance — a Provider would be ceremony for a prototype.
final session = Session();
