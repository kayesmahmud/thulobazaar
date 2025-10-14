import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import ApiService from '../services/api';
import './EditorDashboard.css';
import { UPLOADS_BASE_URL } from '../config/env.js';

function EditorDashboard() {
  const { language } = useLanguage();
  const navigate = useNavigate();

  // Editor-specific state (separate from regular user auth)
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [ads, setAds] = useState([]);
  const [users, setUsers] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [businessRequests, setBusinessRequests] = useState([]);
  const [individualRequests, setIndividualRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter states
  const [adFilters, setAdFilters] = useState({
    status: 'pending',
    search: '',
    page: 1,
    limit: 20
  });

  const [userFilters, setUserFilters] = useState({
    search: '',
    status: 'all',
    page: 1,
    limit: 20
  });

  const [selectedAds, setSelectedAds] = useState([]);

  // Check editor authentication on mount
  useEffect(() => {
    const editorToken = localStorage.getItem('editorToken');
    const editorData = localStorage.getItem('editorData');

    if (!editorToken || !editorData) {
      navigate(`/${language}/editor`);
      return;
    }

    try {
      const userData = JSON.parse(editorData);
      if (userData.role !== 'editor' && userData.role !== 'super_admin') {
        alert('Access denied. Editor privileges required.');
        navigate(`/${language}/editor`);
        return;
      }
      setUser(userData);
      setIsAuthenticated(true);
      setLoading(false);
    } catch (err) {
      console.error('Error parsing editor data:', err);
      navigate(`/${language}/editor`);
    }
  }, [navigate, language]);

  // Fetch stats
  useEffect(() => {
    if (isAuthenticated && user && (user.role === 'editor' || user.role === 'super_admin')) {
      fetchStats();
    }
  }, [isAuthenticated, user]);

  // Fetch data based on active tab
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    if (activeTab === 'ads') {
      fetchAds();
    } else if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'activity') {
      fetchActivityLogs();
    } else if (activeTab === 'business') {
      fetchBusinessRequests();
    } else if (activeTab === 'individual') {
      fetchIndividualRequests();
    }
  }, [activeTab, adFilters, userFilters, isAuthenticated, user]);

  const fetchStats = async () => {
    try {
      const data = await ApiService.getEditorStats();
      console.log('📊 Stats received:', data);
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError(err.message);
    }
  };

  const fetchAds = async () => {
    setLoading(true);
    try {
      const response = await ApiService.getEditorAds(adFilters);
      setAds(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching ads:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await ApiService.getEditorUsers(userFilters);
      setUsers(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const fetchActivityLogs = async () => {
    setLoading(true);
    try {
      const response = await ApiService.getActivityLogs({ page: 1, limit: 50 });
      setActivityLogs(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching activity logs:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const fetchBusinessRequests = async () => {
    setLoading(true);
    try {
      const response = await ApiService.getBusinessRequests({ status: 'pending' });
      setBusinessRequests(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching business requests:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  // Ad actions
  const handleApproveAd = async (adId) => {
    try {
      await ApiService.approveAd(adId);
      fetchAds();
      fetchStats();
      alert('Ad approved successfully');
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleRejectAd = async (adId) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    try {
      await ApiService.rejectAd(adId, reason);
      fetchAds();
      fetchStats();
      alert('Ad rejected successfully');
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleDeleteAd = async (adId) => {
    const reason = prompt('Enter deletion reason:');
    if (!reason) return;

    if (!confirm('Are you sure you want to delete this ad?')) return;

    try {
      await ApiService.editorDeleteAd(adId, reason);
      fetchAds();
      fetchStats();
      alert('Ad deleted successfully');
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleRestoreAd = async (adId) => {
    if (!confirm('Are you sure you want to restore this ad?')) return;

    try {
      await ApiService.restoreAd(adId);
      fetchAds();
      fetchStats();
      alert('Ad restored successfully');
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  // Bulk actions
  const handleBulkAction = async (action) => {
    if (selectedAds.length === 0) {
      alert('Please select at least one ad');
      return;
    }

    let reason = null;
    if (action === 'reject' || action === 'delete') {
      reason = prompt(`Enter ${action} reason:`);
      if (!reason) return;
    }

    if (!confirm(`Are you sure you want to ${action} ${selectedAds.length} ads?`)) return;

    try {
      await ApiService.bulkActionAds(action, selectedAds, reason);
      setSelectedAds([]);
      fetchAds();
      fetchStats();
      alert(`Bulk ${action} completed successfully`);
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  // User actions
  const handleSuspendUser = async (userId) => {
    const reason = prompt('Enter suspension reason:');
    if (!reason) return;

    const durationInput = prompt('Enter suspension duration in days (leave empty for permanent):');
    const duration = durationInput ? parseInt(durationInput) : null;

    try {
      await ApiService.suspendUser(userId, reason, duration);
      fetchUsers();
      alert('User suspended successfully');
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleUnsuspendUser = async (userId) => {
    try {
      await ApiService.unsuspendUser(userId);
      fetchUsers();
      alert('User unsuspended successfully');
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleVerifyUser = async (userId) => {
    try {
      await ApiService.verifyUser(userId);
      fetchUsers();
      alert('User verified successfully');
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  // Business verification actions
  const handleApproveBusiness = async (requestId) => {
    const months = prompt('Enter subscription duration in months (default: 1):', '1');
    if (!months) return;

    if (!confirm('Are you sure you want to approve this business account?')) return;

    try {
      await ApiService.approveBusinessRequest(requestId, parseInt(months));
      fetchBusinessRequests();
      alert('Business account approved successfully');
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleRejectBusiness = async (requestId) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    try {
      await ApiService.rejectBusinessRequest(requestId, reason);
      fetchBusinessRequests();
      alert('Business verification rejected');
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  // Individual verification methods
  const fetchIndividualRequests = async () => {
    setLoading(true);
    try {
      const response = await ApiService.getIndividualRequests({ status: 'pending' });
      setIndividualRequests(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching individual requests:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const handleApproveIndividual = async (requestId) => {
    if (!confirm('Are you sure you want to approve this individual seller?')) return;

    try {
      await ApiService.approveIndividualRequest(requestId);
      fetchIndividualRequests();
      alert('Individual seller approved successfully');
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleRejectIndividual = async (requestId) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    try {
      await ApiService.rejectIndividualRequest(requestId, reason);
      fetchIndividualRequests();
      alert('Individual verification rejected');
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const toggleAdSelection = (adId) => {
    setSelectedAds(prev =>
      prev.includes(adId)
        ? prev.filter(id => id !== adId)
        : [...prev, adId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedAds.length === ads.length) {
      setSelectedAds([]);
    } else {
      setSelectedAds(ads.map(ad => ad.id));
    }
  };

  if (loading || !isAuthenticated || !user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="editor-dashboard">
        <div className="dashboard-header">
          <h1>Editor Dashboard</h1>
          <div className="editor-info">
            <span>{user.fullName}</span>
            <span className="badge">{user.role}</span>
            <button
              onClick={() => {
                // Editor logout - clear editor tokens only
                localStorage.removeItem('editorToken');
                localStorage.removeItem('editorData');
                navigate(`/${language}/editor`);
              }}
              style={{
                marginLeft: '15px',
                padding: '8px 15px',
                backgroundColor: '#dc1e4a',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              Logout
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="dashboard-tabs">
          <button
            className={activeTab === 'overview' ? 'active' : ''}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={activeTab === 'ads' ? 'active' : ''}
            onClick={() => setActiveTab('ads')}
          >
            Ads Management
          </button>
          <button
            className={activeTab === 'users' ? 'active' : ''}
            onClick={() => setActiveTab('users')}
          >
            Users Management
          </button>
          <button
            className={activeTab === 'business' ? 'active' : ''}
            onClick={() => setActiveTab('business')}
          >
            Business Verification
          </button>
          <button
            className={activeTab === 'individual' ? 'active' : ''}
            onClick={() => setActiveTab('individual')}
          >
            Individual Verification
          </button>
          <button
            className={activeTab === 'activity' ? 'active' : ''}
            onClick={() => setActiveTab('activity')}
          >
            Activity Logs
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <div className="overview-section">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">📊</div>
                <div className="stat-content">
                  <h3>{stats.totalAds}</h3>
                  <p>Total Ads</p>
                </div>
              </div>

              <div className="stat-card pending">
                <div className="stat-icon">⏳</div>
                <div className="stat-content">
                  <h3>{stats.pending_ads}</h3>
                  <p>Pending Review</p>
                </div>
              </div>

              <div className="stat-card approved">
                <div className="stat-icon">✅</div>
                <div className="stat-content">
                  <h3>{stats.approved_ads}</h3>
                  <p>Approved Ads</p>
                </div>
              </div>

              <div className="stat-card rejected">
                <div className="stat-icon">❌</div>
                <div className="stat-content">
                  <h3>{stats.rejected_ads}</h3>
                  <p>Rejected Ads</p>
                </div>
              </div>

              <div className="stat-card deleted">
                <div className="stat-icon">🗑️</div>
                <div className="stat-content">
                  <h3>{stats.deleted_ads}</h3>
                  <p>Deleted Ads</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">👥</div>
                <div className="stat-content">
                  <h3>{stats.totalUsers}</h3>
                  <p>Total Users</p>
                </div>
              </div>

              <div className="stat-card suspended">
                <div className="stat-icon">🚫</div>
                <div className="stat-content">
                  <h3>{stats.suspended_users}</h3>
                  <p>Suspended Users</p>
                </div>
              </div>

              <div className="stat-card verified">
                <div className="stat-icon">✓</div>
                <div className="stat-content">
                  <h3>{stats.verified_users}</h3>
                  <p>Verified Users</p>
                </div>
              </div>
            </div>

            <div className="quick-stats">
              <div className="quick-stat-item">
                <strong>Today:</strong> {stats.ads_today} new ads, {stats.users_today} new users
              </div>
              <div className="quick-stat-item">
                <strong>This Month:</strong> {stats.ads_this_month} ads, {stats.users_this_month} users
              </div>
            </div>
          </div>
        )}

        {/* Ads Management Tab */}
        {activeTab === 'ads' && (
          <div className="ads-section">
            <div className="section-header">
              <div className="filters">
                <select
                  value={adFilters.status}
                  onChange={(e) => setAdFilters({...adFilters, status: e.target.value, page: 1})}
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>

                <input
                  type="text"
                  placeholder="Search ads..."
                  value={adFilters.search}
                  onChange={(e) => setAdFilters({...adFilters, search: e.target.value, page: 1})}
                />

                <label>
                  <input
                    type="checkbox"
                    checked={adFilters.includeDeleted === 'true'}
                    onChange={(e) => setAdFilters({...adFilters, includeDeleted: e.target.checked ? 'true' : 'false'})}
                  />
                  Include Deleted
                </label>
              </div>

              {selectedAds.length > 0 && (
                <div className="bulk-actions">
                  <span>{selectedAds.length} selected</span>
                  <button onClick={() => handleBulkAction('approve')} className="btn-approve">Approve</button>
                  <button onClick={() => handleBulkAction('reject')} className="btn-reject">Reject</button>
                  <button onClick={() => handleBulkAction('delete')} className="btn-delete">Delete</button>
                  <button onClick={() => handleBulkAction('restore')} className="btn-restore">Restore</button>
                </div>
              )}
            </div>

            {loading ? (
              <div className="loading">Loading ads...</div>
            ) : (
              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>
                        <input
                          type="checkbox"
                          checked={ads.length > 0 && selectedAds.length === ads.length}
                          onChange={toggleSelectAll}
                        />
                      </th>
                      <th>ID</th>
                      <th>Title</th>
                      <th>Category</th>
                      <th>Seller</th>
                      <th>Price</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ads.map(ad => (
                      <tr key={ad.id} className={ad.deleted_at ? 'deleted-row' : ''}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedAds.includes(ad.id)}
                            onChange={() => toggleAdSelection(ad.id)}
                          />
                        </td>
                        <td>{ad.id}</td>
                        <td className="ad-title">{ad.title}</td>
                        <td>{ad.category_name}</td>
                        <td>{ad.seller_name}</td>
                        <td>रू {ad.price}</td>
                        <td>
                          <span className={`status-badge ${ad.status}`}>
                            {ad.status}
                          </span>
                          {ad.deleted_at && <span className="deleted-badge">Deleted</span>}
                        </td>
                        <td>{new Date(ad.created_at).toLocaleDateString()}</td>
                        <td className="action-buttons">
                          {ad.deleted_at ? (
                            <button onClick={() => handleRestoreAd(ad.id)} className="btn-restore">Restore</button>
                          ) : (
                            <>
                              {ad.status === 'pending' && (
                                <>
                                  <button onClick={() => handleApproveAd(ad.id)} className="btn-approve">✓</button>
                                  <button onClick={() => handleRejectAd(ad.id)} className="btn-reject">✗</button>
                                </>
                              )}
                              <button onClick={() => handleDeleteAd(ad.id)} className="btn-delete">🗑</button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Users Management Tab */}
        {activeTab === 'users' && (
          <div className="users-section">
            <div className="section-header">
              <div className="filters">
                <select
                  value={userFilters.status}
                  onChange={(e) => setUserFilters({...userFilters, status: e.target.value, page: 1})}
                >
                  <option value="all">All Users</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>

                <input
                  type="text"
                  placeholder="Search users..."
                  value={userFilters.search}
                  onChange={(e) => setUserFilters({...userFilters, search: e.target.value, page: 1})}
                />
              </div>
            </div>

            {loading ? (
              <div className="loading">Loading users...</div>
            ) : (
              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Total Ads</th>
                      <th>Status</th>
                      <th>Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id}>
                        <td>{user.id}</td>
                        <td>
                          {user.full_name}
                          {user.is_verified && <span className="verified-badge">✓</span>}
                        </td>
                        <td>{user.email}</td>
                        <td><span className="role-badge">{user.role}</span></td>
                        <td>{user.total_ads}</td>
                        <td>
                          {user.is_suspended ? (
                            <span className="status-badge suspended">Suspended</span>
                          ) : (
                            <span className="status-badge active">Active</span>
                          )}
                        </td>
                        <td>{new Date(user.created_at).toLocaleDateString()}</td>
                        <td className="action-buttons">
                          {user.is_suspended ? (
                            <button onClick={() => handleUnsuspendUser(user.id)} className="btn-success">Unsuspend</button>
                          ) : (
                            <button onClick={() => handleSuspendUser(user.id)} className="btn-warning">Suspend</button>
                          )}
                          {!user.is_verified && (
                            <button onClick={() => handleVerifyUser(user.id)} className="btn-verify">Verify</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Business Verification Tab */}
        {activeTab === 'business' && (
          <div className="business-section">
            <h2>Business Verification Requests</h2>
            {loading ? (
              <div className="loading">Loading business requests...</div>
            ) : (
              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>User</th>
                      <th>Business Name</th>
                      <th>Category</th>
                      <th>Payment</th>
                      <th>Submitted</th>
                      <th>Documents</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {businessRequests.map(request => (
                      <tr key={request.id}>
                        <td>{request.id}</td>
                        <td>
                          <div><strong>{request.user_name}</strong></div>
                          <div style={{fontSize: '12px', color: '#64748b'}}>{request.user_email}</div>
                        </td>
                        <td>
                          <strong>{request.business_name}</strong>
                          {request.business_category && (
                            <div style={{fontSize: '12px', color: '#64748b'}}>{request.business_category}</div>
                          )}
                        </td>
                        <td>{request.business_category || '-'}</td>
                        <td>
                          रू {request.payment_amount || '0'}
                          {request.payment_reference && (
                            <div style={{fontSize: '11px', color: '#64748b'}}>Ref: {request.payment_reference}</div>
                          )}
                        </td>
                        <td>{new Date(request.created_at).toLocaleDateString()}</td>
                        <td>
                          {request.business_license_document && (
                            <a
                              href={`${UPLOADS_BASE_URL}/business-licenses/${request.business_license_document}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{color: '#3b82f6', textDecoration: 'underline'}}
                            >
                              View License
                            </a>
                          )}
                        </td>
                        <td className="action-buttons">
                          <button onClick={() => handleApproveBusiness(request.id)} className="btn-approve">
                            ✓ Approve
                          </button>
                          <button onClick={() => handleRejectBusiness(request.id)} className="btn-reject">
                            ✗ Reject
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {businessRequests.length === 0 && (
                  <div style={{padding: '40px', textAlign: 'center', color: '#64748b'}}>
                    No pending business verification requests
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Individual Verification Tab */}
        {activeTab === 'individual' && (
          <div className="individual-section">
            <h2>Individual Seller Verification Requests</h2>
            {loading ? (
              <div className="loading">Loading individual requests...</div>
            ) : (
              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>User</th>
                      <th>ID Type</th>
                      <th>ID Number</th>
                      <th>Submitted</th>
                      <th>Documents</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {individualRequests.map(request => (
                      <tr key={request.id}>
                        <td>{request.id}</td>
                        <td>
                          <div><strong>{request.full_name}</strong></div>
                          <div style={{fontSize: '12px', color: '#64748b'}}>{request.email}</div>
                          {request.phone && <div style={{fontSize: '11px', color: '#64748b'}}>{request.phone}</div>}
                        </td>
                        <td style={{textTransform: 'capitalize'}}>{request.id_document_type?.replace('_', ' ')}</td>
                        <td>{request.id_document_number}</td>
                        <td>{new Date(request.created_at).toLocaleDateString()}</td>
                        <td>
                          <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                            {request.id_document_front && (
                              <a
                                href={`${UPLOADS_BASE_URL}/individual_verification/${request.id_document_front}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{color: '#3b82f6', textDecoration: 'underline', fontSize: '12px'}}
                              >
                                ID Front
                              </a>
                            )}
                            {request.id_document_back && (
                              <a
                                href={`${UPLOADS_BASE_URL}/individual_verification/${request.id_document_back}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{color: '#3b82f6', textDecoration: 'underline', fontSize: '12px'}}
                              >
                                ID Back
                              </a>
                            )}
                            {request.selfie_with_id && (
                              <a
                                href={`${UPLOADS_BASE_URL}/individual_verification/${request.selfie_with_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{color: '#3b82f6', textDecoration: 'underline', fontSize: '12px'}}
                              >
                                Selfie
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="action-buttons">
                          <button onClick={() => handleApproveIndividual(request.id)} className="btn-approve">
                            ✓ Approve
                          </button>
                          <button onClick={() => handleRejectIndividual(request.id)} className="btn-reject">
                            ✗ Reject
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {individualRequests.length === 0 && (
                  <div style={{padding: '40px', textAlign: 'center', color: '#64748b'}}>
                    No pending individual verification requests
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Activity Logs Tab */}
        {activeTab === 'activity' && (
          <div className="activity-section">
            <h2>Recent Activity</h2>
            {loading ? (
              <div className="loading">Loading activity logs...</div>
            ) : (
              <div className="activity-list">
                {activityLogs.map(log => (
                  <div key={log.id} className="activity-item">
                    <div className="activity-icon">📝</div>
                    <div className="activity-content">
                      <div className="activity-header">
                        <strong>{log.admin_name}</strong>
                        <span className="activity-action">{log.action_type.replace(/_/g, ' ')}</span>
                        <span className="activity-target">{log.target_type} #{log.target_id}</span>
                      </div>
                      <div className="activity-time">{new Date(log.created_at).toLocaleString()}</div>
                      {log.ip_address && <div className="activity-ip">IP: {log.ip_address}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
    </div>
  );
}

export default EditorDashboard;
