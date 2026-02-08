/**
 * API client for Agentic Work Studio backend.
 */
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  timeout: 60000,
});

// ── Connections ──
export const connectionApi = {
  list: () => api.get('/api/connections'),
  create: (data: any) => api.post('/api/connections', data),
  get: (id: string) => api.get(`/api/connections/${id}`),
  delete: (id: string) => api.delete(`/api/connections/${id}`),
  importOpenAPI: (connId: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post(`/api/connections/${connId}/import-openapi`, form);
  },
};

// ── Tools ──
export const toolApi = {
  list: (params?: any) => api.get('/api/tools', { params }),
  get: (id: string) => api.get(`/api/tools/${id}`),
  update: (id: string, data: any) => api.patch(`/api/tools/${id}`, data),
};

// ── Agents ──
export const agentApi = {
  list: (params?: any) => api.get('/api/agents', { params }),
  create: (data: any) => api.post('/api/agents', data),
  get: (id: string) => api.get(`/api/agents/${id}`),
  update: (id: string, data: any) => api.put(`/api/agents/${id}`, data),
  delete: (id: string) => api.delete(`/api/agents/${id}`),
  playground: (id: string, data: { message: string; context?: any }) =>
    api.post(`/api/agents/${id}/playground`, data),
};

// ── Workflows ──
export const workflowApi = {
  list: (params?: any) => api.get('/api/workflows', { params }),
  create: (data: any) => api.post('/api/workflows', data),
  get: (id: string) => api.get(`/api/workflows/${id}`),
  update: (id: string, data: any) => api.put(`/api/workflows/${id}`, data),
  publish: (id: string) => api.post(`/api/workflows/${id}/publish`),
  delete: (id: string) => api.delete(`/api/workflows/${id}`),
};

// ── Runs ──
export const runApi = {
  trigger: (workflowId: string, inputData: any) =>
    api.post(`/api/runs/workflows/${workflowId}/trigger`, { input_data: inputData }),
  list: (params?: any) => api.get('/api/runs', { params }),
  get: (id: string) => api.get(`/api/runs/${id}`),
  getNodes: (id: string) => api.get(`/api/runs/${id}/nodes`),
};

// ── Approvals ──
export const approvalApi = {
  list: (params?: any) => api.get('/api/approvals', { params }),
  get: (id: string) => api.get(`/api/approvals/${id}`),
  decide: (id: string, decision: string, decidedBy: string) =>
    api.post(`/api/approvals/${id}/decide`, { decision, decided_by: decidedBy }),
};

// ── Metrics ──
export const metricsApi = {
  overview: () => api.get('/api/metrics/overview'),
  costs: () => api.get('/api/metrics/costs'),
};

export default api;
