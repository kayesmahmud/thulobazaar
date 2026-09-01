import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:mobile/core/theme/app_font.dart';

class ValidatedStepIndicator extends StatelessWidget {
  final int currentStep;
  final List<String> steps;

  const ValidatedStepIndicator({
    super.key,
    required this.currentStep,
    required this.steps,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      color: Colors.white,
      child: Row(
        children: List.generate(steps.length, (index) {
          final isActive = index == currentStep;
          final isCompleted = index < currentStep;

          return Expanded(
            child: Row(
              children: [
                Container(
                  width: 28,
                  height: 28,
                  decoration: BoxDecoration(
                    color: isActive || isCompleted
                        ? const Color(0xFF6366F1)
                        : Colors.grey[300],
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Center(
                    child: isCompleted
                        ? const Icon(
                            LucideIcons.check,
                            color: Colors.white,
                            size: 16,
                          )
                        : Text(
                            '${index + 1}',
                            style: AppFont.inter(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: isActive ? Colors.white : Colors.grey[600],
                            ),
                          ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    steps[index],
                    style: AppFont.inter(
                      fontSize: 12,
                      fontWeight: isActive
                          ? FontWeight.w600
                          : FontWeight.normal,
                      color: isActive
                          ? const Color(0xFF6366F1)
                          : Colors.grey[500],
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                if (index < steps.length - 1)
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 8),
                    child: Icon(
                      LucideIcons.chevronRight,
                      size: 16,
                      color: Colors.grey[400],
                    ),
                  ),
              ],
            ),
          );
        }),
      ),
    );
  }
}
