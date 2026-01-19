import { useState, useEffect } from 'react'
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline'
import { hospitalsApi, exportApi } from '../services/api'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import toast from 'react-hot-toast'

interface Hospital {
  id: string
  code: string
  name: string
}

export default function ExportPage() {
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [selectedHospitals, setSelectedHospitals] = useState<string[]>([])
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'))
  const [exportFormat, setExportFormat] = useState<'weekly' | 'monthly'>('weekly')
  const [fileFormat, setFileFormat] = useState<'excel' | 'pdf'>('excel')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadHospitals()
  }, [])

  const loadHospitals = async () => {
    try {
      const response = await hospitalsApi.getAll()
      setHospitals(response.data)
    } catch (error) {
      console.error('Failed to load hospitals', error)
    }
  }

  const toggleHospital = (id: string) => {
    setSelectedHospitals((prev) =>
      prev.includes(id) ? prev.filter((h) => h !== id) : [...prev, id]
    )
  }

  const handleExport = async () => {
    if (selectedHospitals.length === 0) {
      toast.error('請選擇至少一個院區')
      return
    }

    setLoading(true)
    try {
      for (const hospitalId of selectedHospitals) {
        const hospital = hospitals.find((h) => h.id === hospitalId)
        const params = {
          hospitalId,
          startDate,
          endDate,
          format: exportFormat,
        }

        let blob: Blob
        let filename: string

        if (fileFormat === 'excel') {
          const response = await exportApi.exportExcel(params)
          blob = new Blob([response.data], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          })
          filename = `${hospital?.name || '班表'}_${startDate}_${endDate}.xlsx`
        } else {
          const response = await exportApi.exportPdf(params)
          blob = new Blob([response.data], { type: 'application/pdf' })
          filename = `${hospital?.name || '班表'}_${startDate}_${endDate}.pdf`
        }

        // Download file
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      }

      toast.success('匯出成功')
    } catch (error) {
      toast.error('匯出失敗')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">報表匯出</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Export form */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">匯出設定</h2>

          <div className="space-y-4">
            {/* Hospital selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                院區選擇
              </label>
              <div className="flex flex-wrap gap-2">
                {hospitals.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => toggleHospital(h.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm ${
                      selectedHospitals.includes(h.id)
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {h.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Date range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  開始日期
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  結束日期
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="input"
                />
              </div>
            </div>

            {/* Export format */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                匯出格式
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="exportFormat"
                    value="weekly"
                    checked={exportFormat === 'weekly'}
                    onChange={() => setExportFormat('weekly')}
                    className="mr-2"
                  />
                  週班表
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="exportFormat"
                    value="monthly"
                    checked={exportFormat === 'monthly'}
                    onChange={() => setExportFormat('monthly')}
                    className="mr-2"
                  />
                  月班表
                </label>
              </div>
            </div>

            {/* File format */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                檔案格式
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="fileFormat"
                    value="excel"
                    checked={fileFormat === 'excel'}
                    onChange={() => setFileFormat('excel')}
                    className="mr-2"
                  />
                  Excel (.xlsx)
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="fileFormat"
                    value="pdf"
                    checked={fileFormat === 'pdf'}
                    onChange={() => setFileFormat('pdf')}
                    className="mr-2"
                  />
                  PDF
                </label>
              </div>
            </div>

            {/* Export button */}
            <button
              onClick={handleExport}
              disabled={loading || selectedHospitals.length === 0}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <DocumentArrowDownIcon className="h-5 w-5" />
              {loading ? '匯出中...' : '匯出報表'}
            </button>
          </div>
        </div>

        {/* Preview / Info */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">匯出說明</h2>
          <div className="space-y-4 text-sm text-gray-600">
            <div>
              <h3 className="font-medium text-gray-700 mb-1">週班表</h3>
              <p>以週為單位顯示班表，適合張貼公告使用。</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700 mb-1">月班表</h3>
              <p>以月為單位顯示完整班表，包含統計資訊。</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700 mb-1">匯出欄位</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>日期、星期</li>
                <li>白班 / 小夜 / 大夜 人員名單</li>
                <li>各班別人數統計</li>
                <li>員工工時統計 (月報表)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
