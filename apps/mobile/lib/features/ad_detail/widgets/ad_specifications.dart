import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:mobile/core/models/models.dart';
import 'package:mobile/core/utils/localized_helpers.dart';
import 'package:mobile/features/post_ad/services/form_template_service.dart';

/// A spec row already resolved to display text, so the layout code never has
/// to look at the raw attribute again.
class _SpecRow {
  final String label;
  final String value;
  final String? url;

  const _SpecRow({required this.label, required this.value, this.url});
}

class AdSpecifications extends StatelessWidget {
  final AdWithDetails ad;

  const AdSpecifications({super.key, required this.ad});

  static final FormTemplateService _templateService = FormTemplateService();

  @override
  Widget build(BuildContext context) {
    final attributes = ad.attributes;
    if (attributes == null || attributes.isEmpty) {
      return const SizedBox.shrink();
    }

    final isNe = context.locale.languageCode == 'ne';

    // The post-ad template is both the whitelist and the order. A key it does
    // not declare is a stale attribute from a switched category, an old client
    // or a legacy field, so it is dropped rather than prettified into a label.
    final fields = [
      ..._templateService.getApplicableFields(
        ad.categoryName,
        ad.subcategoryName ?? '',
      ),
      ..._legacyFields,
    ];

    final rows = _buildRows(fields, attributes, isNe);
    final amenities = _parseAmenities(
      attributes['amenities'],
      _fieldNamed(fields, 'amenities'),
      isNe,
    );

    if (rows.isEmpty && amenities.isEmpty) return const SizedBox.shrink();

    return Container(
      margin: const EdgeInsets.fromLTRB(16, 8, 16, 24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey[200]!),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 4),
            child: Text(
              isNe ? 'विशेषताहरू' : "Specifications",
              style: GoogleFonts.inter(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: const Color(0xFF1F2937),
              ),
            ),
          ),
          const Divider(height: 16, color: Color(0xFFF3F4F6)),
          if (rows.isNotEmpty) _buildSpecTable(context, rows),

