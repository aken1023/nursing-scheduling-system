import { useEffect, useState } from 'react'
import { crossHospitalApi, hospitalsApi } from '../services/api'
import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import toast from 'react-hot-toast'

interface Hospital {
  id: string
  code: string
  name: string
}

interface StaffingSummary {
  hospitalId: string
  hospitalName: string
  required: number
  assigned: number
  availableCount: number
  availableStaff: Array<{ id: string; name: string }>
}

export default function CrossHospitalPage() {
  const [_hospitals, setHospitals] = useState<Hospital[]>([])
  const [summaries, setSummaries] = useState<StaffingSummary[]>([])
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [selectedShiftType, setSelectedShiftType] = useState('DAY')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadHospitals()
  }, [])

  useEffect(() => {
    loadSummary()
  }, [selectedDate, selectedShiftType])

  const loadHospitals = async () => {
    try {
      const response = await hospitalsApi.getAll()
      setHospitals(response.data)
    } catch (error) {
      console.error('Failed to load hospitals', error)
    }
  }

  const loadSummary = async () => {
    setLoading(true)
    try {
      const response = await crossHospitalApi.getStaffingSummary(
        selectedDate,
        selectedShiftType
      )
      setSummaries(response.data)
    } catch (error) {
      console.error('Failed to load summary', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRequest = async (
    employeeId: string,
    fromHospitalId: string,
    toHospitalId: string
  ) => {
    try {
      await crossHospitalApi.create({
        employeeId,
        fromHospitalId,
        toHospitalId,
        date: selectedDate,
        shiftType: selectedShiftType,
      })
      toast.success('調度申請已送出')
      loadSummary()
    } catch (error) {
      // Error handled by API interceptor
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

  const getStatusColor = (summary: StaffingSummary) => {
    const diff = summary.assigned - summary.required
    if (diff > 0) return 'text-green-600'
    if (diff < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  const getStatusIcon = (summary: StaffingSummary) => {
    const diff = summary.assigned - summary.required
    if (diff > 0) return '🟢'
    if (diff < 0) return '🔴'
    return '✓'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">跨院調度</h1>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-sm text-gray-500 mb-1">日期</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="input w-40"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">班別</label>
            <select
              value={selectedShiftType}
              onChange={(e) => setSelectedShiftType(e.target.value)}
              className="input w-32"
            >
              <option value="DAY">白班</option>
              <option value="EVENING">小夜</option>
              <option value="NIGHT">大夜</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary table */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">
          各院區人力狀態 -{' '}
          {format(new Date(selectedDate), 'MM/dd (E)', { locale: zhTW })}{' '}
          {getShiftTypeLabel(selectedShiftType)}
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">院區</th>
                  <th className="text-center py-3 px-4">需求</th>
                  <th className="text-center py-3 px-4">已排</th>
                  <th className="text-center py-3 px-4">狀態</th>
                  <th className="text-left py-3 px-4">可支援人力</th>
                </tr>
              </thead>
              <tbody>
                {summaries.map((summary) => (
                  <tr key={summary.hospitalId} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{summary.hospitalName}</td>
                    <td className="py-3 px-4 text-center">{summary.required}</td>
                    <td className="py-3 px-4 text-center">{summary.assigned}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={getStatusColor(summary)}>
                        {getStatusIcon(summary)}{' '}
                        {summary.assigned - summary.required > 0 ? '+' : ''}
                        {summary.assigned - summary.required}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {summary.availableStaff.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {summary.availableStaff.map((staff) => (
                            <div
                              key={staff.id}
                              className="flex items-center gap-1 bg-gray-100 rounded-full px-3 py-1 text-sm"
                            >
                              <span>{staff.name}</span>
                              {summaries.some(
                                (s) =>
                                  s.hospitalId !== summary.hospitalId &&
                                  s.assigned < s.required
                              ) && (
                                <select
                                  className="text-xs border-0 bg-transparent"
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      handleCreateRequest(
                                        staff.id,
                                        summary.hospitalId,
                                        e.target.value
                                      )
                                      e.target.value = ''
                                    }
                                  }}
                                  defaultValue=""
                                >
                                  <option value="">調度至...</option>
                                  {summaries
                                    .filter(
                                      (s) =>
                                        s.hospitalId !== summary.hospitalId &&
                                        s.assigned < s.required
                                    )
                                    .map((s) => (
                                      <option key={s.hospitalId} value={s.hospitalId}>
                                        {s.hospitalName}
                                      </option>
                                    ))}
                                </select>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="card bg-blue-50 border-blue-200">
        <h3 className="font-medium text-blue-800 mb-2">使用說明</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• 🟢 表示人力充足可支援其他院區</li>
          <li>• 🔴 表示人力不足需要支援</li>
          <li>• 點擊可支援人員旁的下拉選單可發起跨院調度申請</li>
          <li>• 調度申請需經原院區主管核准後生效</li>
        </ul>
      </div>
    </div>
  )
}
