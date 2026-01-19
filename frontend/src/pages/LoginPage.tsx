import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [employeeNo, setEmployeeNo] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const login = useAuthStore((state) => state.login)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!employeeNo || !password) {
      toast.error('請輸入工號和密碼')
      return
    }

    setLoading(true)
    try {
      await login(employeeNo, password)
      toast.success('登入成功')
      navigate('/dashboard')
    } catch (error) {
      // Error is handled by API interceptor
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-primary-600">照護排班系統</h1>
            <p className="text-gray-500 mt-2">請登入您的帳號</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                工號
              </label>
              <input
                type="text"
                value={employeeNo}
                onChange={(e) => setEmployeeNo(e.target.value)}
                className="input"
                placeholder="請輸入工號"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                密碼
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="請輸入密碼"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3"
            >
              {loading ? '登入中...' : '登入'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>預設密碼為工號</p>
          </div>
        </div>
      </div>
    </div>
  )
}
