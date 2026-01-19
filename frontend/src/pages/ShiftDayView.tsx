import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeftIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { shiftsApi, hospitalsApi } from '../services/api'
import { format, addDays, subDays } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import toast from 'react-hot-toast'

interface Employee {
  id: string
  name: string
  employeeNo: string
  isLeader: boolean
  available: boolean
  reason?: string
}

interface ShiftSummary {
  required: number
  leaderRequired: number
  assigned: number
  leaderAssigned: number
  employees: Array<{
    id: string
    name: string
    isLeader: boolean
    isCrossHospital: boolean
  }>
  hasGap: boolean
  hasLeaderGap: boolean
}

export default function ShiftDayView() {
  const { hospitalId, date } = useParams()
  const navigate = useNavigate()
  const [hospital, setHospital] = useState<any>(null)
  const [summary, setSummary] = useState<Record<string, ShiftSummary>>({})
  const [availableEmployees, setAvailableEmployees] = useState<Employee[]>([])
  const [selectedShiftType, setSelectedShiftType] = useState<string>('DAY')
  const [loading, setLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    if (hospitalId && date) {
      loadData()
    }
  }, [hospitalId, date])

  const loadData = async () => {
    setLoading(true)
    try {
      const [hospitalRes, summaryRes] = await Promise.all([
        hospitalsApi.getOne(hospitalId!),
        shiftsApi.getDailySummary(hospitalId!, date!),
      ])
      setHospital(hospitalRes.data)
      setSummary(summaryRes.data.summary)
    } catch (error) {
      console.error('Failed to load data', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAvailableEmployees = async (shiftType: string) => {
    try {
      const response = await shiftsApi.getAvailableEmployees(
        hospitalId!,
        date!,
        shiftType
      )
      setAvailableEmployees(response.data)
    } catch (error) {
      console.error('Failed to load available employees', error)
    }
  }

  const handleOpenAddModal = (shiftType: string) => {
    setSelectedShiftType(shiftType)
    loadAvailableEmployees(shiftType)
    setShowAddModal(true)
  }

  const handleAddShift = async (employeeId: string, isLeaderDuty: boolean) => {
    try {
      await shiftsApi.create({
        date: date!,
        hospitalId: hospitalId!,
        shiftType: selectedShiftType,
        employeeId,
        isLeaderDuty,
      })
      toast.success('新增排班成功')
      setShowAddModal(false)
      loadData()
    } catch (error: any) {
      // Error handled by API interceptor
    }
  }

  const handleRemoveShift = async (employeeId: string) => {
    if (!confirm('確定要移除此排班？')) return

    try {
      const shifts = await shiftsApi.getAll({
        hospitalId: hospitalId!,
        startDate: date,
        endDate: date,
        employeeId,
      })

      if (shifts.data.length > 0) {
        await shiftsApi.delete(shifts.data[0].id, '手動移除')
        toast.success('已移除排班')
        loadData()
      }
    } catch (error) {
      console.error('Failed to remove shift', error)
    }
  }

  const navigateDay = (direction: 'prev' | 'next') => {
    const currentDate = new Date(date!)
    const newDate =
      direction === 'prev' ? subDays(currentDate, 1) : addDays(currentDate, 1)
    navigate(`/shifts/${hospitalId}/${format(newDate, 'yyyy-MM-dd')}`)
  }

  const shiftTypes = [
    { key: 'DAY', label: '白班', time: '08:00-16:00', color: 'bg-shift-day' },
    { key: 'EVENING', label: '小夜', time: '16:00-24:00', color: 'bg-shift-evening' },
    { key: 'NIGHT', label: '大夜', time: '00:00-08:00', color: 'bg-shift-night' },
  ]

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
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/shifts')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {hospital?.name} 班表
            </h1>
            <p className="text-gray-500">
              {date && format(new Date(date), 'yyyy年MM月dd日 EEEE', { locale: zhTW })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateDay('prev')}
            className="btn-secondary"
          >
            前一天
          </button>
          <button
            onClick={() => navigateDay('next')}
            className="btn-secondary"
          >
            後一天
          </button>
        </div>
      </div>

      {/* Shift panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {shiftTypes.map((type) => {
          const data = summary[type.key]
          return (
            <div key={type.key} className={`card ${type.color}`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg">{type.label}</h3>
                  <p className="text-sm text-gray-600">{type.time}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">
                    需求: {data?.required || 0} 人 / Leader: {data?.leaderRequired || 0}
                  </p>
                  <p
                    className={`text-sm font-medium ${
                      data?.hasLeaderGap
                        ? 'text-red-600'
                        : data?.hasGap
                        ? 'text-amber-600'
                        : 'text-green-600'
                    }`}
                  >
                    已排: {data?.assigned || 0} / Leader: {data?.leaderAssigned || 0}
                  </p>
                </div>
              </div>

              {/* Assigned employees */}
              <div className="space-y-2 mb-4">
                {data?.employees.map((emp) => (
                  <div
                    key={emp.id}
                    className="flex items-center justify-between p-2 bg-white rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{emp.name}</span>
                      {emp.isLeader && (
                        <span className="badge badge-success text-xs">Leader</span>
                      )}
                      {emp.isCrossHospital && (
                        <span className="badge badge-pending text-xs">跨院</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveShift(emp.id)}
                      className="p-1 text-gray-400 hover:text-red-500"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add button */}
              <button
                onClick={() => handleOpenAddModal(type.key)}
                className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-primary-500 hover:text-primary-500 flex items-center justify-center gap-2"
              >
                <PlusIcon className="h-5 w-5" />
                新增人員
              </button>
            </div>
          )
        })}
      </div>

      {/* Add employee modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setShowAddModal(false)}
          />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                新增{' '}
                {shiftTypes.find((t) => t.key === selectedShiftType)?.label} 人員
              </h3>
              <button onClick={() => setShowAddModal(false)}>
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-2">
              {availableEmployees.map((emp) => (
                <div
                  key={emp.id}
                  className={`p-3 rounded-lg border ${
                    emp.available
                      ? 'border-gray-200 hover:border-primary-500 cursor-pointer'
                      : 'border-gray-100 bg-gray-50 opacity-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{emp.name}</p>
                      <p className="text-sm text-gray-500">
                        {emp.employeeNo}
                        {emp.isLeader && ' · Leader'}
                      </p>
                      {!emp.available && (
                        <p className="text-sm text-red-500">{emp.reason}</p>
                      )}
                    </div>
                    {emp.available && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAddShift(emp.id, false)}
                          className="btn-secondary text-sm"
                        >
                          一般
                        </button>
                        {emp.isLeader && (
                          <button
                            onClick={() => handleAddShift(emp.id, true)}
                            className="btn-primary text-sm"
                          >
                            Leader
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
