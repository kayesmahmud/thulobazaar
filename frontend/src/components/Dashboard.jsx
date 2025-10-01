import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import ApiService from '../services/api';
import ErrorMessage from './ErrorMessage';
import SimpleHeader from './SimpleHeader';
import BusinessVerificationForm from './BusinessVerificationForm';
import { generateAdUrl } from '../utils/urlUtils';

function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const { language } = useLanguage();
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
  const [businessVerificationModal, setBusinessVerificationModal] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null);

  useEffect(() => {
    // Redirect if not authenticated
    if (!isAuthenticated) {
      navigate(`/${language}`);
      return;
    }

    // Block editors and super_admins from accessing dashboard
    if (user && (user.role === 'editor' || user.role === 'super_admin')) {
      alert('Editors and admins cannot access user dashboard');
      navigate(`/${language}`);
      return;
    }

    // Load user's data
    loadUserData();
  }, [isAuthenticated, navigate, language]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const [ads, receivedMessages, verificationStatusData] = await Promise.all([
        ApiService.getUserAds(),
        ApiService.getContactMessages('received'),
        ApiService.getBusinessVerificationStatus().catch(() => null)
      ]);
      setUserAds(ads);
      setContactMessages(receivedMessages);

      let processedVerificationStatus = null;
      if (verificationStatusData) {
        if (verificationStatusData.latestRequest) {
          // If there's a latest request, use its status
          processedVerificationStatus = {
            status: verificationStatusData.latestRequest.status,
            rejection_reason: verificationStatusData.latestRequest.rejection_reason
          };
        } else if (verificationStatusData.userStatus.business_verification_status) {
          // If no latest request but user is verified (e.g., pre-approved or old system)
          processedVerificationStatus = {
            status: verificationStatusData.userStatus.business_verification_status
          };
        } else {
          // No request, no verification status, so user hasn't applied
          processedVerificationStatus = { status: 'not_applied' };
        }
      }

      setVerificationStatus(processedVerificationStatus);
      console.log('✅ User data loaded:', { ads, receivedMessages, verificationStatusData, processedVerificationStatus });
      console.log('Dashboard - verificationStatus after fetch:', processedVerificationStatus);
    } catch (err) {
      console.error('❌ Error loading user data:', err);
      setError('Failed to load your data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationSuccess = () => {
    setBusinessVerificationModal(false);
    alert('✅ Business verification request submitted successfully! Our team will review your application within 1-2 business days.');
    loadUserData(); // Reload to get updated status
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

        {/* Business Verification Banner */}
        {verificationStatus && verificationStatus.status === 'not_applied' && (
          <div style={{
            backgroundColor: '#fef3c7',
            border: '2px solid #fbbf24',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <span style={{ fontSize: '32px' }}>✓</span>
                <h3 style={{ margin: 0, color: '#92400e', fontSize: '18px', fontWeight: 'bold' }}>
                  Get Your Business Verified!
                </h3>
              </div>
              <p style={{ margin: 0, color: '#92400e', fontSize: '14px' }}>
                Unlock golden verified badge, 30-40% discount on promotions, and increased trust
              </p>
            </div>
            <button
              onClick={() => setBusinessVerificationModal(true)}
              style={{
                padding: '12px 24px',
                backgroundColor: '#fbbf24',
                color: '#92400e',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              Apply Now →
            </button>
          </div>
        )}

        {/* Verification Status Banner */}
        {verificationStatus && verificationStatus.status !== 'not_applied' && (
          <div style={{
            backgroundColor: verificationStatus.status === 'pending' ? '#fef3c7' :
                          verificationStatus.status === 'approved' ? '#d1fae5' : '#fee2e2',
            border: `2px solid ${verificationStatus.status === 'pending' ? '#fbbf24' :
                                 verificationStatus.status === 'approved' ? '#10b981' : '#ef4444'}`,
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '24px' }}>
                    {verificationStatus.status === 'pending' ? '⏳' :
                     verificationStatus.status === 'approved' ? '✓' : '✗'}
                  </span>
                  <h3 style={{
                    margin: 0,
                    color: verificationStatus.status === 'pending' ? '#92400e' :
                           verificationStatus.status === 'approved' ? '#065f46' : '#991b1b',
                    fontSize: '18px',
                    fontWeight: 'bold'
                  }}>
                    Business Verification {verificationStatus.status === 'pending' ? 'Pending' :
                                          verificationStatus.status === 'approved' ? 'Approved!' : 'Rejected'}
                  </h3>
                </div>
                <p style={{
                  margin: 0,
                  color: verificationStatus.status === 'pending' ? '#92400e' :
                         verificationStatus.status === 'approved' ? '#065f46' : '#991b1b',
                  fontSize: '14px'
                }}>
                  {verificationStatus.status === 'pending' && 'Your application is under review. We\'ll notify you within 1-2 business days.'}
                  {verificationStatus.status === 'approved' && 'Congratulations! Your business account is now verified with a golden badge.'}
                  {verificationStatus.status === 'rejected' && `Reason: ${verificationStatus.rejection_reason || 'Please contact support for more information'}`}
                </p>
              </div>
              {verificationStatus.status === 'rejected' && (
                <button
                  onClick={() => setBusinessVerificationModal(true)}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Apply Again
                </button>
              )}
            </div>
          </div>
        )}

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
                      onClick={() => navigate(`/${language}/post-ad`)}
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
                            onClick={() => {
                              console.log('Dashboard - View button clicked for ad:', ad);
                              const slug = generateAdUrl(ad);
                              navigate(`/${language}${slug}`);
                            }}
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
                            onClick={() => navigate(`/${language}/edit-ad/${ad.id}`)}
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
                            onClick={() => {
                              console.log('Dashboard - View Ad button clicked for message:', message);
                              const slug = generateAdUrl({
                                title: message.ad_title,
                                location_name: message.ad_location || 'nepal',
                                id: message.ad_id
                              });
                              navigate(`/${language}${slug}`);
                            }}
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

      {/* Business Verification Modal */}
      {businessVerificationModal && (
        <BusinessVerificationForm
          onClose={() => setBusinessVerificationModal(false)}
          onSuccess={handleVerificationSuccess}
        />
      )}
    </div>
  );
}

export default Dashboard;