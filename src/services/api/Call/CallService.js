// src/services/api/callService.js

// import apiClient from '../config'; // Axios instance with baseURL and interceptors
import apiClient from '../config'; // axios instance pre-configured with baseURL and interceptors

/**
 * Call Service
 * Base URL prefix: /calls
 * Provides methods to interact with call-related backend endpoints.
 */
const callService = {
  /**
   * Get paginated call history for the authenticated user.
   * @param {number} [page=1] - Page number for pagination.
   * @param {number} [limit=20] - Number of items per page.
   * @returns {Promise<Object>} - {
   *   success: true,
   *   data: {
   *     sessions: Array of call session objects,
   *     pagination: { page, limit, total, pages }
   *   }
   * }
   */
  getCallHistory: async (page = 1, limit = 20) => {
    try {
      const response = await apiClient.get('/calls/history', {
        params: { page, limit },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get call history:', error);
      throw error;
    }
  },

  /**
   * Get list of active call sessions.
   * @returns {Promise<Object>} - {
   *   success: true,
   *   data: [ ...active call sessions ]
   * }
   */
  getActiveSessions: async () => {
    try {
      const response = await apiClient.get('/calls/sessions/active');
      return response.data;
    } catch (error) {
      console.error('Failed to get active call sessions:', error);
      throw error;
    }
  },

  /**
   * Initiate a new call session with an astrologer.
   * @param {Object} payload
   * @param {string} payload.astrologerId - MongoID of astrologer (required).
   * @param {string} payload.callType - 'audio' or 'video' (required).
   * @returns {Promise<Object>} - {
   *   success: true,
   *   message: 'Call session created',
   *   data: {
   *     sessionId, orderId, channelName, token, uid, appId,
   *     callType, ratePerMinute
   *   }
   * }
   * @throws 400 if balance insufficient or astrologer offline, 404 if astrologer not found.
   */
  initiateCall: async ({ astrologerId, callType }) => {
    try {
      const response = await apiClient.post('/calls/initiate', {
        astrologerId,
        callType,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to initiate call:', error);
      throw error;
    }
  },

  /**
   * End a call session.
   * @param {string} sessionId - ID of the call session.
   * @param {string} reason - Reason for ending the call, e.g., 'completed'.
   * @returns {Promise<Object>} - {
   *   success: true,
   *   message: 'Call ended successfully',
   *   data: { sessionId, status, duration, totalAmount, endTime }
   * }
   */
  endCall: async (sessionId, reason) => {
    try {
      const response = await apiClient.post('/calls/sessions/end', {
        sessionId,
        reason,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to end call:', error);
      throw error;
    }
  },

  /**
   * Regenerate an Agora token for a call session.
   * @param {string} sessionId - ID of the call session.
   * @returns {Promise<Object>} - {
   *   success: true,
   *   data: { token: "new_agora_rtc_token" }
   * }
   */
  regenerateToken: async (sessionId) => {
    try {
      const response = await apiClient.post('/calls/sessions/regenerate-token', {
        sessionId,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to regenerate token:', error);
      throw error;
    }
  },

  /**
   * Get details of a specific call session.
   * @param {string} sessionId - Call session ID.
   * @returns {Promise<Object>} - {
   *   success: true,
   *   data: {
   *     sessionId, orderId, callType, status, duration,
   *     totalAmount, ratePerMinute, agoraChannelName, startTime,
   *     callMetrics: { averageQuality, userNetworkQuality, astrologerNetworkQuality, reconnectionCount }
   *   }
   * }
   */
  getSessionDetails: async (sessionId) => {
    try {
      const response = await apiClient.get(`/calls/sessions/${sessionId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get session details:', error);
      throw error;
    }
  },

  /**
   * Get call recording information for a specific session.
   * @param {string} sessionId - Call session ID.
   * @returns {Promise<Object>} - {
   *   success: true,
   *   data: {
   *     sessionId, recordingUrl, recordingType, duration, callType
   *   }
   * }
   */
  getCallRecording: async (sessionId) => {
    try {
      const response = await apiClient.get(`/calls/sessions/${sessionId}/recording`);
      return response.data;
    } catch (error) {
      console.error('Failed to get call recording:', error);
      throw error;
    }
  },
};

export default callService;
