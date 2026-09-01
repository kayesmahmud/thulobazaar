import 'dart:developer' as developer;
import 'package:flutter/foundation.dart' show kDebugMode;
import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:mobile/core/theme/app_font.dart';
import 'package:mobile/core/theme/app_theme.dart';
import 'package:mobile/core/widgets/category_icon.dart';
import 'package:mobile/core/models/models.dart';
import 'package:mobile/core/api/ad_client.dart';
import 'package:mobile/core/api/location_client.dart';

class SearchFilterModal extends StatefulWidget {
  final String? initialExpandedSection;
  final SearchFilters? currentFilters;
  final Function(SearchFilters)? onApplyFilters;

  const SearchFilterModal({
    super.key,
    this.initialExpandedSection,
    this.currentFilters,
    this.onApplyFilters,
  });

  @override
  State<SearchFilterModal> createState() => _SearchFilterModalState();
}

class _SearchFilterModalState extends State<SearchFilterModal> {
  final AdClient _adClient = AdClient();
  final LocationClient _locationClient = LocationClient();

  // Track expanded state of each section
  final Map<String, bool> _expandedSections = {
    "Categories": false,
    "Locations": false,
    "Price Range": false,
    "Condition": false,
    "Sort By": false,
  };

  // Track expanded state of specific IDs (for cascading location/categories)
  final Set<String> _expandedItems = {};

  // Selected values
  int? _selectedCategoryId;
  int? _selectedSubcategoryId;
  String? _selectedCategoryName;
  int? _selectedLocationId;
  String? _selectedLocationName;
  String _selectedCondition = ""; // empty = any
  String _selectedSort = "newest";
  double? _minPrice;
  double? _maxPrice;

  // Category data from API
  List<CategoryWithSubcategories> _categories = [];
  bool _loadingCategories = true;

  // Location data from API
  List<Province> _provinces = [];
  List<District> _districts = [];
  List<Municipality> _municipalities = [];
  List<Area> _areas = [];

  // Location loading states
  bool _loadingProvinces = true;
  bool _loadingDistricts = false;
  bool _loadingMunicipalities = false;
  bool _loadingAreas = false;

  // Location selection state (hierarchical)
  Province? _selectedProvince;
  District? _selectedDistrict;
  Municipality? _selectedMunicipality;
  Area? _selectedArea;

  // Price controllers
  final TextEditingController _minPriceController = TextEditingController();
  final TextEditingController _maxPriceController = TextEditingController();

  // Location Search
  final TextEditingController _locationSearchController =
      TextEditingController();
  List<Location> _locationSearchResults = [];
  bool _isSearchingLocation = false;

  void _searchLocations(String query) async {
    if (query.trim().isEmpty) {
      setState(() {
        _locationSearchResults = [];
        _isSearchingLocation = false;
      });
      return;
    }

    setState(() => _isSearchingLocation = true);

    // Debounce could be added here, but direct call for now
    try {
      final results = await _locationClient.searchAllLocations(query);
      if (mounted) {
        setState(() {
          _locationSearchResults = results;
        });
      }
    } catch (e) {
      if (kDebugMode)
        developer.log('Search error: $e', name: 'SearchFilterModal');
    }
  }

  @override
  void initState() {
    super.initState();
    if (widget.initialExpandedSection != null) {
      _expandedSections[widget.initialExpandedSection!] = true;
    }
    _loadFromCurrentFilters();
    _fetchCategories();
    _fetchProvinces();
  }

  @override
  void dispose() {
    _minPriceController.dispose();
    _maxPriceController.dispose();
    _locationSearchController.dispose();
    super.dispose();
  }

  void _loadFromCurrentFilters() {
    if (widget.currentFilters != null) {
      final f = widget.currentFilters!;
      _selectedCategoryId = f.categoryId;
      _selectedSubcategoryId = f.subcategoryId;
      // _selectedLocationId = f.locationId; // Handled by _loadLocationHierarchy
      if (f.locationId != null) {
        _loadLocationHierarchy(f.locationId!);
      }
      _selectedCondition = f.condition ?? "";
      _minPrice = f.minPrice;
      _maxPrice = f.maxPrice;
      if (f.minPrice != null) {
        _minPriceController.text = f.minPrice!.toStringAsFixed(0);
      }
      if (f.maxPrice != null) {
        _maxPriceController.text = f.maxPrice!.toStringAsFixed(0);
      }
      // Map sortBy + sortOrder to our sort option
      if (f.sortBy == 'date') {
        _selectedSort = f.sortOrder == 'asc' ? 'oldest' : 'newest';
      } else if (f.sortBy == 'price') {
        _selectedSort = f.sortOrder == 'asc' ? 'price_asc' : 'price_desc';
      }
    }
  }

