import { useState, useEffect } from 'react'
import { PlayIcon, ClockIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import api from '../services/api'

interface Hospital {
  id: string
  code: string
  name: string
}

interface Template {
  id: string
  name: string
  hospitalId: string
}

interface ScheduleRun {
  id: string
  hospital?: Hospital
  startDate: string
  endDate: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  totalShifts: number
  filledShifts: number
  conflictCount: number
  createdAt: string
}

interface PreviewResult {
  totalShifts: number
  filledShifts: number
  conflictCount: number
  gaps: Array<{ date: string; shiftType: string; required: number; assigned: number }>
  assignments: Array<{
    date: string
    shiftType: string
    employeeName: string
    isLeaderDuty: boolean
  }>
  conflicts: Array<{ type: string; description: string; employeeName?: string }>
}

const STATUS_CONFIG = {
  pending: { label: '等待中', color: 'bg-gray-100 text-gray-600', icon: ClockIcon },
  running: { label: '執行中', color: 'bg-blue-100 text-blue-600', icon: ClockIcon },
  completed: { label: '已完成', color: 'bg-green-100 text-green-600', icon: CheckCircleIcon },
  failed: { label: '失敗', color: 'bg-red-100 text-red-600', icon: XCircleIcon },
}

const SHIFT_LABELS = {
  DAY: '白班',
  EVENING: '小夜',
  NIGHT: '大夜',
}

export default function AutoSchedulePage() {
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [runs, setRuns] = useState<ScheduleRun[]>([])
  const [loading, setLoading] = useState(true)
  const [preview, setPreview] = useState<PreviewResult | null>(null)
  const [isExecuting, setIsExecuting] = useState(false)

  const [formData, setFormData] = useState({
    hospitalId: '',
    startDate: '',
    endDate: '',
    templateId: '',
    respectPreferences: true,
    balanceLeaders: true,
    maxConsecutiveNights: 3,
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [hospitalsRes, templatesRes, runsRes] = await Promise.all([
        api.get('/hospitals'),
        api.get('/shifts/templates'),
        api.get('/shifts/auto-schedule/runs'),
      ])
      setHospitals(hospitalsRes.data)
      setTemplates(templatesRes.data)
      setRuns(runsRes.data)
      if (hospitalsRes.data.length > 0) {
        setFormData(prev => ({ ...prev, hospitalId: hospitalsRes.data[0].id }))
      }
    } catch {
      toast.error('載入資料失敗')
    } finally {
      setLoading(false)
    }
  }

  const handlePreview = async () => {
    if (!formData.hospitalId || !formData.startDate || !formData.endDate) {
      toast.error('請填寫必要欄位')
      return
    }

    try {
      setIsExecuting(true)
      const res = await api.post('/shifts/auto-schedule/preview', {
        ...formData,
        previewOnly: true,
      })
      setPreview(res.data)
      toast.success('預覽完成')
    } catch {
      toast.error('預覽失敗')
    } finally {
      setIsExecuting(false)
    }
  }

  const handleExecute = async () => {
    if (!confirm('確定要執行自動排班？此操作將建立新的班表記錄。')) return

    try {
      setIsExecuting(true)
      await api.post('/shifts/auto-schedule/execute', {
        ...formData,
        previewOnly: false,
      })
      toast.success('排班完成')
      setPreview(null)
      fetchData()
    } catch {
      toast.error('排班失敗')
    } finally {
      setIsExecuting(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-TW')
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
      <h1 className="text-2xl font-bold text-gray-900">自動排班</h1>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* 設定區 */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">排班設定</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                院區 *
              </label>
              <select
                className="input"
                value={formData.hospitalId}
                onChange={(e) => setFormData({ ...formData, hospitalId: e.target.value })}
              >
                {hospitals.map((h) => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  起始日期 *
                </label>
                <input
                  type="date"
                  className="input"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  結束日期 *
                </label>
                <input
                  type="date"
                  className="input"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                套用範本（選填）
              </label>
              <select
                className="input"
                value={formData.templateId}
                onChange={(e) => setFormData({ ...formData, templateId: e.target.value })}
              >
                <option value="">不使用範本</option>
                {templates
                  .filter(t => t.hospitalId === formData.hospitalId)
                  .map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
              </select>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">排班規則</h3>

              <div className="space-y-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.respectPreferences}
                    onChange={(e) => setFormData({ ...formData, respectPreferences: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">遵守員工偏好設定</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.balanceLeaders}
                    onChange={(e) => setFormData({ ...formData, balanceLeaders: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">平衡 Leader 分配</span>
                </label>

                <div className="flex items-center gap-2">
                  <span className="text-sm">避免連續夜班超過</span>
                  <input
                    type="number"
                    min="1"
                    max="7"
                    className="w-16 input text-center"
                    value={formData.maxConsecutiveNights}
                    onChange={(e) => setFormData({ ...formData, maxConsecutiveNights: parseInt(e.target.value) || 3 })}
                  />
                  <span className="text-sm">天</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <button
                onClick={handlePreview}
                className="flex-1 btn-secondary flex items-center justify-center gap-2"
                disabled={isExecuting}
              >
                預覽結果
              </button>
              <button
                onClick={handleExecute}
                className="flex-1 btn-primary flex items-center justify-center gap-2"
                disabled={isExecuting || !preview}
              >
                <PlayIcon className="h-5 w-5" />
                執行排班
              </button>
            </div>
          </div>
        </div>

        {/* 預覽結果 */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">預覽結果</h2>

          {!preview ? (
            <div className="text-center py-12 text-gray-500">
              請先設定排班參數並點擊「預覽結果」
            </div>
          ) : (
            <div className="space-y-4">
              {/* 統計 */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600">{preview.totalShifts}</p>
                  <p className="text-sm text-blue-600">總班次</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">{preview.filledShifts}</p>
                  <p className="text-sm text-green-600">已填補</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-red-600">{preview.conflictCount}</p>
                  <p className="text-sm text-red-600">缺口</p>
                </div>
              </div>

              {/* 缺口列表 */}
              {preview.gaps.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">人力缺口</h3>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {preview.gaps.map((gap, idx) => (
                      <div key={idx} className="text-sm bg-red-50 text-red-700 px-3 py-1 rounded">
                        {formatDate(gap.date)} {SHIFT_LABELS[gap.shiftType as keyof typeof SHIFT_LABELS]}：
                        需要 {gap.required} 人，已排 {gap.assigned} 人
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 衝突列表 */}
              {preview.conflicts.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">排班衝突</h3>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {preview.conflicts.map((conflict, idx) => (
                      <div key={idx} className="text-sm bg-yellow-50 text-yellow-700 px-3 py-1 rounded">
                        {conflict.employeeName && `${conflict.employeeName}：`}
                        {conflict.description}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 排班列表 */}
              {preview.assignments.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    排班結果（{preview.assignments.length} 筆）
                  </h3>
                  <div className="max-h-48 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-2 py-1 text-left">日期</th>
                          <th className="px-2 py-1 text-left">班別</th>
                          <th className="px-2 py-1 text-left">員工</th>
                          <th className="px-2 py-1 text-center">Leader</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.assignments.slice(0, 50).map((a, idx) => (
                          <tr key={idx} className="border-b">
                            <td className="px-2 py-1">{formatDate(a.date)}</td>
                            <td className="px-2 py-1">{SHIFT_LABELS[a.shiftType as keyof typeof SHIFT_LABELS]}</td>
                            <td className="px-2 py-1">{a.employeeName}</td>
                            <td className="px-2 py-1 text-center">
                              {a.isLeaderDuty && <span className="text-primary-600">★</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {preview.assignments.length > 50 && (
                      <p className="text-center text-gray-500 py-2 text-sm">
                        顯示前 50 筆，共 {preview.assignments.length} 筆
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 執行記錄 */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">執行記錄</h2>

        {runs.length === 0 ? (
          <p className="text-center text-gray-500 py-8">尚無執行記錄</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">執行時間</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">院區</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">日期範圍</th>
                  <th className="px-4 py-2 text-center text-sm font-medium text-gray-500">狀態</th>
                  <th className="px-4 py-2 text-center text-sm font-medium text-gray-500">總班次</th>
                  <th className="px-4 py-2 text-center text-sm font-medium text-gray-500">已填補</th>
                  <th className="px-4 py-2 text-center text-sm font-medium text-gray-500">缺口</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((run) => {
                  const StatusIcon = STATUS_CONFIG[run.status].icon
                  return (
                    <tr key={run.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">
                        {new Date(run.createdAt).toLocaleString('zh-TW')}
                      </td>
                      <td className="px-4 py-3 text-sm">{run.hospital?.name}</td>
                      <td className="px-4 py-3 text-sm">
                        {formatDate(run.startDate)} ~ {formatDate(run.endDate)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${STATUS_CONFIG[run.status].color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {STATUS_CONFIG[run.status].label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-center">{run.totalShifts}</td>
                      <td className="px-4 py-3 text-sm text-center text-green-600">{run.filledShifts}</td>
                      <td className="px-4 py-3 text-sm text-center text-red-600">{run.conflictCount}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
