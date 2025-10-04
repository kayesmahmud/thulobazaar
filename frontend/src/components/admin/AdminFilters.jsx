import { styles, colors, spacing, typography } from '../../styles/theme';

function AdminFilters({ selectedStatus, onStatusChange }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.xl
    }}>
      <h2 style={{
        ...styles.heading.h2,
        margin: 0
      }}>
        Ads Management
      </h2>
      <select
        value={selectedStatus}
        onChange={(e) => onStatusChange(e.target.value)}
        style={{
          ...styles.input.default,
          minWidth: '180px'
        }}
      >
        <option value="all">All Ads</option>
        <option value="pending">Pending Review</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
      </select>
    </div>
  );
}

export default AdminFilters;
