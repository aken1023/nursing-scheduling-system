import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeftIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import api from '../services/api'

interface Preference {
  id: string
  preferenceType: 'preferred' | 'avoid' | 'unavailable'
  shiftType?: 'DAY' | 'EVENING' | 'NIGHT'
  dayOfWeek?: number
  specificDate?: string
  effectiveFrom?: string
  effectiveTo?: string
  reason?: string
}

interface Employee {
  id: string
  employeeNo: string
  name: string
}

const DAYS_OF_WEEK = ['週日', '週一', '週二', '週三', '週四', '週五', '週六']
const SHIFT_TYPES = [
  { value: 'DAY', label: '白班' },
  { value: 'EVENING', label: '小夜' },
  { value: 'NIGHT', label: '大夜' },
]
const PREFERENCE_TYPES = [
  { value: 'preferred', label: '偏好', color: 'bg-green-100 text-green-800' },
  { value: 'avoid', label: '避免', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'unavailable', label: '不可', color: 'bg-red-100 text-red-800' },
]

export default function EmployeePreferencesPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [preferences, setPreferences] = useState<Preference[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    preferenceType: 'preferred' as const,
    shiftType: '',
    dayOfWeek: '',
    specificDate: '',
    effectiveFrom: '',
    effectiveTo: '',
    reason: '',
  })

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    try {
      const [empRes, prefRes] = await Promise.all([
        api.get(`/employees/${id}`),
        api.get(`/employees/${id}/preferences`),
      ])
      setEmployee(empRes.data)
      setPreferences(prefRes.data)
    } catch {
      toast.error('載入資料失敗')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    try {
      const data: any = {
        preferenceType: formData.preferenceType,
      }
      if (formData.shiftType) data.shiftType = formData.shiftType
      if (formData.dayOfWeek !== '') data.dayOfWeek = parseInt(formData.dayOfWeek)
      if (formData.specificDate) data.specificDate = formData.specificDate
      if (formData.effectiveFrom) data.effectiveFrom = formData.effectiveFrom
      if (formData.effectiveTo) data.effectiveTo = formData.effectiveTo
      if (formData.reason) data.reason = formData.reason

      await api.post(`/employees/${id}/preferences`, data)
      toast.success('新增成功')
      setShowModal(false)
      resetForm()
      fetchData()
    } catch {
      toast.error('新增失敗')
    }
  }

  const handleDelete = async (prefId: string) => {
    if (!confirm('確定要刪除此偏好設定？')) return
    try {
      await api.delete(`/employees/${id}/preferences/${prefId}`)
      toast.success('刪除成功')
      fetchData()
    } catch {
      toast.error('刪除失敗')
    }
  }

  const resetForm = () => {
    setFormData({
      preferenceType: 'preferred',
      shiftType: '',
      dayOfWeek: '',
      specificDate: '',
      effectiveFrom: '',
      effectiveTo: '',
      reason: '',
    })
  }

  const getPreferenceLabel = (pref: Preference) => {
    const parts: string[] = []
    if (pref.shiftType) {
      parts.push(SHIFT_TYPES.find(s => s.value === pref.shiftType)?.label || pref.shiftType)
    }
    if (pref.dayOfWeek !== undefined && pref.dayOfWeek !== null) {
      parts.push(DAYS_OF_WEEK[pref.dayOfWeek])
    }
    if (pref.specificDate) {
      parts.push(pref.specificDate)
    }
    return parts.length > 0 ? parts.join(' / ') : '所有班別'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/employees')}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {employee?.name} 的偏好設定
          </h1>
          <p className="text-gray-500">工號：{employee?.employeeNo}</p>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">排班偏好</h2>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            新增偏好
          </button>
        </div>

        {preferences.length === 0 ? (
          <p className="text-center text-gray-500 py-8">尚無偏好設定</p>
        ) : (
          <div className="space-y-3">
            {preferences.map((pref) => {
              const prefType = PREFERENCE_TYPES.find(p => p.value === pref.preferenceType)
              return (
                <div
                  key={pref.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${prefType?.color}`}>
                      {prefType?.label}
                    </span>
                    <div>
                      <p className="font-medium">{getPreferenceLabel(pref)}</p>
                      {pref.reason && (
                        <p className="text-sm text-gray-500">{pref.reason}</p>
                      )}
                      {(pref.effectiveFrom || pref.effectiveTo) && (
                        <p className="text-xs text-gray-400">
                          生效期間：{pref.effectiveFrom || '無限制'} ~ {pref.effectiveTo || '無限制'}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(pref.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 新增偏好 Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">新增偏好設定</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  偏好類型 *
                </label>
                <select
                  className="input"
                  value={formData.preferenceType}
                  onChange={(e) => setFormData({ ...formData, preferenceType: e.target.value as any })}
                >
                  {PREFERENCE_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  班別類型
                </label>
                <select
                  className="input"
                  value={formData.shiftType}
                  onChange={(e) => setFormData({ ...formData, shiftType: e.target.value })}
                >
                  <option value="">全部班別</option>
                  {SHIFT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  固定星期
                </label>
                <select
                  className="input"
                  value={formData.dayOfWeek}
                  onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })}
                >
                  <option value="">不限</option>
                  {DAYS_OF_WEEK.map((day, idx) => (
                    <option key={idx} value={idx}>{day}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  特定日期
                </label>
                <input
                  type="date"
                  className="input"
                  value={formData.specificDate}
                  onChange={(e) => setFormData({ ...formData, specificDate: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    生效起始日
                  </label>
                  <input
                    type="date"
                    className="input"
                    value={formData.effectiveFrom}
                    onChange={(e) => setFormData({ ...formData, effectiveFrom: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    生效結束日
                  </label>
                  <input
                    type="date"
                    className="input"
                    value={formData.effectiveTo}
                    onChange={(e) => setFormData({ ...formData, effectiveTo: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  原因說明
                </label>
                <textarea
                  className="input"
                  rows={2}
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="選填"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => { setShowModal(false); resetForm() }}
                className="btn-secondary"
              >
                取消
              </button>
              <button onClick={handleSubmit} className="btn-primary">
                新增
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
