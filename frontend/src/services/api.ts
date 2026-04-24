import axios from 'axios';
import { authService } from './auth';

const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use(config => {
  const token = authService.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

// Report API
export const reportAPI = {
  create: async (data: any) => {
    const response = await api.post('/reports', data);
    return response.data;
  },

  uploadMedia: async (reportId: string, files: File[]) => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    const response = await api.post(`/reports/${reportId}/media`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  getStatus: async (referenceNumber: string) => {
    const response = await api.get(`/reports/${referenceNumber}/status`);
    return response.data;
  },

  getAll: async (params?: any) => {
    const response = await api.get('/reports/dashboard/list', { params });
    return response.data;
  },

  updateStatus: async (id: string, data: any) => {
    const response = await api.put(`/reports/dashboard/${id}`, data);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/reports/dashboard/stats');
    return response.data;
  }
};

// SMS API for admin UI and gateway integration
export const smsAPI = {
  // Fetch SMS inbox with pagination
  getInbox: async (page: number = 1, limit: number = 10) => {
    const response = await api.get('/admin/sms-inbox', {
      params: { page, limit }
    });
    return response.data;
  },

  // Get SMS inbox statistics
  getStats: async () => {
    const response = await api.get('/admin/sms-inbox/stats');
    return response.data;
  },

  // Approve SMS and convert to formal report
  approveSms: async (smsId: string, data?: { notes?: string }) => {
    const response = await api.post(`/admin/sms-inbox/${smsId}/approve`, data);
    return response.data;
  },

  // Reject SMS report
  rejectSms: async (smsId: string, data: { reason: string }) => {
    const response = await api.post(`/admin/sms-inbox/${smsId}/reject`, data);
    return response.data;
  },

  // Ask for clarification
  askClarification: async (smsId: string, data: { question: string }) => {
    const response = await api.post(`/admin/sms-inbox/${smsId}/ask-clarification`, data);
    return response.data;
  },

  // Legacy: fetch inbound sms messages (deprecated, use getInbox instead)
  getMessages: async () => {
    const response = await api.get('/sms_messages');
    return response.data;
  },

  // Legacy: mark message processed (deprecated, use approveSms instead)
  markProcessed: async (id: string, reportId?: string) => {
    const response = await api.post(`/sms_messages/${id}/mark_processed`, { reportId });
    return response.data;
  },

  // Outgoing endpoints (typically used by gateway)
  getOutgoing: async () => {
    const response = await api.get('/outgoing_sms');
    return response.data;
  },

  postOutgoingResult: async (payload: any) => {
    const response = await api.post('/outgoing_sms/result', payload);
    return response.data;
  }
};

export default api;