          // Amenities section (matches web SpecificationsSection)
          if (amenities.isNotEmpty) ...[
            if (rows.isNotEmpty) Divider(height: 1, color: Colors.grey[200]),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
              child: Text(
                isNe ? 'सुविधाहरू' : 'Amenities',
                style: GoogleFonts.inter(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: const Color(0xFF1F2937),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
              child: Wrap(
                spacing: 8,
                runSpacing: 8,
                children: amenities.map((amenity) {
                  return Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 22,
                        height: 22,
                        decoration: const BoxDecoration(
                          shape: BoxShape.circle,
                          color: Color(0xFFDCFCE7),
                        ),
                        child: const Center(
                          child: Icon(
                            Icons.check,
                            size: 14,
                            color: Color(0xFF16A34A),
                          ),
                        ),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        amenity,
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                          color: const Color(0xFF374151),
                        ),
                      ),
                    ],
                  );
                }).toList(),
              ),
            ),
          ],
        ],
      ),
    );
  }

  /// A single Table measures every row together, so the value column starts at
  /// the same x on all of them — a Row per spec cannot guarantee that.
  /// Long labels wrap inside the 38% track instead of pushing the values out
  /// of line; on a very narrow screen or at a large text scale the two cells
  /// stack instead, because a 38% track stops being readable there.
  Widget _buildSpecTable(BuildContext context, List<_SpecRow> rows) {
    final stacked =
        MediaQuery.textScalerOf(context).scale(14) >= 21 ||
        MediaQuery.sizeOf(context).width < 330;

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      child: Table(
        columnWidths: stacked
            ? const {0: FlexColumnWidth()}
            : const {0: FlexColumnWidth(38), 1: FlexColumnWidth(62)},
        defaultVerticalAlignment: TableCellVerticalAlignment.top,
        children: [
          for (var i = 0; i < rows.length; i++)
            _buildTableRow(rows[i], i, rows.length, stacked),
        ],
      ),
    );
  }

  TableRow _buildTableRow(_SpecRow row, int index, int total, bool stacked) {
    final isLast = index == total - 1;
    final padding = EdgeInsets.only(
      top: index == 0 ? 0 : 12,
      bottom: isLast ? 0 : 12,
    );
    final decoration = isLast
        ? null
        : BoxDecoration(
            border: Border(bottom: BorderSide(color: Colors.grey[100]!)),
          );

    final label = Text(
      row.label,
      style: GoogleFonts.inter(
        fontSize: 14,
        fontWeight: FontWeight.w400,
        color: const Color(0xFF6B7280),
      ),
    );

    final url = row.url;
    final value = url == null
        ? Text(
            row.value,
            style: GoogleFonts.inter(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: const Color(0xFF111827),
            ),
          )
        : GestureDetector(
            onTap: () => _launchUrl(url),
            child: Text(
              row.value,
              style: GoogleFonts.inter(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: const Color(0xFF2563EB),
                decoration: TextDecoration.underline,
              ),
            ),
          );

    if (stacked) {
      return TableRow(
        decoration: decoration,
        children: [
          Padding(
            padding: padding,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [label, const SizedBox(height: 4), value],
            ),
          ),
        ],
      );
    }

    return TableRow(
      decoration: decoration,
      children: [
        Padding(padding: padding.copyWith(right: 16), child: label),
        Padding(padding: padding, child: value),
      ],
    );
  }

  /// Declared fields that render somewhere other than the spec table:
  /// `condition` is the badge, `amenities` has its own section, and
  /// `monthlyRent` is the ad's own price now that rentals label the core price
  /// input "Monthly Rent" — old ads still carry the key, it just stops showing.
  /// isNegotiable / isCodAvailable / whatsapp_number need no entry: no template
  /// declares them, so the whitelist above already drops them.
  static const _excludedFromSpecRows = {
    'condition',
    'amenities',
    'monthlyRent',
  };

  /// Display-only. Dropped from the post-ad templates, so nothing writes them
  /// any more, but ads posted before that still carry real values and would
  /// otherwise lose a spec row. Appended after the template fields, so they
  /// render last and never affect the order of a still-declared field.
  static const _legacyFields = [
    FormFieldModel(
      name: 'style',
      label: 'Style',
      labelNe: 'शैली',
      type: FieldType.select,
    ),
    FormFieldModel(
      name: 'assemblyRequired',
      label: 'Assembly Required',
      labelNe: 'जोड्नु पर्ने',
      type: FieldType.select,
    ),
    FormFieldModel(
      name: 'manufacturingDate',
      label: 'Manufacturing Date',
      labelNe: 'उत्पादन मिति',
      type: FieldType.date,
    ),
    // Superseded by roadSize (banded) and buildYear (an AD year). The stored
    // values — a raw number and a range like '0-1 years' — cannot convert, so
    // older ads keep showing them under the label they were captured with.
    FormFieldModel(
      name: 'roadWidth',
      label: 'Road Width (feet)',
      labelNe: 'सडक चौडाइ (फिट)',
      type: FieldType.number,
    ),
    FormFieldModel(
      name: 'propertyAge',
      label: 'Property Age',
      labelNe: 'सम्पत्ति उमेर',
      type: FieldType.select,
    ),
  ];

  List<_SpecRow> _buildRows(
    List<FormFieldModel> fields,
    Map<String, dynamic> attributes,
    bool isNe,
  ) {
    // Merge "Total Area" + "Area Unit" into a single row (e.g. "10 sq ft") so
    // the measurement and its unit read together instead of as two rows.
    final areaUnitField = _fieldNamed(fields, 'areaUnit');
    final mergeArea =
        areaUnitField != null &&
        attributes['totalArea'] != null &&
        attributes['areaUnit'] != null;

    final rows = <_SpecRow>[];
    for (final field in fields) {
      if (_excludedFromSpecRows.contains(field.name)) continue;
      if (mergeArea && field.name == 'areaUnit') continue;

      var value = _formatValue(field, attributes[field.name], isNe);
      if (value == null) continue;

      if (mergeArea && field.name == 'totalArea') {
        final unit = _formatValue(areaUnitField, attributes['areaUnit'], isNe);
        if (unit != null) value = '$value $unit';
      }

      final label = isNe ? (field.labelNe ?? field.label) : field.label;
      if (field.name == 'googleMapsLink') {
        rows.add(
          _SpecRow(
            label: label,
            value: isNe ? 'गुगल म्यापमा हेर्नुहोस्' : 'View on Google Maps',
            url: value,
          ),
        );
        continue;
      }

      rows.add(_SpecRow(label: label, value: value));
    }
    return rows;
  }

  /// Years, counts and floor numbers must never pick up thousand separators —
  /// 2020 is a year, not 2,020.
  static const _rawNumberKeys = {
    'year',
    'registrationYear',
    'floorNumber',
    'totalFloors',
    'shoeSize',
    'megapixels',
    'bedrooms',
    'bathrooms',
    'seatingCapacity',
  };

  static const _currencyKeys = {'securityDeposit'};

  static const _unitSuffixes = {
    'roadWidth': 'ft',
    'mileage': 'km',
    'engineCapacity': 'cc',
  };

  static const _unitSuffixesNe = {
    'roadWidth': 'फिट',
    'mileage': 'कि.मि.',
    'engineCapacity': 'सी.सी.',
  };

  /// Returns the display text for one attribute, or null when the row must be
  /// omitted entirely (empty, or an opt-in flag that is off).
  String? _formatValue(FormFieldModel field, dynamic value, bool isNe) {
    if (value == null) return null;

    if (value is bool) return value ? _yes(isNe) : null;

    if (value is List) return _joinOptions(field, value.map(_asText), isNe);

    if (value is num) return _formatNumber(field, value, isNe);

    final raw = value.toString().trim();
    if (raw.isEmpty || raw == '[]') return null;

    if (field.type == FieldType.multiselect) {
      return _joinOptions(field, raw.split(','), isNe);
    }

    final lower = raw.toLowerCase();
    if (lower == 'false') return null;
    if (lower == 'true') return _yes(isNe);

    if (field.type == FieldType.date) return _formatDate(raw, isNe);

    if (field.type == FieldType.number) {
      final parsed = num.tryParse(raw);
      if (parsed != null) return _formatNumber(field, parsed, isNe);
    }

    return _localizedOption(field, raw, isNe);
  }

  String? _joinOptions(
    FormFieldModel field,
    Iterable<String> values,
    bool isNe,
  ) {
    final parts = values
        .map((v) => v.trim())
        .where((v) => v.isNotEmpty)
        .map((v) => _localizedOption(field, v, isNe))
        .toList();
    return parts.isEmpty ? null : parts.join(', ');
  }

  String _formatNumber(FormFieldModel field, num value, bool isNe) {
    final digits = value % 1 == 0 ? value.toInt().toString() : value.toString();
    if (_rawNumberKeys.contains(field.name)) return digits;
    if (_currencyKeys.contains(field.name)) {
      return formatLocalizedPrice(value.toDouble(), isNe ? 'ne' : 'en');
    }
    final unit = isNe ? _unitSuffixesNe[field.name] : _unitSuffixes[field.name];
    final grouped = _grouped(digits);
    return unit == null ? grouped : '$grouped $unit';
  }

  /// Date fields hold a plain calendar date ('yyyy-MM-dd'), so it is rebuilt as
  /// UTC before formatting — parsing it as local time shifts the day for anyone
  /// east of Nepal.
  String _formatDate(String raw, bool isNe) {
    final parsed = DateTime.tryParse(raw);
    if (parsed == null) return raw;
    return formatNepalTime(
      DateTime.utc(parsed.year, parsed.month, parsed.day),
      'd MMM yyyy',
      isNe ? 'ne' : 'en',
    );
  }

  /// Per-field option map first: two fields can share a value literal and still
  /// need different Nepali. `_valueMapNe` only covers the fields whose factory
  /// drops `optionsNe` when the option list is overridden.
  String _localizedOption(FormFieldModel field, String raw, bool isNe) {
    if (!isNe) return raw;
    final options = field.options;
    final optionsNe = field.optionsNe;
    if (options != null &&
        optionsNe != null &&
        options.length == optionsNe.length) {
      final index = options.indexOf(raw);
      if (index >= 0) return optionsNe[index];
    }
    return _valueMapNe[raw] ?? raw;
  }

  List<String> _parseAmenities(dynamic raw, FormFieldModel? field, bool isNe) {
    if (field == null || raw == null) return const [];
    final values = raw is List ? raw.map(_asText) : raw.toString().split(',');
    return values
        .map((a) => a.trim())
        .where((a) => a.isNotEmpty)
        .map((a) => _localizedOption(field, a, isNe))
        .toList();
  }

  FormFieldModel? _fieldNamed(List<FormFieldModel> fields, String name) {
    for (final field in fields) {
      if (field.name == name) return field;
    }
    return null;
  }

  String _asText(dynamic value) => value?.toString() ?? '';

  String _yes(bool isNe) => isNe ? 'छ' : 'Yes';

  static String _grouped(String digits) => digits.replaceAllMapped(
    RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
    (m) => '${m[1]},',
  );

  static Future<void> _launchUrl(String url) async {
    final uri = Uri.tryParse(url);
    if (uri == null) return;
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  /// Fallback Nepali for option values whose field ships no `optionsNe`.
  static const _valueMapNe = {
    // Condition
    'Brand New': 'नयाँ',
    'Refurbished': 'रिफर्बिस्ड',
    'Used': 'पुरानो',
    // Warranty
    'No Warranty': 'वारेन्टी छैन',
    'Under Warranty (< 6 months)': 'वारेन्टी अन्तर्गत (< ६ महिना)',
    'Under Warranty (6-12 months)': 'वारेन्टी अन्तर्गत (६-१२ महिना)',
    'Under Warranty (1+ years)': 'वारेन्टी अन्तर्गत (१+ वर्ष)',
    // Vehicles
    'Petrol': 'पेट्रोल',
    'Diesel': 'डिजेल',
    'Electric': 'इलेक्ट्रिक',
    'Hybrid': 'हाइब्रिड',
    'CNG': 'सीएनजी',
    'LPG': 'एलपीजी',
    'Manual': 'म्यानुअल',
    'Automatic': 'अटोम्याटिक',
    'Semi-Automatic': 'सेमी-अटोम्याटिक',
    '1st Owner': 'पहिलो मालिक',
    '2nd Owner': 'दोस्रो मालिक',
    '3rd Owner': 'तेस्रो मालिक',
    '4th Owner or More': 'चौथो वा बढी',
    'Sedan': 'सेडान',
    'SUV': 'एसयुभी',
    'Hatchback': 'ह्याचब्याक',
    'Coupe': 'कुपे',
    'Convertible': 'कन्भर्टिबल',
    'Pickup': 'पिकअप',
    'Van': 'भ्यान',
    'Mountain Bike': 'माउन्टेन बाइक',
    'Road Bike': 'रोड बाइक',
    'Kids Bike': 'बच्चाको साइकल',
    // Property
    'sq ft': 'वर्ग फिट',
    'aana': 'आना',
    'ropani': 'रोपनी',
    'sq meter': 'वर्ग मिटर',
    'Studio': 'स्टुडियो',
    'Fully Furnished': 'पूर्ण फर्निचर',
    'Semi Furnished': 'आंशिक फर्निचर',
    'Unfurnished': 'फर्निचर बिना',
    'None': 'छैन',
    'North': 'उत्तर',
    'South': 'दक्षिण',
    'East': 'पूर्व',
    'West': 'पश्चिम',
    'North-East': 'उत्तर-पूर्व',
    'North-West': 'उत्तर-पश्चिम',
    'South-East': 'दक्षिण-पूर्व',
    'South-West': 'दक्षिण-पश्चिम',
    'Under Construction': 'निर्माणाधीन',
    '0-1 years': '०-१ वर्ष',
    '1-5 years': '१-५ वर्ष',
    '5-10 years': '५-१० वर्ष',
    '10-20 years': '१०-२० वर्ष',
    '20+ years': '२०+ वर्ष',
    'Lift/Elevator': 'लिफ्ट',
    'Power Backup': 'पावर ब्याकअप',
    'Water Supply': 'पानी आपूर्ति',
    'Security/Gated': 'सुरक्षा/गेटेड',
    'Gym': 'जिम',
    'Swimming Pool': 'स्विमिङ पुल',
    'Garden': 'बगैंचा',
    'Playground': 'खेल मैदान',
    'Club House': 'क्लब हाउस',
    'Visitor Parking': 'आगन्तुक पार्किङ',
    'Residential': 'आवासीय',
    'Commercial': 'व्यापारिक',
    'Agricultural': 'कृषि',
    'Industrial': 'औद्योगिक',
    'Mixed Use': 'मिश्रित',
    'Paved Road': 'पक्की सडक',
    'Graveled Road': 'ग्राभेल सडक',
    'Dirt Road': 'कच्ची सडक',
    'No Direct Access': 'प्रत्यक्ष पहुँच छैन',
    'Immediately': 'तुरुन्तै',
    '15 days': '१५ दिन',
    '1 month': '१ महिना',
    '2 months': '२ महिना',
    '3 months': '३ महिना',
    // Fashion
    'Free Size': 'फ्री साइज',
    'Shirt': 'सर्ट',
    'T-Shirt': 'टी-सर्ट',
    'Pants': 'प्यान्ट',
    'Jeans': 'जिन्स',
    'Dress': 'ड्रेस',
    'Saree': 'साडी',
    'Kurta': 'कुर्ता',
    'Jacket': 'ज्याकेट',
    'Coat': 'कोट',
    'Sweater': 'स्वेटर',
    'Skirt': 'स्कर्ट',
    'Shorts': 'सर्ट्स',
    'Regular Fit': 'रेगुलर फिट',
    'Slim Fit': 'स्लिम फिट',
    'Loose Fit': 'लुज फिट',
    'Skinny Fit': 'स्किनी फिट',
    'Full Sleeve': 'पूरा बाहुला',
    'Half Sleeve': 'आधा बाहुला',
    'Sleeveless': 'बाहुला बिना',
    '3/4 Sleeve': '३/४ बाहुला',
    'Sneakers': 'स्निकर्स',
    'Formal Shoes': 'औपचारिक जुत्ता',
    'Sandals': 'सेन्डल',
    'Slippers': 'चप्पल',
    'Boots': 'बुट',
    'Heels': 'हिल',
    'Flats': 'फ्ल्याट',
    'Sports Shoes': 'खेलकुद जुत्ता',
    'Analog': 'एनालग',
    'Digital': 'डिजिटल',
    'Smart Watch': 'स्मार्ट वाच',
    'Chronograph': 'क्रोनोग्राफ',
    'Leather': 'छाला',
    'Metal': 'धातु',
    'Rubber': 'रबर',
    'Fabric': 'कपडा',
    // Pets
    'Dog': 'कुकुर',
    'Cat': 'बिरालो',
    'Bird': 'चरा',
    'Fish': 'माछा',
    'Rabbit': 'खरायो',
    'Hamster': 'ह्यामस्टर',
    'Guinea Pig': 'गिनी पिग',
    'Cow': 'गाई',
    'Buffalo': 'भैंसी',
    'Goat': 'बाख्रा',
    'Chicken': 'कुखुरा',
    'Duck': 'हाँस',
    'Other': 'अन्य',
    '0-3 months': '०-३ महिना',
    '3-6 months': '३-६ महिना',
    '6-12 months': '६-१२ महिना',
    '1-2 years': '१-२ वर्ष',
    '2-5 years': '२-५ वर्ष',
    '5+ years': '५+ वर्ष',
    'Male': 'भाले',
    'Female': 'पोथी',
    'Unknown': 'थाहा छैन',
    'Fully Vaccinated': 'पूर्ण खोप लगाइएको',
    'Partially Vaccinated': 'आंशिक खोप',
    'Not Vaccinated': 'खोप नलगाइएको',
    'Yes - All Papers': 'छ - सबै कागजात',
    'Some Papers': 'केही कागजात',
    'No Papers': 'कागजात छैन',
    'Fully Trained': 'पूर्ण प्रशिक्षित',
    'Partially Trained': 'आंशिक प्रशिक्षित',
    'Not Trained': 'प्रशिक्षित छैन',
    'Children': 'बच्चाहरू',
    'Other Dogs': 'अन्य कुकुर',
    'Cats': 'बिरालो',
    'Strangers': 'अपरिचित',
    'Food': 'खाना',
    'Toy': 'खेलौना',
    'Cage': 'पिंजरा',
    'Leash': 'पट्टा',
    'Collar': 'कलर',
    'Grooming': 'ग्रुमिङ',
    'Medicine': 'औषधि',
    'Bedding': 'ओछ्यान',
    'Dogs': 'कुकुर',
    'Birds': 'चरा',
    'All Pets': 'सबै पालतु',
    // Services & Jobs
    'Less than 1 year': '१ वर्ष भन्दा कम',
    '1-3 years': '१-३ वर्ष',
    '3-5 years': '३-५ वर्ष',
    '10+ years': '१०+ वर्ष',
    'Weekdays': 'हप्ताको दिन',
    'Weekends': 'शनिबार/आइतबार',
    'Evenings': 'साँझ',
    '24/7': '२४/७',
    'On-Call': 'कलमा',
    'At Customer Location': 'ग्राहकको स्थानमा',
    'At Provider Location': 'प्रदायकको स्थानमा',
    'Remote/Online': 'रिमोट/अनलाइन',
    'English': 'अंग्रेजी',
    'Nepali': 'नेपाली',
    'Hindi': 'हिन्दी',
    'Newari': 'नेवारी',
    'Full Time': 'पूर्णकालीन',
    'Part Time': 'अंशकालीन',
    'Contract': 'करार',
    'Freelance': 'फ्रिल्यान्स',
    'Internship': 'इन्टर्नशिप',
    'Fresher': 'फ्रेसर',
    'No Formal Education': 'औपचारिक शिक्षा छैन',
    'SLC/SEE': 'एसएलसी/एसईई',
    '+2': '+२',
    "Bachelor's": 'स्नातक',
    "Master's": 'स्नातकोत्तर',
    'PhD': 'पीएचडी',
    'Below 20,000': '२०,००० भन्दा कम',
    'Negotiable': 'मोलमोलाई योग्य',
    // Teaching
    'Math': 'गणित',
    'Science': 'विज्ञान',
    'Social Studies': 'सामाजिक अध्ययन',
    'Computer': 'कम्प्युटर',
    'Accounts': 'लेखा',
    'All Subjects': 'सबै विषय',
    'Primary (1-5)': 'प्राथमिक (१-५)',
    'Secondary (6-10)': 'माध्यमिक (६-१०)',
    '+2/Intermediate': '+२/मध्यवर्ती',
    'Bachelor': 'स्नातक',
    'Master': 'स्नातकोत्तर',
    'Home Tuition': 'घर ट्युसन',
    'Online': 'अनलाइन',
    'At Institute': 'संस्थामा',
    'Group Class': 'सामूहिक कक्षा',
    // Furniture & General
    'Bed': 'बेड',
    'Sofa': 'सोफा',
    'Table': 'टेबल',
    'Chair': 'कुर्सी',
    'Wardrobe': 'अलमारी',
    'Shelf': 'शेल्फ',
    'Desk': 'डेस्क',
    'Cabinet': 'क्याबिनेट',
    'Dining Set': 'डाइनिङ सेट',
    'Wood': 'काठ',
    'Plastic': 'प्लास्टिक',
    'Glass': 'गिलास',
    'Mixed Materials': 'मिश्रित',
    'Yes - Assembly Required': 'हो - जोड्ने आवश्यक',
    'No - Ready to Use': 'छैन - प्रयोगको लागि तयार',
    'Partial Assembly': 'आंशिक जोड्ने',
    '1 Person': '१ जना',
    '2-3 People': '२-३ जना',
    '4-6 People': '४-६ जना',
    '6-8 People': '६-८ जना',
    '8+ People': '८+ जना',
    'Yes': 'छ',
    'No': 'छैन',
    'Modern': 'आधुनिक',
    'Traditional': 'परम्परागत',
    'Vintage': 'पुरानो',
    'Minimalist': 'न्यूनतम',
    'Contemporary': 'समकालीन',
    'Rustic': 'ग्रामीण',
    // Machinery & Agriculture
    'Construction': 'निर्माण',
    'Manufacturing': 'उत्पादन',
    'Office Equipment': 'कार्यालय उपकरण',
    'Medical Equipment': 'चिकित्सा उपकरण',
    'Battery': 'ब्याट्री',
    'Solar': 'सोलार',
    'Food Item': 'खाद्य पदार्थ',
    'Household Item': 'घरायसी सामान',
    'Baby Product': 'बच्चा उत्पादन',
    'Healthcare': 'स्वास्थ्य',
    'Tractor': 'ट्र्याक्टर',
    'Plough': 'हलो',
    'Harvester': 'हार्भेस्टर',
    'Sprayer': 'स्प्रेयर',
    'Hand Tool': 'हात औजार',
  };
}
