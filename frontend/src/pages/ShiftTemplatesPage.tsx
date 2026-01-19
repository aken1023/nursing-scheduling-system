import { useState, useEffect } from 'react'
import { PlusIcon, PencilIcon, TrashIcon, PlayIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import api from '../services/api'

interface Hospital {
  id: string
  code: string
  name: string
}

interface TemplateItem {
  dayIndex: number
  shiftType: 'DAY' | 'EVENING' | 'NIGHT' | 'OFF'
  requiredCount: number
  leaderRequired: number
}

interface Template {
  id: string
  name: string
  hospitalId: string
  hospital?: Hospital
  description?: string
  cycleDays: number
  isActive: boolean
  items: TemplateItem[]
}

const SHIFT_COLORS = {
  DAY: 'bg-amber-100 text-amber-800',
  EVENING: 'bg-blue-100 text-blue-800',
  NIGHT: 'bg-purple-100 text-purple-800',
  OFF: 'bg-gray-100 text-gray-600',
}

const SHIFT_LABELS = {
  DAY: '白',
  EVENING: '小夜',
  NIGHT: '大夜',
  OFF: '休',
}

export default function ShiftTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    hospitalId: '',
    description: '',
    cycleDays: 7,
    items: [] as TemplateItem[],
  })
  const [applyData, setApplyData] = useState({
    startDate: '',
    endDate: '',
    previewOnly: true,
  })
  const [applyPreview, setApplyPreview] = useState<any>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [templatesRes, hospitalsRes] = await Promise.all([
        api.get('/shifts/templates'),
        api.get('/hospitals'),
      ])
      setTemplates(templatesRes.data)
      setHospitals(hospitalsRes.data)
    } catch {
      toast.error('載入資料失敗')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setSelectedTemplate(null)
    setFormData({
      name: '',
      hospitalId: hospitals[0]?.id || '',
      description: '',
      cycleDays: 7,
      items: generateDefaultItems(7),
    })
    setShowModal(true)
  }

  const handleEdit = (template: Template) => {
    setSelectedTemplate(template)
    setFormData({
      name: template.name,
      hospitalId: template.hospitalId,
      description: template.description || '',
      cycleDays: template.cycleDays,
      items: template.items.length > 0 ? template.items : generateDefaultItems(template.cycleDays),
    })
    setShowModal(true)
  }

  const generateDefaultItems = (days: number): TemplateItem[] => {
    const items: TemplateItem[] = []
    for (let day = 0; day < days; day++) {
      for (const shift of ['DAY', 'EVENING', 'NIGHT'] as const) {
        items.push({
          dayIndex: day,
          shiftType: shift,
          requiredCount: shift === 'NIGHT' ? 2 : 3,
          leaderRequired: 1,
        })
      }
    }
    return items
  }

  const handleSubmit = async () => {
    try {
      if (selectedTemplate) {
        await api.put(`/shifts/templates/${selectedTemplate.id}`, formData)
        toast.success('更新成功')
      } else {
        await api.post('/shifts/templates', formData)
        toast.success('建立成功')
      }
      setShowModal(false)
      fetchData()
    } catch {
      toast.error('操作失敗')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('確定要刪除此範本？')) return
    try {
      await api.delete(`/shifts/templates/${id}`)
      toast.success('刪除成功')
      fetchData()
    } catch {
      toast.error('刪除失敗')
    }
  }

  const handleApply = (template: Template) => {
    setSelectedTemplate(template)
    setApplyData({
      startDate: '',
      endDate: '',
      previewOnly: true,
    })
    setApplyPreview(null)
    setShowApplyModal(true)
  }

  const handleApplySubmit = async () => {
    if (!selectedTemplate) return
    try {
      const res = await api.post(`/shifts/templates/${selectedTemplate.id}/apply`, applyData)
      if (applyData.previewOnly) {
        setApplyPreview(res.data)
        toast.success('預覽完成')
      } else {
        toast.success(`已套用範本，建立 ${res.data.created} 筆排班`)
        setShowApplyModal(false)
        fetchData()
      }
    } catch {
      toast.error('套用失敗')
    }
  }

  const updateItem = (dayIndex: number, shiftType: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.dayIndex === dayIndex && item.shiftType === shiftType
          ? { ...item, [field]: value }
          : item
      ),
    }))
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
        <h1 className="text-2xl font-bold text-gray-900">班表範本</h1>
        <button onClick={handleCreate} className="btn-primary flex items-center gap-2">
          <PlusIcon className="h-5 w-5" />
          新增範本
        </button>
      </div>

      {templates.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">
          尚無班表範本
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <div key={template.id} className="card">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{template.name}</h3>
                  <p className="text-sm text-gray-500">{template.hospital?.name}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${template.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                  {template.isActive ? '啟用' : '停用'}
                </span>
              </div>

              {template.description && (
                <p className="text-sm text-gray-600 mb-3">{template.description}</p>
              )}

              <p className="text-sm text-gray-500 mb-3">週期：{template.cycleDays} 天</p>

              <div className="flex flex-wrap gap-1 mb-4">
                {Array.from({ length: Math.min(template.cycleDays, 7) }).map((_, idx) => (
                  <div key={idx} className="text-xs text-center">
                    <div className="text-gray-400 mb-1">Day {idx + 1}</div>
                    <div className="flex flex-col gap-0.5">
                      {template.items
                        .filter(item => item.dayIndex === idx)
                        .map((item, i) => (
                          <span
                            key={i}
                            className={`px-1.5 py-0.5 rounded text-xs ${SHIFT_COLORS[item.shiftType]}`}
                          >
                            {SHIFT_LABELS[item.shiftType]}
                          </span>
                        ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleApply(template)}
                  className="flex-1 btn-primary flex items-center justify-center gap-1 text-sm"
                >
                  <PlayIcon className="h-4 w-4" />
                  套用
                </button>
                <button
                  onClick={() => handleEdit(template)}
                  className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDelete(template.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 編輯 Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-lg font-semibold mb-4">
              {selectedTemplate ? '編輯範本' : '新增範本'}
            </h3>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">範本名稱 *</label>
                <input
                  type="text"
                  className="input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">院區 *</label>
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
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
              <textarea
                className="input"
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                每日班別需求（週期 {formData.cycleDays} 天）
              </label>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="py-2 px-3 text-left">班別</th>
                      {Array.from({ length: formData.cycleDays }).map((_, idx) => (
                        <th key={idx} className="py-2 px-3 text-center">Day {idx + 1}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(['DAY', 'EVENING', 'NIGHT'] as const).map((shiftType) => (
                      <tr key={shiftType} className="border-b">
                        <td className="py-2 px-3">
                          <span className={`px-2 py-1 rounded ${SHIFT_COLORS[shiftType]}`}>
                            {SHIFT_LABELS[shiftType]}
                          </span>
                        </td>
                        {Array.from({ length: formData.cycleDays }).map((_, dayIdx) => {
                          const item = formData.items.find(
                            i => i.dayIndex === dayIdx && i.shiftType === shiftType
                          )
                          return (
                            <td key={dayIdx} className="py-2 px-3 text-center">
                              <input
                                type="number"
                                min="0"
                                max="10"
                                className="w-12 text-center border rounded px-1 py-0.5"
                                value={item?.requiredCount || 0}
                                onChange={(e) => updateItem(dayIdx, shiftType, 'requiredCount', parseInt(e.target.value) || 0)}
                              />
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={() => setShowModal(false)} className="btn-secondary">
                取消
              </button>
              <button onClick={handleSubmit} className="btn-primary">
                {selectedTemplate ? '更新' : '建立'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 套用 Modal */}
      {showApplyModal && selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowApplyModal(false)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
            <h3 className="text-lg font-semibold mb-4">套用範本：{selectedTemplate.name}</h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">起始日期 *</label>
                  <input
                    type="date"
                    className="input"
                    value={applyData.startDate}
                    onChange={(e) => setApplyData({ ...applyData, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">結束日期 *</label>
                  <input
                    type="date"
                    className="input"
                    value={applyData.endDate}
                    onChange={(e) => setApplyData({ ...applyData, endDate: e.target.value })}
                  />
                </div>
              </div>

              {applyPreview && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium mb-2">預覽結果</h4>
                  <p className="text-sm text-gray-600">需要填補的班次：{applyPreview.preview?.length || 0}</p>
                  <p className="text-sm text-gray-600">已跳過（已排班）：{applyPreview.skipped}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowApplyModal(false)} className="btn-secondary">
                取消
              </button>
              <button
                onClick={() => { setApplyData({ ...applyData, previewOnly: true }); handleApplySubmit() }}
                className="btn-secondary"
              >
                預覽
              </button>
              <button
                onClick={() => { setApplyData({ ...applyData, previewOnly: false }); handleApplySubmit() }}
                className="btn-primary"
                disabled={!applyData.startDate || !applyData.endDate}
              >
                確認套用
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
