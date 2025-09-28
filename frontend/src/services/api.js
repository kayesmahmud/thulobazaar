const API_BASE_URL = 'http://localhost:5000/api';

class ApiService {
  async get(endpoint) {
    try {
      console.log(`🔄 Fetching: ${API_BASE_URL}${endpoint}`);
      const response = await fetch(`${API_BASE_URL}${endpoint}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ Response for ${endpoint}:`, data);

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
    if (searchParams.sortBy) params.append('sortBy', searchParams.sortBy);
    if (searchParams.limit) params.append('limit', searchParams.limit);
    if (searchParams.offset) params.append('offset', searchParams.offset);

    const queryString = params.toString();
    const endpoint = queryString ? `/ads?${queryString}` : '/ads';

    try {
      console.log(`🔄 Fetching: ${API_BASE_URL}${endpoint}`);
      const response = await fetch(`${API_BASE_URL}${endpoint}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ Response for ${endpoint}:`, data);

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
  async getCategories() {
    return this.get('/categories');
  }

  // Get locations
  async getLocations() {
    return this.get('/locations');
  }

  // Authentication methods
  async login(email, password) {
    try {
      console.log(`🔄 Logging in user: ${email}`);
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log(`✅ Login response:`, data);

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
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
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

      return data.data;
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
    const token = localStorage.getItem('authToken');
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
    const token = localStorage.getItem('authToken');
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
    const token = localStorage.getItem('authToken');
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
    const token = localStorage.getItem('authToken');
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
}

export default new ApiService();