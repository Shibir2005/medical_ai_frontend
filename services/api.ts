import { get } from "http"

const BASE_URL = 'http://localhost:6767'

export const api = {
  async request(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: object
  ) {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      credentials: 'include',
      headers: data ? { 'Content-Type': 'application/json' } : undefined,
      body: data ? JSON.stringify(data) : undefined,
    })

    const json = await res.json()

    if (!res.ok) {
      throw new Error(json.message || json.detail || 'Request failed')
    }

    return json
  },

  get(endpoint: string) {
    return this.request('GET', endpoint)
  },

  post(endpoint: string, data?: object) {
    return this.request('POST', endpoint, data)
  },

  put(endpoint: string, data?: object) {
    return this.request('PUT', endpoint, data)
  },

  delete(endpoint: string) {
    return this.request('DELETE', endpoint)
  },
}

export const getToken = () => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('token')
}

export const setToken = (token: string) => {
  localStorage.setItem('token', token)
}

export const removeToken = () => {
  localStorage.removeItem('token')
}

export const authService = {
  login: (data: any) => api.post('/api/auth/login/', data),
  register: (data: any) => api.post('/api/auth/register/', data),
  verifyEmail: (data: { token?: string; uid?: string; code?: string }) =>
    api.post('/api/auth/verify-email/', data),

  sendOtp: (email: string) =>
    api.post('/api/auth/forgot-password/', { email }),

  verifyOtpAndReset: (data: any) =>
    api.post('/api/auth/reset-password/', data),

  checkAuth: () => api.get('/api/auth/me/'),
  logout: () => api.post('/api/auth/logout/'),
}


export const sectionService = {
  getAll: () => api.get("/api/health/assessment-types/"),
  create: (data: any) => api.post("/api/health/assessment-types/create/", data),
  update: (id: string, data: any) => api.put(`/api/health/assessment-types/${id}/update/`, data),
  delete: (id: string) => api.delete(`/api/health/assessment-types/${id}/delete/`),
}

export const questionnairesService = {
  getAll: () => api.get("/api/health/assessment-types/full-tree/"),
  get: (id: string) => api.get(`/api/health/assessment-types/${id}/questions/`),
  create: (data: any) => api.post("/api/health/sections/bulk-create/", data),
  update: ( data: any) => api.put("/api/health/sections/bulk-update/", data),
  delete: (id: string) => api.delete(`/api/health/sections/${id}/questions/delete/`),
}

export const adminService = {
  getDashboardStats: () => api.get("/api/controlpanel/dashboard/stats/"),
  getUsers: () => api.get("/api/controlpanel/users/"),
  createUser: (data: any) => api.post("/api/controlpanel/users/create/", data),
  banUser: (id: string, data:any) => api.post(`/api/controlpanel/users/${id}/ban-unban/`, data),
  userAdminRole: (id: string, data:any) => api.post(`/api/controlpanel/users/${id}/admin-rights/`, data)
}