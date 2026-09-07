import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/features/post_ad/services/form_template_service.dart';

/// The post-ad Form's validators only paint red text; nothing ever read their
/// result, so a starred Condition dropdown never blocked a post. This helper
/// is what `_submitAd` now gates on.
void main() {
  const condition = FormFieldModel(
    name: 'condition',
    label: 'Condition',
    labelNe: 'अवस्था',
    type: FieldType.select,
    required: true,
    options: ['Brand New', 'Used'],
  );
  const brand = FormFieldModel(
    name: 'brand',
    label: 'Brand',
    type: FieldType.text,
  );
  const features = FormFieldModel(
    name: 'features',
    label: 'Features',
    type: FieldType.multiselect,
    required: true,
    options: ['A', 'B'],
  );

  group('FormTemplateService.missingRequiredFields', () {
    test('flags an unselected required dropdown', () {
      final missing = FormTemplateService.missingRequiredFields(
        [condition, brand],
        {'brand': 'Samsung'},
      );
      expect(missing.map((f) => f.name), ['condition']);
    });

    test('accepts a selected required dropdown', () {
      final missing = FormTemplateService.missingRequiredFields(
        [condition, brand],
        {'condition': 'Used'},
      );
      expect(missing, isEmpty);
    });

    test('treats blank text and empty lists as missing', () {
      final missing = FormTemplateService.missingRequiredFields(
        [condition, features],
        {'condition': '   ', 'features': <String>[]},
      );
      expect(missing.map((f) => f.name), ['condition', 'features']);
    });

    test('ignores optional fields entirely', () {
      expect(FormTemplateService.missingRequiredFields([brand], {}), isEmpty);
    });
  });

  group('getApplicableFields', () {
    final service = FormTemplateService();

    test('Electronics keeps Condition required (policy: required)', () {
      final fields = service.getApplicableFields(
        'Electronics',
        'Laptops',
        categorySlug: 'electronics',
        subcategorySlug: 'laptops',
      );
      final condition = fields.singleWhere((f) => f.name == 'condition');
      expect(condition.required, isTrue);
    });

    test('Property has no Condition field at all (policy: hidden)', () {
      final fields = service.getApplicableFields(
        'Property',
        'House Rentals',
        categorySlug: 'property',
        subcategorySlug: 'house-rentals',
      );
      expect(fields.where((f) => f.name == 'condition'), isEmpty);
    });
  });
}
