import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ApiService from '../services/api';
import ErrorMessage from './ErrorMessage';
import SimpleHeader from './SimpleHeader';

function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('my-ads');
  const [userAds, setUserAds] = useState([]);
  const [contactMessages, setContactMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, adId: null, adTitle: '' });
  const [replyModal, setReplyModal] = useState({ isOpen: false, messageId: null, buyerName: '', adTitle: '' });
  const [replyMessage, setReplyMessage] = useState('');
  const [replyError, setReplyError] = useState(null);

  useEffect(() => {
    // Redirect if not authenticated
    if (!isAuthenticated) {
      navigate('/');
      return;
    }

    // Load user's data
    loadUserData();
  }, [isAuthenticated, navigate]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const [ads, receivedMessages] = await Promise.all([
        ApiService.getUserAds(),
        ApiService.getContactMessages('received')
      ]);
      setUserAds(ads);
      setContactMessages(receivedMessages);
      console.log('✅ User data loaded:', { ads, receivedMessages });
    } catch (err) {
      console.error('❌ Error loading user data:', err);
      setError('Failed to load your data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAd = async (adId) => {
    try {
      await ApiService.deleteAd(adId);
      console.log('✅ Ad deleted:', adId);

      // Remove from local state
      setUserAds(prev => prev.filter(ad => ad.id !== adId));
      setDeleteModal({ isOpen: false, adId: null, adTitle: '' });
    } catch (err) {
      console.error('❌ Error deleting ad:', err);
      setError('Failed to delete ad. Please try again.');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-NP', {
      style: 'currency',
      currency: 'NPR',
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getAdStats = () => {
    const totalAds = userAds.length;
    const totalViews = userAds.reduce((sum, ad) => sum + (ad.view_count || 0), 0);
    const featuredAds = userAds.filter(ad => ad.is_featured).length;

    return { totalAds, totalViews, featuredAds };
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    setReplyError(null);

    try {
      const result = await ApiService.replyToMessage(replyModal.messageId, replyMessage);

      console.log('✅ Reply sent successfully:', result);
      setReplyModal({ isOpen: false, messageId: null, buyerName: '', adTitle: '' });
      setReplyMessage('');

      // Refresh messages to show the reply
      loadUserData();
    } catch (error) {
      console.error('❌ Error sending reply:', error);
      setReplyError(error); // Store the full error object for structured display
    }
  };

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  const stats = getAdStats();

  return (
    <div>
      {/* Header */}
      <SimpleHeader showUserWelcome={true} />

      {/* Dashboard Content */}
      <div className="dashboard-container" style={{
        maxWidth: '1200px',
        margin: '40px auto',
        padding: '0 20px'
      }}>
        {/* Dashboard Header */}
        <div className="dashboard-header" style={{ marginBottom: '32px' }}>
          <h1 style={{
            margin: '0 0 8px 0',
            color: '#1e293b',
            fontSize: '28px',
            fontWeight: 'bold'
          }}>
            My Dashboard
          </h1>
          <p style={{
            margin: 0,
            color: '#64748b',
            fontSize: '16px'
          }}>
            Manage your ads and account settings
          </p>
        </div>

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
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#dc1e4a', marginBottom: '8px' }}>
              {stats.totalAds}
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
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#3b82f6', marginBottom: '8px' }}>
              {stats.totalViews}
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
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f59e0b', marginBottom: '8px' }}>
              {stats.featuredAds}
            </div>
            <div style={{ color: '#64748b', fontSize: '14px' }}>Featured Ads</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          overflow: 'hidden'
        }}>
          <div style={{
            display: 'flex',
            borderBottom: '1px solid #e2e8f0'
          }}>
            <button
              onClick={() => setActiveTab('my-ads')}
              style={{
                flex: 1,
                padding: '16px 24px',
                border: 'none',
                backgroundColor: activeTab === 'my-ads' ? '#f8fafc' : 'white',
                borderBottom: activeTab === 'my-ads' ? '2px solid #dc1e4a' : '2px solid transparent',
                color: activeTab === 'my-ads' ? '#dc1e4a' : '#64748b',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              My Ads ({userAds.length})
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              style={{
                flex: 1,
                padding: '16px 24px',
                border: 'none',
                backgroundColor: activeTab === 'messages' ? '#f8fafc' : 'white',
                borderBottom: activeTab === 'messages' ? '2px solid #dc1e4a' : '2px solid transparent',
                color: activeTab === 'messages' ? '#dc1e4a' : '#64748b',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Messages ({contactMessages.length})
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              style={{
                flex: 1,
                padding: '16px 24px',
                border: 'none',
                backgroundColor: activeTab === 'profile' ? '#f8fafc' : 'white',
                borderBottom: activeTab === 'profile' ? '2px solid #dc1e4a' : '2px solid transparent',
                color: activeTab === 'profile' ? '#dc1e4a' : '#64748b',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Profile
            </button>
          </div>

          {/* Tab Content */}
          <div style={{ padding: '24px' }}>
            {activeTab === 'my-ads' && (
              <div>
                {error && (
                  <div style={{
                    backgroundColor: '#fee2e2',
                    border: '1px solid #fecaca',
                    color: '#dc2626',
                    padding: '12px',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    fontSize: '14px'
                  }}>
                    {error}
                  </div>
                )}

                {loading ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    🔄 Loading your ads...
                  </div>
                ) : userAds.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
                    <h3 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>No ads yet</h3>
                    <p style={{ margin: '0 0 24px 0', color: '#64748b' }}>
                      Start by posting your first ad to reach potential buyers
                    </p>
                    <button
                      onClick={() => navigate('/post-ad')}
                      style={{
                        backgroundColor: '#dc1e4a',
                        color: 'white',
                        border: 'none',
                        padding: '12px 24px',
                        borderRadius: '8px',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      Post Your First Ad
                    </button>
                  </div>
                ) : (
                  <div style={{
                    display: 'grid',
                    gap: '16px'
                  }}>
                    {userAds.map((ad) => (
                      <div key={ad.id} className="dashboard-ad-item" style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr auto',
                        gap: '16px',
                        padding: '20px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        alignItems: 'center'
                      }}>
                        <div className="dashboard-ad-content" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                          <div style={{
                            width: '80px',
                            height: '80px',
                            backgroundColor: '#f1f5f9',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '24px'
                          }}>
                            {ad.category_icon || '📦'}
                          </div>

                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                              <h3 style={{
                                margin: 0,
                                color: '#1e293b',
                                fontSize: '18px',
                                fontWeight: '600'
                              }}>
                                {ad.title}
                              </h3>
                              {ad.is_featured && (
                                <span style={{
                                  backgroundColor: '#f59e0b',
                                  color: 'white',
                                  padding: '2px 8px',
                                  borderRadius: '12px',
                                  fontSize: '10px',
                                  fontWeight: 'bold'
                                }}>
                                  FEATURED
                                </span>
                              )}
                            </div>

                            <div style={{ marginBottom: '8px' }}>
                              <span style={{ color: '#dc1e4a', fontSize: '20px', fontWeight: 'bold' }}>
                                {formatPrice(ad.price)}
                              </span>
                            </div>

                            <div style={{ fontSize: '14px', color: '#64748b' }}>
                              <span>📍 {ad.location_name}</span>
                              <span style={{ margin: '0 12px' }}>•</span>
                              <span>📅 {formatDate(ad.created_at)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="dashboard-ad-actions" style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => navigate(`/ad/${ad.id}`)}
                            style={{
                              backgroundColor: 'transparent',
                              border: '1px solid #3b82f6',
                              color: '#3b82f6',
                              padding: '8px 16px',
                              borderRadius: '6px',
                              fontSize: '14px',
                              cursor: 'pointer'
                            }}
                          >
                            View
                          </button>

                          <button
                            onClick={() => navigate(`/edit-ad/${ad.id}`)}
                            style={{
                              backgroundColor: 'transparent',
                              border: '1px solid #64748b',
                              color: '#64748b',
                              padding: '8px 16px',
                              borderRadius: '6px',
                              fontSize: '14px',
                              cursor: 'pointer'
                            }}
                          >
                            Edit
                          </button>

                          <button
                            onClick={() => setDeleteModal({
                              isOpen: true,
                              adId: ad.id,
                              adTitle: ad.title
                            })}
                            style={{
                              backgroundColor: 'transparent',
                              border: '1px solid #dc2626',
                              color: '#dc2626',
                              padding: '8px 16px',
                              borderRadius: '6px',
                              fontSize: '14px',
                              cursor: 'pointer'
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'messages' && (
              <div>
                <h3 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>Contact Messages</h3>

                {loading ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    🔄 Loading messages...
                  </div>
                ) : contactMessages.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📬</div>
                    <h3 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>No messages yet</h3>
                    <p style={{ margin: 0, color: '#64748b' }}>
                      When people contact you about your ads, their messages will appear here.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {contactMessages.map((message) => (
                      <div
                        key={message.id}
                        style={{
                          backgroundColor: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '12px',
                          padding: '20px'
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: '12px'
                        }}>
                          <div>
                            <h4 style={{
                              margin: '0 0 4px 0',
                              color: '#1e293b',
                              fontSize: '16px',
                              fontWeight: '600'
                            }}>
                              Message about: {message.ad_title}
                            </h4>
                            <div style={{
                              color: '#64748b',
                              fontSize: '14px'
                            }}>
                              From: <strong>{message.buyer_name}</strong> ({message.buyer_email})
                              {message.buyer_phone && (
                                <span> • Phone: {message.buyer_phone}</span>
                              )}
                            </div>
                          </div>
                          <div style={{
                            color: '#94a3b8',
                            fontSize: '12px'
                          }}>
                            {new Date(message.created_at).toLocaleDateString()}
                          </div>
                        </div>

                        <div style={{
                          backgroundColor: 'white',
                          padding: '16px',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0'
                        }}>
                          <p style={{
                            margin: 0,
                            color: '#374151',
                            lineHeight: '1.5'
                          }}>
                            {message.message}
                          </p>
                        </div>

                        <div style={{
                          marginTop: '12px',
                          display: 'flex',
                          gap: '8px'
                        }}>
                          <button
                            onClick={() => setReplyModal({
                              isOpen: true,
                              messageId: message.id,
                              buyerName: message.buyer_name,
                              adTitle: message.ad_title
                            })}
                            style={{
                              backgroundColor: '#dc1e4a',
                              color: 'white',
                              border: 'none',
                              padding: '8px 16px',
                              borderRadius: '6px',
                              fontSize: '14px',
                              cursor: 'pointer',
                              fontWeight: '500'
                            }}
                          >
                            💬 Reply
                          </button>
                          <button
                            onClick={() => window.location.href = `mailto:${message.buyer_email}?subject=Re: ${message.ad_title}&body=Hi ${message.buyer_name},%0A%0AThank you for your interest in my ad "${message.ad_title}".%0A%0A`}
                            style={{
                              backgroundColor: '#3b82f6',
                              color: 'white',
                              border: 'none',
                              padding: '8px 16px',
                              borderRadius: '6px',
                              fontSize: '14px',
                              cursor: 'pointer',
                              fontWeight: '500'
                            }}
                          >
                            📧 Reply via Email
                          </button>
                          {message.buyer_phone && (
                            <button
                              onClick={() => window.location.href = `tel:${message.buyer_phone}`}
                              style={{
                                backgroundColor: '#10b981',
                                color: 'white',
                                border: 'none',
                                padding: '8px 16px',
                                borderRadius: '6px',
                                fontSize: '14px',
                                cursor: 'pointer',
                                fontWeight: '500'
                              }}
                            >
                              📞 Call
                            </button>
                          )}
                          <button
                            onClick={() => navigate(`/ad/${message.ad_id}`)}
                            style={{
                              backgroundColor: 'transparent',
                              color: '#64748b',
                              border: '1px solid #d1d5db',
                              padding: '8px 16px',
                              borderRadius: '6px',
                              fontSize: '14px',
                              cursor: 'pointer',
                              fontWeight: '500'
                            }}
                          >
                            🔗 View Ad
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'profile' && (
              <div>
                <h3 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>Profile Information</h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '16px'
                }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                      Full Name
                    </label>
                    <div style={{
                      padding: '12px',
                      backgroundColor: '#f9fafb',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      color: '#64748b'
                    }}>
                      {user?.fullName || 'Not provided'}
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                      Email
                    </label>
                    <div style={{
                      padding: '12px',
                      backgroundColor: '#f9fafb',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      color: '#64748b'
                    }}>
                      {user?.email || 'Not provided'}
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                      Phone
                    </label>
                    <div style={{
                      padding: '12px',
                      backgroundColor: '#f9fafb',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      color: '#64748b'
                    }}>
                      {user?.phone || 'Not provided'}
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                      Member Since
                    </label>
                    <div style={{
                      padding: '12px',
                      backgroundColor: '#f9fafb',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      color: '#64748b'
                    }}>
                      {user?.createdAt ? formatDate(user.createdAt) : 'Not available'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '32px',
            width: '100%',
            maxWidth: '400px',
            margin: '20px'
          }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>Confirm Delete</h3>
            <p style={{ margin: '0 0 24px 0', color: '#64748b' }}>
              Are you sure you want to delete "<strong>{deleteModal.adTitle}</strong>"? This action cannot be undone.
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDeleteModal({ isOpen: false, adId: null, adTitle: '' })}
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid #d1d5db',
                  color: '#64748b',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>

              <button
                onClick={() => handleDeleteAd(deleteModal.adId)}
                style={{
                  backgroundColor: '#dc2626',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reply Modal */}
      {replyModal.isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            width: '90%',
            maxWidth: '500px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 'bold',
              marginBottom: '16px',
              color: '#1e293b'
            }}>
              Reply to {replyModal.buyerName}
            </h3>

            <p style={{
              color: '#64748b',
              fontSize: '14px',
              marginBottom: '16px'
            }}>
              Regarding: <strong>{replyModal.adTitle}</strong>
            </p>

            {/* Error message */}
            <ErrorMessage
              error={replyError}
              onClose={() => setReplyError(null)}
            />

            <form onSubmit={handleReplySubmit}>
              <textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Type your reply message here..."
                required
                style={{
                  width: '100%',
                  minHeight: '120px',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  marginBottom: '16px'
                }}
              />

              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px'
              }}>
                <button
                  type="button"
                  onClick={() => {
                    setReplyModal({ isOpen: false, messageId: null, buyerName: '', adTitle: '' });
                    setReplyMessage('');
                  }}
                  style={{
                    backgroundColor: 'transparent',
                    color: '#64748b',
                    border: '1px solid #d1d5db',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  style={{
                    backgroundColor: '#dc1e4a',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Send Reply
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;