  Future<void> _loadLocationHierarchy(int locationId) async {
    try {
      final response = await _locationClient.getLocationById(locationId);
      if (response.data == null) return;

      final location = response.data!;

      setState(() {
        _selectedLocationId = location.id;
        _selectedLocationName = location.localizedName(
          context.locale.languageCode,
        );
      });

      // Based on type, reconstruct the hierarchy
      if (location.type == LocationType.province) {
        setState(() {
          _selectedProvince = Province(
            id: location.id,
            name: location.name,
            nameNe: location.nameNe,
          );
          _selectedDistrict = null;
          _selectedMunicipality = null;
          _selectedArea = null;
        });
        await _loadDistricts(location.id);
      } else if (location.type == LocationType.district) {
        if (location.parentId != null) {
          // 1. Fetch Parent (Province)
          final provRes = await _locationClient.getLocationById(
            location.parentId!,
          );
          if (provRes.data != null) {
            final prov = provRes.data!;
            setState(() {
              _selectedProvince = Province(
                id: prov.id,
                name: prov.name,
                nameNe: prov.nameNe,
              );
              // Don't set children here
            });
            // 2. Load siblings for the dropdowns
            await _loadDistricts(prov.id, autoSelectId: location.id);
            await _loadMunicipalities(location.id);
          }
        }
      } else if (location.type == LocationType.municipality) {
        if (location.parentId != null) {
          // 1. Fetch Parent (District)
          final distRes = await _locationClient.getLocationById(
            location.parentId!,
          );
          if (distRes.data != null) {
            final dist = distRes.data!;

            // 2. Fetch Grandparent (Province)
            if (dist.parentId != null) {
              final provRes = await _locationClient.getLocationById(
                dist.parentId!,
              );
              if (provRes.data != null) {
                final prov = provRes.data!;

                setState(() {
                  _selectedProvince = Province(
                    id: prov.id,
                    name: prov.name,
                    nameNe: prov.nameNe,
                  );
                  // Don't set children here
                });

                // 3. Load siblings
                await _loadDistricts(prov.id, autoSelectId: dist.id);
                await _loadMunicipalities(dist.id, autoSelectId: location.id);
                await _loadAreas(location.id);
              }
            }
          }
        }
      } else if (location.type == LocationType.area) {
        if (location.parentId != null) {
          // 1. Fetch Parent (Municipality)
          final munRes = await _locationClient.getLocationById(
            location.parentId!,
          );
          if (munRes.data != null) {
            final mun = munRes.data!;

            // 2. Fetch Grandparent (District)
            if (mun.parentId != null) {
              final distRes = await _locationClient.getLocationById(
                mun.parentId!,
              );
              if (distRes.data != null) {
                final dist = distRes.data!;

                // 3. Fetch Great-Grandparent (Province)
                if (dist.parentId != null) {
                  final provRes = await _locationClient.getLocationById(
                    dist.parentId!,
                  );
                  if (provRes.data != null) {
                    final prov = provRes.data!;

                    setState(() {
                      _selectedProvince = Province(
                        id: prov.id,
                        name: prov.name,
                        nameNe: prov.nameNe,
                      );
                      // Don't set children here, let the load functions do it
                    });

                    // 4. Load siblings with auto-select
                    await _loadDistricts(prov.id, autoSelectId: dist.id);
                    await _loadMunicipalities(dist.id, autoSelectId: mun.id);
                    await _loadAreas(mun.id, autoSelectId: location.id);
                  }
                }
              }
            }
          }
        }
      }
    } catch (e) {
      if (kDebugMode)
        developer.log(
          'Error loading location hierarchy: $e',
          name: 'SearchFilterModal',
        );
    }
  }

  Future<void> _fetchCategories() async {
    try {
      final categories = await _adClient.getCategories();
      if (mounted) {
        setState(() {
          _categories = categories;
          _loadingCategories = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _loadingCategories = false;
        });
      }
    }
  }

