import { useState } from 'react';
import PropTypes from 'prop-types';
import { colors, spacing, borderRadius, typography, shadows, transitions } from '../../styles/theme';

/**
 * CategorySelector - Enhanced category selection with icon grid
 * Displays categories as clickable cards with icons and selected state
 */
function CategorySelector({
  categories,
  selectedCategory,
  onSelect,
  showSubcategories = false
}) {
  const [hoveredCard, setHoveredCard] = useState(null);

  const getCategoryCardStyle = (categoryId) => {
    const isSelected = selectedCategory === categoryId;
    const isHovered = hoveredCard === categoryId;

    return {
      backgroundColor: isSelected ? colors.primaryLight : colors.background.primary,
      border: `2px solid ${isSelected ? colors.primary : colors.border.default}`,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      cursor: 'pointer',
      transition: transitions.normal,
      boxShadow: isHovered ? shadows.md : shadows.sm,
      transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: spacing.sm,
      textAlign: 'center',
      position: 'relative'
    };
  };

  const iconStyle = {
    fontSize: typography.fontSize['3xl'],
    marginBottom: spacing.xs
  };

  const categoryNameStyle = (isSelected) => ({
    fontSize: typography.fontSize.sm,
    fontWeight: isSelected ? typography.fontWeight.semibold : typography.fontWeight.medium,
    color: isSelected ? colors.primary : colors.text.primary,
    margin: 0
  });

  const selectedBadgeStyle = {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.primary,
    color: colors.text.inverse,
    borderRadius: borderRadius.full,
    width: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold
  };

  const handleCategoryClick = (categoryId) => {
    onSelect(categoryId);
  };

  return (
    <div>
      <label style={{
        display: 'block',
        marginBottom: spacing.lg,
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.primary
      }}>
        Select Category *
      </label>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        gap: spacing.md,
        marginBottom: spacing.xl
      }}>
        {categories.map((category) => {
          const isSelected = selectedCategory === category.id || selectedCategory === category.id.toString();

          return (
            <div
              key={category.id}
              style={getCategoryCardStyle(category.id)}
              onClick={() => handleCategoryClick(category.id)}
              onMouseEnter={() => setHoveredCard(category.id)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              {isSelected && (
                <div style={selectedBadgeStyle}>✓</div>
              )}

              <div style={iconStyle}>
                {category.icon || '📦'}
              </div>

              <div style={categoryNameStyle(isSelected)}>
                {category.name}
              </div>

              {category.subcategories && category.subcategories.length > 0 && (
                <div style={{
                  fontSize: typography.fontSize.xs,
                  color: colors.text.secondary,
                  marginTop: spacing.xs
                }}>
                  {category.subcategories.length} subcategories
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Subcategories Section (Optional) */}
      {showSubcategories && selectedCategory && (
        <div style={{
          marginTop: spacing.xl,
          padding: spacing.lg,
          backgroundColor: colors.background.secondary,
          borderRadius: borderRadius.md,
          border: `1px solid ${colors.border.default}`
        }}>
          <h4 style={{
            margin: `0 0 ${spacing.md} 0`,
            fontSize: typography.fontSize.base,
            fontWeight: typography.fontWeight.semibold,
            color: colors.text.primary
          }}>
            Subcategories
          </h4>

          {(() => {
            const selected = categories.find(
              cat => cat.id === selectedCategory || cat.id.toString() === selectedCategory
            );

            if (selected && selected.subcategories && selected.subcategories.length > 0) {
              return (
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: spacing.sm
                }}>
                  {selected.subcategories.map((subcat, index) => (
                    <div
                      key={index}
                      style={{
                        padding: `${spacing.xs} ${spacing.md}`,
                        backgroundColor: colors.background.primary,
                        border: `1px solid ${colors.border.default}`,
                        borderRadius: borderRadius.md,
                        fontSize: typography.fontSize.sm,
                        color: colors.text.secondary,
                        cursor: 'pointer',
                        transition: transitions.fast
                      }}
                    >
                      {subcat}
                    </div>
                  ))}
                </div>
              );
            }

            return (
              <div style={{
                fontSize: typography.fontSize.sm,
                color: colors.text.secondary
              }}>
                No subcategories available for this category
              </div>
            );
          })()}
        </div>
      )}

      {/* Helper Text */}
      {!selectedCategory && (
        <div style={{
          fontSize: typography.fontSize.sm,
          color: colors.text.secondary,
          marginTop: spacing.md,
          textAlign: 'center'
        }}>
          Please select a category for your ad
        </div>
      )}
    </div>
  );
}

CategorySelector.propTypes = {
  categories: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    icon: PropTypes.string,
    subcategories: PropTypes.arrayOf(PropTypes.string)
  })).isRequired,
  selectedCategory: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.string
  ]),
  onSelect: PropTypes.func.isRequired,
  showSubcategories: PropTypes.bool
};

export default CategorySelector;
