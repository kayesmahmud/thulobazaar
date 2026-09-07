import 'dart:async';
import 'dart:convert';
import 'dart:developer';
import 'dart:io';

import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:mobile/features/post_ad/submit_failure.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:dio/dio.dart';
import 'package:provider/provider.dart';
import 'package:mobile/core/providers/auth_provider.dart';
import 'package:mobile/features/profile/phone_verification_screen.dart';
import 'package:mobile/core/widgets/app_cached_image.dart';
import 'package:mobile/core/api/ad_client.dart';
import 'package:mobile/core/api/api_config.dart';
import 'package:mobile/core/api/location_client.dart';
import 'package:mobile/core/api/shop_client.dart';
import 'package:mobile/core/models/models.dart';
import 'package:mobile/core/services/analytics_service.dart';
import 'package:mobile/core/services/review_service.dart';
import 'package:mobile/core/widgets/category_icon.dart';
import 'package:mobile/core/widgets/success_checkmark.dart';
import 'package:mobile/features/ad_detail/ad_detail_screen.dart';
import 'package:mobile/features/dashboard/dashboard_screen.dart';
import 'package:mobile/features/post_ad/models/ad_draft_model.dart';
import 'package:mobile/features/post_ad/models/location_models.dart';
import 'package:mobile/features/post_ad/services/ad_draft_service.dart';
import 'package:mobile/features/post_ad/services/category_policy.dart';
import 'package:mobile/features/post_ad/services/form_template_service.dart';
import 'package:mobile/features/post_ad/widgets/dynamic_form_fields.dart';

class CreateAdScreen extends StatefulWidget {
  final String? draftId;
  final AdWithDetails? existingAd;

  const CreateAdScreen({super.key, this.draftId, this.existingAd});

  bool get isEditMode => existingAd != null;

  @override
  State<CreateAdScreen> createState() => _CreateAdScreenState();
}

class _CreateAdScreenState extends State<CreateAdScreen> {
  // Single-screen progressive form: sections reveal as earlier ones are
  // filled, and never collapse again (monotonic) so editing doesn't hide work.
  final _formKey = GlobalKey<FormState>();
  final _scrollController = ScrollController();
  final Map<String, GlobalKey> _sectionKeys = {
    'title': GlobalKey(),
    'category': GlobalKey(),
    'details': GlobalKey(),
    'location': GlobalKey(),
    'contact': GlobalKey(),
  };

  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _priceController = TextEditingController();

  bool _isLoading = false;
  bool _priceNegotiable = false;
  bool _codAvailable = false;

  // 0..1 while the multipart body is uploading; null once the server is
  // processing (or when idle). Drives the "Uploading X%" label on the button.
  double? _uploadProgress;

  // Data
  List<CategoryWithSubcategories> _categories = [];
  CategoryWithSubcategories? _selectedCategory;
  Category? _selectedSubCategory;

  // Images
  final ImagePicker _picker = ImagePicker();
  List<XFile> _selectedImages = [];
  List<String> _existingImagePaths =
      []; // For edit mode: existing image paths to keep
  int _maxImages = 5; // Default, updated from server

  // Dynamic Fields
  final AdClient _adClient = AdClient();
  final FormTemplateService _templateService = FormTemplateService();
  final Map<String, dynamic> _attributeValues = {};

  // Which of Negotiable / COD / Price the chosen category actually offers.
  // Falls back to the parent default until a subcategory is picked, and to the
  // safe default while nothing is selected.
  CategoryPolicy get _policy => getCategoryPolicy(
    _selectedCategory?.slug ?? '',
    _selectedSubCategory?.slug,
  );

  // Location Data
  List<LocationProvince> _provinces = [];
  LocationProvince? _selectedProvince;
  LocationDistrict? _selectedDistrict;
  LocationMunicipality? _selectedMunicipality;
  LocationArea? _selectedArea;

  // Location quick-search (type a place, auto-fills the dropdowns below)
  final LocationClient _locationClient = LocationClient();
  final _locationSearchController = TextEditingController();
  Timer? _locationSearchDebounce;
  List<Location> _locationSearchResults = [];
  bool _searchingLocation = false;

  // Contact Data
  final _whatsappController = TextEditingController();
  bool _whatsappSameAsPhone = true;

  // Contact phone + verification status come from the logged-in user profile.
  Map<String, dynamic>? get _authUser => context.read<AuthProvider>().user;
  String get _verifiedPhone => (_authUser?['phone'] as String?)?.trim() ?? '';
  bool get _isPhoneVerified => _authUser?['phoneVerified'] == true;

  // Edit mode: track if initial prefill is done (to avoid clearing attributes)
  bool _editPrefillDone = false;

  // AI autofill (Phase 2): every AI value is an editable suggestion; fail-open.
  bool _aiDraftLoading = false;
  bool _aiDraftRequested = false;
  // A restored draft must show the full form even without typed title/desc.
  bool _draftRestored = false;
  bool _aiConfirmed = false;
  bool _applyingAiDraft = false;
  // AI ran but couldn't fill (unsellable/off/error) — show the honest note
  bool _aiFillFailed = false;
  // Why it declined ('selfie'/'screenshot'/'unclear'/'other') for targeted copy
  String? _aiUnsellableReason;
  // Hourly AI quota hit — our limit, never the seller's photos' fault
  bool _aiLimitReached = false;
  // Prohibited sexual/nude content — HARD BLOCK: photos removed, user reported
  bool _aiExplicitBlocked = false;

  String get _aiCouldNotFillKey {
    if (_aiLimitReached) return 'postAd.aiLimitReached';
    return switch (_aiUnsellableReason) {
      'selfie' => 'postAd.aiCouldNotFillSelfie',
      'screenshot' => 'postAd.aiCouldNotFillScreenshot',
      'unclear' => 'postAd.aiCouldNotFillUnclear',
      'prohibited' => 'postAd.aiCouldNotFillProhibited',
      _ => 'postAd.aiCouldNotFill',
    };
  }

  // Background (staged) upload — Phase 2.5: photos upload as they are picked
  // (XFile.path → stagedId) so Post Ad sends only ids and returns instantly.
  // Fail-open: any photo without a stagedId at submit → classic full upload.
  final Map<String, String> _stagedIds = {};
  final Set<String> _stagingInFlight = {};

  void _stageNewImages() {
    if (widget.isEditMode) return;
    for (final img in _selectedImages) {
      final key = img.path;
      if (_stagedIds.containsKey(key) || _stagingInFlight.contains(key)) {
        continue;
      }
      _stagingInFlight.add(key);
      _adClient.stageAdImage(key).then((stagedId) {
        _stagingInFlight.remove(key);
        if (stagedId != null) _stagedIds[key] = stagedId;
      });
    }
  }

  final Set<String> _aiFilled = {};
  int? _aiPriceEstimate;
  bool? _aiSellable;
  // Draft State
  String? _currentDraftId;
  bool _isSaving = false;
  DateTime? _lastSaved;
  List<AdDraft> _drafts = [];
  bool _showDraftsPanel = false;
  Timer? _debounceTimer;

  @override
  void initState() {
    super.initState();
    _whatsappController.text = _verifiedPhone;
    _initializeScreen();
    _titleController.addListener(_onFormChanged);
    _descriptionController.addListener(_onFormChanged);
    _priceController.addListener(_onFormChanged);
    // The ✨ badge on an AI-filled field disappears the moment the user edits it
    _titleController.addListener(() => _clearAiMarkOnEdit('title'));
    _descriptionController.addListener(() => _clearAiMarkOnEdit('description'));
    _priceController.addListener(() => _clearAiMarkOnEdit('price'));
  }

  void _clearAiMarkOnEdit(String field) {
    if (_applyingAiDraft) return;
    if (_aiFilled.remove(field) && mounted) setState(() {});
  }

  // Full ad details fetched for edit mode (dashboard data is incomplete)
  AdWithDetails? _fullAdDetails;

  Future<void> _initializeScreen() async {
    try {
      if (widget.isEditMode) {
        // Edit mode: fetch full ad details (dashboard data lacks attributes etc.)
        // and load categories/locations in parallel
        final futures = await Future.wait([
          _loadInitialData(),
          _adClient.getAdById(widget.existingAd!.id),
        ]);
        final adResponse = futures[1] as ApiResponse<AdWithDetails>;
        if (adResponse.success && adResponse.data != null) {
          _fullAdDetails = adResponse.data;
        }
        if (mounted) _prefillFromExistingAd();
      } else {
        // Create mode: load data and drafts
        await Future.wait([_loadInitialData(), _loadDrafts()]);
        if (widget.draftId != null && mounted) {
          final match = _drafts.where((d) => d.id == widget.draftId);
          if (match.isNotEmpty) {
            await _restoreDraft(match.first);
          }
        }
        // Shop-page memory: prefill location (+ category as fallback) from the
        // seller's shop tabs — only into still-empty selections.
        if (mounted) _prefillShopDefaults();
      }
    } catch (e) {
      log('Error initializing create ad screen: $e', name: 'CreateAdScreen');
      // Retry once after a short delay (handles auth token propagation timing)
      if (mounted) {
        await Future.delayed(const Duration(milliseconds: 500));
        try {
          await _loadInitialData();
          if (widget.isEditMode && mounted) _prefillFromExistingAd();
        } catch (retryError) {
          log('Retry also failed: $retryError', name: 'CreateAdScreen');
        }
      }
    }
  }

