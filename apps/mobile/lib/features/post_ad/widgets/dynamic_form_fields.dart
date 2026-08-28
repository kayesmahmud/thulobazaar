import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:mobile/features/post_ad/services/form_template_service.dart';

class DynamicFormFields extends StatelessWidget {
  final String locale;
  final List<FormFieldModel> fields;
  final Map<String, dynamic> values;
  final Function(String key, dynamic value) onChanged;

  const DynamicFormFields({
    super.key,
    required this.locale,
    required this.fields,
    required this.values,
    required this.onChanged,
  });

  /// Returns the localized label for a field
  String _localizedLabel(FormFieldModel field) =>
      locale == 'ne' && field.labelNe != null ? field.labelNe! : field.label;

  /// Returns the localized placeholder for a field
  String? _localizedPlaceholder(FormFieldModel field) =>
      locale == 'ne' && field.placeholderNe != null
      ? field.placeholderNe
      : field.placeholder;

  /// Returns the localized display text for an option at a given index
  String _localizedOption(FormFieldModel field, int index, String fallback) {
    if (locale == 'ne' &&
        field.optionsNe != null &&
        index < field.optionsNe!.length) {
      return field.optionsNe![index];
    }
    return fallback;
  }

  @override
  Widget build(BuildContext context) {
    if (fields.isEmpty) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.all(12),
      margin: const EdgeInsets.only(bottom: 24),
      decoration: BoxDecoration(
        color: Colors.blue[50],
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.blue[100]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(
                LucideIcons.clipboardList,
                color: Colors.blue,
                size: 20,
              ),
              const SizedBox(width: 8),
              Text(
                locale == 'ne' ? 'थप विवरण' : 'Additional Details',
                style: GoogleFonts.inter(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: Colors.blue[900],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          // Declaration order is the render order, so fields the config puts
          // together (Total Area + Area Unit) stay adjacent.
          for (var i = 0; i < fields.length; i++)
            Padding(
              // B-21: without a key Flutter reuses the previous category's
              // element on a subcategory switch — the old typed text survives
              // on screen while `values` has been cleared, and the ad posts
              // without it. Field names are unique within a template.
              key: ValueKey(fields[i].name),
              // One gap between fields; the card's padding closes the bottom.
              padding: EdgeInsets.only(bottom: i == fields.length - 1 ? 0 : 20),
              child: _buildField(context, fields[i]),
            ),
        ],
      ),
    );
  }

