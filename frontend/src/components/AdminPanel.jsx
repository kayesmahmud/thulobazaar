import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../services/api';
import { generateAdUrl } from '../utils/urlUtils';

function AdminPanel() {
  const navigate = useNavigate();

  // Admin-specific state (separate from regular user auth)
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState('');

  // Dashboard data
  const [stats, setStats] = useState({});
  const [ads, setAds] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedAdStatus, setSelectedAdStatus] = useState('all');

  // Promotion pricing state
  const [pricing, setPricing] = useState([]);
  const [editingPriceId, setEditingPriceId] = useState(null);
  const [editingPrice, setEditingPrice] = useState('');
  const [editingDiscount, setEditingDiscount] = useState('');

  // Check admin authentication on mount
  useEffect(() => {
    const editorToken = localStorage.getItem('editorToken');
    const editorData = localStorage.getItem('editorData');

    if (!editorToken || !editorData) {
      navigate('/admin');
      return;
    }

    try {
      const userData = JSON.parse(editorData);
      if (userData.role !== 'super_admin') {
        alert('Access denied. Super Admin privileges required.');
        navigate('/admin');
        return;
      }
      setUser(userData);
      setIsAuthenticated(true);
    } catch (err) {
      console.error('Error parsing admin data:', err);
      navigate('/admin');
    }
  }, [navigate]);

  // Load initial data after authentication
  useEffect(() => {
    if (isAuthenticated && user) {
      loadDashboardData();
    }
  }, [isAuthenticated, user]);

  const loadDashboardData = async () => {
    try {
      setDataLoading(true);
      const [statsData, adsData, usersData] = await Promise.all([
        ApiService.getAdminStats(),
        ApiService.getAdminAds(),
        ApiService.getAdminUsers()
      ]);

      setStats(statsData);
      setAds(adsData);
      setUsers(usersData);
    } catch (err) {
      console.error('❌ Error loading admin data:', err);
      setError('Failed to load admin data. You may not have admin privileges.');
    } finally {
      setDataLoading(false);
    }
  };

  const loadPricingData = async () => {
    try {
      const pricingData = await ApiService.getAllPromotionPricing();
      setPricing(pricingData);
    } catch (err) {
      console.error('❌ Error loading pricing data:', err);
      setError('Failed to load pricing data.');
    }
  };

  const handlePriceEdit = (priceId, currentPrice, currentDiscount) => {
    setEditingPriceId(priceId);
    setEditingPrice(currentPrice.toString());
    setEditingDiscount(currentDiscount.toString());
  };

  const handlePriceSave = async (priceId) => {
    try {
      const newPrice = parseFloat(editingPrice);
      const newDiscount = parseFloat(editingDiscount);

      if (isNaN(newPrice) || newPrice < 0) {
        setError('Please enter a valid price');
        return;
      }

      if (isNaN(newDiscount) || newDiscount < 0 || newDiscount > 100) {
        setError('Please enter a valid discount percentage (0-100)');
        return;
      }

      await ApiService.updatePromotionPrice(priceId, newPrice, newDiscount);

      // Refresh pricing data
      await loadPricingData();

      setEditingPriceId(null);
      setEditingPrice('');
      setEditingDiscount('');
      setError('');
    } catch (err) {
      console.error('❌ Error updating price:', err);
      setError('Failed to update price');
    }
  };

  const handlePriceCancel = () => {
    setEditingPriceId(null);
    setEditingPrice('');
    setEditingDiscount('');
  };

  const getPromotionTypeLabel = (type) => {
    const labels = {
      'featured': '🌟 Featured',
      'urgent': '🔥 Urgent',
      'bump_up': '📈 Bump Up',
      'sticky': '📈 Sticky'
    };
    return labels[type] || type;
  };

  const handleAdStatusChange = async (adId, status, reason = '') => {
    try {
      await ApiService.updateAdStatus(adId, status, reason);

      // Refresh ads list
      const adsData = await ApiService.getAdminAds(selectedAdStatus);
      setAds(adsData);

      // Refresh stats
      const statsData = await ApiService.getAdminStats();
      setStats(statsData);
    } catch (err) {
      console.error('❌ Error updating ad status:', err);
      setError('Failed to update ad status');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-NP', {
      style: 'currency',
      currency: 'NPR',
      minimumFractionDigits: 0
    }).format(price);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return '#10b981';
      case 'rejected': return '#ef4444';
      case 'pending': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  if (dataLoading && !user) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px'
      }}>
        🔄 Checking authentication...
      </div>
    );
  }

  if (dataLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px'
      }}>
        🔄 Loading admin panel...
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <header style={{
        backgroundColor: '#1e293b',
        color: 'white',
        padding: '1rem 0'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h1 style={{ margin: 0, fontSize: '24px' }}>
            🛠️ Thulobazaar Admin Panel
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span>Welcome, {user?.fullName} (Admin)</span>
            <button
              onClick={() => navigate('/en')}
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Back to Site
            </button>
            <button
              onClick={() => {
                // Admin logout - clear editor tokens (admin uses same tokens as editor)
                localStorage.removeItem('editorToken');
                localStorage.removeItem('editorData');
                navigate('/admin');
              }}
              style={{
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Error Message */}
      {error && (
        <div style={{
          backgroundColor: '#fee2e2',
          border: '1px solid #fecaca',
          color: '#dc2626',
          padding: '12px 20px',
          maxWidth: '1200px',
          margin: '20px auto'
        }}>
          {error}
          <button
            onClick={() => setError('')}
            style={{
              float: 'right',
              background: 'none',
              border: 'none',
              color: '#dc2626',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Content */}
      <div style={{
        maxWidth: '1200px',
        margin: '40px auto',
        padding: '0 20px'
      }}>
        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #e2e8f0',
          marginBottom: '32px'
        }}>
          {[
            { id: 'dashboard', label: '📊 Dashboard', count: '' },
            { id: 'ads', label: '📝 Ads Management', count: `(${stats.totalAds || 0})` },
            { id: 'users', label: '👥 Users', count: `(${stats.totalUsers || 0})` },
            { id: 'settings', label: '⚙️ Settings', count: '' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 24px',
                border: 'none',
                backgroundColor: 'transparent',
                borderBottom: activeTab === tab.id ? '2px solid #dc1e4a' : '2px solid transparent',
                color: activeTab === tab.id ? '#dc1e4a' : '#64748b',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              {tab.label} {tab.count}
            </button>
          ))}
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div>
            {/* Stats Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '20px',
              marginBottom: '32px'
            }}>
              <div style={{
                backgroundColor: 'white',
                padding: '24px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#dc1e4a', marginBottom: '8px' }}>
                  {stats.totalAds || 0}
                </div>
                <div style={{ color: '#64748b', fontSize: '14px' }}>Total Ads</div>
              </div>

              <div style={{
                backgroundColor: 'white',
                padding: '24px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#f59e0b', marginBottom: '8px' }}>
                  {stats.pendingAds || 0}
                </div>
                <div style={{ color: '#64748b', fontSize: '14px' }}>Pending Review</div>
              </div>

              <div style={{
                backgroundColor: 'white',
                padding: '24px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#3b82f6', marginBottom: '8px' }}>
                  {stats.totalUsers || 0}
                </div>
                <div style={{ color: '#64748b', fontSize: '14px' }}>Total Users</div>
              </div>

              <div style={{
                backgroundColor: 'white',
                padding: '24px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#10b981', marginBottom: '8px' }}>
                  {stats.totalViews || 0}
                </div>
                <div style={{ color: '#64748b', fontSize: '14px' }}>Total Views</div>
              </div>

              <div style={{
                backgroundColor: 'white',
                padding: '24px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#8b5cf6', marginBottom: '8px' }}>
                  {stats.todayAds || 0}
                </div>
                <div style={{ color: '#64748b', fontSize: '14px' }}>Today's Ads</div>
              </div>
            </div>

            {/* Top Categories */}
            {stats.topCategories && stats.topCategories.length > 0 && (
              <div style={{
                backgroundColor: 'white',
                padding: '24px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0'
              }}>
                <h3 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>Top Categories</h3>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {stats.topCategories.map((category, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 0'
                    }}>
                      <span style={{ color: '#374151' }}>{category.name}</span>
                      <span style={{
                        backgroundColor: '#f3f4f6',
                        color: '#6b7280',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '14px'
                      }}>
                        {category.count} ads
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Ads Management Tab */}
        {activeTab === 'ads' && (
          <div>
            {/* Filter Controls */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <h2 style={{ margin: 0, color: '#1e293b' }}>Ads Management</h2>
              <select
                value={selectedAdStatus}
                onChange={async (e) => {
                  setSelectedAdStatus(e.target.value);
                  const adsData = await ApiService.getAdminAds(e.target.value);
                  setAds(adsData);
                }}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db'
                }}
              >
                <option value="all">All Ads</option>
                <option value="pending">Pending Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Ads List */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              overflow: 'hidden'
            }}>
              {ads.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                  No ads found
                </div>
              ) : (
                <div>
                  {ads.map((ad) => (
                    <div key={ad.id} style={{
                      padding: '20px',
                      borderBottom: '1px solid #f3f4f6',
                      display: 'grid',
                      gridTemplateColumns: '80px 1fr auto',
                      gap: '16px',
                      alignItems: 'center'
                    }}>
                      {/* Ad Image */}
                      <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        backgroundColor: '#f1f5f9'
                      }}>
                        {ad.primary_image ? (
                          <img
                            src={`http://localhost:5000/uploads/ads/${ad.primary_image}`}
                            alt={ad.title}
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
                            fontSize: '24px'
                          }}>
                            {ad.category_icon || '📦'}
                          </div>
                        )}
                      </div>

                      {/* Ad Details */}
                      <div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: '4px'
                        }}>
                          <h4 style={{ margin: 0, color: '#1e293b' }}>{ad.title}</h4>
                          <span style={{
                            backgroundColor: getStatusColor(ad.status),
                            color: 'white',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            textTransform: 'uppercase'
                          }}>
                            {ad.status}
                          </span>
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#dc1e4a', marginBottom: '4px' }}>
                          {formatPrice(ad.price)}
                        </div>
                        <div style={{ fontSize: '14px', color: '#64748b' }}>
                          📍 {ad.location_name} • 🕒 {formatDate(ad.created_at)}
                        </div>
                        <div style={{ fontSize: '14px', color: '#64748b' }}>
                          📧 {ad.user_email} • 📞 {ad.seller_phone}
                        </div>
                        {ad.status_reason && (
                          <div style={{
                            fontSize: '12px',
                            color: '#ef4444',
                            marginTop: '4px',
                            fontStyle: 'italic'
                          }}>
                            Reason: {ad.status_reason}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <button
                          onClick={() => navigate(`/en${generateAdUrl(ad)}`)}
                          style={{
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          View
                        </button>

                        {ad.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleAdStatusChange(ad.id, 'approved')}
                              style={{
                                backgroundColor: '#10b981',
                                color: 'white',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                cursor: 'pointer'
                              }}
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                const reason = prompt('Rejection reason (optional):');
                                handleAdStatusChange(ad.id, 'rejected', reason || '');
                              }}
                              style={{
                                backgroundColor: '#ef4444',
                                color: 'white',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                cursor: 'pointer'
                              }}
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {ad.status !== 'pending' && (
                          <button
                            onClick={() => handleAdStatusChange(ad.id, 'pending')}
                            style={{
                              backgroundColor: '#f59e0b',
                              color: 'white',
                              border: 'none',
                              padding: '6px 12px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                          >
                            Reset to Pending
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div>
            <h2 style={{ margin: '0 0 24px 0', color: '#1e293b' }}>User Management</h2>

            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              overflow: 'hidden'
            }}>
              {users.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                  No users found
                </div>
              ) : (
                <div>
                  {users.map((user) => (
                    <div key={user.id} style={{
                      padding: '20px',
                      borderBottom: '1px solid #f3f4f6',
                      display: 'grid',
                      gridTemplateColumns: '1fr auto',
                      gap: '16px',
                      alignItems: 'center'
                    }}>
                      <div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: '4px'
                        }}>
                          <h4 style={{ margin: 0, color: '#1e293b' }}>{user.full_name}</h4>
                          {!user.is_active && (
                            <span style={{
                              backgroundColor: '#ef4444',
                              color: 'white',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '10px',
                              fontWeight: 'bold'
                            }}>
                              INACTIVE
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '4px' }}>
                          📧 {user.email} • 📞 {user.phone || 'No phone'}
                        </div>
                        <div style={{ fontSize: '14px', color: '#64748b' }}>
                          📍 {user.location_name || 'No location'} • 🕒 Joined {formatDate(user.created_at)}
                        </div>
                        <div style={{ fontSize: '14px', color: '#64748b' }}>
                          📝 {user.total_ads} total ads • ✅ {user.approved_ads} approved
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <button
                          style={{
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          View Ads
                        </button>
                        <button
                          style={{
                            backgroundColor: user.is_active ? '#ef4444' : '#10b981',
                            color: 'white',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          {user.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div>
            <h2 style={{ margin: '0 0 24px 0', color: '#1e293b' }}>Promotion Pricing Management</h2>

            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              overflow: 'hidden'
            }}>
              {/* Load pricing button */}
              {pricing.length === 0 && (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                  <button
                    onClick={loadPricingData}
                    style={{
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      padding: '12px 24px',
                      borderRadius: '6px',
                      fontSize: '16px',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    Load Pricing Data
                  </button>
                </div>
              )}

              {/* Pricing table */}
              {pricing.length > 0 && (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse'
                  }}>
                    <thead>
                      <tr style={{
                        backgroundColor: '#f8fafc',
                        borderBottom: '2px solid #e2e8f0'
                      }}>
                        <th style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '14px' }}>
                          Promotion Type
                        </th>
                        <th style={{ padding: '12px 16px', textAlign: 'center', color: '#64748b', fontWeight: '600', fontSize: '14px' }}>
                          Duration
                        </th>
                        <th style={{ padding: '12px 16px', textAlign: 'center', color: '#64748b', fontWeight: '600', fontSize: '14px' }}>
                          Account Type
                        </th>
                        <th style={{ padding: '12px 16px', textAlign: 'right', color: '#64748b', fontWeight: '600', fontSize: '14px' }}>
                          Price (रू)
                        </th>
                        <th style={{ padding: '12px 16px', textAlign: 'center', color: '#64748b', fontWeight: '600', fontSize: '14px' }}>
                          Discount %
                        </th>
                        <th style={{ padding: '12px 16px', textAlign: 'center', color: '#64748b', fontWeight: '600', fontSize: '14px' }}>
                          Status
                        </th>
                        <th style={{ padding: '12px 16px', textAlign: 'center', color: '#64748b', fontWeight: '600', fontSize: '14px' }}>
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {pricing.map((price) => (
                        <tr key={price.id} style={{
                          borderBottom: '1px solid #f3f4f6',
                          backgroundColor: editingPriceId === price.id ? '#fef3c7' : 'transparent'
                        }}>
                          <td style={{ padding: '16px', color: '#1e293b' }}>
                            {getPromotionTypeLabel(price.promotion_type)}
                          </td>
                          <td style={{ padding: '16px', textAlign: 'center', color: '#64748b' }}>
                            {price.duration_days} days
                          </td>
                          <td style={{ padding: '16px', textAlign: 'center' }}>
                            <span style={{
                              backgroundColor: price.account_type === 'business' ? '#dbeafe' : '#fef3c7',
                              color: price.account_type === 'business' ? '#1e40af' : '#92400e',
                              padding: '4px 8px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: '600',
                              textTransform: 'capitalize'
                            }}>
                              {price.account_type}
                            </span>
                          </td>
                          <td style={{ padding: '16px', textAlign: 'right' }}>
                            {editingPriceId === price.id ? (
                              <input
                                type="number"
                                value={editingPrice}
                                onChange={(e) => setEditingPrice(e.target.value)}
                                style={{
                                  width: '100px',
                                  padding: '6px 8px',
                                  border: '2px solid #3b82f6',
                                  borderRadius: '4px',
                                  fontSize: '14px',
                                  textAlign: 'right'
                                }}
                                autoFocus
                                placeholder="Price"
                              />
                            ) : (
                              <span style={{ fontWeight: '600', color: '#dc1e4a' }}>
                                रू {parseFloat(price.price).toLocaleString('en-NP')}
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '16px', textAlign: 'center' }}>
                            {editingPriceId === price.id ? (
                              <input
                                type="number"
                                value={editingDiscount}
                                onChange={(e) => setEditingDiscount(e.target.value)}
                                min="0"
                                max="100"
                                style={{
                                  width: '60px',
                                  padding: '6px 8px',
                                  border: '2px solid #3b82f6',
                                  borderRadius: '4px',
                                  fontSize: '14px',
                                  textAlign: 'center'
                                }}
                                placeholder="%"
                              />
                            ) : (
                              <span style={{ color: '#64748b' }}>
                                {price.discount_percentage || 0}%
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '16px', textAlign: 'center' }}>
                            <span style={{
                              backgroundColor: price.is_active ? '#dcfce7' : '#fee2e2',
                              color: price.is_active ? '#166534' : '#991b1b',
                              padding: '4px 8px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: '600'
                            }}>
                              {price.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td style={{ padding: '16px', textAlign: 'center' }}>
                            {editingPriceId === price.id ? (
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                <button
                                  onClick={() => handlePriceSave(price.id)}
                                  style={{
                                    backgroundColor: '#10b981',
                                    color: 'white',
                                    border: 'none',
                                    padding: '6px 12px',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                    fontWeight: '600'
                                  }}
                                >
                                  Save
                                </button>
                                <button
                                  onClick={handlePriceCancel}
                                  style={{
                                    backgroundColor: '#6b7280',
                                    color: 'white',
                                    border: 'none',
                                    padding: '6px 12px',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                    fontWeight: '600'
                                  }}
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handlePriceEdit(price.id, price.price, price.discount_percentage || 0)}
                                style={{
                                  backgroundColor: '#3b82f6',
                                  color: 'white',
                                  border: 'none',
                                  padding: '6px 12px',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  cursor: 'pointer',
                                  fontWeight: '600'
                                }}
                              >
                                Edit
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Refresh button */}
              {pricing.length > 0 && (
                <div style={{
                  padding: '16px',
                  backgroundColor: '#f8fafc',
                  borderTop: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ color: '#64748b', fontSize: '14px' }}>
                    Total: {pricing.length} pricing entries
                  </span>
                  <button
                    onClick={loadPricingData}
                    style={{
                      backgroundColor: '#f3f4f6',
                      color: '#374151',
                      border: '1px solid #d1d5db',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      fontSize: '14px',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    🔄 Refresh Data
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;