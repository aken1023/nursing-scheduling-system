import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  UserGroupIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentCheckIcon,
  ArrowsRightLeftIcon,
} from '@heroicons/react/24/outline'
import { shiftsApi, leavesApi, hospitalsApi } from '../services/api'
import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'

interface DashboardData {
  todayShifts: number
  leaderGapCount: number
  coverageRate: number
  leaderGaps: Array<{
    date: Date
    hospitalId: string
    hospitalName: string
    shiftType: string
    gap: number
    suggestedLeaders: Array<{ id: string; name: string }>
  }>
}

interface Hospital {
  id: string
  code: string
  name: string
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [pendingLeaves, setPendingLeaves] = useState(0)
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [selectedHospital, setSelectedHospital] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadHospitals()
  }, [])

  useEffect(() => {
    loadDashboard()
    loadPendingLeaves()
  }, [selectedHospital])

  const loadHospitals = async () => {
    try {
      const response = await hospitalsApi.getAll()
      setHospitals(response.data)
    } catch (error) {
      console.error('Failed to load hospitals', error)
    }
  }

  const loadDashboard = async () => {
    setLoading(true)
    try {
      const response = await shiftsApi.getDashboard(selectedHospital || undefined)
      setData(response.data)
    } catch (error) {
      console.error('Failed to load dashboard', error)
    } finally {
      setLoading(false)
    }
  }

  const loadPendingLeaves = async () => {
    try {
      const response = await leavesApi.getPendingCount()
      setPendingLeaves(response.data)
    } catch (error) {
      console.error('Failed to load pending leaves', error)
    }
  }

  const getShiftTypeLabel = (type: string) => {
    switch (type) {
      case 'DAY':
        return '白班'
      case 'EVENING':
        return '小夜'
      case 'NIGHT':
        return '大夜'
      default:
        return type
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">首頁</h1>
          <p className="text-gray-500">
            {format(new Date(), 'yyyy年MM月dd日 EEEE', { locale: zhTW })}
          </p>
        </div>
        <select
          value={selectedHospital}
          onChange={(e) => setSelectedHospital(e.target.value)}
          className="input w-48"
        >
          <option value="">全部院區</option>
          {hospitals.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name}
            </option>
          ))}
        </select>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <UserGroupIcon className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">今日出勤</p>
              <p className="text-2xl font-semibold">{data?.todayShifts || 0} 人</p>
            </div>
          </div>
        </div>

        <Link to="/leaves?status=pending" className="card hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-amber-100 text-amber-600">
              <ClipboardDocumentCheckIcon className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">待審請假</p>
              <p className="text-2xl font-semibold">{pendingLeaves} 件</p>
            </div>
          </div>
        </Link>

        <div className="card">
          <div className="flex items-center">
            <div
              className={`p-3 rounded-full ${
                (data?.leaderGapCount || 0) > 0
                  ? 'bg-red-100 text-red-600'
                  : 'bg-green-100 text-green-600'
              }`}
            >
              <ExclamationTriangleIcon className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Leader 缺口</p>
              <p className="text-2xl font-semibold">{data?.leaderGapCount || 0} 個</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <ArrowsRightLeftIcon className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">人力充足率</p>
              <p className="text-2xl font-semibold">{data?.coverageRate || 100}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Leader gaps alert */}
      {data?.leaderGaps && data.leaderGaps.length > 0 && (
        <div className="card border-l-4 border-red-500">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center text-red-600">
              <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
              Leader 缺口警示
            </h2>
          </div>
          <div className="space-y-3">
            {data.leaderGaps.slice(0, 5).map((gap, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
              >
                <div>
                  <p className="font-medium">
                    {format(new Date(gap.date), 'MM/dd (E)', { locale: zhTW })}{' '}
                    {getShiftTypeLabel(gap.shiftType)} - {gap.hospitalName}
                  </p>
                  <p className="text-sm text-gray-600">
                    缺 {gap.gap} 位 Leader
                    {gap.suggestedLeaders.length > 0 && (
                      <span className="ml-2">
                        建議人選：{gap.suggestedLeaders.map((l) => l.name).join('、')}
                      </span>
                    )}
                  </p>
                </div>
                <Link
                  to={`/shifts/${gap.hospitalId}/${format(new Date(gap.date), 'yyyy-MM-dd')}`}
                  className="btn-primary text-sm"
                >
                  處理
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">快速操作</h2>
          <div className="space-y-2">
            <Link
              to="/shifts"
              className="flex items-center p-3 rounded-lg hover:bg-gray-50"
            >
              <span className="text-2xl mr-3">📅</span>
              <div>
                <p className="font-medium">查看班表</p>
                <p className="text-sm text-gray-500">檢視或調整班表</p>
              </div>
            </Link>
            <Link
              to="/leaves"
              className="flex items-center p-3 rounded-lg hover:bg-gray-50"
            >
              <span className="text-2xl mr-3">📝</span>
              <div>
                <p className="font-medium">請假管理</p>
                <p className="text-sm text-gray-500">申請請假或審核</p>
              </div>
            </Link>
            <Link
              to="/cross-hospital"
              className="flex items-center p-3 rounded-lg hover:bg-gray-50"
            >
              <span className="text-2xl mr-3">🔄</span>
              <div>
                <p className="font-medium">跨院調度</p>
                <p className="text-sm text-gray-500">查看人力或申請調度</p>
              </div>
            </Link>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">系統資訊</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">院區數量</span>
              <span className="font-medium">{hospitals.length} 個</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">今日日期</span>
              <span className="font-medium">
                {format(new Date(), 'yyyy/MM/dd')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">系統版本</span>
              <span className="font-medium">v1.0.0</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
