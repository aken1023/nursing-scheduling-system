import axios from 'axios'
import toast from 'react-hot-toast'

const api = axios.create({
  baseURL: '/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 請求攔截器
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 回應攔截器
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || '發生錯誤，請稍後再試'

    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
      toast.error('登入已過期，請重新登入')
    } else {
      toast.error(message)
    }

    return Promise.reject(error)
  }
)

export default api

// API 服務
export const authApi = {
  login: (data: { employeeNo: string; password: string }) =>
    api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  changePassword: (data: { oldPassword: string; newPassword: string }) =>
    api.post('/auth/change-password', data),
}

export const hospitalsApi = {
  getAll: () => api.get('/hospitals'),
  getOne: (id: string) => api.get(`/hospitals/${id}`),
  create: (data: any) => api.post('/hospitals', data),
  update: (id: string, data: any) => api.patch(`/hospitals/${id}`, data),
  delete: (id: string) => api.delete(`/hospitals/${id}`),
}

export const employeesApi = {
  getAll: (params?: any) => api.get('/employees', { params }),
  getOne: (id: string) => api.get(`/employees/${id}`),
  create: (data: any) => api.post('/employees', data),
  update: (id: string, data: any) => api.patch(`/employees/${id}`, data),
  delete: (id: string) => api.delete(`/employees/${id}`),
  getLeaders: (hospitalId?: string) =>
    api.get('/employees/leaders', { params: { hospitalId } }),
}

export const shiftsApi = {
  getAll: (params?: any) => api.get('/shifts', { params }),
  getOne: (id: string) => api.get(`/shifts/${id}`),
  create: (data: any) => api.post('/shifts', data),
  update: (id: string, data: any) => api.patch(`/shifts/${id}`, data),
  delete: (id: string, reason?: string) =>
    api.delete(`/shifts/${id}`, { params: { reason } }),
  batchUpdate: (data: any) => api.post('/shifts/batch', data),
  getDailySummary: (hospitalId: string, date: string) =>
    api.get(`/shifts/summary/${hospitalId}/${date}`),
  getAvailableEmployees: (hospitalId: string, date: string, shiftType: string) =>
    api.get('/shifts/available-employees', {
      params: { hospitalId, date, shiftType },
    }),
  getDashboard: (hospitalId?: string) =>
    api.get('/shifts/monitor/dashboard', { params: { hospitalId } }),
  getLeaderGaps: (startDate: string, endDate: string) =>
    api.get('/shifts/monitor/leader-gaps', { params: { startDate, endDate } }),
}

export const leavesApi = {
  getAll: (params?: any) => api.get('/leaves', { params }),
  getOne: (id: string) => api.get(`/leaves/${id}`),
  create: (data: any) => api.post('/leaves', data),
  approve: (id: string) => api.put(`/leaves/${id}/approve`),
  reject: (id: string, reason: string) =>
    api.put(`/leaves/${id}/reject`, { reason }),
  cancel: (id: string) => api.delete(`/leaves/${id}`),
  getPendingCount: () => api.get('/leaves/pending-count'),
}

export const crossHospitalApi = {
  getAll: (params?: any) => api.get('/cross-hospital', { params }),
  getOne: (id: string) => api.get(`/cross-hospital/${id}`),
  create: (data: any) => api.post('/cross-hospital', data),
  approve: (id: string) => api.put(`/cross-hospital/${id}/approve`),
  reject: (id: string, reason: string) =>
    api.put(`/cross-hospital/${id}/reject`, { reason }),
  getStaffingSummary: (date: string, shiftType: string) =>
    api.get('/cross-hospital/staffing-summary', { params: { date, shiftType } }),
}

export const notificationsApi = {
  getAll: (limit?: number) => api.get('/notifications', { params: { limit } }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id: string) => api.post(`/notifications/${id}/read`),
  markAllAsRead: () => api.post('/notifications/read-all'),
  delete: (id: string) => api.delete(`/notifications/${id}`),
}

export const exportApi = {
  exportExcel: (params: any) =>
    api.get('/export/excel', { params, responseType: 'blob' }),
  exportPdf: (params: any) =>
    api.get('/export/pdf', { params, responseType: 'blob' }),
}
