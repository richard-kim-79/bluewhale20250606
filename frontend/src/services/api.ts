import axios from 'axios';

// Base URL for API requests
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling common errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized errors (token expired)
    if (error.response && error.response.status === 401) {
      // Clear local storage and redirect to login
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    // 내부 API 라우트 사용 (CORS 우회)
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    return response.json();
  },
  
  register: async (email: string, password: string) => {
    // 내부 API 라우트 사용 (CORS 우회)
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    return response.json();
  },
  
  getCurrentUser: async () => {
    // 내부 API 라우트 사용 (CORS 우회)
    const token = localStorage.getItem('authToken');
    const response = await fetch('/api/auth/me', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
    });
    return response.json();
  },
  
  logout: async () => {
    // 로그아웃은 클라이언트에서 처리
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    return { success: true };
  },
};

// Content API
export const contentAPI = {
  // Get all content with optional filters
  getContent: async (params?: {
    page?: number;
    limit?: number;
    sort?: string;
    filter?: string;
    location?: { lat: number; lng: number; radius?: number };
  }) => {
    const response = await apiClient.get('/content', { params });
    return response.data;
  },
  
  // Get global top content ranked by AI score
  getGlobalTopContent: async (params?: { page?: number; limit?: number }) => {
    const response = await apiClient.get('/content/global-top', { params });
    return response.data;
  },
  
  // Get personalized content for the current user
  getPersonalizedContent: async (params?: {
    page?: number;
    limit?: number;
    location?: { lat: number; lng: number };
  }) => {
    const response = await apiClient.get('/content/personalized', { params });
    return response.data;
  },
  
  // Get local content based on location
  getLocalContent: async (params: {
    lat: number;
    lng: number;
    radius?: number;
    page?: number;
    limit?: number;
  }) => {
    const response = await apiClient.get('/content/local', { params });
    return response.data;
  },
  
  // Get content by ID
  getContentById: async (id: string) => {
    const response = await apiClient.get(`/content/${id}`);
    return response.data;
  },
  
  // Create new content
  createContent: async (data: FormData) => {
    const response = await apiClient.post('/content', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  
  // Update content
  updateContent: async (id: string, data: FormData) => {
    const response = await apiClient.put(`/content/${id}`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  
  // Delete content
  deleteContent: async (id: string) => {
    const response = await apiClient.delete(`/content/${id}`);
    return response.data;
  },
  
  // Search content
  searchContent: async (query: string, params?: {
    page?: number;
    limit?: number;
    filter?: string;
    sort?: string;
    location?: { lat: number; lng: number; radius?: number };
  }) => {
    const response = await apiClient.get('/content/search', { 
      params: { query, ...params } 
    });
    return response.data;
  },
  
  // Get user's content
  getUserContent: async (userId?: string, params?: { page?: number; limit?: number }) => {
    const endpoint = userId ? `/content/user/${userId}` : '/content/my-content';
    const response = await apiClient.get(endpoint, { params });
    return response.data;
  },
  
  // Save content (bookmark)
  saveContent: async (contentId: string) => {
    const response = await apiClient.post(`/content/${contentId}/save`);
    return response.data;
  },
  
  // Unsave content (remove bookmark)
  unsaveContent: async (contentId: string) => {
    const response = await apiClient.delete(`/content/${contentId}/save`);
    return response.data;
  },
  
  // Get saved content
  getSavedContent: async (params?: { page?: number; limit?: number }) => {
    const response = await apiClient.get('/content/saved', { params });
    return response.data;
  },
};

// Notification API
export const notificationAPI = {
  // Get all notifications for current user
  getNotifications: async (params?: { page?: number; limit?: number }) => {
    const response = await apiClient.get('/notifications', { params });
    return response.data;
  },
  
  // Mark notification as read
  markAsRead: async (notificationId: string) => {
    const response = await apiClient.put(`/notifications/${notificationId}/read`);
    return response.data;
  },
  
  // Mark all notifications as read
  markAllAsRead: async () => {
    const response = await apiClient.put('/notifications/read-all');
    return response.data;
  },
  
  // Get unread notification count
  getUnreadCount: async () => {
    const response = await apiClient.get('/notifications/unread-count');
    return response.data;
  },
};

// User API
export const userAPI = {
  // Get user profile
  getUserProfile: async (userId: string) => {
    const response = await apiClient.get(`/users/${userId}`);
    return response.data;
  },
  
  // Update user profile
  updateUserProfile: async (data: {
    name?: string;
    bio?: string;
    avatar?: File;
  }) => {
    const formData = new FormData();
    if (data.name) formData.append('name', data.name);
    if (data.bio) formData.append('bio', data.bio);
    if (data.avatar) formData.append('avatar', data.avatar);
    
    const response = await apiClient.put('/users/profile', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  
  // Follow a user
  followUser: async (userId: string) => {
    const response = await apiClient.post(`/users/${userId}/follow`);
    return response.data;
  },
  
  // Unfollow a user
  unfollowUser: async (userId: string) => {
    const response = await apiClient.delete(`/users/${userId}/follow`);
    return response.data;
  },
  
  // Get user's followers
  getUserFollowers: async (userId: string, params?: { page?: number; limit?: number }) => {
    const response = await apiClient.get(`/users/${userId}/followers`, { params });
    return response.data;
  },
  
  // Get users that a user is following
  getUserFollowing: async (userId: string, params?: { page?: number; limit?: number }) => {
    const response = await apiClient.get(`/users/${userId}/following`, { params });
    return response.data;
  },
  
  // Search for users
  searchUsers: async (query: string, params?: { page?: number; limit?: number }) => {
    const response = await apiClient.get('/users/search', { 
      params: { query, ...params } 
    });
    return response.data;
  },
};

export default {
  auth: authAPI,
  content: contentAPI,
  notifications: notificationAPI,
  user: userAPI,
};
