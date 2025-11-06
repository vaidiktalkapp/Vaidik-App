
/**
 * Chat Service
 * ---------------------------------------------------------
 * Handles all chat-related API calls for users and astrologers.
 * Base URL: /chat
 * ---------------------------------------------------------
 */

import apiClient from '../config'; // axios instance pre-configured with baseURL and interceptors

export const ChatService = {
  /**
   * 3.1 Get Chat History
   * ---------------------------------------------------------
   * Fetches paginated chat session history.
   *
   * @param {number} [page=1] - Page number for pagination
   * @param {number} [limit=20] - Number of items per page
   * @returns {Promise<Object>} Chat sessions + pagination info
   *
   * Response:
   * {
   *   success: true,
   *   data: {
   *     sessions: [...],
   *     pagination: { page, limit, total, pages }
   *   }
   * }
   */
  getChatHistory: async (page = 1, limit = 20) => {
    try {
      const response = await apiClient.get('/chat/history', {
        params: { page, limit },
      });
      return response.data.data;
    } catch (error) {
      console.error('❌ Error fetching chat history:', error);
      throw error;
    }
  },

  /**
   * 3.2 Get Active Chat Sessions
   * ---------------------------------------------------------
   * Fetches currently active chat sessions.
   *
   * @returns {Promise<Array>} Active chat sessions list
   *
   * Response:
   * {
   *   success: true,
   *   data: [ { sessionId, orderId, astrologerId, ... } ]
   * }
   */
  getActiveSessions: async () => {
    try {
      const response = await apiClient.get('/chat/sessions/active');
      return response.data.data;
    } catch (error) {
      console.error('❌ Error fetching active chat sessions:', error);
      throw error;
    }
  },

  /**
   * 3.3 Get Total Unread Count
   * ---------------------------------------------------------
   * Returns total unread message count across all sessions.
   *
   * @returns {Promise<number>} totalUnread
   *
   * Response:
   * {
   *   success: true,
   *   data: { totalUnread: 12 }
   * }
   */
  getTotalUnreadCount: async () => {
    try {
      const response = await apiClient.get('/chat/unread/total');
      return response.data.data.totalUnread;
    } catch (error) {
      console.error('❌ Error fetching total unread count:', error);
      throw error;
    }
  },

  /**
   * 3.4 Initiate Chat
   * ---------------------------------------------------------
   * Starts a new chat session with an astrologer.
   *
   * @param {string} astrologerId - Astrologer ID
   * @returns {Promise<Object>} Session creation result
   *
   * Request:
   * {
   *   astrologerId: "67123abc..."
   * }
   *
   * Response:
   * {
   *   success: true,
   *   message: "Chat session created",
   *   data: { sessionId, orderId, ratePerMinute, status }
   * }
   *
   * Possible Errors:
   * 400 - Insufficient balance
   * 400 - Astrologer is offline
   * 404 - Astrologer not found
   */
  initiateChat: async (astrologerId) => {
    try {
      const response = await apiClient.post('/chat/initiate', { astrologerId });
      return response.data;
    } catch (error) {
      console.error('❌ Error initiating chat:', error);
      throw error;
    }
  },

  /**
   * 3.5 End Chat Session
   * ---------------------------------------------------------
   * Ends a chat session manually or automatically.
   *
   * @param {string} sessionId - Chat session ID
   * @param {string} reason - Reason for ending the session
   * @returns {Promise<Object>} End session response
   *
   * Request:
   * {
   *   sessionId: "CHAT_1730123456_XYZ789",
   *   reason: "Session completed"
   * }
   *
   * Response:
   * {
   *   success: true,
   *   message: "Session ended successfully",
   *   data: { sessionId, status, duration, totalAmount, ... }
   * }
   */
  endChatSession: async (sessionId, reason) => {
    try {
      const response = await apiClient.post('/chat/sessions/end', {
        sessionId,
        reason,
      });
      return response.data;
    } catch (error) {
      console.error('❌ Error ending chat session:', error);
      throw error;
    }
  },

  /**
   * 3.6 Get Session Messages
   * ---------------------------------------------------------
   * Fetches paginated chat messages for a specific session.
   *
   * @param {string} sessionId - Chat session ID
   * @param {number} [page=1]
   * @param {number} [limit=50]
   * @returns {Promise<Object>} Messages + pagination
   *
   * Response:
   * {
   *   success: true,
   *   data: { messages: [...], pagination: {...} }
   * }
   */
  getSessionMessages: async (sessionId, page = 1, limit = 50) => {
    try {
      const response = await apiClient.get(`/chat/sessions/${sessionId}/messages`, {
        params: { page, limit },
      });
      return response.data.data;
    } catch (error) {
      console.error('❌ Error fetching session messages:', error);
      throw error;
    }
  },

  /**
   * 3.7 Get Unread Count for Session
   * ---------------------------------------------------------
   * Fetches unread message count for a specific chat session.
   *
   * @param {string} sessionId - Chat session ID
   * @returns {Promise<number>} Unread message count
   *
   * Response:
   * {
   *   success: true,
   *   data: { unreadCount: 3 }
   * }
   */
  getUnreadCountForSession: async (sessionId) => {
    try {
      const response = await apiClient.get(`/chat/sessions/${sessionId}/unread`);
      return response.data.data.unreadCount;
    } catch (error) {
      console.error('❌ Error fetching unread count for session:', error);
      throw error;
    }
  },

  /**
   * 3.8 Get Starred Messages
   * ---------------------------------------------------------
   * Retrieves starred (important) messages in a session.
   *
   * @param {string} sessionId - Chat session ID
   * @returns {Promise<Array>} List of starred messages
   *
   * Response:
   * {
   *   success: true,
   *   data: [ { messageId, content, type, sentAt } ]
   * }
   */
  getStarredMessages: async (sessionId) => {
    try {
      const response = await apiClient.get(`/chat/sessions/${sessionId}/starred`);
      return response.data.data;
    } catch (error) {
      console.error('❌ Error fetching starred messages:', error);
      throw error;
    }
  },

  /**
   * 3.9 Search Messages in a Session
   * ---------------------------------------------------------
   * Searches chat messages for a keyword.
   *
   * @param {string} sessionId - Chat session ID
   * @param {string} query - Search term (min length: 2)
   * @returns {Promise<Array>} Matching messages
   *
   * Example Request: /chat/sessions/:sessionId/search?q=career
   *
   * Response:
   * {
   *   success: true,
   *   data: [ { messageId, content, type, sentAt } ]
   * }
   */
  searchMessages: async (sessionId, query) => {
    try {
      const response = await apiClient.get(`/chat/sessions/${sessionId}/search`, {
        params: { q: query },
      });
      return response.data.data;
    } catch (error) {
      console.error('❌ Error searching messages:', error);
      throw error;
    }
  },

  /**
   * 3.10 Edit Message
   * ---------------------------------------------------------
   * Edits an existing message content.
   *
   * @param {string} messageId - Message ID
   * @param {string} newContent - Updated text content
   * @returns {Promise<Object>} Updated message info
   *
   * Request:
   * {
   *   messageId: "MSG_1730123456_ABC",
   *   newContent: "Updated message text"
   * }
   *
   * Response:
   * {
   *   success: true,
   *   message: "Message edited successfully",
   *   data: { messageId, content, isEdited, editedAt }
   * }
   */
  editMessage: async (messageId, newContent) => {
    try {
      const response = await apiClient.post('/chat/messages/edit', {
        messageId,
        newContent,
      });
      return response.data;
    } catch (error) {
      console.error('❌ Error editing message:', error);
      throw error;
    }
  },
};