  Future<void> _fetchProvinces() async {
    setState(() => _loadingProvinces = true);
    try {
      final provinces = await _locationClient.getProvinces();
      if (mounted) {
        setState(() {
          _provinces = provinces;
          _loadingProvinces = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _loadingProvinces = false);
      }
    }
  }

  Future<void> _loadDistricts(int provinceId, {int? autoSelectId}) async {
    setState(() {
      _loadingDistricts = true;
      _districts = [];
      _selectedDistrict = null;
      _municipalities = [];
      _selectedMunicipality = null;
      _areas = [];
      _selectedArea = null;
    });

    try {
      final districts = await _locationClient.getDistricts(provinceId);
      if (mounted) {
        District? selected;
        if (autoSelectId != null) {
          try {
            selected = districts.firstWhere((e) => e.id == autoSelectId);
          } catch (_) {}
        }

        setState(() {
          _districts = districts;
          _selectedDistrict = selected;
          _loadingDistricts = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _loadingDistricts = false);
      }
    }
  }

  Future<void> _loadMunicipalities(int districtId, {int? autoSelectId}) async {
    setState(() {
      _loadingMunicipalities = true;
      _municipalities = [];
      _selectedMunicipality = null;
      _areas = [];
      _selectedArea = null;
    });

    try {
      final municipalities = await _locationClient.getMunicipalities(
        districtId,
      );
      if (mounted) {
        Municipality? selected;
        if (autoSelectId != null) {
          try {
            selected = municipalities.firstWhere((e) => e.id == autoSelectId);
          } catch (_) {}
        }

        setState(() {
          _municipalities = municipalities;
          _selectedMunicipality = selected;
          _loadingMunicipalities = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _loadingMunicipalities = false);
      }
    }
  }

  Future<void> _loadAreas(int municipalityId, {int? autoSelectId}) async {
    setState(() {
      _loadingAreas = true;
      _areas = [];
      _selectedArea = null;
    });

    try {
      final areas = await _locationClient.getAreas(municipalityId);
      if (mounted) {
        Area? selected;
        if (autoSelectId != null) {
          try {
            selected = areas.firstWhere((e) => e.id == autoSelectId);
          } catch (_) {}
        }

        setState(() {
          _areas = areas;
          _selectedArea = selected;
          _loadingAreas = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _loadingAreas = false);
      }
    }
  }

  void _toggleSection(String title) {
    setState(() {
      _expandedSections[title] = !(_expandedSections[title] ?? false);
    });
  }

  void _toggleItem(String id) {
    setState(() {
      if (_expandedItems.contains(id)) {
        _expandedItems.remove(id);
      } else {
        _expandedItems.add(id);
      }
    });
  }

  void _applyFilters() {
    // Parse sort option
    String? sortBy;
    String? sortOrder;
    switch (_selectedSort) {
      case 'newest':
        sortBy = 'date';
        sortOrder = 'desc';
        break;
      case 'oldest':
        sortBy = 'date';
        sortOrder = 'asc';
        break;
      case 'price_asc':
        sortBy = 'price';
        sortOrder = 'asc';
        break;
      case 'price_desc':
        sortBy = 'price';
        sortOrder = 'desc';
        break;
    }

    // Parse price
    final minPrice = double.tryParse(_minPriceController.text);
    final maxPrice = double.tryParse(_maxPriceController.text);

    // Use most specific location selection (area > municipality > district > province)
    final locationId =
        _selectedArea?.id ??
        _selectedMunicipality?.id ??
        _selectedDistrict?.id ??
        _selectedProvince?.id;

    // Build location display name from most specific selection
    final locale = context.locale.languageCode;
    final locationName =
        _selectedArea?.localizedName(locale) ??
        _selectedMunicipality?.localizedName(locale) ??
        _selectedDistrict?.localizedName(locale) ??
        _selectedProvince?.localizedName(locale);

    final filters = SearchFilters(
      categoryId: _selectedCategoryId,
      subcategoryId: _selectedSubcategoryId,
      locationId: locationId,
      areaId: _selectedArea?.id,
      condition: _selectedCondition.isEmpty ? null : _selectedCondition,
      minPrice: minPrice,
      maxPrice: maxPrice,
      sortBy: sortBy,
      sortOrder: sortOrder,
      query: widget.currentFilters?.query, // Preserve search query
      categoryName: _selectedCategoryName,
      locationName: locationName,
    );

    widget.onApplyFilters?.call(filters);
    Navigator.pop(context);
  }

  void _resetFilters() {
    setState(() {
      _selectedCategoryId = null;
      _selectedSubcategoryId = null;
      _selectedCategoryName = null;
      _selectedLocationId = null;
      _selectedLocationName = null;
      // Reset hierarchical location selection
      _selectedProvince = null;
      _selectedDistrict = null;
      _selectedMunicipality = null;
      _selectedArea = null;
      _districts = [];
      _municipalities = [];
      _areas = [];
      _selectedCondition = "";
      _selectedSort = "newest";
      _minPrice = null;
      _maxPrice = null;
      _minPriceController.clear();
      _maxPriceController.clear();
      _expandedItems.clear();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Handle Bar (Grey line at top)
          Center(
            child: Container(
              margin: const EdgeInsets.only(top: 12, bottom: 8),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey[300],
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),

          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  context.locale.languageCode == 'ne' ? 'फिल्टरहरू' : 'Filters',
                  style: AppFont.inter(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                IconButton(
                  icon: const Icon(LucideIcons.x),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
          ),
          const Divider(height: 1),

          // Scrollable Content
          Expanded(
            child: ListView(
              children: [
                _buildExpandableSection(
                  title: "Categories",
                  displayTitle: context.locale.languageCode == 'ne'
                      ? 'वर्गहरू'
                      : null,
                  isExpanded: _expandedSections["Categories"] ?? false,
                  content: _buildCategoriesContent(),
                ),
                _buildDivider(),
                _buildExpandableSection(
                  title: "Locations",
                  displayTitle: context.locale.languageCode == 'ne'
                      ? 'स्थानहरू'
                      : null,
                  isExpanded: _expandedSections["Locations"] ?? false,
                  content: _buildLocationsContent(),
                ),
                _buildDivider(),
                _buildExpandableSection(
                  title: "Price Range",
                  displayTitle: context.locale.languageCode == 'ne'
                      ? 'मूल्य दायरा'
                      : null,
                  isExpanded: _expandedSections["Price Range"] ?? false,
                  content: _buildPriceContent(),
                ),
                _buildDivider(),
                _buildExpandableSection(
                  title: "Condition",
                  displayTitle: context.locale.languageCode == 'ne'
                      ? 'अवस्था'
                      : null,
                  isExpanded: _expandedSections["Condition"] ?? false,
                  content: _buildConditionContent(),
                ),
                _buildDivider(),
                _buildExpandableSection(
                  title: "Sort By",
                  displayTitle: context.locale.languageCode == 'ne'
                      ? 'क्रमबद्ध'
                      : null,
                  isExpanded: _expandedSections["Sort By"] ?? false,
                  content: _buildSortContent(),
                ),
                _buildDivider(),
              ],
            ),
          ),

          // Bottom Action Bar
          Container(
            padding: EdgeInsets.fromLTRB(
              16,
              16,
              16,
              16 + MediaQuery.of(context).padding.bottom,
            ),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  blurRadius: 10,
                  offset: const Offset(0, -5),
                ),
              ],
            ),
            child: Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: _resetFilters,
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      side: BorderSide(color: Colors.grey[300]!),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    child: Text(
                      context.locale.languageCode == 'ne' ? 'रिसेट' : 'Reset',
                      style: AppFont.inter(
                        color: Colors.black,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: ElevatedButton(
                    onPressed: _applyFilters,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primary,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    child: Text(
                      context.locale.languageCode == 'ne'
                          ? 'नतिजा देखाउनुहोस्'
                          : 'Show Results',
                      style: AppFont.inter(
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDivider() => Divider(height: 1, color: Colors.grey[100]);

  Widget _buildExpandableSection({
    required String title,
    String? displayTitle,
    required bool isExpanded,
    required Widget content,
  }) {
    return Column(
      children: [
        InkWell(
          onTap: () => _toggleSection(title),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  displayTitle ?? title,
                  style: AppFont.inter(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: Colors.black87,
                  ),
                ),
                Icon(
                  isExpanded ? LucideIcons.chevronUp : LucideIcons.chevronDown,
                  color: Colors.grey[600],
                ),
              ],
            ),
          ),
        ),
        if (isExpanded) content,
      ],
    );
  }

  // --- Category Builder with API Data ---
  Widget _buildCategoriesContent() {
    if (_loadingCategories) {
      return const Padding(
        padding: EdgeInsets.all(32),
        child: Center(child: CircularProgressIndicator()),
      );
    }

    return Container(
      color: Colors.grey[50],
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        children: [
          // "All Categories" Option
          InkWell(
            onTap: () => setState(() {
              _selectedCategoryId = null;
              _selectedSubcategoryId = null;
              _selectedCategoryName = null;
            }),
            child: Container(
              color: _selectedCategoryId == null
                  ? const Color(0xFFFFF1F2)
                  : Colors.transparent,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Row(
                children: [
                  const Icon(LucideIcons.folderOpen, color: Colors.grey),
                  const SizedBox(width: 12),
                  Text(
                    context.locale.languageCode == 'ne'
                        ? 'सबै वर्गहरू'
                        : "All Categories",
                    style: AppFont.inter(fontSize: 14),
                  ),
                  const Spacer(),
                  if (_selectedCategoryId == null)
                    const Icon(
                      LucideIcons.check,
                      color: AppTheme.primary,
                      size: 18,
                    ),
                ],
              ),
            ),
          ),

          // List of Categories from API
          ..._categories.map((cat) => _buildCategoryItem(cat)),
        ],
      ),
    );
  }

  Widget _buildCategoryItem(CategoryWithSubcategories category) {
    final hasSub = category.subcategories?.isNotEmpty ?? false;
    final isExpanded = _expandedItems.contains("cat_${category.id}");
    final isSelected =
        _selectedCategoryId == category.id && _selectedSubcategoryId == null;

    return Column(
      children: [
        InkWell(
          onTap: () {
            setState(() {
              _selectedCategoryId = category.id;
              _selectedSubcategoryId = null;
              _selectedCategoryName = category.localizedName(
                context.locale.languageCode,
              );
            });
          },
          child: Container(
            color: isSelected ? const Color(0xFFFFF1F2) : Colors.transparent,
            padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 16),
            child: Row(
              children: [
                // Expand Icon (if has subs)
                if (hasSub)
                  InkWell(
                    onTap: () => _toggleItem("cat_${category.id}"),
                    child: Padding(
                      padding: const EdgeInsets.only(right: 8.0),
                      child: Icon(
                        isExpanded
                            ? LucideIcons.chevronDown
                            : LucideIcons.chevronRight,
                        size: 18,
                        color: Colors.grey[600],
                      ),
                    ),
                  )
                else
                  const SizedBox(width: 26),

                // Icon
                CategoryIcon(
                  slug: category.slug,
                  emoji: category.icon ?? "📁",
                  size: 26,
                ),
                const SizedBox(width: 12),

                // Name
                Expanded(
                  child: Text(
                    category.localizedName(context.locale.languageCode),
                    style: AppFont.inter(
                      fontSize: 14,
                      color: isSelected ? AppTheme.primary : Colors.black87,
                      fontWeight: isSelected
                          ? FontWeight.w600
                          : FontWeight.normal,
                    ),
                  ),
                ),

                if (isSelected)
                  const Icon(
                    LucideIcons.check,
                    color: AppTheme.primary,
                    size: 18,
                  ),
              ],
            ),
          ),
        ),
        // Draw Subcategories if expanded
        if (hasSub && isExpanded)
          ...category.subcategories!.map(
            (sub) => _buildSubcategoryItem(sub, category.id),
          ),
      ],
    );
  }

  Widget _buildSubcategoryItem(Category subcategory, int parentId) {
    final isSelected = _selectedSubcategoryId == subcategory.id;

    return InkWell(
      onTap: () {
        setState(() {
          _selectedCategoryId = parentId;
          _selectedSubcategoryId = subcategory.id;
          _selectedCategoryName = subcategory.localizedName(
            context.locale.languageCode,
          );
        });
      },
      child: Container(
        color: isSelected ? const Color(0xFFFFF1F2) : Colors.transparent,
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 16),
        child: Row(
          children: [
            // Indent past the parent's chevron, then the icon — this keeps the
            // subcategory name a step right of the parent name, so the nesting
            // still reads even though both rows now carry artwork.
            const SizedBox(width: 38),
            CategoryIcon(
              slug: subcategory.slug,
              emoji: subcategory.icon ?? "📁",
              size: 24,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                subcategory.localizedName(context.locale.languageCode),
                style: AppFont.inter(
                  fontSize: 13,
                  color: isSelected ? AppTheme.primary : Colors.black87,
                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                ),
              ),
            ),
            if (isSelected)
              const Icon(LucideIcons.check, color: AppTheme.primary, size: 18),
          ],
        ),
      ),
    );
  }

  // --- Location Builder with cascading dropdowns ---
  Widget _buildLocationsContent() {
    final bool noLocationSelected = _selectedProvince == null;

    return Container(
      color: Colors.grey[50],
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // All Nepal Option
          InkWell(
            onTap: () => setState(() {
              _selectedProvince = null;
              _selectedDistrict = null;
              _selectedMunicipality = null;
              _selectedArea = null;
              _districts = [];
              _municipalities = [];
              _areas = [];
            }),
            child: Container(
              decoration: BoxDecoration(
                color: noLocationSelected
                    ? const Color(0xFFFFF1F2)
                    : Colors.white,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: noLocationSelected
                      ? AppTheme.primary.withOpacity(0.3)
                      : Colors.grey[300]!,
                ),
              ),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
              child: Row(
                children: [
                  Icon(
                    LucideIcons.globe,
                    color: noLocationSelected ? AppTheme.primary : Colors.grey,
                    size: 20,
                  ),
                  const SizedBox(width: 12),
                  Text(
                    context.locale.languageCode == 'ne'
                        ? 'सम्पूर्ण नेपाल'
                        : "All Nepal",
                    style: AppFont.inter(
                      fontSize: 14,
                      fontWeight: noLocationSelected
                          ? FontWeight.w600
                          : FontWeight.normal,
                      color: noLocationSelected
                          ? AppTheme.primary
                          : Colors.black87,
                    ),
                  ),
                  const Spacer(),
                  if (noLocationSelected)
                    const Icon(
                      LucideIcons.check,
                      color: AppTheme.primary,
                      size: 18,
                    ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 16),

          // --- LOCATION SEARCH INPUT ---
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              TextFormField(
                controller: _locationSearchController,
                style: AppFont.inter(
                  color: Colors.black87,
                  fontSize: 14,
                ), // Explicit text color
                decoration: InputDecoration(
                  hintText: context.locale.languageCode == 'ne'
                      ? 'स्थान खोज्नुहोस्...'
                      : "Search location...",
                  hintStyle: AppFont.inter(
                    color: Colors.grey[500],
                    fontSize: 14,
                  ), // Explicit hint color
                  prefixIcon: const Icon(
                    LucideIcons.search,
                    size: 20,
                    color: Colors.grey,
                  ),
                  filled: true,
                  fillColor: Colors.white,
                  contentPadding: const EdgeInsets.symmetric(
                    vertical: 10,
                    horizontal: 12,
                  ),
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
                    borderSide: const BorderSide(
                      color: AppTheme.primary,
                      width: 1,
                    ),
                  ),
                  suffixIcon: _locationSearchController.text.isNotEmpty
                      ? IconButton(
                          icon: const Icon(LucideIcons.x, size: 16),
                          onPressed: () {
                            _locationSearchController.clear();
                            setState(() {
                              _locationSearchResults = [];
                              _isSearchingLocation = false;
                            });
                          },
                        )
                      : null,
                ),
                onChanged: _searchLocations,
              ),

              // Search Results List (Conditional)
              if (_isSearchingLocation) ...[
                const SizedBox(height: 8),
                Container(
                  constraints: const BoxConstraints(maxHeight: 200),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.grey[300]!),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.05),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: _locationSearchResults.isEmpty
                      ? Padding(
                          padding: const EdgeInsets.all(12),
                          child: Text(
                            context.locale.languageCode == 'ne'
                                ? 'स्थान भेटिएन'
                                : "No locations found",
                            style: const TextStyle(color: Colors.grey),
                          ),
                        )
                      : ListView.builder(
                          shrinkWrap: true,
                          padding: EdgeInsets.zero,
                          itemCount: _locationSearchResults.length,
                          itemBuilder: (context, index) {
                            final loc = _locationSearchResults[index];
                            return InkWell(
                              onTap: () {
                                _loadLocationHierarchy(loc.id);
                                _locationSearchController.clear();
                                setState(() {
                                  _locationSearchResults = [];
                                  _isSearchingLocation = false;
                                });
                                FocusScope.of(
                                  context,
                                ).unfocus(); // Close keyboard
                              },
                              child: Padding(
                                padding: const EdgeInsets.symmetric(
                                  vertical: 10,
                                  horizontal: 12,
                                ),
                                child: Row(
                                  children: [
                                    Icon(
                                      loc.type == LocationType.province
                                          ? LucideIcons.map
                                          : loc.type == LocationType.district
                                          ? LucideIcons.building2
                                          : LucideIcons.mapPin,
                                      size: 16,
                                      color: Colors.grey[600],
                                    ),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: RichText(
                                        text: TextSpan(
                                          text: loc.localizedName(
                                            context.locale.languageCode,
                                          ),
                                          style: const TextStyle(
                                            color: Colors.black87,
                                            fontSize: 14,
                                          ),
                                          children: [
                                            TextSpan(
                                              text:
                                                  "  ${loc.type.name.toUpperCase()}",
                                              style: TextStyle(
                                                color: Colors.grey[400],
                                                fontSize: 10,
                                                fontWeight: FontWeight.w500,
                                              ),
                                            ),
                                          ],
                                        ),
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
            ],
          ),

          // ----------------------------
          const SizedBox(height: 16),

          // Province Dropdown
          _buildLocationDropdown(
            label: context.locale.languageCode == 'ne' ? 'प्रदेश' : 'Province',
            isLoading: _loadingProvinces,
            hint: context.locale.languageCode == 'ne'
                ? 'प्रदेश छान्नुहोस्'
                : 'Select Province',
            value: _selectedProvince,
            items: _provinces,
            itemLabel: (p) => p.localizedName(context.locale.languageCode),
            onChanged: (province) {
              setState(() => _selectedProvince = province);
              if (province != null) {
                _loadDistricts(province.id);
              }
            },
          ),

          const SizedBox(height: 12),

          // District Dropdown
          _buildLocationDropdown(
            label: context.locale.languageCode == 'ne' ? 'जिल्ला' : 'District',
            isLoading: _loadingDistricts,
            hint: _selectedProvince == null
                ? (context.locale.languageCode == 'ne'
                      ? 'पहिले प्रदेश छान्नुहोस्'
                      : 'Select Province first')
                : (context.locale.languageCode == 'ne'
                      ? 'जिल्ला छान्नुहोस्'
                      : 'Select District'),
            value: _selectedDistrict,
            items: _districts,
            itemLabel: (d) => d.localizedName(context.locale.languageCode),
            enabled: _selectedProvince != null,
            onChanged: (district) {
              setState(() => _selectedDistrict = district);
              if (district != null) {
                _loadMunicipalities(district.id);
              }
            },
          ),

          const SizedBox(height: 12),

          // Municipality Dropdown
          _buildLocationDropdown(
            label: context.locale.languageCode == 'ne'
                ? 'नगरपालिका'
                : 'Municipality',
            isLoading: _loadingMunicipalities,
            hint: _selectedDistrict == null
                ? (context.locale.languageCode == 'ne'
                      ? 'पहिले जिल्ला छान्नुहोस्'
                      : 'Select District first')
                : (context.locale.languageCode == 'ne'
                      ? 'नगरपालिका छान्नुहोस्'
                      : 'Select Municipality'),
            value: _selectedMunicipality,
            items: _municipalities,
            itemLabel: (m) => m.localizedName(context.locale.languageCode),
            enabled: _selectedDistrict != null,
            onChanged: (municipality) {
              setState(() => _selectedMunicipality = municipality);
              if (municipality != null) {
                _loadAreas(municipality.id);
              }
            },
          ),

          const SizedBox(height: 12),

          // Area Dropdown (Optional)
          _buildLocationDropdown(
            label: context.locale.languageCode == 'ne'
                ? 'क्षेत्र (ऐच्छिक)'
                : 'Area (Optional)',
            isLoading: _loadingAreas,
            hint: _selectedMunicipality == null
                ? (context.locale.languageCode == 'ne'
                      ? 'पहिले नगरपालिका छान्नुहोस्'
                      : 'Select Municipality first')
                : (_areas.isEmpty
                      ? (context.locale.languageCode == 'ne'
                            ? 'क्षेत्र उपलब्ध छैन'
                            : 'No areas available')
                      : (context.locale.languageCode == 'ne'
                            ? 'क्षेत्र छान्नुहोस्'
                            : 'Select Area')),
            value: _selectedArea,
            items: _areas,
            itemLabel: (a) => a.localizedName(context.locale.languageCode),
            enabled: _selectedMunicipality != null && _areas.isNotEmpty,
            onChanged: (area) {
              setState(() => _selectedArea = area);
            },
          ),

          // Selected location preview
          if (_selectedProvince != null) ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppTheme.primary.withOpacity(0.05),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: AppTheme.primary.withOpacity(0.2)),
              ),
              child: Row(
                children: [
                  const Icon(
                    LucideIcons.mapPin,
                    color: AppTheme.primary,
                    size: 18,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      _buildLocationPath(),
                      style: AppFont.inter(
                        fontSize: 13,
                        color: AppTheme.primary,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildLocationDropdown<T>({
    required String label,
    required bool isLoading,
    required String hint,
    required T? value,
    required List<T> items,
    required String Function(T) itemLabel,
    required void Function(T?) onChanged,
    bool enabled = true,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(
              label,
              style: AppFont.inter(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: enabled ? Colors.grey[700] : Colors.grey[400],
              ),
            ),
            if (isLoading) ...[
              const SizedBox(width: 8),
              const SizedBox(
                width: 14,
                height: 14,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: AppTheme.primary,
                ),
              ),
            ],
          ],
        ),
        const SizedBox(height: 6),
        DropdownButtonFormField<T>(
          value: value,
          hint: Text(
            hint,
            style: AppFont.inter(color: Colors.grey[500], fontSize: 14),
          ),
          isExpanded: true,
          decoration: InputDecoration(
            filled: true,
            fillColor: enabled ? Colors.white : Colors.grey[100],
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 12,
              vertical: 10,
            ),
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
              borderSide: const BorderSide(color: AppTheme.primary, width: 1),
            ),
          ),
          items: items
              .map(
                (item) => DropdownMenuItem(
                  value: item,
                  child: Text(
                    itemLabel(item),
                    style: AppFont.inter(fontSize: 14),
                  ),
                ),
              )
              .toList(),
          onChanged: enabled ? onChanged : null,
          icon: Icon(
            LucideIcons.chevronDown,
            color: enabled ? Colors.grey[600] : Colors.grey[400],
          ),
        ),
      ],
    );
  }

  String _buildLocationPath() {
    final locale = context.locale.languageCode;
    final parts = <String>[];
    if (_selectedArea != null) parts.add(_selectedArea!.localizedName(locale));
    if (_selectedMunicipality != null)
      parts.add(_selectedMunicipality!.localizedName(locale));
    if (_selectedDistrict != null)
      parts.add(_selectedDistrict!.localizedName(locale));
    if (_selectedProvince != null)
      parts.add(_selectedProvince!.localizedName(locale));
    return parts.join(', ');
  }

  Widget _buildPriceContent() {
    return Container(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _minPriceController,
                  keyboardType: TextInputType.number,
                  decoration: InputDecoration(
                    labelText: context.locale.languageCode == 'ne'
                        ? 'न्यूनतम मूल्य (रु.)'
                        : "Min Price (Rs.)",
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: TextField(
                  controller: _maxPriceController,
                  keyboardType: TextInputType.number,
                  decoration: InputDecoration(
                    labelText: context.locale.languageCode == 'ne'
                        ? 'अधिकतम मूल्य (रु.)'
                        : "Max Price (Rs.)",
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildConditionContent() {
    final isNe = context.locale.languageCode == 'ne';
    final conditions = ["Any Condition", "Brand New", "Used"];
    final conditionsNe = {
      'Any Condition': 'कुनै पनि अवस्था',
      'Brand New': 'नयाँ',
      'Used': 'पुरानो',
    };
    return Container(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: conditions.map((c) {
          final val = c == "Any Condition"
              ? ""
              : c; // Use exact value for DB match
          return RadioListTile(
            title: Text(isNe ? conditionsNe[c]! : c),
            value: val,
            groupValue: _selectedCondition,
            onChanged: (v) => setState(() => _selectedCondition = v.toString()),
            dense: true,
            activeColor: AppTheme.primary,
          );
        }).toList(),
      ),
    );
  }

  Widget _buildSortContent() {
    return Container(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          RadioListTile(
            value: "newest",
            groupValue: _selectedSort,
            onChanged: (v) => setState(() => _selectedSort = v.toString()),
            title: Text(
              context.locale.languageCode == 'ne'
                  ? 'नयाँ पहिले'
                  : "Newest First",
            ),
            activeColor: AppTheme.primary,
          ),
          RadioListTile(
            value: "oldest",
            groupValue: _selectedSort,
            onChanged: (v) => setState(() => _selectedSort = v.toString()),
            title: Text(
              context.locale.languageCode == 'ne'
                  ? 'पुरानो पहिले'
                  : "Oldest First",
            ),
            activeColor: AppTheme.primary,
          ),
          RadioListTile(
            value: "price_asc",
            groupValue: _selectedSort,
            onChanged: (v) => setState(() => _selectedSort = v.toString()),
            title: Text(
              context.locale.languageCode == 'ne'
                  ? 'मूल्य: कम देखि बढी'
                  : "Price: Low to High",
            ),
            activeColor: AppTheme.primary,
          ),
          RadioListTile(
            value: "price_desc",
            groupValue: _selectedSort,
            onChanged: (v) => setState(() => _selectedSort = v.toString()),
            title: Text(
              context.locale.languageCode == 'ne'
                  ? 'मूल्य: बढी देखि कम'
                  : "Price: High to Low",
            ),
            activeColor: AppTheme.primary,
          ),
        ],
      ),
    );
  }
}
