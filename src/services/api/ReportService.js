// src/services/api/ReportService.js
import apiClient from './config';

const ReportService = {
  /**
   * Create a new report (astrologer creates for user)
   * POST /reports/create/:astrologerId
   */
  createReport: async (astrologerId, createDto) => {
    try {
      const response = await apiClient.post(`/reports/create/${astrologerId}`, createDto);
      return response.data;
    } catch (error) {
      console.error('❌ Error creating report:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  /**
   * Update a report (content/status)
   * PATCH /reports/update/:reportId/:astrologerId
   */
  updateReport: async (reportId, astrologerId, updateDto) => {
    try {
      const response = await apiClient.patch(`/reports/update/${reportId}/${astrologerId}`, updateDto);
      return response.data;
    } catch (error) {
      console.error('❌ Error updating report:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  /**
   * Upload report file (PDF)
   * POST /reports/upload/:reportId/:astrologerId
   */
  uploadReportFile: async (reportId, astrologerId, formData) => {
    try {
      const response = await apiClient.post(`/reports/upload/${reportId}/${astrologerId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      console.error('❌ Error uploading report file:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  /**
   * Get astrologer’s reports
   * GET /astrologer/reports/:astrologerId?page=1&limit=20&status=&type=
   */
  getAstrologerReports: async (astrologerId, page = 1, limit = 20, filters = {}) => {
    try {
      const params = new URLSearchParams({ page, limit, ...filters }).toString();
      const response = await apiClient.get(`/astrologer/reports/${astrologerId}?${params}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching astrologer reports:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  /**
   * Get user’s reports
   * GET /reports:userId?page=1&limit=20&status=&type=
   */
  getUserReports: async (userId, page = 1, limit = 20, filters = {}) => {
    try {
      const params = new URLSearchParams({ page, limit, ...filters }).toString();
      const response = await apiClient.get(`/reports/${userId}?${params}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching user reports:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  /**
   * Get single report details
   * GET /reports/details/:reportId/:userId
   */
  getReportDetails: async (reportId, userId) => {
    try {
      const response = await apiClient.get(`/reports/details/${reportId}/${userId}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching report details:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  /**
   * Download report
   * GET /reports/download/:reportId/:userId
   */
  downloadReport: async (reportId, userId) => {
    try {
      const response = await apiClient.get(`/reports/download/${reportId}/${userId}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error downloading report:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  /**
   * Get user report statistics
   * GET /reports/stats/user/:userId
   */
  getUserReportStats: async (userId) => {
    try {
      const response = await apiClient.get(`/reports/stats/user/${userId}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching user stats:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  /**
   * Get astrologer report statistics
   * GET /reports/stats/astrologer/:astrologerId
   */
  getAstrologerReportStats: async (astrologerId) => {
    try {
      const response = await apiClient.get(`/reports/stats/astrologer/${astrologerId}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching astrologer stats:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  /**
   * Delete report
   * DELETE /reports/delete/:reportId/:astrologerId
   */
  deleteReport: async (reportId, astrologerId) => {
    try {
      const response = await apiClient.delete(`/reports/delete/${reportId}/${astrologerId}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error deleting report:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },
};

export default ReportService;
