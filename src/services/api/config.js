// src/services/api/config.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import { API_BASE_URL } from '@env';

// API Base URL
// const API_BASE_URL = 'http://192.168.1.10:3001/api/v1';
// const API_BASE_URL = 'http://192.168.1.23:3001/api/v1';
const API_BASE_URL = 'https://vaidik-server.onrender.com/api/v1'

console.log('🌍 API Base URL:', API_BASE_URL);

/**
 * Axios instance for all API requests
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================
// REQUEST INTERCEPTOR - Add Auth Token
// ============================================

apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('🔑 Auth token added to request:', config.url);
        console.log('🔑 Token preview:', token.substring(0, 30) + '...');
      } else {
        console.log('⚠️ No auth token found for request:', config.url);
      }
    } catch (error) {
      console.error('❌ Error retrieving token:', error);
    }

    console.log('📤 API Request:', config.method?.toUpperCase(), config.url);

    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// ============================================
// RESPONSE INTERCEPTOR - Handle Token Refresh
// ============================================

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.config.url, response.status);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    console.error('❌ API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
    });

    // Handle 401 Unauthorized - Token Expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');

        if (!refreshToken) {
          console.error('❌ No refresh token available');
          throw new Error('No refresh token available');
        }

        console.log('🔄 Attempting to refresh access token...');
        console.log('🔄 Refresh token preview:', refreshToken.substring(0, 30) + '...');

        // ✅ FIXED: Call refresh endpoint with correct structure
        const { data } = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          { refreshToken }, // Backend expects { refreshToken: "..." }
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        console.log('📥 Refresh response:', data);
console.log('📥 Refresh response.data:', data.data); // ← ADD THIS
console.log('📥 Has accessToken:', !!data.data?.accessToken); // ← ADD THIS
console.log('📥 Has refreshToken:', !!data.data?.refreshToken); // ← ADD THIS

        if (data.success) {
          // ✅ FIXED: Extract tokens with correct field names
          const newAccessToken = data.data.accessToken; // ✅ CORRECT - "accessToken"
          const newRefreshToken = data.data.refreshToken; // ✅ CORRECT - "refreshToken"

          if (!newAccessToken || !newRefreshToken) {
            console.error('❌ Invalid refresh response - missing tokens');
            throw new Error('Invalid refresh response');
          }

          // Store new tokens
          await AsyncStorage.multiSet([
            ['accessToken', newAccessToken],
            ['refreshToken', newRefreshToken],
          ]);

          console.log('✅ Tokens refreshed successfully');
          console.log('✅ New access token:', newAccessToken.substring(0, 30) + '...');

          // Update headers
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

          // Process queued requests
          processQueue(null, newAccessToken);
          isRefreshing = false;

          // Retry original request
          return apiClient(originalRequest);
        } else {
          throw new Error(data.message || 'Token refresh failed');
        }
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError);
        console.error('❌ Refresh error details:', {
          message: refreshError.message,
          response: refreshError.response?.data,
        });

        // Process queued requests with error
        processQueue(refreshError, null);
        isRefreshing = false;

        // Clear all auth data
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);

        console.log('🔴 Force logout - Tokens cleared');

        // Reject with specific error
        return Promise.reject(new Error('Session expired. Please login again.'));
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
