import { colors, spacing, borderRadius, typography } from '../../styles/theme';

function FormActions({ onSubmit, onCancel, loading, disabled }) {
  return (
    <div style={{
      display: 'flex',
      gap: spacing[3],
      justifyContent: 'center'
    }}>
      <button
        type="button"
        onClick={onCancel}
        disabled={loading}
        style={{
          backgroundColor: 'transparent',
          color: colors.text.secondary,
          border: `2px solid ${colors.border.default}`,
          padding: `${spacing[4]} ${spacing[8]}`,
          borderRadius: borderRadius.md,
          fontSize: typography.fontSize.base,
          fontWeight: typography.fontWeight.bold,
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.6 : 1,
          fontFamily: typography.fontFamily.base
        }}
      >
        Cancel
      </button>

      <button
        type="submit"
        onClick={onSubmit}
        disabled={loading || disabled}
        style={{
          backgroundColor: (loading || disabled) ? colors.gray400 : colors.primary,
          color: colors.text.inverse,
          border: 'none',
          padding: `${spacing[4]} ${spacing[8]}`,
          borderRadius: borderRadius.md,
          fontSize: typography.fontSize.base,
          fontWeight: typography.fontWeight.bold,
          cursor: (loading || disabled) ? 'not-allowed' : 'pointer',
          fontFamily: typography.fontFamily.base
        }}
      >
        {loading ? 'Updating...' : 'Save Changes'}
      </button>
    </div>
  );
}

export default FormActions;
