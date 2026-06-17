import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor
api.interceptors.request.use((config) => {
  return config;
});

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || error.message || 'An error occurred';
    return Promise.reject(new Error(message));
  }
);

// ==================
// LEADS
// ==================
export const leadsApi = {
  list: (params?: Record<string, any>) => api.get('/api/leads', { params }).then(r => r.data),
  get: (id: string) => api.get(`/api/leads/${id}`).then(r => r.data),
  create: (data: any) => api.post('/api/leads', data).then(r => r.data),
  update: (id: string, data: any) => api.patch(`/api/leads/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/api/leads/${id}`).then(r => r.data),
  bulkDelete: (ids: string[]) => api.delete('/api/leads', { data: { ids } }).then(r => r.data),
  getTags: () => api.get('/api/leads/tags/all').then(r => r.data),
};

// ==================
// SEARCH
// ==================
export const searchApi = {
  search: (params: any) => api.post('/api/search', params).then(r => r.data),
  analyze: (url: string) => api.post('/api/search/analyze', { url }).then(r => r.data),
  history: () => api.get('/api/search/history').then(r => r.data),
};

// ==================
// AUDIT
// ==================
export const auditApi = {
  run: (url: string, leadId?: string) => api.post('/api/audit', { url, leadId }).then(r => r.data),
  history: (leadId: string) => api.get(`/api/audit/history/${leadId}`).then(r => r.data),
};

// ==================
// OUTREACH
// ==================
export const outreachApi = {
  generate: (leadId: string, type: string) => api.post('/api/outreach/generate', { leadId, type }).then(r => r.data),
  list: (leadId: string) => api.get(`/api/outreach/${leadId}`).then(r => r.data),
  updateStatus: (id: string, status: string) => api.patch(`/api/outreach/${id}/status`, { status }).then(r => r.data),
};

// ==================
// EXPORT
// ==================
export const exportApi = {
  csv: (params?: Record<string, string>) => {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    window.open(`${API_URL}/api/export/csv${queryString}`, '_blank');
  },
};

// ==================
// STATS
// ==================
export const statsApi = {
  overview: () => api.get('/api/stats/overview').then(r => r.data),
};

export default api;
