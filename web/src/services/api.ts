/**
 * API client — session-first architecture.
 */
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  timeout: 60000,
});

// ── Sessions (primary) ──
export const sessionApi = {
  list: () => api.get('/api/sessions'),
  get: (id: string) => api.get(`/api/sessions/${id}`),
  delete: (id: string) => api.delete(`/api/sessions/${id}`),
  // chat is done via fetch+SSE, not axios
};

// ── Config: Connections & Tools ──
export const connectionApi = {
  list: () => api.get('/api/connections'),
  create: (data: any) => api.post('/api/connections', data),
  delete: (id: string) => api.delete(`/api/connections/${id}`),
  importOpenAPI: (connId: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post(`/api/connections/${connId}/import-openapi`, form);
  },
};

export const toolApi = {
  list: (params?: any) => api.get('/api/tools', { params }),
  update: (id: string, data: any) => api.patch(`/api/tools/${id}`, data),
};

// ── Config: Agents ──
export const agentApi = {
  list: (params?: any) => api.get('/api/agents', { params }),
  create: (data: any) => api.post('/api/agents', data),
  get: (id: string) => api.get(`/api/agents/${id}`),
  update: (id: string, data: any) => api.put(`/api/agents/${id}`, data),
  delete: (id: string) => api.delete(`/api/agents/${id}`),
  playground: (id: string, data: any) => api.post(`/api/agents/${id}/playground`, data),
};

// ── Metrics ──
export const metricsApi = {
  overview: () => api.get('/api/metrics/overview'),
};

export default api;
