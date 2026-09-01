import 'package:flutter/material.dart';
import 'package:mobile/core/theme/app_font.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../api/location_client.dart';
import '../models/models.dart';
import '../theme/app_theme.dart';

/// Selected location data to be returned from the picker
class SelectedLocation {
  final int? provinceId;
  final String? provinceName;
  final int? districtId;
  final String? districtName;
  final int? municipalityId;
  final String? municipalityName;
  final int? areaId;
  final String? areaName;

  SelectedLocation({
    this.provinceId,
    this.provinceName,
    this.districtId,
    this.districtName,
    this.municipalityId,
    this.municipalityName,
    this.areaId,
    this.areaName,
  });

  /// Get the most specific location ID (area > municipality > district > province)
  int? get finalLocationId =>
      areaId ?? municipalityId ?? districtId ?? provinceId;

  /// Get display name for the selected location
  String get displayName {
    final parts = <String>[];
    if (areaName != null) parts.add(areaName!);
    if (municipalityName != null) parts.add(municipalityName!);
    if (districtName != null) parts.add(districtName!);
    if (provinceName != null) parts.add(provinceName!);
    return parts.isEmpty ? 'Select Location' : parts.join(', ');
  }

  /// Short display name (just area/municipality or district)
  String get shortDisplayName {
    if (areaName != null) return areaName!;
    if (municipalityName != null) return municipalityName!;
    if (districtName != null) return districtName!;
    if (provinceName != null) return provinceName!;
    return 'Select Location';
  }

  bool get isSelected => finalLocationId != null;
}

/// Cascading location picker modal
class LocationPicker extends StatefulWidget {
  final SelectedLocation? initialLocation;
  final Function(SelectedLocation) onLocationSelected;

  const LocationPicker({
    super.key,
    this.initialLocation,
    required this.onLocationSelected,
  });

  /// Show the location picker as a bottom sheet
  static Future<SelectedLocation?> show(
    BuildContext context, {
    SelectedLocation? initialLocation,
  }) async {
    return showModalBottomSheet<SelectedLocation>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        maxChildSize: 0.9,
        minChildSize: 0.5,
        builder: (context, scrollController) => _LocationPickerContent(
          scrollController: scrollController,
          initialLocation: initialLocation,
        ),
      ),
    );
  }

  @override
  State<LocationPicker> createState() => _LocationPickerState();
}

class _LocationPickerState extends State<LocationPicker> {
  @override
  Widget build(BuildContext context) {
    return _LocationPickerContent(
      initialLocation: widget.initialLocation,
      onLocationSelected: widget.onLocationSelected,
    );
  }
}

class _LocationPickerContent extends StatefulWidget {
  final ScrollController? scrollController;
  final SelectedLocation? initialLocation;
  final Function(SelectedLocation)? onLocationSelected;

  const _LocationPickerContent({
    this.scrollController,
    this.initialLocation,
    this.onLocationSelected,
  });

  @override
  State<_LocationPickerContent> createState() => _LocationPickerContentState();
}

class _LocationPickerContentState extends State<_LocationPickerContent> {
  final _locationClient = LocationClient();

  // Loading states
  bool _loadingProvinces = true;
  bool _loadingDistricts = false;
  bool _loadingMunicipalities = false;
  bool _loadingAreas = false;

  // Data lists
  List<Province> _provinces = [];
  List<District> _districts = [];
  List<Municipality> _municipalities = [];
  List<Area> _areas = [];

  // Selected values
  Province? _selectedProvince;
  District? _selectedDistrict;
  Municipality? _selectedMunicipality;
  Area? _selectedArea;

  @override
  void initState() {
    super.initState();
    _loadProvinces();
  }

  Future<void> _loadProvinces() async {
    setState(() => _loadingProvinces = true);
    final provinces = await _locationClient.getProvinces();
    if (mounted) {
      setState(() {
        _provinces = provinces;
        _loadingProvinces = false;

        // If we have initial data, try to restore selection
        if (widget.initialLocation?.provinceId != null) {
          final initialProvince = provinces.where(
            (p) => p.id == widget.initialLocation!.provinceId,
          );
          if (initialProvince.isNotEmpty) {
            _selectedProvince = initialProvince.first;
            _loadDistricts(_selectedProvince!.id);
          }
        }
      });
    }
  }

  Future<void> _loadDistricts(int provinceId) async {
    setState(() {
      _loadingDistricts = true;
      _districts = [];
      _selectedDistrict = null;
      _municipalities = [];
      _selectedMunicipality = null;
      _areas = [];
      _selectedArea = null;
    });

    final districts = await _locationClient.getDistricts(provinceId);
    if (mounted) {
      setState(() {
        _districts = districts;
        _loadingDistricts = false;

        // Restore initial selection if applicable
        if (widget.initialLocation?.districtId != null) {
          final initialDistrict = districts.where(
            (d) => d.id == widget.initialLocation!.districtId,
          );
          if (initialDistrict.isNotEmpty) {
            _selectedDistrict = initialDistrict.first;
            _loadMunicipalities(_selectedDistrict!.id);
          }
        }
      });
    }
  }

