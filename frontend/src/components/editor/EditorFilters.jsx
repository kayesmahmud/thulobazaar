import { styles, colors, spacing, typography } from '../../styles/theme';

function EditorFilters({
  type,
  filters,
  onFilterChange,
  selectedCount = 0,
  onBulkAction
}) {
  return (
    <div style={{
      ...styles.card.flat,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      display: 'flex',
      flexDirection: 'column',
      gap: spacing.md
    }}>
      {/* Filters Row */}
      <div style={{
        display: 'flex',
        gap: spacing.md,
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        {type === 'ads' && (
          <>
            <select
              value={filters.status}
              onChange={(e) => onFilterChange({ ...filters, status: e.target.value, page: 1 })}
              style={{
                ...styles.input.default,
                minWidth: '150px'
              }}
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>

            <input
              type="text"
              placeholder="Search ads..."
              value={filters.search}
              onChange={(e) => onFilterChange({ ...filters, search: e.target.value, page: 1 })}
              style={{
                ...styles.input.default,
                flex: 1,
                minWidth: '200px'
              }}
            />

            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.sm,
              fontSize: typography.fontSize.sm,
              color: colors.text.primary,
              cursor: 'pointer',
              userSelect: 'none'
            }}>
              <input
                type="checkbox"
                checked={filters.includeDeleted === 'true'}
                onChange={(e) => onFilterChange({ ...filters, includeDeleted: e.target.checked ? 'true' : 'false' })}
                style={{ cursor: 'pointer' }}
              />
              Include Deleted
            </label>
          </>
        )}

        {type === 'users' && (
          <>
            <select
              value={filters.status}
              onChange={(e) => onFilterChange({ ...filters, status: e.target.value, page: 1 })}
              style={{
                ...styles.input.default,
                minWidth: '150px'
              }}
            >
              <option value="all">All Users</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>

            <input
              type="text"
              placeholder="Search users..."
              value={filters.search}
              onChange={(e) => onFilterChange({ ...filters, search: e.target.value, page: 1 })}
              style={{
                ...styles.input.default,
                flex: 1,
                minWidth: '200px'
              }}
            />
          </>
        )}
      </div>

      {/* Bulk Actions Row (only for ads) */}
      {type === 'ads' && selectedCount > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing.md,
          padding: spacing.md,
          backgroundColor: colors.background.secondary,
          borderRadius: '8px'
        }}>
          <span style={{
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.semibold,
            color: colors.text.primary
          }}>
            {selectedCount} selected
          </span>
          <button
            onClick={() => onBulkAction('approve')}
            style={{
              ...styles.button.small,
              backgroundColor: colors.success,
              color: 'white',
              border: 'none'
            }}
          >
            Approve
          </button>
          <button
            onClick={() => onBulkAction('reject')}
            style={{
              ...styles.button.small,
              backgroundColor: colors.error,
              color: 'white',
              border: 'none'
            }}
          >
            Reject
          </button>
          <button
            onClick={() => onBulkAction('delete')}
            style={{
              ...styles.button.small,
              backgroundColor: '#64748b',
              color: 'white',
              border: 'none'
            }}
          >
            Delete
          </button>
          <button
            onClick={() => onBulkAction('restore')}
            style={{
              ...styles.button.small,
              backgroundColor: colors.secondary,
              color: 'white',
              border: 'none'
            }}
          >
            Restore
          </button>
        </div>
      )}
    </div>
  );
}

export default EditorFilters;
