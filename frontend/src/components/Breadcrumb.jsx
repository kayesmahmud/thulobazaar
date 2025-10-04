import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';

function Breadcrumb({ items = [], style = {} }) {
  const navigate = useNavigate();

  const defaultStyle = {
    padding: '20px',
    backgroundColor: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
    ...style
  };

  const containerStyle = {
    maxWidth: '1200px',
    margin: '0 auto'
  };

  const breadcrumbStyle = {
    fontSize: '14px',
    color: '#64748b'
  };

  const linkStyle = {
    color: '#3b82f6',
    textDecoration: 'none',
    cursor: 'pointer'
  };

  const separatorStyle = {
    margin: '0 8px',
    color: '#94a3b8'
  };

  const currentStyle = {
    color: '#1e293b',
    fontWeight: '500'
  };

  const handleItemClick = (item) => {
    if (item.path && !item.current) {
      navigate(item.path);
    }
  };

  return (
    <div style={defaultStyle}>
      <div style={containerStyle}>
        <nav style={breadcrumbStyle}>
          {items.map((item, index) => (
            <span key={index}>
              {index > 0 && <span style={separatorStyle}>›</span>}
              {item.current ? (
                <span style={currentStyle}>{item.label}</span>
              ) : (
                <span
                  style={linkStyle}
                  onClick={() => handleItemClick(item)}
                  onMouseEnter={(e) => {
                    if (!item.current) {
                      e.target.style.textDecoration = 'underline';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!item.current) {
                      e.target.style.textDecoration = 'none';
                    }
                  }}
                >
                  {item.label}
                </span>
              )}
            </span>
          ))}
        </nav>
      </div>
    </div>
  );
}

Breadcrumb.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      path: PropTypes.string,
      current: PropTypes.bool
    })
  ),
  style: PropTypes.object
};

Breadcrumb.defaultProps = {
  items: [],
  style: {}
};

export default Breadcrumb;