const API_BASE_URL = 'http://localhost:5000/api';

class ApiService {
  async get(endpoint) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        // Create enhanced error with structured information
        const error = new Error(data.message || 'API request failed');
        error.type = data.error?.type;
        error.title = data.error?.title;
        error.suggestion = data.error?.suggestion;
        error.severity = data.error?.severity;
        error.field = data.error?.field;
        error.details = data.error?.details;
        error.structured = !!data.error; // Flag to indicate structured error
        throw error;
      }

      return data.data;
    } catch (error) {
      console.error(`❌ API Error for ${endpoint}:`, error);
      throw error;
    }
  }

  // Get all ads with optional search parameters
  async getAds(searchParams = {}) {
    const params = new URLSearchParams();

    if (searchParams.search) params.append('search', searchParams.search);
    if (searchParams.category) params.append('category', searchParams.category);
    if (searchParams.location) params.append('location', searchParams.location);
    if (searchParams.minPrice) params.append('minPrice', searchParams.minPrice);
    if (searchParams.maxPrice) params.append('maxPrice', searchParams.maxPrice);
    if (searchParams.condition) params.append('condition', searchParams.condition);
    if (searchParams.datePosted) params.append('datePosted', searchParams.datePosted);
    if (searchParams.dateFrom) params.append('dateFrom', searchParams.dateFrom);
    if (searchParams.dateTo) params.append('dateTo', searchParams.dateTo);
    if (searchParams.sortBy) params.append('sortBy', searchParams.sortBy);
    if (searchParams.sortOrder) params.append('sortOrder', searchParams.sortOrder);
    if (searchParams.limit) params.append('limit', searchParams.limit);
    if (searchParams.offset) params.append('offset', searchParams.offset);

    const queryString = params.toString();
    const endpoint = queryString ? `/ads?${queryString}` : '/ads';

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        // Create enhanced error with structured information
        const error = new Error(data.message || 'API request failed');
        error.type = data.error?.type;
        error.title = data.error?.title;
        error.suggestion = data.error?.suggestion;
        error.severity = data.error?.severity;
        error.field = data.error?.field;
        error.details = data.error?.details;
        error.structured = !!data.error; // Flag to indicate structured error
        throw error;
      }

      return data; // Return the full response including pagination
    } catch (error) {
      console.error(`❌ API Error for ${endpoint}:`, error);
      throw error;
    }
  }

  // Get single ad
  async getAd(id) {
    return this.get(`/ads/${id}`);
  }

  // Get categories
  async getCategories(includeSubcategories = false) {
    const params = includeSubcategories ? '?includeSubcategories=true' : '';
    return this.get(`/categories${params}`);
  }

  // Get locations (optionally filter by parent_id for hierarchical selection)
  async getLocations(parentId = null) {
    if (parentId !== null) {
      return this.get(`/locations?parent_id=${parentId}`);
    }
    return this.get('/locations');
  }

  // Get complete location hierarchy (provinces > districts > municipalities)
  // OPTIMIZED: Returns all locations in a single API call instead of 85 separate calls
  async getLocationHierarchy() {
    try {
      const response = await fetch(`${API_BASE_URL}/locations/hierarchy`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch location hierarchy');
      }

      return data.data;
    } catch (error) {
      console.error('❌ Location hierarchy error:', error);
      throw error;
    }
  }

  // Search locations/areas with autocomplete
  async searchLocations(query, limit = 10) {
    if (!query || query.length < 2) {
      return [];
    }

    try {
      const response = await fetch(`${API_BASE_URL}/locations/search?q=${encodeURIComponent(query)}&limit=${limit}`);
      const data = await response.json();
      return data.success ? data.data : [];
    } catch (error) {
      console.error('❌ Location search error:', error);
      return [];
    }
  }

  // Authentication methods
  async login(email, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Login failed');
      }

      return data.data;
    } catch (error) {
      console.error(`❌ Login error:`, error);
      throw error;
    }
  }

  async register(userData) {
    try {
      console.log(`🔄 Registering user: ${userData.email}`);
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();
      console.log(`✅ Registration response:`, data);

      if (!data.success) {
        throw new Error(data.message || 'Registration failed');
      }

      return data.data;
    } catch (error) {
      console.error(`❌ Registration error:`, error);
      throw error;
    }
  }

  async getProfile() {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('No authentication token found');
    }

    try {
      console.log(`🔄 Fetching user profile`);
      const response = await fetch(`${API_BASE_URL}/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      console.log(`✅ Profile response:`, data);

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch profile');
      }

      return data.data;
    } catch (error) {
      console.error(`❌ Profile fetch error:`, error);
      throw error;
    }
  }

  async updateProfile(profileData) {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('No authentication token found');
    }

    try {
      console.log(`🔄 Updating user profile with data:`, profileData);
      const response = await fetch(`${API_BASE_URL}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      });

      const data = await response.json();
      console.log(`✅ Update profile response:`, data);

      if (!data.success) {
        throw new Error(data.message || 'Failed to update profile');
      }

      return data;
    } catch (error) {
      console.error(`❌ Update profile error:`, error);
      throw error;
    }
  }

  async uploadAvatar(file) {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('No authentication token found');
    }

    try {
      console.log(`🔄 Uploading avatar`);
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch(`${API_BASE_URL}/profile/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      console.log(`✅ Upload avatar response:`, data);

      if (!data.success) {
        throw new Error(data.message || 'Failed to upload avatar');
      }

      return data;
    } catch (error) {
      console.error(`❌ Upload avatar error:`, error);
      throw error;
    }
  }

  async uploadCoverPhoto(file) {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('No authentication token found');
    }

    try {
      console.log(`🔄 Uploading cover photo`);
      const formData = new FormData();
      formData.append('cover', file);

      const response = await fetch(`${API_BASE_URL}/profile/cover`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      console.log(`✅ Upload cover photo response:`, data);

      if (!data.success) {
        throw new Error(data.message || 'Failed to upload cover photo');
      }

      return data;
    } catch (error) {
      console.error(`❌ Upload cover photo error:`, error);
      throw error;
    }
  }

  async removeAvatar() {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('No authentication token found');
    }

    try {
      console.log(`🔄 Removing avatar`);
      const response = await fetch(`${API_BASE_URL}/profile/avatar`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      console.log(`✅ Remove avatar response:`, data);

      if (!data.success) {
        throw new Error(data.message || 'Failed to remove avatar');
      }

      return data;
    } catch (error) {
      console.error(`❌ Remove avatar error:`, error);
      throw error;
    }
  }

  async removeCoverPhoto() {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('No authentication token found');
    }

    try {
      console.log(`🔄 Removing cover photo`);
      const response = await fetch(`${API_BASE_URL}/profile/cover`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      console.log(`✅ Remove cover photo response:`, data);

      if (!data.success) {
        throw new Error(data.message || 'Failed to remove cover photo');
      }

      return data;
    } catch (error) {
      console.error(`❌ Remove cover photo error:`, error);
      throw error;
    }
  }

  async createAd(adData, images = []) {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('No authentication token found');
    }

    try {
      console.log(`🔄 Creating ad: ${adData.title} with ${images.length} images`);

      // Create FormData for file upload
      const formData = new FormData();

      // Add text data
      Object.keys(adData).forEach(key => {
        formData.append(key, adData[key]);
      });

      // Add images
      images.forEach(image => {
        formData.append('images', image);
      });

      const response = await fetch(`${API_BASE_URL}/ads`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type header, let browser set it with boundary for FormData
        },
        body: formData,
      });

      const data = await response.json();
      console.log(`✅ Create ad response:`, data);

      if (!data.success) {
        throw new Error(data.message || 'Failed to create ad');
      }

      return data.data;
    } catch (error) {
      console.error(`❌ Create ad error:`, error);
      throw error;
    }
  }

  async getUserAds() {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('No authentication token found');
    }

    try {
      console.log(`🔄 Fetching user ads`);
      const response = await fetch(`${API_BASE_URL}/user/ads`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      console.log(`✅ User ads response:`, data);

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch user ads');
      }

      return data; // Return full response including pagination
    } catch (error) {
      console.error(`❌ Fetch user ads error:`, error);
      throw error;
    }
  }

  async deleteAd(adId) {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('No authentication token found');
    }

    try {
      console.log(`🔄 Deleting ad: ${adId}`);
      const response = await fetch(`${API_BASE_URL}/ads/${adId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      console.log(`✅ Delete ad response:`, data);

      if (!data.success) {
        throw new Error(data.message || 'Failed to delete ad');
      }

      return data;
    } catch (error) {
      console.error(`❌ Delete ad error:`, error);
      throw error;
    }
  }

  async updateAd(adId, adData) {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('No authentication token found');
    }

    try {
      console.log(`🔄 Updating ad: ${adId}`);
      const response = await fetch(`${API_BASE_URL}/ads/${adId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(adData),
      });

      const data = await response.json();
      console.log(`✅ Update ad response:`, data);

      if (!data.success) {
        throw new Error(data.message || 'Failed to update ad');
      }

      return data.data;
    } catch (error) {
      console.error(`❌ Update ad error:`, error);
      throw error;
    }
  }

  // Admin API methods
  async getAdminStats() {
    const token = localStorage.getItem('editorToken');
    if (!token) {
      throw new Error('No authentication token found');
    }

    try {
      console.log(`🔄 Fetching admin stats`);
      const response = await fetch(`${API_BASE_URL}/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      console.log(`✅ Admin stats response:`, data);

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch admin stats');
      }

      return data.data;
    } catch (error) {
      console.error(`❌ Admin stats error:`, error);
      throw error;
    }
  }

  async getAdminAds(status = 'all') {
    const token = localStorage.getItem('editorToken');
    if (!token) {
      throw new Error('No authentication token found');
    }

    try {
      console.log(`🔄 Fetching admin ads (${status})`);
      const params = status !== 'all' ? `?status=${status}` : '';
      const response = await fetch(`${API_BASE_URL}/admin/ads${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      console.log(`✅ Admin ads response:`, data);

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch admin ads');
      }

      return data.data;
    } catch (error) {
      console.error(`❌ Admin ads error:`, error);
      throw error;
    }
  }

  async getAdminUsers() {
    const token = localStorage.getItem('editorToken');
    if (!token) {
      throw new Error('No authentication token found');
    }

    try {
      console.log(`🔄 Fetching admin users`);
      const response = await fetch(`${API_BASE_URL}/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      console.log(`✅ Admin users response:`, data);

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch admin users');
      }

      return data.data;
    } catch (error) {
      console.error(`❌ Admin users error:`, error);
      throw error;
    }
  }

  async updateAdStatus(adId, status, reason = '') {
    const token = localStorage.getItem('editorToken');
    if (!token) {
      throw new Error('No authentication token found');
    }

    try {
      console.log(`🔄 Updating ad ${adId} status to ${status}`);
      const response = await fetch(`${API_BASE_URL}/admin/ads/${adId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status, reason }),
      });

      const data = await response.json();
      console.log(`✅ Update ad status response:`, data);

      if (!data.success) {
        throw new Error(data.message || 'Failed to update ad status');
      }

      return data.data;
    } catch (error) {
      console.error(`❌ Update ad status error:`, error);
      throw error;
    }
  }

  // Contact seller
  async contactSeller(contactData) {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('No authentication token found');
    }

    try {
      console.log(`🔄 Sending contact message for ad: ${contactData.adId}`);
      const response = await fetch(`${API_BASE_URL}/contact-seller`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(contactData),
      });

      const data = await response.json();
      console.log(`✅ Contact seller response:`, data);

      if (!data.success) {
        throw new Error(data.message || 'Failed to send message');
      }

      return data;
    } catch (error) {
      console.error(`❌ Contact seller error:`, error);
      throw error;
    }
  }

  // Report ad
  async reportAd(reportData) {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('No authentication token found');
    }

    try {
      console.log(`🔄 Reporting ad: ${reportData.adId}`);
      const response = await fetch(`${API_BASE_URL}/report-ad`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(reportData),
      });

      const data = await response.json();
      console.log(`✅ Report ad response:`, data);

      if (!data.success) {
        throw new Error(data.message || 'Failed to submit report');
      }

      return data;
    } catch (error) {
      console.error(`❌ Report ad error:`, error);
      throw error;
    }
  }

  // Get contact messages
  async getContactMessages(type = 'received') {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('No authentication token found');
    }

    try {
      console.log(`🔄 Fetching contact messages (${type})`);
      const response = await fetch(`${API_BASE_URL}/user/contact-messages?type=${type}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      console.log(`✅ Contact messages response:`, data);

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch contact messages');
      }

      return data.data;
    } catch (error) {
      console.error(`❌ Contact messages error:`, error);
      throw error;
    }
  }

  // Reply to message
  async replyToMessage(originalMessageId, replyMessage) {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('No authentication token found');
    }

    try {
      const url = `${API_BASE_URL}/reply-message`;
      console.log(`🔄 Replying to message: ${originalMessageId}`);
      console.log(`🔗 Request URL: ${url}`);
      console.log(`📤 Request body:`, { originalMessageId, replyMessage });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ originalMessageId, replyMessage }),
      });

      const data = await response.json();
      console.log(`✅ Reply message response:`, data);

      if (!data.success) {
        throw new Error(data.message || 'Failed to send reply');
      }

      return data;
    } catch (error) {
      console.error(`❌ Reply message error:`, error);
      throw error;
    }
  }

  // Editor API methods (uses editorToken)
  async getEditorStats() {
    const token = localStorage.getItem('editorToken');
    if (!token) throw new Error('No authentication token found');

    const response = await fetch(`${API_BASE_URL}/admin/stats`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message || 'Failed to fetch stats');
    return data.data;
  }

  async getEditorAds(filters = {}) {
    const token = localStorage.getItem('editorToken');
    if (!token) throw new Error('No authentication token found');

    const params = new URLSearchParams(filters).toString();
    const response = await fetch(`${API_BASE_URL}/admin/ads${params ? `?${params}` : ''}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message || 'Failed to fetch ads');
    return data;
  }

  async getEditorUsers(filters = {}) {
    const token = localStorage.getItem('editorToken');
    if (!token) throw new Error('No authentication token found');

    const response = await fetch(`${API_BASE_URL}/admin/users`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message || 'Failed to fetch users');
    return data;
  }

  async getActivityLogs(params = {}) {
    return { success: true, data: [] }; // TODO: Implement backend
  }

  async getBusinessRequests(params = {}) {
    return { success: true, data: [] }; // TODO: Implement backend
  }

  async approveAd(adId) {
    const token = localStorage.getItem('editorToken');
    if (!token) throw new Error('No authentication token found');

    const response = await fetch(`${API_BASE_URL}/admin/ads/${adId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status: 'active' })
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message || 'Failed to approve ad');
    return data;
  }

  async rejectAd(adId, reason) {
    const token = localStorage.getItem('editorToken');
    if (!token) throw new Error('No authentication token found');

    const response = await fetch(`${API_BASE_URL}/admin/ads/${adId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status: 'rejected', reason })
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message || 'Failed to reject ad');
    return data;
  }

  async editorDeleteAd(adId, reason) {
    const token = localStorage.getItem('editorToken');
    if (!token) throw new Error('No authentication token found');

    const response = await fetch(`${API_BASE_URL}/admin/ads/${adId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message || 'Failed to delete ad');
    return data;
  }

  async restoreAd(adId) {
    return { success: true }; // TODO: Implement backend
  }

  async bulkActionAds(action, adIds, reason) {
    return { success: true }; // TODO: Implement backend
  }

  async suspendUser(userId, reason, duration) {
    return { success: true }; // TODO: Implement backend
  }

  async unsuspendUser(userId) {
    return { success: true }; // TODO: Implement backend
  }

  async verifyUser(userId) {
    return { success: true }; // TODO: Implement backend
  }

  // Business Verification methods
  async getBusinessVerificationStatus() {
    const token = localStorage.getItem('authToken');
    if (!token) return null;

    const response = await fetch(`${API_BASE_URL}/business/verification-status`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    return data.success ? data.data : null;
  }

  async submitBusinessVerification(formData) {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('No authentication token found');

    const response = await fetch(`${API_BASE_URL}/business/verify-request`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData // FormData with files
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message || 'Failed to submit verification');
    return data;
  }

  // Individual Seller Verification methods
  async getIndividualVerificationStatus() {
    const token = localStorage.getItem('authToken');
    if (!token) return null;

    const response = await fetch(`${API_BASE_URL}/individual-verification/status`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    return data.success ? data.data : null;
  }

  async submitIndividualVerification(formData) {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('No authentication token found');

    const response = await fetch(`${API_BASE_URL}/individual-verification/submit`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData // FormData with files
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message || 'Failed to submit verification');
    return data;
  }

  async getBusinessRequests(filters = {}) {
    const token = localStorage.getItem('editorToken');
    if (!token) throw new Error('No authentication token found');

    const params = new URLSearchParams(filters).toString();
    const response = await fetch(`${API_BASE_URL}/business/verification-requests${params ? `?${params}` : ''}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message || 'Failed to fetch business requests');
    return data;
  }

  async approveBusinessRequest(requestId, subscriptionMonths) {
    const token = localStorage.getItem('editorToken');
    if (!token) throw new Error('No authentication token found');

    const response = await fetch(`${API_BASE_URL}/business/verification-requests/${requestId}/approve`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ subscriptionMonths })
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message || 'Failed to approve request');
    return data;
  }

  async rejectBusinessRequest(requestId, reason) {
    const token = localStorage.getItem('editorToken');
    if (!token) throw new Error('No authentication token found');

    const response = await fetch(`${API_BASE_URL}/business/verification-requests/${requestId}/reject`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ reason })
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message || 'Failed to reject request');
    return data
  }

  // Editor: Individual Verification Management
  async getIndividualRequests(filters = {}) {
    const token = localStorage.getItem('editorToken');
    if (!token) throw new Error('No authentication token found');

    const params = new URLSearchParams(filters).toString();
    const response = await fetch(`${API_BASE_URL}/admin/individual-verifications${params ? `?${params}` : ''}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message || 'Failed to fetch individual verification requests');
    return data;
  }

  async approveIndividualRequest(requestId) {
    const token = localStorage.getItem('editorToken');
    if (!token) throw new Error('No authentication token found');

    const response = await fetch(`${API_BASE_URL}/admin/individual-verifications/${requestId}/approve`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message || 'Failed to approve request');
    return data;
  }

  async rejectIndividualRequest(requestId, reason) {
    const token = localStorage.getItem('editorToken');
    if (!token) throw new Error('No authentication token found');

    const response = await fetch(`${API_BASE_URL}/admin/individual-verifications/${requestId}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ reason })
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message || 'Failed to reject request');
    return data;
  }

  // Promotion Pricing methods
  async getPromotionPricing() {
    try {
      const response = await fetch(`${API_BASE_URL}/promotion-pricing`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch promotion pricing');
      }

      return data.data;
    } catch (error) {
      console.error('❌ Get promotion pricing error:', error);
      throw error;
    }
  }

  async calculatePromotionPrice(promotionType, durationDays, adId) {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('No authentication token found');

    try {
      const response = await fetch(
        `${API_BASE_URL}/promotion-pricing/calculate?promotionType=${promotionType}&durationDays=${durationDays}${adId ? `&adId=${adId}` : ''}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to calculate price');
      }

      return data.data;
    } catch (error) {
      console.error('❌ Calculate promotion price error:', error);
      throw error;
    }
  }

  // Ad Promotion Payment methods
  async initiatePayment(promotionData) {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('No authentication token found');

    try {
      console.log(`🔄 Initiating payment for ad promotion:`, promotionData);
      const response = await fetch(`${API_BASE_URL}/mock-payment/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(promotionData)
      });

      const data = await response.json();
      console.log(`✅ Initiate payment response:`, data);

      if (!data.success) {
        throw new Error(data.message || 'Failed to initiate payment');
      }

      return data;
    } catch (error) {
      console.error(`❌ Initiate payment error:`, error);
      throw error;
    }
  }

  async verifyPayment(transactionId) {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('No authentication token found');

    try {
      console.log(`🔄 Verifying payment:`, transactionId);
      const response = await fetch(`${API_BASE_URL}/mock-payment/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ transactionId })
      });

      const data = await response.json();
      console.log(`✅ Verify payment response:`, data);

      if (!data.success) {
        throw new Error(data.message || 'Failed to verify payment');
      }

      return data;
    } catch (error) {
      console.error(`❌ Verify payment error:`, error);
      throw error;
    }
  }

  async getPaymentStatus(transactionId) {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('No authentication token found');

    try {
      const response = await fetch(`${API_BASE_URL}/mock-payment/status/${transactionId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error(`❌ Get payment status error:`, error);
      throw error;
    }
  }

  // Admin: Promotion Pricing Management
  async getAllPromotionPricing() {
    const token = localStorage.getItem('editorToken');
    if (!token) throw new Error('No authentication token found');

    try {
      const response = await fetch(`${API_BASE_URL}/promotion-pricing/admin/all`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch promotion pricing');
      }

      return data.data;
    } catch (error) {
      console.error('❌ Get all promotion pricing error:', error);
      throw error;
    }
  }

  async updatePromotionPrice(pricingId, newPrice, newDiscount) {
    const token = localStorage.getItem('editorToken');
    if (!token) throw new Error('No authentication token found');

    try {
      const response = await fetch(`${API_BASE_URL}/promotion-pricing/${pricingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          price: newPrice,
          discount_percentage: newDiscount
        })
      });
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to update pricing');
      }

      return data.data;
    } catch (error) {
      console.error('❌ Update promotion price error:', error);
      throw error;
    }
  }
}

export default new ApiService();