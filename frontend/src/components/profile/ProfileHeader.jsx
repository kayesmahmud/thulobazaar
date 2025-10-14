import PropTypes from 'prop-types';
import { styles, colors, spacing, borderRadius } from '../../styles/theme';
import { UPLOADS_BASE_URL } from '../../config/env.js';

function ProfileHeader({ profile, onAvatarClick, onCoverClick, uploadingAvatar, uploadingCover }) {
  const getAvatarUrl = () => {
    if (!profile?.avatar) return null;
    return `${UPLOADS_BASE_URL}/avatars/${profile.avatar}`;
  };

  const getCoverUrl = () => {
    if (!profile?.cover_photo) return null;
    return `${UPLOADS_BASE_URL}/covers/${profile.cover_photo}`;
  };

  return (
    <div style={{ position: 'relative', marginBottom: spacing['3xl'] }}>
      {/* Cover Photo */}
      <div
        onClick={onCoverClick}
        style={{
          position: 'relative',
          height: '280px',
          backgroundColor: colors.background.tertiary,
          borderRadius: borderRadius.lg,
          overflow: 'hidden',
          cursor: 'pointer',
          marginBottom: spacing.xl
        }}
      >
        {getCoverUrl() ? (
          <img
            src={getCoverUrl()}
            alt="Cover"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '48px',
            color: colors.text.muted
          }}>
            📷
          </div>
        )}

        {/* Cover Upload Overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0,
          transition: 'opacity 0.3s',
          ':hover': { opacity: 1 }
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
        onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
        >
          <span style={{ color: 'white', fontSize: '16px', fontWeight: 'bold' }}>
            {uploadingCover ? 'Uploading...' : getCoverUrl() ? 'Change Cover Photo' : 'Add Cover Photo'}
          </span>
        </div>
      </div>

      {/* Avatar */}
      <div style={{
        position: 'absolute',
        bottom: '-60px',
        left: spacing['3xl'],
        zIndex: 10
      }}>
        <div
          onClick={onAvatarClick}
          style={{
            position: 'relative',
            width: '160px',
            height: '160px',
            borderRadius: borderRadius.full,
            border: `6px solid ${colors.background.primary}`,
            backgroundColor: colors.secondary,
            overflow: 'hidden',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
          }}
        >
          {getAvatarUrl() ? (
            <img
              src={getAvatarUrl()}
              alt={profile?.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          ) : (
            <div style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '64px',
              color: colors.text.inverse,
              fontWeight: 'bold'
            }}>
              {profile?.name?.charAt(0).toUpperCase()}
            </div>
          )}

          {/* Avatar Upload Overlay */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0,
            transition: 'opacity 0.3s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
          onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
          >
            <span style={{ color: 'white', fontSize: '32px', marginBottom: spacing.xs }}>📷</span>
            <span style={{ color: 'white', fontSize: '12px', fontWeight: 'bold', textAlign: 'center' }}>
              {uploadingAvatar ? 'Uploading...' : getAvatarUrl() ? 'Change Photo' : 'Add Photo'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

ProfileHeader.propTypes = {
  profile: PropTypes.shape({
    avatar: PropTypes.string,
    cover_photo: PropTypes.string,
    name: PropTypes.string
  }),
  onAvatarClick: PropTypes.func.isRequired,
  onCoverClick: PropTypes.func.isRequired,
  uploadingAvatar: PropTypes.bool,
  uploadingCover: PropTypes.bool
};

export default ProfileHeader;