  Future<void> _loadMunicipalities(int districtId) async {
    setState(() {
      _loadingMunicipalities = true;
      _municipalities = [];
      _selectedMunicipality = null;
      _areas = [];
      _selectedArea = null;
    });

    final municipalities = await _locationClient.getMunicipalities(districtId);
    if (mounted) {
      setState(() {
        _municipalities = municipalities;
        _loadingMunicipalities = false;

        // Restore initial selection if applicable
        if (widget.initialLocation?.municipalityId != null) {
          final initialMunicipality = municipalities.where(
            (m) => m.id == widget.initialLocation!.municipalityId,
          );
          if (initialMunicipality.isNotEmpty) {
            _selectedMunicipality = initialMunicipality.first;
            _loadAreas(_selectedMunicipality!.id);
          }
        }
      });
    }
  }

  Future<void> _loadAreas(int municipalityId) async {
    setState(() {
      _loadingAreas = true;
      _areas = [];
      _selectedArea = null;
    });

    final areas = await _locationClient.getAreas(municipalityId);
    if (mounted) {
      setState(() {
        _areas = areas;
        _loadingAreas = false;

        // Restore initial area selection
        if (widget.initialLocation?.areaId != null) {
          final initialArea = areas.where(
            (a) => a.id == widget.initialLocation!.areaId,
          );
          if (initialArea.isNotEmpty) {
            _selectedArea = initialArea.first;
          }
        }
      });
    }
  }

  SelectedLocation _buildSelectedLocation() {
    return SelectedLocation(
      provinceId: _selectedProvince?.id,
      provinceName: _selectedProvince?.name,
      districtId: _selectedDistrict?.id,
      districtName: _selectedDistrict?.name,
      municipalityId: _selectedMunicipality?.id,
      municipalityName: _selectedMunicipality?.name,
      areaId: _selectedArea?.id,
      areaName: _selectedArea?.name,
    );
  }

  void _confirmSelection() {
    final selection = _buildSelectedLocation();
    if (widget.onLocationSelected != null) {
      widget.onLocationSelected!(selection);
    }
    Navigator.of(context).pop(selection);
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
          // Handle bar
          Container(
            margin: const EdgeInsets.only(top: 12),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.grey[300],
              borderRadius: BorderRadius.circular(2),
            ),
          ),

