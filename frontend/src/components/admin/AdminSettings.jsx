import { styles, colors, spacing } from '../../styles/theme';

function AdminSettings() {
  return (
    <div>
      <h2 style={{
        ...styles.heading.h2,
        marginBottom: spacing.xl
      }}>
        Settings
      </h2>
      <div style={styles.card.default}>
        <p style={{ color: colors.text.secondary, marginBottom: spacing.lg }}>
          Settings panel coming soon. This will include:
        </p>
        <ul style={{
          color: colors.text.secondary,
          paddingLeft: spacing.xl,
          lineHeight: 1.8
        }}>
          <li>Category management</li>
          <li>Location management</li>
          <li>Site configuration</li>
          <li>Email templates</li>
          <li>Featured ad pricing</li>
        </ul>
      </div>
    </div>
  );
}

export default AdminSettings;
