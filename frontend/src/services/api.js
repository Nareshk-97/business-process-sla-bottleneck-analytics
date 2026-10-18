import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT access token to outgoing requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sla_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token if expired/invalid
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        localStorage.removeItem('sla_token');
        localStorage.removeItem('sla_user');
        window.location.href = '/login';
      }
    }
    const errorData = error.response?.data || {
      success: false,
      message: error.message || 'Network connection failed'
    };
    return Promise.reject(errorData);
  }
);

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/profile'),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
};

export const processesAPI = {
  getAll: (params) => api.get('/processes', { params }),
  getById: (id) => api.get(`/processes/${id}`),
  create: (data) => api.post('/processes', data),
  update: (id, data) => api.put(`/processes/${id}`, data),
};

export const stagesAPI = {
  getByProcessId: (processId) => api.get(`/processes/${processId}/stages`),
  create: (processId, data) => api.post(`/processes/${processId}/stages`, data),
  update: (id, data) => api.put(`/stages/${id}`, data),
};

export const requestsAPI = {
  getAll: (params) => api.get('/requests', { params }),
  getById: (id) => api.get(`/requests/${id}`),
  getTracking: (id) => api.get(`/requests/${id}/tracking`),
  create: (data) => api.post('/requests', data),
  completeStage: (id, data) => api.post(`/requests/${id}/complete-stage`, data),
};

export const analyticsAPI = {
  getOverview: (params) => api.get('/analytics/overview', { params }),
  getProcesses: () => api.get('/analytics/processes'),
  getStages: (params) => api.get('/analytics/stages', { params }),
  getDepartments: () => api.get('/analytics/departments'),
  getSla: (params) => api.get('/analytics/sla', { params }),
  getBottlenecks: (params) => api.get('/analytics/bottlenecks', { params }),
  simulate: (data) => api.post('/analytics/simulation', data),
};

export const reportsAPI = {
  getImprovementReport: (params) => api.get('/reports/improvement', { params }),
  getSlaReport: (params) => api.get('/reports/sla', { params }),
  getProcessReport: (processId) => api.get(`/reports/process/${processId}`),
};

export const adminAPI = {
  getUsers: () => api.get('/admin/users'),
  toggleUserStatus: (id, data) => api.put(`/admin/users/${id}/status`, data),
  getDepartments: () => api.get('/admin/departments'),
  createDepartment: (data) => api.post('/admin/departments', data),
  getAuditLogs: (params) => api.get('/admin/audit-logs', { params }),
};

export default api;