          // Header
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Select Location',
                  style: AppFont.inter(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.textDark,
                  ),
                ),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(LucideIcons.x),
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                ),
              ],
            ),
          ),

          const Divider(height: 1),

          // Content
          Expanded(
            child: SingleChildScrollView(
              controller: widget.scrollController,
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Province Dropdown
                  _buildDropdownField(
                    label: 'Province',
                    isLoading: _loadingProvinces,
                    child: _loadingProvinces
                        ? const SizedBox(height: 48)
                        : DropdownButtonFormField<Province>(
                            value: _selectedProvince,
                            hint: Text(
                              'Select Province',
                              style: AppFont.inter(color: Colors.grey[500]),
                            ),
                            isExpanded: true,
                            decoration: _dropdownDecoration(),
                            items: _provinces
                                .map(
                                  (p) => DropdownMenuItem(
                                    value: p,
                                    child: Text(p.name, style: AppFont.inter()),
                                  ),
                                )
                                .toList(),
                            onChanged: (province) {
                              setState(() => _selectedProvince = province);
                              if (province != null) {
                                _loadDistricts(province.id);
                              }
                            },
                          ),
                  ),

                  const SizedBox(height: 16),

                  // District Dropdown
                  _buildDropdownField(
                    label: 'District',
                    isLoading: _loadingDistricts,
                    enabled: _selectedProvince != null,
                    child: _loadingDistricts
                        ? const SizedBox(height: 48)
                        : DropdownButtonFormField<District>(
                            value: _selectedDistrict,
                            hint: Text(
                              _selectedProvince == null
                                  ? 'Select Province first'
                                  : 'Select District',
                              style: AppFont.inter(color: Colors.grey[500]),
                            ),
                            isExpanded: true,
                            decoration: _dropdownDecoration(
                              enabled: _selectedProvince != null,
                            ),
                            items: _districts
                                .map(
                                  (d) => DropdownMenuItem(
                                    value: d,
                                    child: Text(d.name, style: AppFont.inter()),
                                  ),
                                )
                                .toList(),
                            onChanged: _selectedProvince == null
                                ? null
                                : (district) {
                                    setState(
                                      () => _selectedDistrict = district,
                                    );
                                    if (district != null) {
                                      _loadMunicipalities(district.id);
                                    }
                                  },
                          ),
                  ),

                  const SizedBox(height: 16),

                  // Municipality Dropdown
                  _buildDropdownField(
                    label: 'Municipality',
                    isLoading: _loadingMunicipalities,
                    enabled: _selectedDistrict != null,
                    child: _loadingMunicipalities
                        ? const SizedBox(height: 48)
                        : DropdownButtonFormField<Municipality>(
                            value: _selectedMunicipality,
                            hint: Text(
                              _selectedDistrict == null
                                  ? 'Select District first'
                                  : 'Select Municipality',
                              style: AppFont.inter(color: Colors.grey[500]),
                            ),
                            isExpanded: true,
                            decoration: _dropdownDecoration(
                              enabled: _selectedDistrict != null,
                            ),
                            items: _municipalities
                                .map(
                                  (m) => DropdownMenuItem(
                                    value: m,
                                    child: Text(m.name, style: AppFont.inter()),
                                  ),
                                )
                                .toList(),
                            onChanged: _selectedDistrict == null
                                ? null
                                : (municipality) {
                                    setState(
                                      () =>
                                          _selectedMunicipality = municipality,
                                    );
                                    if (municipality != null) {
                                      _loadAreas(municipality.id);
                                    }
                                  },
                          ),
                  ),

                  const SizedBox(height: 16),

                  // Area Dropdown (Optional)
                  _buildDropdownField(
                    label: 'Area (Optional)',
                    isLoading: _loadingAreas,
                    enabled: _selectedMunicipality != null && _areas.isNotEmpty,
                    child: _loadingAreas
                        ? const SizedBox(height: 48)
                        : _areas.isEmpty && _selectedMunicipality != null
                        ? Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 14,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.grey[50],
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: Colors.grey[200]!),
                            ),
                            child: Text(
                              'No areas available',
                              style: AppFont.inter(color: Colors.grey[500]),
                            ),
                          )
                        : DropdownButtonFormField<Area>(
                            value: _selectedArea,
                            hint: Text(
                              _selectedMunicipality == null
                                  ? 'Select Municipality first'
                                  : 'Select Area',
                              style: AppFont.inter(color: Colors.grey[500]),
                            ),
                            isExpanded: true,
                            decoration: _dropdownDecoration(
                              enabled:
                                  _selectedMunicipality != null &&
                                  _areas.isNotEmpty,
                            ),
                            items: _areas
                                .map(
                                  (a) => DropdownMenuItem(
                                    value: a,
                                    child: Text(a.name, style: AppFont.inter()),
                                  ),
                                )
                                .toList(),
                            onChanged: _selectedMunicipality == null
                                ? null
                                : (area) {
                                    setState(() => _selectedArea = area);
                                  },
                          ),
                  ),

                  const SizedBox(height: 24),

                  // Preview
                  if (_buildSelectedLocation().isSelected)
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppTheme.primary.withOpacity(0.05),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: AppTheme.primary.withOpacity(0.2),
                        ),
                      ),
                      child: Row(
                        children: [
                          const Icon(
                            LucideIcons.mapPin,
                            color: AppTheme.primary,
                            size: 20,
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Selected Location',
                                  style: AppFont.inter(
                                    fontSize: 12,
                                    color: Colors.grey[600],
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  _buildSelectedLocation().displayName,
                                  style: AppFont.inter(
                                    fontWeight: FontWeight.w600,
                                    color: AppTheme.textDark,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                ],
              ),
            ),
          ),

          // Confirm Button
          Container(
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
            child: SafeArea(
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _selectedProvince != null
                      ? _confirmSelection
                      : null,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primary,
                    disabledBackgroundColor: Colors.grey[300],
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: Text(
                    'Confirm Location',
                    style: AppFont.inter(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDropdownField({
    required String label,
    required bool isLoading,
    required Widget child,
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
                fontWeight: FontWeight.w600,
                color: enabled ? Colors.grey[700] : Colors.grey[400],
              ),
            ),
            if (isLoading) ...[
              const SizedBox(width: 8),
              const SizedBox(
                width: 16,
                height: 16,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: AppTheme.primary,
                ),
              ),
            ],
          ],
        ),
        const SizedBox(height: 8),
        child,
      ],
    );
  }

  InputDecoration _dropdownDecoration({bool enabled = true}) {
    return InputDecoration(
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      filled: true,
      fillColor: enabled ? Colors.white : Colors.grey[50],
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
        borderSide: const BorderSide(color: AppTheme.primary, width: 2),
      ),
      disabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: BorderSide(color: Colors.grey[200]!),
      ),
    );
  }
}
