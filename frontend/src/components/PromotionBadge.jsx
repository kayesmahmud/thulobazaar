import React from 'react';
import { Star, Flame, TrendingUp } from 'lucide-react';
import '../styles/PromotionBadge.css';

const PromotionBadge = ({ type, size = 'medium', showLabel = true }) => {
  const badges = {
    featured: {
      icon: <Star className="badge-icon" fill="#FFD700" />,
      label: 'Featured',
      color: '#FFD700',
      bgColor: 'rgba(255, 215, 0, 0.1)',
      borderColor: '#FFD700'
    },
    urgent: {
      icon: <Flame className="badge-icon" />,
      label: 'Urgent',
      color: '#FF4500',
      bgColor: 'rgba(255, 69, 0, 0.1)',
      borderColor: '#FF4500'
    },
    bump_up: {
      icon: <TrendingUp className="badge-icon" />,
      label: 'Bump Up',
      color: '#32CD32',
      bgColor: 'rgba(50, 205, 50, 0.1)',
      borderColor: '#32CD32'
    }
  };

  if (!type || !badges[type]) return null;

  const badge = badges[type];

  return (
    <div
      className={`promotion-badge ${size} ${!showLabel ? 'icon-only' : ''}`}
      style={{
        '--badge-color': badge.color,
        '--badge-bg': badge.bgColor,
        '--badge-border': badge.borderColor
      }}
    >
      {badge.icon}
      {showLabel && <span className="badge-label">{badge.label}</span>}
    </div>
  );
};

export default PromotionBadge;