  Widget _buildField(BuildContext context, FormFieldModel field) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildLabel(field),
        const SizedBox(height: 8),
        _buildInput(context, field),
      ],
    );
  }

  Widget _buildLabel(FormFieldModel field) {
    return RichText(
      text: TextSpan(
        text: _localizedLabel(field),
        style: GoogleFonts.inter(
          fontSize: 13,
          fontWeight: FontWeight.w500,
          color: Colors.grey[800],
        ),
        children: [
          if (field.required)
            const TextSpan(
              text: " *",
              style: TextStyle(color: Colors.red),
            ),
        ],
      ),
    );
  }

  Widget _buildInput(BuildContext context, FormFieldModel field) {
    final placeholder = _localizedPlaceholder(field);
    final label = _localizedLabel(field);

    switch (field.type) {
      case FieldType.text:
      case FieldType.number:
        return TextFormField(
          initialValue: values[field.name]?.toString(),
          keyboardType: field.type == FieldType.number
              ? TextInputType.number
              : TextInputType.text,
          onChanged: (val) => onChanged(field.name, val),
          validator: (val) {
            if (field.required && (val == null || val.isEmpty)) {
              return '$label is required';
            }
            return null;
          },
          decoration: _inputDecoration(
            placeholder ?? 'Enter ${field.label.toLowerCase()}',
          ),
        );

      case FieldType.select:
        return DropdownButtonFormField<String>(
          value: values[field.name],
          isExpanded: true,
          decoration: _inputDecoration(placeholder ?? 'Select ${field.label}'),
          icon: const Icon(LucideIcons.chevronDown, color: Colors.grey),
          onChanged: (val) => onChanged(field.name, val),
          validator: (val) {
            if (field.required && val == null) {
              return 'Please select $label';
            }
            return null;
          },
          items: field.options?.asMap().entries.map((entry) {
            final displayLabel = _localizedOption(
              field,
              entry.key,
              entry.value,
            );
            return DropdownMenuItem(
              value: entry.value,
              child: Text(displayLabel, style: GoogleFonts.inter(fontSize: 14)),
            );
          }).toList(),
        );

      case FieldType.multiselect:
        return _buildMultiselect(field);

      case FieldType.checkbox:
        return CheckboxListTile(
          value: values[field.name] ?? false,
          onChanged: (val) => onChanged(field.name, val),
          title: Text(
            _localizedLabel(field),
            style: GoogleFonts.inter(fontSize: 14),
          ),
          controlAffinity: ListTileControlAffinity.leading,
          contentPadding: EdgeInsets.zero,
        );

      case FieldType.date:
        return _DateFieldInput(
          label: label,
          hint: placeholder,
          isRequired: field.required,
          value: values[field.name]?.toString(),
          onPicked: (val) => onChanged(field.name, val),
        );
    }
  }

  Widget _buildMultiselect(FormFieldModel field) {
    final selected = List<String>.from(values[field.name] ?? []);
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey[300]!),
      ),
      child: Wrap(
        spacing: 8,
        runSpacing: 8,
        children: (field.options ?? []).asMap().entries.map((entry) {
          final opt = entry.value;
          final displayLabel = _localizedOption(field, entry.key, opt);
          final isSelected = selected.contains(opt);
          return FilterChip(
            label: Text(
              displayLabel,
              style: GoogleFonts.inter(
                fontSize: 13,
                color: isSelected ? Colors.white : Colors.grey[800],
              ),
            ),
            selected: isSelected,
            selectedColor: const Color(0xFF10B981),
            checkmarkColor: Colors.white,
            backgroundColor: Colors.grey[100],
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(20),
              side: BorderSide(
                color: isSelected ? const Color(0xFF10B981) : Colors.grey[300]!,
              ),
            ),
            onSelected: (val) {
              final updated = List<String>.from(selected);
              if (val) {
                updated.add(opt);
              } else {
                updated.remove(opt);
              }
              onChanged(field.name, updated);
            },
          );
        }).toList(),
      ),
    );
  }
}

/// Owns its controller (B-22): the date field used to allocate a new
/// [TextEditingController] on every parent rebuild, i.e. on every keystroke
/// elsewhere in the form.
class _DateFieldInput extends StatefulWidget {
  final String label;
  final String? hint;
  final bool isRequired;
  final String? value;
  final ValueChanged<String> onPicked;

  const _DateFieldInput({
    required this.label,
    required this.hint,
    required this.isRequired,
    required this.value,
    required this.onPicked,
  });

  @override
  State<_DateFieldInput> createState() => _DateFieldInputState();
}

class _DateFieldInputState extends State<_DateFieldInput> {
  late final TextEditingController _controller;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: widget.value ?? '');
  }

  @override
  void didUpdateWidget(_DateFieldInput oldWidget) {
    super.didUpdateWidget(oldWidget);
    final value = widget.value ?? '';
    if (value != _controller.text) _controller.text = value;
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      readOnly: true,
      controller: _controller,
      decoration: _inputDecoration(widget.hint ?? 'Select date').copyWith(
        suffixIcon: const Icon(
          LucideIcons.calendar,
          size: 18,
          color: Colors.grey,
        ),
      ),
      validator: (val) {
        if (widget.isRequired && (val == null || val.isEmpty)) {
          return '${widget.label} is required';
        }
        return null;
      },
      onTap: () async {
        final picked = await showDatePicker(
          context: context,
          initialDate: DateTime.now(),
          firstDate: DateTime.now(),
          lastDate: DateTime.now().add(const Duration(days: 365)),
          builder: (context, child) {
            return Theme(
              data: Theme.of(context).copyWith(
                colorScheme: const ColorScheme.light(
                  primary: Color(0xFF10B981),
                ),
              ),
              child: child!,
            );
          },
        );
        if (picked != null) {
          widget.onPicked(DateFormat('yyyy-MM-dd').format(picked));
        }
      },
    );
  }
}

InputDecoration _inputDecoration(String? hint) {
  return InputDecoration(
    hintText: hint ?? 'Enter value',
    hintStyle: GoogleFonts.inter(color: Colors.grey[400], fontSize: 14),
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
