// src/services/AuthService.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
// import { API_BASE_URL } from '@env';


const API_BASE_URL = 'http://192.168.1.10:3001/api/v1';
// const API_BASE_URL = 'http://192.168.1.23:3001/api/v1';
// const API_BASE_URL = 'https://vaidik-server.onrender.com/api/v1'

console.log('🌍 Loaded API_BASE_URL:', API_BASE_URL);

class AuthService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    this.setupInterceptors();
  }

  setupInterceptors() {
    this.api.interceptors.request.use(
      (config) => {
        console.log('📤 API Request:', config.method?.toUpperCase(), config.url);
        console.log('📤 Request Body:', config.data);
        return config;
      },
      (error) => {
        console.error('📤 Request Error:', error);
        return Promise.reject(error);
      }
    );

    this.api.interceptors.response.use(
      (response) => {
        console.log('📥 API Response:', response.status, response.config.url);
        console.log('📥 Response Data:', response.data);
        return response;
      },
      (error) => {
        console.error('❌ API Error:', {
          status: error.response?.status,
          url: error.config?.url,
          message: error.response?.data?.message || error.message,
          data: error.response?.data,
        });
        return Promise.reject(error);
      }
    );
  }

  // ============================================
  // Storage Methods
  // ============================================

  async storeTokens(accessToken, refreshToken) {
    try {
      const entries = [];

      if (accessToken) {
        entries.push(['accessToken', accessToken]);
        console.log('💾 Storing access token:', accessToken.substring(0, 30) + '...');
      } else {
        console.warn('⚠️ No access token to store');
      }

      if (refreshToken) {
        entries.push(['refreshToken', refreshToken]);
        console.log('💾 Storing refresh token:', refreshToken.substring(0, 30) + '...');
      } else {
        console.warn('⚠️ No refresh token to store');
      }

      if (entries.length > 0) {
        await AsyncStorage.multiSet(entries);
        console.log('✅ Tokens stored successfully');
        
        // ✅ ADDED: Verify storage
        const storedAccess = await AsyncStorage.getItem('accessToken');
        const storedRefresh = await AsyncStorage.getItem('refreshToken');
        console.log('✅ Verified tokens in storage:', {
          hasAccessToken: !!storedAccess,
          hasRefreshToken: !!storedRefresh,
        });
      }
    } catch (error) {
      console.error('❌ Token storage error:', error);
      throw error;
    }
  }

  async getAccessToken() {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      console.log('🔑 Retrieved access token:', token ? token.substring(0, 30) + '...' : 'null');
      return token;
    } catch (error) {
      console.error('❌ Token retrieval error:', error);
      return null;
    }
  }

  async getRefreshToken() {
    try {
      const token = await AsyncStorage.getItem('refreshToken');
      console.log('🔑 Retrieved refresh token:', token ? token.substring(0, 30) + '...' : 'null');
      return token;
    } catch (error) {
      console.error('❌ Refresh token retrieval error:', error);
      return null;
    }
  }

  async storeUser(user) {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(user));
      console.log('✅ User data stored');
    } catch (error) {
      console.error('❌ User storage error:', error);
      throw error;
    }
  }

  async getUser() {
    try {
      const user = await AsyncStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('❌ User retrieval error:', error);
      return null;
    }
  }

  async clearStorage() {
    try {
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
      console.log('✅ Storage cleared');
    } catch (error) {
      console.error('❌ Storage clear error:', error);
    }
  }

  // ============================================
  // Authentication Methods
  // ============================================

  async sendOtp(phoneNumber, countryCode = '91') {
    try {
      const cleanCountryCode = countryCode.replace('+', '');
      
      console.log('📞 Sending OTP to:', cleanCountryCode, phoneNumber);

      const response = await this.api.post('/auth/send-otp', {
        phoneNumber: phoneNumber,
        countryCode: cleanCountryCode,
      });

      if (response.data.success) {
        console.log('✅ OTP sent successfully');
        return {
          success: true,
          message: response.data.message,
          data: response.data.data,
        };
      }

      throw new Error(response.data.message || 'Failed to send OTP');
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async verifyOtp(phoneNumber, countryCode = '91', otp) {
    try {
      const cleanCountryCode = countryCode.replace('+', '');

      console.log('🔐 Verifying OTP for:', cleanCountryCode, phoneNumber);

      const response = await this.api.post('/auth/verify-otp', {
        phoneNumber: phoneNumber,
        countryCode: cleanCountryCode,
        otp: otp,
      });

      if (response.data.success) {
        const { user, tokens, isNewUser } = response.data.data;

        // ✅ ADDED: Validate tokens before storing
        if (!tokens || !tokens.accessToken || !tokens.refreshToken) {
          console.error('❌ Invalid tokens in response:', tokens);
          throw new Error('Invalid tokens received from server');
        }

        console.log('✅ Tokens received:', {
          hasAccessToken: !!tokens.accessToken,
          hasRefreshToken: !!tokens.refreshToken,
          expiresIn: tokens.expiresIn,
        });

        // Store tokens and user data
        await this.storeTokens(tokens.accessToken, tokens.refreshToken);
        await this.storeUser(user);

        console.log('✅ OTP verified, user logged in:', user.phoneNumber);
        console.log('✅ Is new user:', isNewUser);

        return {
          success: true,
          message: response.data.message,
          data: {
            user,
            tokens,
            isNewUser,
          },
        };
      }

      throw new Error(response.data.message || 'OTP verification failed');
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async verifyTruecaller(truecallerData) {
    try {
      console.log('🔐 Verifying Truecaller data');

      const response = await this.api.post('/auth/verify-truecaller', {
        authorizationCode: truecallerData.authorizationCode,
        codeVerifier: truecallerData.codeVerifier,
      });

      if (response.data.success) {
        const { user, tokens, isNewUser } = response.data.data;

        // ✅ ADDED: Validate tokens
        if (!tokens || !tokens.accessToken || !tokens.refreshToken) {
          console.error('❌ Invalid tokens in response:', tokens);
          throw new Error('Invalid tokens received from server');
        }

        // Store tokens and user data
        await this.storeTokens(tokens.accessToken, tokens.refreshToken);
        await this.storeUser(user);

        console.log('✅ Truecaller verified, user logged in:', user.phoneNumber);
        console.log('👤 User name from backend:', user.name);
        console.log('✅ Is new user:', isNewUser);

        return {
          success: true,
          message: response.data.message,
          data: {
            user,
            tokens,
            isNewUser,
          },
        };
      }

      throw new Error(response.data.message || 'Truecaller verification failed');
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async checkAuthStatus() {
    try {
      const accessToken = await this.getAccessToken();
      const user = await this.getUser();

      if (accessToken && user) {
        console.log('✅ User is authenticated:', user.phoneNumber);
        return { isAuthenticated: true, user, token: accessToken };
      }

      console.log('ℹ️ User not authenticated');
      return { isAuthenticated: false };
    } catch (error) {
      console.error('❌ Auth check error:', error);
      return { isAuthenticated: false };
    }
  }

  async refreshAccessToken() {
    try {
      const refreshToken = await this.getRefreshToken();

      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      console.log('🔄 Refreshing access token...');
      console.log('🔄 Using refresh token:', refreshToken.substring(0, 30) + '...');

      const response = await this.api.post('/auth/refresh', {
        refreshToken,
      });

      console.log('📥 Refresh API response:', response.data);

      if (response.data.success) {
        const { accessToken, refreshToken: newRefreshToken } = response.data.data;

        // ✅ ADDED: Validate new tokens
        if (!accessToken || !newRefreshToken) {
          console.error('❌ Invalid refresh response:', response.data.data);
          throw new Error('Invalid tokens in refresh response');
        }

        console.log('✅ New tokens received:', {
          accessToken: accessToken.substring(0, 30) + '...',
          refreshToken: newRefreshToken.substring(0, 30) + '...',
        });

        // Store new tokens
        await this.storeTokens(accessToken, newRefreshToken);

        console.log('✅ Access token refreshed');
        return accessToken;
      }

      throw new Error('Token refresh failed');
    } catch (error) {
      console.error('❌ Token refresh error:', error);
      // Clear auth data on refresh failure
      await this.clearStorage();
      throw error;
    }
  }

  async logout() {
    try {
      const accessToken = await this.getAccessToken();

      if (accessToken) {
        try {
          await this.api.post(
            '/auth/logout',
            {},
            {
              headers: { Authorization: `Bearer ${accessToken}` },
            }
          );
          console.log('✅ Logout API called successfully');
        } catch (error) {
          console.log('⚠️ Logout API call failed, clearing local data anyway');
        }
      }

      await this.clearStorage();
      console.log('✅ User logged out');
    } catch (error) {
      console.error('❌ Logout error:', error);
      await this.clearStorage();
    }
  }

  handleError(error) {
    if (error.response) {
      const message =
        error.response.data?.message ||
        error.response.data?.error?.details ||
        error.response.data?.error ||
        `Request failed with status ${error.response.status}`;

      console.error('❌ Server Error:', message);
      return new Error(message);
    } else if (error.request) {
      console.error('❌ Network Error: No response from server');
      return new Error('No response from server. Check your connection.');
    } else {
      console.error('❌ Error:', error.message);
      return new Error(error.message || 'An unexpected error occurred');
    }
  }
}

export default new AuthService();
