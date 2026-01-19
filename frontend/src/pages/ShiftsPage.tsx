import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { shiftsApi, hospitalsApi } from '../services/api'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  addMonths,
  subMonths,
  getDay,
} from 'date-fns'
import { zhTW } from 'date-fns/locale'

interface Hospital {
  id: string
  code: string
  name: string
}

interface DaySummary {
  date: string
  hasGap: boolean
  hasLeaderGap: boolean
  dayCount: number
  eveningCount: number
  nightCount: number
}

export default function ShiftsPage() {
  const navigate = useNavigate()
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [selectedHospital, setSelectedHospital] = useState<string>('')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [summaries, setSummaries] = useState<Record<string, DaySummary>>({})
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month')

  useEffect(() => {
    loadHospitals()
  }, [])

  useEffect(() => {
    if (selectedHospital) {
      loadMonthSummary()
    }
  }, [selectedHospital, currentDate])

  const loadHospitals = async () => {
    try {
      const response = await hospitalsApi.getAll()
      setHospitals(response.data)
      if (response.data.length > 0) {
        setSelectedHospital(response.data[0].id)
      }
    } catch (error) {
      console.error('Failed to load hospitals', error)
    }
  }

  const loadMonthSummary = async () => {
    setLoading(true)
    try {
      const startDate = format(startOfMonth(currentDate), 'yyyy-MM-dd')
      const endDate = format(endOfMonth(currentDate), 'yyyy-MM-dd')

      const response = await shiftsApi.getAll({
        hospitalId: selectedHospital,
        startDate,
        endDate,
      })

      // Group shifts by date
      const grouped: Record<string, DaySummary> = {}
      response.data.forEach((shift: any) => {
        const dateStr = format(new Date(shift.date), 'yyyy-MM-dd')
        if (!grouped[dateStr]) {
          grouped[dateStr] = {
            date: dateStr,
            hasGap: false,
            hasLeaderGap: false,
            dayCount: 0,
            eveningCount: 0,
            nightCount: 0,
          }
        }

        if (shift.shiftType === 'DAY') grouped[dateStr].dayCount++
        else if (shift.shiftType === 'EVENING') grouped[dateStr].eveningCount++
        else if (shift.shiftType === 'NIGHT') grouped[dateStr].nightCount++
      })

      setSummaries(grouped)
    } catch (error) {
      console.error('Failed to load shifts', error)
    } finally {
      setLoading(false)
    }
  }

  const getDaysInMonth = () => {
    const start = startOfMonth(currentDate)
    const end = endOfMonth(currentDate)
    return eachDayOfInterval({ start, end })
  }

  const handleDateClick = (date: Date) => {
    if (selectedHospital) {
      navigate(`/shifts/${selectedHospital}/${format(date, 'yyyy-MM-dd')}`)
    }
  }

  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  const days = getDaysInMonth()
  const firstDayOfMonth = getDay(startOfMonth(currentDate))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">班表管理</h1>
        <div className="flex items-center gap-4">
          <select
            value={selectedHospital}
            onChange={(e) => setSelectedHospital(e.target.value)}
            className="input w-48"
          >
            <option value="">選擇院區</option>
            {hospitals.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
          <div className="flex rounded-lg overflow-hidden border border-gray-300">
            <button
              className={`px-3 py-1 text-sm ${
                viewMode === 'month'
                  ? 'bg-primary-500 text-white'
                  : 'bg-white text-gray-700'
              }`}
              onClick={() => setViewMode('month')}
            >
              月
            </button>
            <button
              className={`px-3 py-1 text-sm ${
                viewMode === 'week'
                  ? 'bg-primary-500 text-white'
                  : 'bg-white text-gray-700'
              }`}
              onClick={() => setViewMode('week')}
            >
              週
            </button>
          </div>
        </div>
      </div>

      {/* Calendar header */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <h2 className="text-xl font-semibold">
            {format(currentDate, 'yyyy年MM月', { locale: zhTW })}
          </h2>
          <button
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
          {/* Weekday headers */}
          {weekdays.map((day) => (
            <div
              key={day}
              className="bg-gray-50 p-2 text-center text-sm font-medium text-gray-500"
            >
              {day}
            </div>
          ))}

          {/* Empty cells for days before first day of month */}
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} className="bg-white p-2 h-24" />
          ))}

          {/* Day cells */}
          {days.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd')
            const summary = summaries[dateStr]
            const isToday = format(new Date(), 'yyyy-MM-dd') === dateStr
            const isWeekend = getDay(day) === 0 || getDay(day) === 6

            return (
              <div
                key={dateStr}
                className={`bg-white p-2 h-24 cursor-pointer hover:bg-gray-50 transition-colors ${
                  isWeekend ? 'bg-orange-50' : ''
                } ${isToday ? 'ring-2 ring-primary-500' : ''}`}
                onClick={() => handleDateClick(day)}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-sm font-medium ${
                      isToday ? 'text-primary-600' : ''
                    }`}
                  >
                    {format(day, 'd')}
                  </span>
                  {summary && (
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded ${
                        summary.hasLeaderGap
                          ? 'bg-red-100 text-red-700'
                          : summary.hasGap
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {summary.hasLeaderGap ? '!' : '✓'}
                    </span>
                  )}
                </div>
                {summary && (
                  <div className="mt-1 space-y-0.5">
                    <div className="flex items-center text-xs">
                      <span className="w-2 h-2 rounded-full bg-amber-400 mr-1" />
                      <span>白 {summary.dayCount}</span>
                    </div>
                    <div className="flex items-center text-xs">
                      <span className="w-2 h-2 rounded-full bg-blue-400 mr-1" />
                      <span>夜 {summary.eveningCount}</span>
                    </div>
                    <div className="flex items-center text-xs">
                      <span className="w-2 h-2 rounded-full bg-purple-400 mr-1" />
                      <span>大 {summary.nightCount}</span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center gap-6 text-sm text-gray-500">
          <div className="flex items-center">
            <span className="w-3 h-3 rounded bg-green-100 mr-2" />
            滿編
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 rounded bg-amber-100 mr-2" />
            人力不足
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 rounded bg-red-100 mr-2" />
            Leader 缺口
          </div>
        </div>
      </div>
    </div>
  )
}