  void _prefillFromExistingAd() {
    // Use full details from API if available, fallback to dashboard data
    final ad = _fullAdDetails ?? widget.existingAd!;

    _titleController.text = ad.title;
    _descriptionController.text = ad.description;
    _priceController.text = ad.price.toStringAsFixed(0);
    // isNegotiable is stored in custom_fields (like web), check there first
    _priceNegotiable =
        ad.attributes?['isNegotiable'] as bool? ?? ad.isNegotiable;
    _codAvailable = ad.attributes?['isCodAvailable'] as bool? ?? false;

    // Pre-fill existing images — use paths as-is (getAdImageUrl handles them)
    _existingImagePaths = List<String>.from(ad.images);

    // Pre-fill category
    // The ad has categoryId (parent) and subcategoryId (child)
    // If subcategoryId exists, categoryId is the parent; otherwise categoryId could be a parent or subcategory
    try {
      // First try: categoryId matches a parent category directly
      final cat = _categories.firstWhere(
        (c) => c.id == ad.categoryId,
        orElse: () {
          // Second try: categoryId might actually be a subcategory ID
          // Search all parent categories for a subcategory matching categoryId
          for (final parent in _categories) {
            for (final sub in parent.subcategories) {
              if (sub.id == ad.categoryId) {
                return parent;
              }
            }
          }
          throw StateError('Category not found');
        },
      );
      _selectedCategory = cat;

      // Now find subcategory
      final subId = ad.subcategoryId ?? ad.categoryId;
      if (subId != cat.id) {
        try {
          _selectedSubCategory = cat.subcategories.firstWhere(
            (s) => s.id == subId,
          );
        } catch (_) {}
      }
    } catch (_) {
      log(
        'Edit: category not found for id ${ad.categoryId}, sub: ${ad.subcategoryId}',
        name: 'CreateAdScreen',
      );
    }

    // Pre-fill location
    try {
      for (final prov in _provinces) {
        for (final dist in prov.districts) {
          for (final muni in dist.municipalities) {
            if (muni.id == ad.locationId) {
              _selectedProvince = prov;
              _selectedDistrict = dist;
              _selectedMunicipality = muni;
              if (ad.areaId != null) {
                try {
                  _selectedArea = muni.areas.firstWhere(
                    (a) => a.id == ad.areaId,
                  );
                } catch (_) {}
              }
              break;
            }
            // Check areas too
            for (final area in muni.areas) {
              if (area.id == ad.locationId || area.id == ad.areaId) {
                _selectedProvince = prov;
                _selectedDistrict = dist;
                _selectedMunicipality = muni;
                _selectedArea = area;
                break;
              }
            }
          }
        }
      }
    } catch (_) {
      log(
        'Edit: location not found for id ${ad.locationId}',
        name: 'CreateAdScreen',
      );
    }

    // Pre-fill custom attributes
    if (ad.attributes != null) {
      _attributeValues.addAll(ad.attributes!);
    }
    // Both flags have their own checkbox (gated by the category policy) and are
    // re-added at submit, so keep them out of the dynamic-fields map.
    _attributeValues.remove('isNegotiable');
    _attributeValues.remove('isCodAvailable');
    // Condition is stored separately in DB, not in custom_fields — inject it back
    if (ad.condition != null && !_attributeValues.containsKey('condition')) {
      _attributeValues['condition'] = ad.condition;
    }

    // Pre-fill WhatsApp: it lives in custom_fields only when the seller set a
    // number different from their profile phone. Managed via the toggle below,
    // so keep it out of the dynamic-fields map.
    final savedWhatsapp = (ad.attributes?['whatsapp_number'] as String?)
        ?.trim();
    _attributeValues.remove('whatsapp_number');
    if (savedWhatsapp != null &&
        savedWhatsapp.isNotEmpty &&
        savedWhatsapp != _verifiedPhone) {
      _whatsappSameAsPhone = false;
      _whatsappController.text = savedWhatsapp;
    } else {
      _whatsappSameAsPhone = true;
      _whatsappController.text = _verifiedPhone;
    }

    _applyPolicy();
    _editPrefillDone = true;
    setState(() {});
  }

  Future<void> _loadInitialData() async {
    setState(() => _isLoading = true);
    try {
      final results = await Future.wait([
        _adClient.getCategories(),
        _adClient.getLocationHierarchy(),
        _adClient.getAdLimits(),
      ]);
      final categories = results[0] as List<CategoryWithSubcategories>;
      final provinces = results[1] as List<LocationProvince>;
      final limits = results[2] as AdLimitsResponse;

      setState(() {
        _categories = categories;
        _provinces = provinces;
        _maxImages = limits.effectiveImageLimit;
      });
    } catch (e) {
      debugPrint("Error loading initial data: $e");
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _loadDrafts() async {
    final drafts = await AdDraftService.loadDrafts();
    if (mounted) setState(() => _drafts = drafts);
  }

  void _onFormChanged() {
    // Rebuild so char counters and progressive reveals track typing.
    if (mounted) setState(() {});
    if (!widget.isEditMode) _triggerAutoSave();
  }

  void _triggerAutoSave() {
    _debounceTimer?.cancel();

    final hasContent =
        _titleController.text.trim().isNotEmpty ||
        _descriptionController.text.trim().isNotEmpty ||
        _priceController.text.trim().isNotEmpty ||
        _selectedCategory != null;

    if (!hasContent) return;

    _debounceTimer = Timer(const Duration(seconds: 3), _saveCurrentDraft);
  }

  Future<void> _saveCurrentDraft() async {
    if (!mounted) return;
    setState(() => _isSaving = true);

    final now = DateTime.now();
    final draftId = _currentDraftId ?? AdDraftService.generateId();

    final existing = _drafts.firstWhere(
      (d) => d.id == draftId,
      orElse: () => AdDraft(
        id: draftId,
        title: '',
        description: '',
        price: '',
        isNegotiable: false,
        customFields: {},
        createdAt: now,
        updatedAt: now,
      ),
    );

    final draft = AdDraft(
      id: draftId,
      title: _titleController.text,
      description: _descriptionController.text,
      price: _priceController.text,
      categoryId: _selectedCategory?.id,
      subcategoryId: _selectedSubCategory?.id,
      provinceId: _selectedProvince?.id,
      districtId: _selectedDistrict?.id,
      municipalityId: _selectedMunicipality?.id,
      areaId: _selectedArea?.id,
      isNegotiable: _priceNegotiable,
      // COD has no dedicated draft column; it rides along in customFields.
      customFields: <String, dynamic>{
        ..._attributeValues,
        if (_policy.cod) 'isCodAvailable': _codAvailable,
      },
      createdAt: existing.createdAt,
      updatedAt: now,
    );

    await AdDraftService.saveDraft(draft);
    final updatedDrafts = await AdDraftService.loadDrafts();

    if (mounted) {
      setState(() {
        _currentDraftId = draftId;
        _drafts = updatedDrafts;
        _isSaving = false;
        _lastSaved = now;
      });
    }
  }

  Future<void> _restoreDraft(AdDraft draft) async {
    _draftRestored = true;
    _titleController.text = draft.title;
    _descriptionController.text = draft.description;
    _priceController.text = draft.price;

    CategoryWithSubcategories? category;
    Category? subcategory;

    if (draft.categoryId != null) {
      try {
        category = _categories.firstWhere((c) => c.id == draft.categoryId);
        if (draft.subcategoryId != null) {
          subcategory = category.subcategories.firstWhere(
            (s) => s.id == draft.subcategoryId,
          );
        }
      } catch (_) {
        log(
          'AdDraft restore: category not found for id ${draft.categoryId}',
          name: 'CreateAdScreen',
        );
      }
    }

    LocationProvince? province;
    LocationDistrict? district;
    LocationMunicipality? municipality;
    LocationArea? area;

    if (draft.provinceId != null) {
      try {
        province = _provinces.firstWhere((p) => p.id == draft.provinceId);
        if (draft.districtId != null) {
          district = province.districts.firstWhere(
            (d) => d.id == draft.districtId,
          );
          if (draft.municipalityId != null) {
            municipality = district.municipalities.firstWhere(
              (m) => m.id == draft.municipalityId,
            );
            if (draft.areaId != null) {
              area = municipality.areas.firstWhere((a) => a.id == draft.areaId);
            }
          }
        }
      } catch (_) {
        log('AdDraft restore: location not found', name: 'CreateAdScreen');
      }
    }

    setState(() {
      _selectedCategory = category;
      _selectedSubCategory = subcategory;
      _selectedProvince = province;
      _selectedDistrict = district;
      _selectedMunicipality = municipality;
      _selectedArea = area;
      _priceNegotiable = draft.isNegotiable;
      // COD has no dedicated draft column; it rides along in customFields.
      _codAvailable = draft.customFields['isCodAvailable'] as bool? ?? false;
      _attributeValues
        ..clear()
        ..addAll(draft.customFields)
        ..remove('isCodAvailable');
      _applyPolicy();
      _currentDraftId = draft.id;
      _lastSaved = draft.updatedAt;
      _showDraftsPanel = false;
    });
  }

  Future<void> _deleteDraft(String id) async {
    await AdDraftService.deleteDraft(id);
    final updatedDrafts = await AdDraftService.loadDrafts();
    if (mounted) {
      setState(() {
        _drafts = updatedDrafts;
        if (_currentDraftId == id) {
          _currentDraftId = null;
          _lastSaved = null;
        }
      });
    }
  }

  Future<void> _deleteDraftAfterPost() async {
    final id = _currentDraftId;
    if (id != null) {
      await AdDraftService.deleteDraft(id);
    }
  }

  @override
  void dispose() {
    _debounceTimer?.cancel();
    _locationSearchDebounce?.cancel();
    _titleController.removeListener(_onFormChanged);
    _descriptionController.removeListener(_onFormChanged);
    _priceController.removeListener(_onFormChanged);
    _titleController.dispose();
    _descriptionController.dispose();
    _priceController.dispose();
    _whatsappController.dispose();
    _locationSearchController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  int get _totalImageCount =>
      _existingImagePaths.length + _selectedImages.length;

  // ── Location quick-search ────────────────────────────────────────────────
  // Type a place name, pick a result, and the cascading dropdowns below
  // auto-fill from the already-loaded province tree (no extra API calls).

  void _onLocationSearchChanged(String query) {
    _locationSearchDebounce?.cancel();
    if (query.trim().length < 2) {
      setState(() => _locationSearchResults = []);
      return;
    }
    _locationSearchDebounce = Timer(
      const Duration(milliseconds: 300),
      () async {
        setState(() => _searchingLocation = true);
        final results = await _locationClient.searchAllLocations(query.trim());
        if (!mounted) return;
        setState(() {
          _locationSearchResults = results;
          _searchingLocation = false;
        });
      },
    );
  }

  /// Locate a flat search result inside the loaded province tree and return its
  /// full ancestry path. Returns null if the location isn't in the tree.
  ({
    LocationProvince p,
    LocationDistrict? d,
    LocationMunicipality? m,
    LocationArea? a,
  })?
  _resolveLocationPath(Location loc) {
    for (final prov in _provinces) {
      if (loc.type == LocationType.province && prov.id == loc.id) {
        return (p: prov, d: null, m: null, a: null);
      }
      for (final dist in prov.districts) {
        if (loc.type == LocationType.district && dist.id == loc.id) {
          return (p: prov, d: dist, m: null, a: null);
        }
        for (final muni in dist.municipalities) {
          if (loc.type == LocationType.municipality && muni.id == loc.id) {
            return (p: prov, d: dist, m: muni, a: null);
          }
          for (final area in muni.areas) {
            if (loc.type == LocationType.area && area.id == loc.id) {
              return (p: prov, d: dist, m: muni, a: area);
            }
          }
        }
      }
    }
    return null;
  }

  /// Like [_resolveLocationPath] but by bare id at any level (the shop-page
  /// default location can be a province, district, municipality, or area).
  ({
    LocationProvince p,
    LocationDistrict? d,
    LocationMunicipality? m,
    LocationArea? a,
  })?
  _resolveLocationPathById(int id) {
    for (final prov in _provinces) {
      if (prov.id == id) return (p: prov, d: null, m: null, a: null);
      for (final dist in prov.districts) {
        if (dist.id == id) return (p: prov, d: dist, m: null, a: null);
        for (final muni in dist.municipalities) {
          if (muni.id == id) return (p: prov, d: dist, m: muni, a: null);
          for (final area in muni.areas) {
            if (area.id == id) return (p: prov, d: dist, m: muni, a: area);
          }
        }
      }
    }
    return null;
  }

  /// Save the ad's location onto the seller's profile the first time they post.
  /// Both platforms read and write the same `users.location_id`, so a location
  /// saved from the app prefills the website's post-ad form and vice versa —
  /// this is the write half that the app was missing.
  ///
  /// Only fills a missing or too-coarse default (a province/district can't
  /// prefill a form that demands a municipality). A default the seller already
  /// set to a municipality or area is never overwritten.
  Future<void> _rememberDefaultLocation() async {
    final existingId = (_authUser?['locationId'] as num?)?.toInt();
    final existing = existingId == null
        ? null
        : _resolveLocationPathById(existingId);

    // "Good enough" means it could actually prefill a valid form: an area, or a
    // municipality that has no areas. A default of Kathmandu Metropolitan City
    // is NOT good enough — it would prefill a location the API rejects — so it
    // gets upgraded to the area the seller just picked.
    final hasUsableDefault =
        existing != null &&
        (existing.a != null ||
            (existing.m != null && existing.m!.areas.isEmpty));
    if (hasUsableDefault) return;

    final LocationHierarchyBase? chosen =
        _selectedArea ?? _selectedMunicipality;
    if (chosen == null) return;

    try {
      await ShopClient().updateShopLocation(chosen.slug);
    } catch (e) {
      // Non-critical: the ad posted fine, only the convenience memory failed.
      debugPrint('Failed to save default location: $e');
    }
  }

  /// Prefill from the seller's shop page (Location + Categories tabs), the same
  /// memory the web post-ad form uses. Never overwrites a selection that a
  /// restored draft (or the user) already made.
  void _prefillShopDefaults() {
    final user = _authUser;
    if (user == null) return;

    final locId = (user['locationId'] as num?)?.toInt();
    if (locId != null &&
        _selectedProvince == null &&
        _selectedMunicipality == null) {
      final path = _resolveLocationPathById(locId);
      if (path != null) {
        setState(() {
          _selectedProvince = path.p;
          _selectedDistrict = path.d;
          _selectedMunicipality = path.m;
          _selectedArea = path.a;
        });
      }
    }

    final catId = (user['categoryId'] as num?)?.toInt();
    if (catId != null && _selectedCategory == null) {
      for (final parent in _categories) {
        if (parent.id != catId) continue;
        Category? sub;
        final subId = (user['subcategoryId'] as num?)?.toInt();
        if (subId != null) {
          for (final s in parent.subcategories) {
            if (s.id == subId) sub = s;
          }
        }
        setState(() {
          _selectedCategory = parent;
          _selectedSubCategory = sub;
          _applyPolicy();
        });
        break;
      }
    }
  }

  void _selectSearchedLocation(Location loc) {
    final path = _resolveLocationPath(loc);
    FocusScope.of(context).unfocus();
    if (path == null) {
      // Result isn't in the loaded tree (rare) — let the user pick manually.
      setState(() => _locationSearchResults = []);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('postAd.locationSearchManual'.tr())),
      );
      return;
    }
    setState(() {
      _selectedProvince = path.p;
      _selectedDistrict = path.d;
      _selectedMunicipality = path.m;
      _selectedArea = path.a;
      _locationSearchResults = [];
      _locationSearchController.text = loc.name;
    });
    _onFormChanged();
  }

  /// One-line parent hierarchy for a result, e.g. "Kathmandu Metro, Kathmandu, Bagmati".
  String _locationPathHint(Location loc) {
    final path = _resolveLocationPath(loc);
    if (path == null) return '';
    final lang = context.locale.languageCode;
    final parents = <String>[];
    // Municipality is a parent only when an area was picked.
    if (loc.type == LocationType.area && path.m != null) {
      parents.add(path.m!.localizedName(lang));
    }
    // District is a parent for areas and municipalities.
    if ((loc.type == LocationType.area ||
            loc.type == LocationType.municipality) &&
        path.d != null) {
      parents.add(path.d!.localizedName(lang));
    }
    // Province is a parent for everything below it.
    if (loc.type != LocationType.province) {
      parents.add(path.p.localizedName(lang));
    }
    return parents.join(', ');
  }

  Widget _buildLocationResultTile(Location loc) {
    final hint = _locationPathHint(loc);
    return InkWell(
      onTap: () => _selectSearchedLocation(loc),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        child: Row(
          children: [
            const Icon(LucideIcons.mapPin, size: 16, color: Color(0xFF10B981)),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    loc.name,
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  if (hint.isNotEmpty)
                    Text(
                      hint,
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        color: Colors.grey[600],
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showImageSourceSheet() {
    if (_totalImageCount >= _maxImages) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('postAd.maxImagesError'.tr())));
      return;
    }

    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: const Icon(LucideIcons.camera),
                title: Text(
                  context.locale.languageCode == 'ne'
                      ? 'क्यामेराबाट फोटो खिच्नुहोस्'
                      : 'Take Photo',
                  style: GoogleFonts.inter(),
                ),
                onTap: () {
                  Navigator.pop(ctx);
                  _pickFromCamera();
                },
              ),
              ListTile(
                leading: const Icon(LucideIcons.image),
                title: Text(
                  context.locale.languageCode == 'ne'
                      ? 'ग्यालेरीबाट छान्नुहोस्'
                      : 'Choose from Gallery',
                  style: GoogleFonts.inter(),
                ),
                onTap: () {
                  Navigator.pop(ctx);
                  _pickImages();
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _pickFromCamera() async {
    try {
      final XFile? image = await _picker.pickImage(
        source: ImageSource.camera,
        maxWidth: 1200,
        imageQuality: 85,
      );
      if (image == null) return;

      const maxSize = 5 * 1024 * 1024; // 5MB
      final size = await image.length();
      if (size > maxSize) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                context.locale.languageCode == 'ne'
                    ? 'छवि ५MB भन्दा ठूलो छ। कृपया ५MB भन्दा सानो छवि अपलोड गर्नुहोस्।'
                    : 'Image exceeds 5MB. Please upload an image under 5MB.',
              ),
            ),
          );
        }
        return;
      }

      setState(() {
        _selectedImages.add(image);
      });
      _stageNewImages();
      _maybeRequestAiDraft();
    } catch (e) {
      debugPrint('Error capturing image: $e');
    }
  }

