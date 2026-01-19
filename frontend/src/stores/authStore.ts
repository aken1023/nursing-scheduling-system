import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../services/api'

interface User {
  id: string
  employeeNo: string
  name: string
  role: string
  isLeader: boolean
  isDeputy?: boolean
  hospitals: Array<{ id: string; name: string }>
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (employeeNo: string, password: string) => Promise<void>
  logout: () => void
  setUser: (user: User) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (employeeNo: string, password: string) => {
        const response = await api.post('/auth/login', { employeeNo, password })
        const { accessToken, user } = response.data

        localStorage.setItem('token', accessToken)
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`

        set({
          user,
          token: accessToken,
          isAuthenticated: true,
        })
      },

      logout: () => {
        localStorage.removeItem('token')
        delete api.defaults.headers.common['Authorization']
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        })
      },

      setUser: (user: User) => set({ user }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

// 初始化時設定 token
const token = localStorage.getItem('token')
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`
}