  Future<void> _pickImages() async {
    try {
      // Same downscaling as the camera path — without it, gallery picks upload
      // the original 4-12MB photo, which dominates post time on slow upstream.
      final List<XFile> images = await _picker.pickMultiImage(
        maxWidth: 1200,
        imageQuality: 85,
      );
      if (images.isNotEmpty) {
        // Validate each image is under 5MB
        const maxSize = 5 * 1024 * 1024; // 5MB
        final List<XFile> validImages = [];
        final List<String> oversizedNames = [];

        for (final img in images) {
          final size = await img.length();
          if (size > maxSize) {
            oversizedNames.add(img.name);
          } else {
            validImages.add(img);
          }
        }

        if (oversizedNames.isNotEmpty && mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                context.locale.languageCode == 'ne'
                    ? '${oversizedNames.length} छवि(हरू) ५MB भन्दा ठूलो भएकाले छोडियो। कृपया ५MB भन्दा सानो छवि अपलोड गर्नुहोस्।'
                    : '${oversizedNames.length} image(s) exceed 5MB and were skipped. Please upload images under 5MB.',
              ),
              duration: const Duration(seconds: 4),
            ),
          );
        }

        setState(() {
          _selectedImages.addAll(validImages);
          if (_selectedImages.length > _maxImages) {
            _selectedImages = _selectedImages.sublist(0, _maxImages);
          }
        });
        _stageNewImages();
        _maybeRequestAiDraft();
      }
    } catch (e) {
      debugPrint('Error picking images: $e');
    }
  }

  // ── AI autofill (Phase 2) ────────────────────────────────────────────────

  /// After the first photos land, ask the AI to draft the listing — typed
  /// fields or not (owner, 2026-08-27: a seller who typed a title first still
  /// gets the full AI fill; the photo wins). Fail-open: null = no change.
  Future<void> _maybeRequestAiDraft() async {
    if (_aiExplicitBlocked) setState(() => _aiExplicitBlocked = false);
    if (widget.isEditMode || _aiDraftRequested) return;
    if (_selectedImages.isEmpty) return;
    _aiDraftRequested = true;
    setState(() => _aiDraftLoading = true);
    final result = await _adClient.getAiDraft(
      _selectedImages.take(3).map((x) => x.path).toList(),
    );
    if (!mounted) return;
    final draft = result.draft;
    if (draft == null) {
      // Adding/replacing photos may retry — the next attempt could succeed
      _aiDraftRequested = false;
      setState(() {
        _aiDraftLoading = false;
        _aiFillFailed = true;
        _aiLimitReached = result.rateLimited;
      });
      return;
    }
    if (draft.unsellableReason == 'explicit') {
      // Prohibited content: remove the photos and block this set outright
      // (the server has already filed the user report)
      _stagedIds.clear();
      _aiDraftRequested = false;
      setState(() {
        _aiDraftLoading = false;
        _aiFillFailed = false;
        _aiExplicitBlocked = true;
        _selectedImages = [];
      });
      return;
    }
    _aiSellable = draft.sellable;
    _aiPriceEstimate = draft.priceEstimate;
    if (!draft.sellable) _aiDraftRequested = false; // retry on new photos
    setState(() {
      _aiDraftLoading = false;
      _aiFillFailed = !draft.sellable;
      _aiLimitReached = false;
      _aiUnsellableReason = draft.unsellableReason;
    });
    if (draft.sellable) _applyAiDraft(draft);
  }

  /// Apply an AI draft. The photo is authoritative (owner, 2026-08-27): AI
  /// values REPLACE anything typed before the photos landed — every replaced
  /// field carries the ✨ badge and stays fully editable.
  void _applyAiDraft(AiDraft draft) {
    _applyingAiDraft = true;
    final marks = <String>{};

    final title = draft.title;
    if (title != null) {
      _titleController.text = title;
      marks.add('title');
    }
    final description = draft.description;
    if (description != null) {
      _descriptionController.text = description;
      marks.add('description');
    }
    // Price is deliberately NOT filled (owner, 2026-08-27): the seller types
    // their own price. The estimate is still kept (_aiPriceEstimate) so the
    // absurd-price warning can fire on a wildly off typed price.

    // Photo wins over any pre-photo selection (incl. shop-page memory) —
    // the AI saw the actual item.
    final draftCatId = draft.categoryId;
    if (draftCatId != null) {
      for (final parent in _categories) {
        if (parent.id != draftCatId) continue;
        Category? sub;
        final subId = draft.subcategoryId;
        if (subId != null) {
          for (final s in parent.subcategories) {
            if (s.id == subId) sub = s;
          }
        }
        // When the AI picks the seller's CURRENT selection, keep everything —
        // clearing would wipe attribute values (condition, brand, …) the
        // seller already filled, for no category change at all.
        final sameSelection =
            _selectedCategory?.id == parent.id &&
            _selectedSubCategory?.id == sub?.id;
        if (!sameSelection) {
          _selectedCategory = parent;
          _selectedSubCategory = sub;
          _attributeValues.clear();
          _applyPolicy();
          marks.add('category');
        }
        break;
      }
    }

    // Condition (Brand New/Used) is deliberately NOT applied (owner,
    // 2026-08-27): the seller judges it themselves — like price.

    setState(() => _aiFilled.addAll(marks));
    _applyingAiDraft = false;
    _onFormChanged();
  }

  /// Pre-post confirmation for AI-assisted listings — warnings only, the user
  /// can always post anyway; editors remain the only hard "no". Takes i18n
  /// KEYS (not translated strings) so each warning can carry a matching icon.
  Future<bool?> _showAiConfirmDialog(List<String> warningKeys) {
    IconData iconFor(String key) => switch (key) {
      'postAd.aiWarnPrice' => LucideIcons.wallet,
      'postAd.aiWarnJunk' ||
      'postAd.aiCouldNotFillSelfie' => LucideIcons.camera,
      'postAd.aiWarnFilled' => LucideIcons.sparkles,
      'postAd.aiWarnCategoryMismatch' => LucideIcons.tag,
      'postAd.aiWarnSpelling' => LucideIcons.type,
      _ => LucideIcons.alertTriangle,
    };
    return showDialog<bool>(
      context: context,
      builder: (ctx) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        insetPadding: const EdgeInsets.symmetric(horizontal: 24),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 28, 24, 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Gradient AI icon disc, matching the web modal
              Container(
                width: 64,
                height: 64,
                alignment: Alignment.center,
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [Color(0xFF8B5CF6), Color(0xFF4F46E5)],
                  ),
                ),
                child: const Icon(
                  LucideIcons.sparkles,
                  color: Colors.white,
                  size: 30,
                ),
              ),
              const SizedBox(height: 14),
              Text(
                'postAd.aiConfirmTitle'.tr(),
                textAlign: TextAlign.center,
                style: GoogleFonts.inter(
                  fontWeight: FontWeight.bold,
                  fontSize: 18,
                ),
              ),
              const SizedBox(height: 18),
              for (final key in warningKeys)
                Container(
                  margin: const EdgeInsets.only(bottom: 10),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFFBEB),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: const Color(0xFFFDE68A)),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(
                        iconFor(key),
                        size: 20,
                        color: const Color(0xFFB45309),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          key.tr(),
                          style: GoogleFonts.inter(
                            fontSize: 13.5,
                            height: 1.45,
                            color: const Color(0xFF78350F),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              const SizedBox(height: 10),
              SizedBox(
                height: 50,
                child: FilledButton(
                  onPressed: () => Navigator.pop(ctx, false),
                  style: FilledButton.styleFrom(
                    backgroundColor: const Color(0xFFEF4444),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                  child: Text(
                    'postAd.aiReviewAgain'.tr(),
                    style: GoogleFonts.inter(
                      fontWeight: FontWeight.w600,
                      fontSize: 15,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 10),
              SizedBox(
                height: 50,
                child: FilledButton(
                  onPressed: () => Navigator.pop(ctx, true),
                  style: FilledButton.styleFrom(
                    backgroundColor: const Color(0xFF10B981),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                  child: Text(
                    'postAd.aiPostAnyway'.tr(),
                    style: GoogleFonts.inter(
                      fontWeight: FontWeight.w600,
                      fontSize: 15,
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

  Future<void> _submitAd() async {
    // The Form only validates fields that are currently in the widget tree, so
    // check section completeness explicitly (replaces the old per-step gates).
    // Jobs post without a salary and Matrimonials have no price field at all,
    // so only block on an empty price where the policy actually demands one.
    final priceMode = _policy.price;
    if (_titleController.text.trim().isEmpty ||
        _descriptionController.text.trim().isEmpty ||
        (!priceMode.hidden &&
            priceMode.required &&
            _priceController.text.trim().isEmpty)) {
      _formKey.currentState?.validate();
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('postAd.completeAllFields'.tr())));
      return;
    }

    if (_selectedCategory == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('postAd.selectCategoryError'.tr())),
      );
      return;
    }

    final selectedCategory = _selectedCategory;
    if (selectedCategory != null &&
        selectedCategory.subcategories.isNotEmpty &&
        _selectedSubCategory == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('postAd.selectSubcategoryError'.tr())),
      );
      return;
    }

    // Required category fields (Condition on Electronics/Mobiles/Vehicles).
    // The Form's validators only draw the red text; nothing read their result,
    // so a starred dropdown never actually blocked the post.
    if (selectedCategory != null && _selectedSubCategory != null) {
      final missing = FormTemplateService.missingRequiredFields(
        _templateService.getApplicableFields(
          selectedCategory.name,
          _selectedSubCategory!.name,
          categorySlug: selectedCategory.slug,
          subcategorySlug: _selectedSubCategory!.slug,
        ),
        _attributeValues,
      );
      if (missing.isNotEmpty) {
        _formKey.currentState?.validate();
        final isNepali = context.locale.languageCode == 'ne';
        final label = isNepali
            ? (missing.first.labelNe ?? missing.first.label)
            : missing.first.label;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('postAd.fieldRequired'.tr(args: [label]))),
        );
        return;
      }
    }

    if (_selectedImages.isEmpty && _existingImagePaths.isEmpty) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('postAd.addImageError'.tr())));
      return;
    }

    if (_selectedProvince == null ||
        _selectedDistrict == null ||
        _selectedMunicipality == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('postAd.selectLocationError'.tr())),
      );
      return;
    }

    // A municipality that is subdivided into areas isn't precise enough on its
    // own — Kathmandu Metropolitan City has 104 of them (Thamel, Naxal, …).
    // Municipalities with no areas stay a valid stopping point. The area field
    // has always been labelled "Area / Place *"; this enforces the asterisk.
    if (_selectedMunicipality!.areas.isNotEmpty && _selectedArea == null) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('postAd.selectAreaError'.tr())));
      return;
    }

    // Phone must be verified before posting (mirrors the web post-ad flow).
    if (!_isPhoneVerified) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('postAd.verifyBeforePost'.tr())));
      return;
    }

    if (_whatsappController.text.isEmpty) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('postAd.validContactError'.tr())));
      return;
    }

    // Pre-post AI checks — warnings only, never hard blocks (owner decision):
    // junk photos, absurd price vs the AI estimate, unreviewed AI-filled fields.
    if (!widget.isEditMode && !_aiConfirmed) {
      final warnings = <String>[];
      // Selfie gets its own wording; other declines share the generic warning
      if (_aiSellable == false) {
        warnings.add(
          _aiUnsellableReason == 'selfie'
              ? 'postAd.aiCouldNotFillSelfie'
              : 'postAd.aiWarnJunk',
        );
      }
      final estimate = _aiPriceEstimate;
      final typedPrice = double.tryParse(_priceController.text.trim());
      if (estimate != null &&
          typedPrice != null &&
          typedPrice > 0 &&
          (typedPrice < estimate * 0.1 || typedPrice > estimate * 10)) {
        warnings.add('postAd.aiWarnPrice');
      }
      if (_aiFilled.isNotEmpty) warnings.add('postAd.aiWarnFilled');

      // Server pre-check only when title or category is the seller's own work
      // (AI-filled-and-untouched fields were already chosen from the photos).
      // Fail-open: any trouble returns no warnings and posting proceeds.
      if (!_aiFilled.contains('title') || !_aiFilled.contains('category')) {
        setState(() => _isLoading = true);
        final precheck = await _adClient.precheckAd(
          title: _titleController.text.trim(),
          description: _descriptionController.text.trim(),
          categoryName: _selectedCategory?.name,
          price: typedPrice,
        );
        if (!mounted) return;
        setState(() => _isLoading = false);
        for (final code in precheck) {
          switch (code) {
            case 'category_mismatch':
              warnings.add('postAd.aiWarnCategoryMismatch');
            case 'spelling':
              warnings.add('postAd.aiWarnSpelling');
          }
        }
      }

      if (warnings.isNotEmpty) {
        final proceed = await _showAiConfirmDialog(warnings);
        if (proceed != true) return;
        _aiConfirmed = true;
      }
    }

    setState(() => _isLoading = true);

    try {
      if (widget.isEditMode) {
        await _updateExistingAd();
      } else {
        await _createNewAd();
      }
    } catch (e) {
      debugPrint("🔴 ${widget.isEditMode ? 'Update' : 'Post'} Ad Error: $e");
      // Re-arm the pre-post checks: the seller will likely edit fields before
      // retrying, and a stale confirmation would skip every warning and the
      // server precheck on the retry.
      _aiConfirmed = false;
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              '${context.locale.languageCode == 'ne' ? 'त्रुटि' : 'Error'}: $e',
            ),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _uploadProgress = null;
        });
      }
    }
  }

  void _onUploadProgress(int sent, int total) {
    if (!mounted || total <= 0) return;
    setState(() => _uploadProgress = sent / total);
  }

  /// Builds the attributes map including the flags the category's policy
  /// offers + a custom WhatsApp number (all stored in custom_fields). A flag
  /// the policy hides is never written, so a house stops carrying a "Cash on
  /// Delivery" claim (B-03). WhatsApp is only persisted when the seller set a
  /// number different from their profile phone.
  Map<String, dynamic> _buildSubmitAttributes() {
    final policy = _policy;
    final attrs = <String, dynamic>{
      ..._attributeValues,
      if (policy.negotiable) 'isNegotiable': _priceNegotiable,
      if (policy.cod) 'isCodAvailable': _codAvailable,
    };
    final whatsapp = _whatsappController.text.trim();
    if (!_whatsappSameAsPhone &&
        whatsapp.isNotEmpty &&
        whatsapp != _verifiedPhone) {
      attrs['whatsapp_number'] = whatsapp;
    } else {
      attrs.remove('whatsapp_number');
    }
    return attrs;
  }

  Future<void> _createNewAd() async {
    final formData = FormData.fromMap({
      'title': _titleController.text,
      'description': _descriptionController.text,
      // Matrimonials have no price: omit the field so the API stores null.
      if (!_policy.price.hidden) 'price': _priceController.text,
      'categoryId': _selectedCategory!.id,
      'subcategoryId': _selectedSubCategory?.id,
      'locationId': _selectedArea?.id ?? _selectedMunicipality!.id,
      'province_id': _selectedProvince!.id,
      'district_id': _selectedDistrict!.id,
      'city_id': _selectedMunicipality!.id,
      'area_id': _selectedArea?.id,
      'attributes': jsonEncode(_buildSubmitAttributes()),
    });

    // Instant post: when every photo already finished its background upload,
    // send only the staged ids — no file bytes (fall back to classic upload
    // for any gap, e.g. a staging call that failed or is still in flight).
    final stagedIds = _selectedImages
        .map((img) => _stagedIds[img.path])
        .toList();
    final allStaged = _selectedImages.isNotEmpty && !stagedIds.contains(null);
    if (allStaged) {
      formData.fields.add(MapEntry('stagedImages', jsonEncode(stagedIds)));
    } else {
      for (var image in _selectedImages) {
        formData.files.add(
          MapEntry(
            'images',
            await MultipartFile.fromFile(image.path, filename: image.name),
          ),
        );
      }
    }

    final result = await _adClient.createAd(
      formData,
      onSendProgress: _onUploadProgress,
    );

    if (result.success) {
      await _deleteDraftAfterPost();
      await _rememberDefaultLocation();
      AnalyticsService.logPostAd(
        adId: result.data?.id ?? 0,
        title: _titleController.text.trim(),
        price: double.tryParse(_priceController.text.trim()),
      );
      // Positive moment: record it and maybe ask for a store review.
      await ReviewService.recordSignificantAction();
      await ReviewService.maybeRequestReview();
      if (mounted) {
        final isNepali = context.locale.languageCode == 'ne';
        final adId = result.data?.id;
        if (result.isLive) {
          // Verified business: ad published instantly, no review needed.
          await showSuccessDialog(
            context,
            message: isNepali ? 'तपाईंको विज्ञापन लाइभ छ!' : 'Your ad is live!',
          );
          if (!mounted) return;
          _goAfterPost(live: true, adId: adId);
        } else {
          // Watch for an instant AI publish while the seller reads the dialog —
          // auto-approved ads land on their detail page, held ones on the
          // dashboard Pending tab (owner spec).
          final approvalFuture = adId == null
              ? Future<bool>.value(false)
              : _waitForInstantApproval(adId);
          await showSuccessDialog(
            context,
            message: 'postAd.adPosted'.tr(),
            subtitle: 'postAd.adPostedReviewNote'.tr(),
            subtitleTransliteration: isNepali
                ? null
                : 'postAd.adPostedReviewNoteLatin'.tr(),
          );
          if (!mounted) return;
          final live = await _awaitWithSpinner(approvalFuture);
          if (!mounted) return;
          _goAfterPost(live: live, adId: adId);
        }
      }
    } else {
      if (mounted) showAdSubmitFailure(context, result);
    }
  }

  /// Polls briefly after posting: did the AI publish the ad already?
  /// Uses the owner-only edit-context endpoint — the public get-ad endpoint
  /// would increment the new ad's view count on every poll. Bounded at ~10s;
  /// anything unresolved (including any error) counts as "still pending".
  Future<bool> _waitForInstantApproval(int adId) async {
    try {
      for (var i = 0; i < 4; i++) {
        await Future.delayed(const Duration(milliseconds: 2500));
        final res = await _adClient.getEditContext(adId);
        final status = res.data?.status;
        if (status == 'approved' || status == 'active') return true;
        if (status != null && status != 'pending') return false;
      }
    } catch (_) {
      // Advisory only — a polling failure must never surface after a
      // successful post.
    }
    return false;
  }

  /// Awaits the approval poll, showing a spinner only if it is still running
  /// (the seller usually spends those seconds reading the success dialog).
  Future<bool> _awaitWithSpinner(Future<bool> future) async {
    final safeFuture = future.catchError((_) => false);
    var completed = false;
    var value = false;
    unawaited(
      safeFuture.then((v) {
        completed = true;
        value = v;
      }),
    );
    // Give the then() a microtask to run for an already-finished future.
    await Future.delayed(Duration.zero);
    if (completed) return value;
    if (!mounted) return safeFuture;
    // PopScope: the Android back button must not dismiss this spinner — if it
    // did, the later pop would remove the SCREEN instead and corrupt the
    // navigation stack when the poll resolves.
    var dialogOpen = true;
    unawaited(
      showDialog<void>(
        context: context,
        barrierDismissible: false,
        builder: (_) => const PopScope(
          canPop: false,
          child: Center(child: CircularProgressIndicator()),
        ),
      ).whenComplete(() => dialogOpen = false),
    );
    value = await safeFuture;
    if (mounted && dialogOpen) Navigator.pop(context);
    return value;
  }

  /// Post-submit destination: live → the ad's own page, pending → dashboard
  /// Pending tab (unchanged).
  void _goAfterPost({required bool live, required int? adId}) {
    if (live && adId != null) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => AdDetailScreen(adId: adId)),
      );
    } else {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (_) =>
              DashboardScreen(initialFilter: live ? 'Active' : 'Pending'),
        ),
      );
    }
  }

  Future<void> _updateExistingAd() async {
    final ad = widget.existingAd!;
    final isRejected = ad.status == AdStatus.rejected;

    final formData = FormData.fromMap({
      'title': _titleController.text,
      'description': _descriptionController.text,
      if (!_policy.price.hidden) 'price': _priceController.text,
      'categoryId': _selectedCategory!.id,
      'subcategoryId': _selectedSubCategory?.id,
      'locationId': _selectedArea?.id ?? _selectedMunicipality!.id,
      'attributes': jsonEncode(_buildSubmitAttributes()),
      'existingImages': jsonEncode(_existingImagePaths),
    });

    for (var image in _selectedImages) {
      formData.files.add(
        MapEntry(
          'images',
          await MultipartFile.fromFile(image.path, filename: image.name),
        ),
      );
    }

    final result = await _adClient.updateAd(
      ad.id,
      formData,
      onSendProgress: _onUploadProgress,
    );

    if (result.success && mounted) {
      final isNepali = context.locale.languageCode == 'ne';
      final message = result.isLive
          // Verified business: the edit published instantly.
          ? (isNepali
                ? 'तपाईंको विज्ञापन अपडेट भयो र लाइभ छ।'
                : 'Your ad has been updated and is live.')
          : isRejected
          ? (isNepali
                ? 'विज्ञापन पुन: पेश गरियो। समीक्षाको लागि पर्खनुहोस्।'
                : 'Ad resubmitted for review.')
          : (isNepali
                ? 'विज्ञापन अपडेट भयो। सम्पादक समीक्षाको लागि पर्खनुहोस्।'
                : 'Ad updated. Waiting for editor review.');

      await showSuccessDialog(context, message: message);
      if (mounted) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (_) => DashboardScreen(
              initialFilter: result.isLive ? 'Active' : 'Pending',
            ),
          ),
        );
      }
    } else if (mounted) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(result.errorMessage)));
    }
  }

  @override
  Widget build(BuildContext context) {
    // Subscribe to auth changes so the verified badge / warning banner update
    // immediately after the user verifies their phone.
    context.watch<AuthProvider>();

    if (_isLoading && _categories.isEmpty) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(LucideIcons.x, color: Colors.black),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          widget.isEditMode
              ? (widget.existingAd!.status == AdStatus.rejected
                    ? (context.locale.languageCode == 'ne'
                          ? 'सम्पादन र पुन: पेश'
                          : 'Edit & Resubmit')
                    : (context.locale.languageCode == 'ne'
                          ? 'विज्ञापन सम्पादन'
                          : 'Edit Ad'))
              : 'postAd.title'.tr(),
          style: GoogleFonts.inter(
            color: Colors.black,
            fontWeight: FontWeight.w600,
            fontSize: 16,
          ),
        ),
        centerTitle: true,
        actions: [
          if (!widget.isEditMode &&
              (_drafts.isNotEmpty || _currentDraftId != null))
            Stack(
              alignment: Alignment.center,
              children: [
                IconButton(
                  icon: const Icon(LucideIcons.fileText, color: Colors.black87),
                  tooltip: 'postAd.draftsTooltip'.tr(),
                  onPressed: () =>
                      setState(() => _showDraftsPanel = !_showDraftsPanel),
                ),
                if (_drafts.isNotEmpty)
                  Positioned(
                    top: 8,
                    right: 8,
                    child: Container(
                      width: 16,
                      height: 16,
                      decoration: const BoxDecoration(
                        color: Color(0xFF10B981),
                        shape: BoxShape.circle,
                      ),
                      child: Center(
                        child: Text(
                          '${_drafts.length}',
                          style: GoogleFonts.inter(
                            fontSize: 10,
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                  ),
              ],
            ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Draft status bar (create mode only)
            if (!widget.isEditMode) _buildDraftStatusBar(),

            // Drafts panel (slides in/out, create mode only)
            if (!widget.isEditMode)
              AnimatedSize(
                duration: const Duration(milliseconds: 220),
                curve: Curves.easeInOut,
                child: _showDraftsPanel
                    ? _buildDraftsPanel()
                    : const SizedBox.shrink(),
              ),

            // Single-screen progressive form
            Expanded(
              child: SingleChildScrollView(
                controller: _scrollController,
                padding: const EdgeInsets.all(20),
                child: Form(key: _formKey, child: _buildFormContent()),
              ),
            ),

            // Sticky Post/Update button
            _buildBottomBar(),
          ],
        ),
      ),
    );
  }

  Widget _buildDraftStatusBar() {
    if (_isSaving) {
      return _buildStatusRow(
        LucideIcons.arrowUpFromLine,
        'postAd.draftSaving'.tr(),
        Colors.grey[500]!,
      );
    }
    if (_lastSaved != null) {
      final diff = DateTime.now().difference(_lastSaved!);
      final label = diff.inSeconds < 10
          ? 'postAd.draftSaved'.tr()
          : diff.inMinutes < 1
          ? 'postAd.draftSavedSecondsAgo'.tr(args: ['${diff.inSeconds}'])
          : 'postAd.draftSavedMinutesAgo'.tr(args: ['${diff.inMinutes}']);
      return _buildStatusRow(
        LucideIcons.cloudLightning,
        label,
        Colors.grey[500]!,
      );
    }
    return const SizedBox.shrink();
  }

  Widget _buildStatusRow(IconData icon, String label, Color color) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 13, color: color),
          const SizedBox(width: 4),
          Text(label, style: GoogleFonts.inter(fontSize: 12, color: color)),
        ],
      ),
    );
  }

  Widget _buildDraftsPanel() {
    if (_drafts.isEmpty) {
      return Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        child: Text(
          'postAd.noSavedDrafts'.tr(),
          style: GoogleFonts.inter(fontSize: 13, color: Colors.grey[500]),
        ),
      );
    }

    return Container(
      constraints: const BoxConstraints(maxHeight: 240),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        border: Border(bottom: BorderSide(color: Colors.grey[200]!)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 10, 16, 4),
            child: Text(
              'postAd.savedDrafts'.tr(),
              style: GoogleFonts.inter(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: Colors.grey[700],
              ),
            ),
          ),
          Flexible(
            child: ListView.builder(
              shrinkWrap: true,
              padding: const EdgeInsets.only(bottom: 8),
              itemCount: _drafts.length,
              itemBuilder: (context, index) {
                final draft = _drafts[index];
                final isActive = draft.id == _currentDraftId;
                final diff = DateTime.now().difference(draft.updatedAt);
                final timeLabel = diff.inMinutes < 1
                    ? 'postAd.justNow'.tr()
                    : diff.inHours < 1
                    ? 'postAd.minutesAgo'.tr(args: ['${diff.inMinutes}'])
                    : diff.inDays < 1
                    ? 'postAd.hoursAgo'.tr(args: ['${diff.inHours}'])
                    : 'postAd.daysAgo'.tr(args: ['${diff.inDays}']);

                return ListTile(
                  dense: true,
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 0,
                  ),
                  leading: Icon(
                    LucideIcons.fileText,
                    size: 18,
                    color: isActive
                        ? const Color(0xFF10B981)
                        : Colors.grey[400],
                  ),
                  title: Text(
                    draft.displayName,
                    style: GoogleFonts.inter(
                      fontSize: 13,
                      fontWeight: isActive
                          ? FontWeight.w600
                          : FontWeight.normal,
                      color: Colors.black87,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  subtitle: Text(
                    timeLabel,
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      color: Colors.grey[500],
                    ),
                  ),
                  trailing: IconButton(
                    icon: const Icon(
                      LucideIcons.trash2,
                      size: 15,
                      color: Colors.redAccent,
                    ),
                    onPressed: () => _deleteDraft(draft.id),
                  ),
                  onTap: () => _restoreDraft(draft),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  /// Photos-first reveal: before any photo only the Photos section shows;
  /// while the AI is filling, the wait banner holds the space; once the AI is
  /// done (filled or failed) — or content already exists (draft restore, edit
  /// mode) — every remaining field appears at once, AI-filled or empty.
  bool get _detailsRevealed {
    if (widget.isEditMode) return true;
    // A restored draft always reveals: it may legitimately carry only
    // photos/price/category and still be the seller's in-progress work.
    if (_draftRestored) return true;
    // Typed text only — a category alone doesn't count, because the shop-page
    // memory prefill sets one on load and must not reveal an empty form.
    if (_titleController.text.trim().isNotEmpty ||
        _descriptionController.text.trim().isNotEmpty) {
      return true;
    }
    return (_selectedImages.isNotEmpty || _existingImagePaths.isNotEmpty) &&
        !_aiDraftLoading;
  }

  Widget _buildFormContent() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildPhotosSection(),
        if (_detailsRevealed) ...[
          _buildSection('title', _buildTitleSection),
          _buildSection('category', _buildCategorySection),
          _buildSection('details', _buildDetailsSection),
          _buildSection('location', _buildLocationSection),
          _buildSection('contact', _buildContactSection),
        ],
      ],
    );
  }

  /// Keeps each section keyed so its state survives rebuilds.
  Widget _buildSection(String key, Widget Function() builder) {
    return KeyedSubtree(key: _sectionKeys[key], child: builder());
  }

  /// Drop flag values the newly chosen category doesn't offer, so a setting
  /// made under one category can't ride along into the next (or the payload).
  void _applyPolicy() {
    final policy = _policy;
    if (!policy.negotiable) _priceNegotiable = false;
    if (!policy.cod) _codAvailable = false;
    if (policy.price.hidden) _priceController.clear();
  }

  Future<void> _openCategoryPicker() async {
    final locale = context.locale.languageCode;
    final picked = await _openTilePickerSheet<CategoryWithSubcategories>(
      title: 'postAd.selectCategoryHint'.tr(),
      items: _categories,
      slugOf: (cat) => cat.slug,
      iconOf: (cat) => cat.icon,
      labelOf: (cat) => cat.localizedName(locale),
      isSelected: (cat) => _selectedCategory?.id == cat.id,
    );
    if (picked == null || !mounted) return;
    setState(() {
      _selectedCategory = picked;
      _selectedSubCategory = null;
      _aiFilled.remove('category');
      if (!widget.isEditMode || _editPrefillDone) {
        _attributeValues.clear();
      }
      _applyPolicy();
    });
    _onFormChanged();
  }

  Future<void> _openSubcategoryPicker() async {
    final parent = _selectedCategory;
    if (parent == null) return;
    final locale = context.locale.languageCode;
    final picked = await _openTilePickerSheet<Category>(
      title: 'postAd.selectSubcategoryHint'.tr(),
      items: parent.subcategories,
      slugOf: (sub) => sub.slug,
      iconOf: (sub) => sub.icon,
      labelOf: (sub) => sub.localizedName(locale),
      isSelected: (sub) => _selectedSubCategory?.id == sub.id,
      // A touch smaller than the parent grid, so the two read as a hierarchy.
      iconSize: 40,
    );
    if (picked == null || !mounted) return;
    setState(() {
      _selectedSubCategory = picked;
      _aiFilled.remove('category');
      if (!widget.isEditMode || _editPrefillDone) {
        _attributeValues.clear();
      }
      _applyPolicy();
    });
    _onFormChanged();
  }

  // Shared bottom-sheet icon-tile grid: category and subcategory pickers look
  // and behave identically (tap the field → grid opens → pick → sheet closes).
  Future<T?> _openTilePickerSheet<T>({
    required String title,
    required List<T> items,
    required String Function(T) slugOf,
    required String? Function(T) iconOf,
    required String Function(T) labelOf,
    required bool Function(T) isSelected,
    double iconSize = 44,
  }) {
    return showModalBottomSheet<T>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) => SafeArea(
        child: SizedBox(
          height: MediaQuery.of(ctx).size.height * 0.72,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: GoogleFonts.inter(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 12),
                Expanded(
                  child: GridView.builder(
                    // 4-up so all 16 categories fit without scrolling.
                    gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 3,
                          mainAxisSpacing: 8,
                          crossAxisSpacing: 8,
                          // Fixed height decoupled from screen width so the
                          // 2-line labels never overflow on narrow phones.
                          // 3-up so long names like "Women's Fashion & Beauty"
                          // fit in 2 lines untruncated (owner, 2026-08-27).
                          mainAxisExtent: 104,
                        ),
                    itemCount: items.length,
                    itemBuilder: (ctx2, i) {
                      final item = items[i];
                      final selected = isSelected(item);
                      return InkWell(
                        onTap: () => Navigator.pop(ctx, item),
                        borderRadius: BorderRadius.circular(12),
                        child: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: selected
                                ? const Color(0xFFECFDF5)
                                : Colors.white,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: selected
                                  ? const Color(0xFF10B981)
                                  : Colors.grey[200]!,
                              width: selected ? 2 : 1,
                            ),
                          ),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              CategoryIcon(
                                slug: slugOf(item),
                                emoji: iconOf(item) ?? '📁',
                                size: iconSize,
                              ),
                              const SizedBox(height: 5),
                              Text(
                                labelOf(item),
                                textAlign: TextAlign.center,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: GoogleFonts.inter(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w500,
                                  height: 1.25,
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // Title (after photos) — the suggestion chip appears right under it.
  Widget _buildTitleSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 28),
        Text(
          'postAd.aboutProduct'.tr(),
          style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 24),

        _buildLabel('postAd.adTitle'.tr(), aiField: 'title'),
        _buildTextField(
          controller: _titleController,
          hintText: 'postAd.adTitleHint'.tr(),
          validator: (val) => val == null || val.isEmpty
              ? (context.locale.languageCode == 'ne'
                    ? 'शीर्षक आवश्यक छ'
                    : 'Title is required')
              : null,
        ),
        _buildCharCount("${_titleController.text.length}/100"),
      ],
    );
  }

  // Category right after the title: tappable fields (category, then
  // subcategory) opening the icon tile grid, then dynamic fields.
  Widget _buildCategorySection() {
    final selectedCategory = _selectedCategory;
    final selectedSub = _selectedSubCategory;
    final locale = context.locale.languageCode;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 24),
        _buildLabel('postAd.selectCategory'.tr(), aiField: 'category'),
        InkWell(
          onTap: _openCategoryPicker,
          borderRadius: BorderRadius.circular(8),
          child: InputDecorator(
            decoration: _inputDecoration(),
            child: Row(
              children: [
                if (selectedCategory != null) ...[
                  CategoryIcon(
                    slug: selectedCategory.slug,
                    emoji: selectedCategory.icon ?? '📁',
                    size: 24,
                  ),
                  const SizedBox(width: 10),
                ],
                Expanded(
                  child: Text(
                    selectedCategory?.localizedName(locale) ??
                        'postAd.selectCategoryHint'.tr(),
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      color: selectedCategory == null
                          ? Colors.grey[400]
                          : Colors.black87,
                    ),
                  ),
                ),
                const Icon(
                  LucideIcons.chevronDown,
                  color: Colors.grey,
                  size: 18,
                ),
              ],
            ),
          ),
        ),

        if (selectedCategory != null &&
            selectedCategory.subcategories.isNotEmpty) ...[
          const SizedBox(height: 20),
          _buildLabel('postAd.selectSubcategory'.tr()),
          // Same tappable field + bottom-sheet grid as the category above.
          InkWell(
            onTap: _openSubcategoryPicker,
            borderRadius: BorderRadius.circular(8),
            child: InputDecorator(
              decoration: _inputDecoration(),
              child: Row(
                children: [
                  if (selectedSub != null) ...[
                    CategoryIcon(
                      slug: selectedSub.slug,
                      emoji: selectedSub.icon ?? '📁',
                      size: 24,
                    ),
                    const SizedBox(width: 10),
                  ],
                  Expanded(
                    child: Text(
                      selectedSub?.localizedName(locale) ??
                          'postAd.selectSubcategoryHint'.tr(),
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        color: selectedSub == null
                            ? Colors.grey[400]
                            : Colors.black87,
                      ),
                    ),
                  ),
                  const Icon(
                    LucideIcons.chevronDown,
                    color: Colors.grey,
                    size: 18,
                  ),
                ],
              ),
            ),
          ),
        ],

        // Dynamic Fields
        Builder(
          builder: (context) {
            final category = _selectedCategory;
            final subcategory = _selectedSubCategory;
            if (category == null || subcategory == null) {
              return const SizedBox.shrink();
            }

            final fields = _templateService.getApplicableFields(
              category.name,
              subcategory.name,
              categorySlug: category.slug,
              subcategorySlug: subcategory.slug,
            );

            if (fields.isEmpty) return const SizedBox.shrink();

            return Padding(
              padding: const EdgeInsets.only(top: 24),
              child: DynamicFormFields(
                // Second half of B-21: a per-field key can still match a field
                // name that exists in both the old and the new subcategory
                // (brand, model, …). Keying the block on the selection makes
                // the whole subtree new, so no controller survives the switch.
                key: ValueKey('${category.id}/${subcategory.id}'),
                locale: context.locale.languageCode,
                fields: fields,
                values: _attributeValues,
                onChanged: (key, value) {
                  setState(() {
                    _attributeValues[key] = value;
                  });
                },
              ),
            );
          },
        ),
      ],
    );
  }

  // Description, then whichever of Price / Negotiable / COD the category's
  // policy offers. Salary, Monthly Rent and Fee are the same input relabelled;
  // Matrimonials get no price input at all.
  Widget _buildDetailsSection() {
    final policy = _policy;
    final priceMode = policy.price;
    final isNepali = context.locale.languageCode == 'ne';
    final priceLabel = isNepali
        ? (priceMode.labelNe ?? 'मूल्य (रु.)')
        : (priceMode.label ?? 'Price (NPR)');
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 24),
        _buildLabel('postAd.descriptionLabel'.tr(), aiField: 'description'),
        _buildTextField(
          controller: _descriptionController,
          hintText: 'postAd.descriptionHint'.tr(),
          maxLines: 5,
          validator: (val) => val == null || val.isEmpty
              ? (isNepali ? 'विवरण आवश्यक छ' : 'Description is required')
              : null,
        ),
        _buildCharCount("${_descriptionController.text.length}/5000"),

        if (!priceMode.hidden) ...[
          const SizedBox(height: 24),
          _buildLabel(priceMode.required ? '$priceLabel *' : priceLabel),
          _buildTextField(
            controller: _priceController,
            hintText: "0",
            keyboardType: TextInputType.number,
            inputFormatters: [FilteringTextInputFormatter.digitsOnly],
            validator: (val) =>
                priceMode.required && (val == null || val.isEmpty)
                ? (isNepali
                      ? '$priceLabel आवश्यक छ'
                      : '$priceLabel is required')
                : null,
          ),
        ],

        if (policy.negotiable) ...[
          const SizedBox(height: 8),
          Row(
            children: [
              SizedBox(
                height: 24,
                width: 24,
                child: Checkbox(
                  value: _priceNegotiable,
                  activeColor: const Color(0xFF10B981),
                  onChanged: (val) {
                    setState(() => _priceNegotiable = val ?? false);
                    _onFormChanged();
                  },
                ),
              ),
              const SizedBox(width: 8),
              Text(
                'postAd.priceNegotiable'.tr(),
                style: GoogleFonts.inter(fontSize: 14, color: Colors.black87),
              ),
            ],
          ),
        ],

        if (policy.cod) ...[
          const SizedBox(height: 8),
          Row(
            children: [
              SizedBox(
                height: 24,
                width: 24,
                child: Checkbox(
                  value: _codAvailable,
                  activeColor: const Color(0xFF10B981),
                  onChanged: (val) {
                    setState(() => _codAvailable = val ?? false);
                    _onFormChanged();
                  },
                ),
              ),
              const SizedBox(width: 8),
              Text(
                'postAd.cashOnDelivery'.tr(),
                style: GoogleFonts.inter(fontSize: 14, color: Colors.black87),
              ),
            ],
          ),
        ],
      ],
    );
  }

  // Photos section — first thing on the form ("let me show you the thing")
  Widget _buildPhotosSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'postAd.photosLabel'.tr(),
              style: GoogleFonts.inter(
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
            Text(
              'postAd.maxImages'.tr(),
              style: GoogleFonts.inter(fontSize: 12, color: Colors.grey[500]),
            ),
          ],
        ),
        const SizedBox(height: 12),
        GestureDetector(
          onTap: _showImageSourceSheet,
          child: Container(
            height: 140,
            width: double.infinity,
            decoration: BoxDecoration(
              color: Colors.grey[50],
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: Colors.grey[300]!,
                style: BorderStyle.solid,
              ),
            ),
            child: _totalImageCount == 0
                ? Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.blue[50],
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          LucideIcons.camera,
                          size: 24,
                          color: Colors.blue[600],
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'postAd.tapToUpload'.tr(),
                        style: GoogleFonts.inter(
                          fontWeight: FontWeight.w600,
                          color: Colors.black87,
                        ),
                      ),
                    ],
                  )
                : ListView.builder(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.all(12),
                    itemCount: _totalImageCount + 1,
                    itemBuilder: (context, index) {
                      // Add button at the end
                      if (index == _totalImageCount) {
                        if (_totalImageCount < _maxImages) {
                          return GestureDetector(
                            onTap: _showImageSourceSheet,
                            child: Container(
                              width: 100,
                              margin: const EdgeInsets.only(left: 8),
                              decoration: BoxDecoration(
                                color: Colors.grey[100],
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(
                                  color: Colors.grey[300]!,
                                  style: BorderStyle.solid,
                                ),
                              ),
                              child: const Icon(
                                LucideIcons.plus,
                                color: Colors.grey,
                              ),
                            ),
                          );
                        }
                        return const SizedBox.shrink();
                      }

                      // Existing images first, then new images
                      final isExisting = index < _existingImagePaths.length;

                      return Stack(
                        children: [
                          Container(
                            width: 100,
                            margin: const EdgeInsets.only(right: 8),
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(8),
                            ),
                            clipBehavior: Clip.antiAlias,
                            child: isExisting
                                ? AppCachedImage(
                                    imageUrl: ApiConfig.getAdImageUrl(
                                      _existingImagePaths[index],
                                    ),
                                    fit: BoxFit.cover,
                                    width: 100,
                                  )
                                : Image.file(
                                    File(
                                      _selectedImages[index -
                                              _existingImagePaths.length]
                                          .path,
                                    ),
                                    fit: BoxFit.cover,
                                    width: 100,
                                    height: double.infinity,
                                  ),
                          ),
                          Positioned(
                            right: 4,
                            top: 4,
                            child: InkWell(
                              onTap: () {
                                setState(() {
                                  if (isExisting) {
                                    _existingImagePaths.removeAt(index);
                                  } else {
                                    _selectedImages.removeAt(
                                      index - _existingImagePaths.length,
                                    );
                                  }
                                  // All photos gone: the AI's one-shot draft
                                  // was about photos that no longer exist —
                                  // reset so the NEXT photos get a fresh
                                  // draft and stale warnings can't fire.
                                  if (_selectedImages.isEmpty &&
                                      _existingImagePaths.isEmpty) {
                                    _aiDraftRequested = false;
                                    _aiPriceEstimate = null;
                                    _aiSellable = null;
                                    _aiUnsellableReason = null;
                                  }
                                });
                              },
                              child: Container(
                                padding: const EdgeInsets.all(4),
                                decoration: const BoxDecoration(
                                  color: Colors.red,
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(
                                  LucideIcons.x,
                                  size: 14,
                                  color: Colors.white,
                                ),
                              ),
                            ),
                          ),
                        ],
                      );
                    },
                  ),
          ),
        ),
        if (_aiDraftLoading)
          Container(
            margin: const EdgeInsets.only(top: 12),
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: const Color(0xFFF5F3FF),
              border: Border.all(color: const Color(0xFFDDD6FE)),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const _AiSparkle(),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'postAd.aiFillingWait'.tr(),
                            style: GoogleFonts.inter(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: const Color(0xFF5B21B6),
                            ),
                          ),
                          Text(
                            'postAd.aiFillingWaitHint'.tr(),
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              color: const Color(0xFF7C3AED),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                ClipRRect(
                  borderRadius: BorderRadius.circular(2),
                  child: const LinearProgressIndicator(
                    minHeight: 3,
                    color: Color(0xFF7C3AED),
                    backgroundColor: Color(0xFFDDD6FE),
                  ),
                ),
              ],
            ),
          ),
        if (_aiExplicitBlocked)
          Container(
            margin: const EdgeInsets.only(top: 12),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFFEF2F2),
              border: Border.all(color: const Color(0xFFFCA5A5)),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Text(
              'postAd.aiExplicitBlocked'.tr(),
              style: GoogleFonts.inter(
                fontSize: 12.5,
                fontWeight: FontWeight.w600,
                color: const Color(0xFFB91C1C),
              ),
            ),
          ),
        if (_aiFillFailed && _titleController.text.trim().isEmpty)
          Container(
            margin: const EdgeInsets.only(top: 12),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFFFFBEB),
              border: Border.all(color: const Color(0xFFFDE68A)),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Text(
              _aiCouldNotFillKey.tr(),
              style: GoogleFonts.inter(
                fontSize: 12.5,
                color: const Color(0xFF92400E),
              ),
            ),
          ),
      ],
    );
  }

  // Location section
  Widget _buildLocationSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 28),
        Text(
          'postAd.locationLabel'.tr(),
          style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600),
        ),
        const SizedBox(height: 16),

        // Quick search — type a place name to auto-fill the dropdowns below
        _buildLabel('postAd.searchLocationLabel'.tr()),
        TextField(
          controller: _locationSearchController,
          onChanged: _onLocationSearchChanged,
          style: GoogleFonts.inter(fontSize: 14),
          decoration: _inputDecoration().copyWith(
            hintText: 'postAd.searchLocationHint'.tr(),
            hintStyle: GoogleFonts.inter(color: Colors.grey[400], fontSize: 14),
            prefixIcon: const Icon(
              LucideIcons.search,
              size: 18,
              color: Colors.grey,
            ),
            suffixIcon: _searchingLocation
                ? const Padding(
                    padding: EdgeInsets.all(12),
                    child: SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                  )
                : (_locationSearchController.text.isNotEmpty
                      ? IconButton(
                          icon: const Icon(
                            LucideIcons.x,
                            size: 18,
                            color: Colors.grey,
                          ),
                          onPressed: () {
                            _locationSearchController.clear();
                            setState(() => _locationSearchResults = []);
                          },
                        )
                      : null),
          ),
        ),
        if (_locationSearchResults.isNotEmpty) ...[
          const SizedBox(height: 8),
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.grey[300]!),
            ),
            child: Column(
              children: [
                for (int i = 0; i < _locationSearchResults.length; i++) ...[
                  if (i > 0) Divider(height: 1, color: Colors.grey[200]),
                  _buildLocationResultTile(_locationSearchResults[i]),
                ],
              ],
            ),
          ),
        ],
        const SizedBox(height: 16),

        _buildLabel('postAd.provinceLabel'.tr()),
        DropdownButtonFormField<LocationProvince>(
          value: _selectedProvince,
          isExpanded: true,
          hint: Text(
            'postAd.selectProvince'.tr(),
            style: GoogleFonts.inter(color: Colors.grey[400], fontSize: 14),
          ),
          decoration: _inputDecoration(),
          items: _provinces.map<DropdownMenuItem<LocationProvince>>((
            LocationProvince prov,
          ) {
            return DropdownMenuItem<LocationProvince>(
              value: prov,
              child: Text(
                prov.localizedName(context.locale.languageCode),
                style: GoogleFonts.inter(fontSize: 14),
              ),
            );
          }).toList(),
          onChanged: (val) {
            setState(() {
              _selectedProvince = val;
              _selectedDistrict = null;
              _selectedMunicipality = null;
            });
          },
          icon: const Icon(LucideIcons.chevronDown, color: Colors.grey),
        ),

        if (_selectedProvince != null) ...[
          const SizedBox(height: 16),
          _buildLabel('postAd.districtLabel'.tr()),
          DropdownButtonFormField<LocationDistrict>(
            value: _selectedDistrict,
            isExpanded: true,
            hint: Text(
              'postAd.selectDistrict'.tr(),
              style: GoogleFonts.inter(color: Colors.grey[400], fontSize: 14),
            ),
            decoration: _inputDecoration(),
            items: _selectedProvince!.districts
                .map<DropdownMenuItem<LocationDistrict>>((
                  LocationDistrict dist,
                ) {
                  return DropdownMenuItem<LocationDistrict>(
                    value: dist,
                    child: Text(
                      dist.localizedName(context.locale.languageCode),
                      style: GoogleFonts.inter(fontSize: 14),
                    ),
                  );
                })
                .toList(),
            onChanged: (val) {
              setState(() {
                _selectedDistrict = val;
                _selectedMunicipality = null;
              });
            },
            icon: const Icon(LucideIcons.chevronDown, color: Colors.grey),
          ),
        ],

        if (_selectedDistrict != null) ...[
          const SizedBox(height: 16),
          _buildLabel('postAd.cityLabel'.tr()),
          DropdownButtonFormField<LocationMunicipality>(
            value: _selectedMunicipality,
            isExpanded: true,
            hint: Text(
              'postAd.selectCity'.tr(),
              style: GoogleFonts.inter(color: Colors.grey[400], fontSize: 14),
            ),
            decoration: _inputDecoration(),
            items: _selectedDistrict!.municipalities
                .map<DropdownMenuItem<LocationMunicipality>>((
                  LocationMunicipality city,
                ) {
                  return DropdownMenuItem<LocationMunicipality>(
                    value: city,
                    child: Text(
                      city.localizedName(context.locale.languageCode),
                      style: GoogleFonts.inter(fontSize: 14),
                    ),
                  );
                })
                .toList(),
            onChanged: (val) {
              setState(() {
                _selectedMunicipality = val;
                _selectedArea = null;
              });
            },
            icon: const Icon(LucideIcons.chevronDown, color: Colors.grey),
          ),
        ],

        if (_selectedMunicipality != null &&
            _selectedMunicipality!.areas.isNotEmpty) ...[
          const SizedBox(height: 16),
          _buildLabel('postAd.areaLabel'.tr()),
          DropdownButtonFormField<LocationArea>(
            value: _selectedArea,
            isExpanded: true,
            hint: Text(
              'postAd.selectArea'.tr(),
              style: GoogleFonts.inter(color: Colors.grey[400], fontSize: 14),
            ),
            decoration: _inputDecoration(),
            items: _selectedMunicipality!.areas
                .map<DropdownMenuItem<LocationArea>>((LocationArea area) {
                  return DropdownMenuItem<LocationArea>(
                    value: area,
                    child: Text(
                      area.localizedName(context.locale.languageCode),
                      style: GoogleFonts.inter(fontSize: 14),
                    ),
                  );
                })
                .toList(),
            onChanged: (val) {
              setState(() {
                _selectedArea = val;
              });
            },
            icon: const Icon(LucideIcons.chevronDown, color: Colors.grey),
          ),
        ],
      ],
    );
  }

  // Contact section (Phone + WhatsApp)
  Widget _buildContactSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 28),
        Text(
          'postAd.contactInfo'.tr(),
          style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 24),

        // Verified Phone Display
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFFF9FAFB),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.grey[200]!),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'postAd.phoneLabel'.tr(),
                style: GoogleFonts.inter(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Colors.black87,
                ),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  const Icon(
                    LucideIcons.smartphone,
                    size: 20,
                    color: Colors.grey,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    _verifiedPhone.isNotEmpty
                        ? _verifiedPhone
                        : 'postAd.noPhoneAdded'.tr(),
                    style: GoogleFonts.inter(
                      fontSize: 15,
                      color: _verifiedPhone.isNotEmpty
                          ? Colors.black87
                          : Colors.grey,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(width: 8),
                  // Only show the green "Verified" badge when the user's phone
                  // is actually verified on their profile.
                  if (_isPhoneVerified)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFFECFDF5),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: const Color(0xFF10B981).withOpacity(0.3),
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(
                            LucideIcons.checkCircle,
                            size: 12,
                            color: Color(0xFF10B981),
                          ),
                          const SizedBox(width: 4),
                          Text(
                            'common.verified'.tr(),
                            style: GoogleFonts.inter(
                              fontSize: 11,
                              color: const Color(0xFF047857),
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                ],
              ),
            ],
          ),
        ),

        // Warning banner + CTA when the phone is not verified. Mirrors the web
        // post-ad flow: posting is blocked until the phone is verified.
        if (!_isPhoneVerified) ...[
          const SizedBox(height: 16),
          _buildPhoneVerificationWarning(),
        ],

        const SizedBox(height: 24),

        // WhatsApp Section
        Text(
          'postAd.whatsappLabel'.tr(),
          style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600),
        ),
        const SizedBox(height: 12),

        // Checkbox: "Same as phone number"
        InkWell(
          onTap: () {
            setState(() {
              _whatsappSameAsPhone = !_whatsappSameAsPhone;
              if (_whatsappSameAsPhone) {
                _whatsappController.text = _verifiedPhone;
              } else {
                _whatsappController.clear();
              }
            });
          },
          child: Row(
            children: [
              SizedBox(
                width: 24,
                height: 24,
                child: Checkbox(
                  value: _whatsappSameAsPhone,
                  activeColor: const Color(0xFF10B981),
                  onChanged: (val) {
                    setState(() {
                      _whatsappSameAsPhone = val!;
                      if (_whatsappSameAsPhone) {
                        _whatsappController.text = _verifiedPhone;
                      } else {
                        _whatsappController.clear();
                      }
                    });
                  },
                ),
              ),
              const SizedBox(width: 8),
              Text(
                'postAd.sameAsPhone'.tr(),
                style: GoogleFonts.inter(fontSize: 14, color: Colors.black87),
              ),
            ],
          ),
        ),

        const SizedBox(height: 12),

        // Locked while "same as phone" is ticked: the value is derived from the
        // verified number, so an edit here would be silently discarded on submit.
        // Untick to type a different number.
        _buildTextField(
          controller: _whatsappController,
          hintText: 'postAd.enterWhatsapp'.tr(),
          keyboardType: TextInputType.phone,
          enabled: !_whatsappSameAsPhone,
        ),
        if (_whatsappSameAsPhone)
          Padding(
            padding: const EdgeInsets.only(top: 4, left: 4),
            child: Text(
              'postAd.uncheckNote'.tr(),
              style: GoogleFonts.inter(
                fontSize: 12,
                color: Colors.grey[500],
                fontStyle: FontStyle.italic,
              ),
            ),
          ),
      ],
    );
  }

  // Amber warning shown on the Contact step when the user's phone is not
  // verified. Includes a CTA to the phone verification screen.
  Widget _buildPhoneVerificationWarning() {
    final detail = _verifiedPhone.isNotEmpty
        ? 'postAd.phoneNotVerifiedWithNumber'.tr(args: [_verifiedPhone])
        : 'postAd.noPhoneAdded'.tr();
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFFFFBEB),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFF59E0B)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(
                LucideIcons.alertTriangle,
                size: 20,
                color: Color(0xFFB45309),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'postAd.phoneNotVerifiedTitle'.tr(),
                      style: GoogleFonts.inter(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                        color: const Color(0xFF92400E),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${'postAd.phoneNotVerifiedMsg'.tr()} $detail',
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        height: 1.4,
                        color: const Color(0xFF92400E),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: _openPhoneVerification,
              icon: const Icon(LucideIcons.shieldCheck, size: 16),
              label: Text(
                'postAd.verifyPhoneCta'.tr(),
                style: GoogleFonts.inter(fontWeight: FontWeight.w600),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFF59E0B),
                foregroundColor: Colors.white,
                elevation: 0,
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _openPhoneVerification() async {
    final verified = await Navigator.push<bool>(
      context,
      MaterialPageRoute(
        builder: (_) =>
            PhoneVerificationScreen(isChanging: _verifiedPhone.isNotEmpty),
      ),
    );
    // The screen pops `true` after a successful verify+save. Reload the profile
    // so the phone number and verified badge update on this screen.
    if (verified == true && mounted) {
      await context.read<AuthProvider>().refreshProfile();
    }
  }

  Widget _buildBottomBar() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: SizedBox(
        width: double.infinity,
        child: ElevatedButton(
          onPressed: _isLoading ? null : _submitAd,
          style: ElevatedButton.styleFrom(
            padding: const EdgeInsets.symmetric(vertical: 16),
            backgroundColor: const Color(0xFF10B981),
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
          ),
          child: _isLoading
              ? Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Text(
                      _uploadLabel(),
                      style: GoogleFonts.inter(
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                )
              : Text(
                  widget.isEditMode
                      ? (widget.existingAd?.status == AdStatus.rejected
                            ? (context.locale.languageCode == 'ne'
                                  ? 'पुन: पेश गर्नुहोस्'
                                  : 'Resubmit')
                            : (context.locale.languageCode == 'ne'
                                  ? 'अपडेट गर्नुहोस्'
                                  : 'Update Ad'))
                      : 'postAd.postAdNow'.tr(),
                  style: GoogleFonts.inter(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
        ),
      ),
    );
  }

  /// "Uploading X%" while bytes are leaving the phone, then "Processing..."
  /// while the server optimizes images and creates the ad.
  String _uploadLabel() {
    final progress = _uploadProgress;
    final isNepali = context.locale.languageCode == 'ne';
    if (progress != null && progress < 0.99) {
      final percent = (progress * 100).round();
      return isNepali ? 'अपलोड हुँदैछ $percent%' : 'Uploading $percent%';
    }
    return isNepali ? 'प्रोसेस हुँदैछ...' : 'Processing...';
  }

  Widget _buildLabel(String text, {String? aiField}) {
    final showAiBadge = aiField != null && _aiFilled.contains(aiField);
    // Per-field copy so each badge nudges the specific action needed
    final aiBadgeKey = switch (aiField) {
      'title' => 'postAd.aiSuggestedTitle',
      'category' => 'postAd.aiSuggestedCategory',
      'description' => 'postAd.aiSuggestedDescription',
      _ => 'postAd.aiSuggested',
    };
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Text(
            text,
            style: GoogleFonts.inter(
              fontWeight: FontWeight.w600,
              fontSize: 13,
              color: Colors.grey[800],
            ),
          ),
          if (showAiBadge) ...[
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: const Color(0xFFF5F3FF),
                border: Border.all(color: const Color(0xFFDDD6FE)),
                borderRadius: BorderRadius.circular(999),
              ),
              child: Text(
                '✨ ${aiBadgeKey.tr()}',
                style: GoogleFonts.inter(
                  fontSize: 10,
                  color: const Color(0xFF7C3AED),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  InputDecoration _inputDecoration() {
    return InputDecoration(
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: BorderSide(color: Colors.grey[300]!),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: BorderSide(color: Colors.grey[300]!),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: Color(0xFF10B981), width: 1.5),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      fillColor: Colors.white,
      filled: true,
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    String? hintText,
    int maxLines = 1,
    TextInputType? keyboardType,
    String? Function(String?)? validator,
    List<TextInputFormatter>? inputFormatters,
    bool enabled = true,
  }) {
    return TextFormField(
      controller: controller,
      maxLines: maxLines,
      keyboardType: keyboardType,
      validator: validator,
      inputFormatters: inputFormatters,
      enabled: enabled,
      style: GoogleFonts.inter(
        fontSize: 15,
        color: enabled ? Colors.black87 : Colors.grey[600],
      ),
      decoration: _inputDecoration().copyWith(
        hintText: hintText,
        hintStyle: GoogleFonts.inter(color: Colors.grey[400], fontSize: 14),
        // Greyed background makes "you can't type here" obvious at a glance,
        // rather than the field looking editable and silently rejecting edits.
        filled: !enabled,
        fillColor: enabled ? null : Colors.grey[100],
      ),
    );
  }

  Widget _buildCharCount(String text) {
    return Align(
      alignment: Alignment.centerRight,
      child: Padding(
        padding: const EdgeInsets.only(top: 6),
        child: Text(
          text,
          style: GoogleFonts.inter(fontSize: 12, color: Colors.grey[400]),
        ),
      ),
    );
  }
}

/// Twinkling sparkle for the AI-filling banner: gentle rotate + scale loop so
/// the wait state reads as "actively working", never stalled.
class _AiSparkle extends StatefulWidget {
  const _AiSparkle();

  @override
  State<_AiSparkle> createState() => _AiSparkleState();
}

class _AiSparkleState extends State<_AiSparkle>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 900),
  )..repeat(reverse: true);

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        final t = Curves.easeInOut.transform(_controller.value);
        return Transform.rotate(
          angle: (t - 0.5) * 0.5,
          child: Transform.scale(scale: 1 + t * 0.25, child: child),
        );
      },
      child: const Text('✨', style: TextStyle(fontSize: 20)),
    );
  }
}
