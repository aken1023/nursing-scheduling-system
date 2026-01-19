import { useState, useEffect } from 'react'
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import api from '../services/api'

interface Employee {
  id: string
  employeeNo: string
  name: string
}

interface ShiftAssignment {
  id: string
  date: string
  shiftType: 'DAY' | 'EVENING' | 'NIGHT'
  hospital?: { id: string; name: string }
  employee?: Employee
}

interface SwapRequest {
  id: string
  requester: Employee
  requesterAssignment: ShiftAssignment
  target: Employee
  targetAssignment: ShiftAssignment
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  reason?: string
  rejectReason?: string
  createdAt: string
}

const STATUS_LABELS = {
  pending: { label: '待審核', color: 'badge-pending' },
  approved: { label: '已核准', color: 'badge-success' },
  rejected: { label: '已駁回', color: 'badge-danger' },
  cancelled: { label: '已取消', color: 'bg-gray-100 text-gray-600' },
}

const SHIFT_LABELS = {
  DAY: '白班',
  EVENING: '小夜',
  NIGHT: '大夜',
}

export default function ShiftSwapsPage() {
  const [swaps, setSwaps] = useState<SwapRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('pending')
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [selectedSwap, setSelectedSwap] = useState<SwapRequest | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    fetchSwaps()
  }, [filter])

  const fetchSwaps = async () => {
    try {
      const params = filter !== 'all' ? { status: filter } : {}
      const res = await api.get('/shifts/swaps', { params })
      setSwaps(res.data)
    } catch {
      toast.error('載入資料失敗')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id: string) => {
    if (!confirm('確定要核准此換班申請？')) return
    try {
      await api.post(`/shifts/swaps/${id}/approve`)
      toast.success('已核准換班申請')
      fetchSwaps()
    } catch {
      toast.error('操作失敗')
    }
  }

  const handleReject = async () => {
    if (!selectedSwap || !rejectReason) return
    try {
      await api.post(`/shifts/swaps/${selectedSwap.id}/reject`, { rejectReason })
      toast.success('已駁回換班申請')
      setShowRejectModal(false)
      setRejectReason('')
      fetchSwaps()
    } catch {
      toast.error('操作失敗')
    }
  }

  const openRejectModal = (swap: SwapRequest) => {
    setSelectedSwap(swap)
    setRejectReason('')
    setShowRejectModal(true)
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">換班申請</h1>
      </div>

      {/* 篩選標籤 */}
      <div className="flex gap-2">
        {[
          { value: 'pending', label: '待審核' },
          { value: 'approved', label: '已核准' },
          { value: 'rejected', label: '已駁回' },
          { value: 'all', label: '全部' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === tab.value
                ? 'bg-primary-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 換班列表 */}
      {swaps.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">
          暫無換班申請
        </div>
      ) : (
        <div className="space-y-4">
          {swaps.map((swap) => (
            <div key={swap.id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`px-2 py-1 rounded text-sm ${STATUS_LABELS[swap.status].color}`}>
                      {STATUS_LABELS[swap.status].label}
                    </span>
                    <span className="text-sm text-gray-500">
                      申請時間：{new Date(swap.createdAt).toLocaleString('zh-TW')}
                    </span>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {/* 申請人 */}
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-sm text-blue-600 font-medium mb-2">申請人</p>
                      <p className="font-semibold">{swap.requester?.name}</p>
                      <p className="text-sm text-gray-500">{swap.requester?.employeeNo}</p>
                      <div className="mt-2 text-sm">
                        <p>日期：{formatDate(swap.requesterAssignment?.date)}</p>
                        <p>班別：{SHIFT_LABELS[swap.requesterAssignment?.shiftType]}</p>
                        <p>院區：{swap.requesterAssignment?.hospital?.name}</p>
                      </div>
                    </div>

                    {/* 交換對象 */}
                    <div className="bg-green-50 rounded-lg p-4">
                      <p className="text-sm text-green-600 font-medium mb-2">交換對象</p>
                      <p className="font-semibold">{swap.target?.name}</p>
                      <p className="text-sm text-gray-500">{swap.target?.employeeNo}</p>
                      <div className="mt-2 text-sm">
                        <p>日期：{formatDate(swap.targetAssignment?.date)}</p>
                        <p>班別：{SHIFT_LABELS[swap.targetAssignment?.shiftType]}</p>
                        <p>院區：{swap.targetAssignment?.hospital?.name}</p>
                      </div>
                    </div>
                  </div>

                  {swap.reason && (
                    <div className="mt-3 text-sm text-gray-600">
                      <span className="font-medium">申請原因：</span>{swap.reason}
                    </div>
                  )}

                  {swap.rejectReason && (
                    <div className="mt-3 text-sm text-red-600">
                      <span className="font-medium">駁回原因：</span>{swap.rejectReason}
                    </div>
                  )}
                </div>

                {/* 操作按鈕 */}
                {swap.status === 'pending' && (
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleApprove(swap.id)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                      title="核准"
                    >
                      <CheckIcon className="h-6 w-6" />
                    </button>
                    <button
                      onClick={() => openRejectModal(swap)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      title="駁回"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 駁回 Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowRejectModal(false)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">駁回換班申請</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                駁回原因 *
              </label>
              <textarea
                className="input"
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="請輸入駁回原因"
              />
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowRejectModal(false)} className="btn-secondary">
                取消
              </button>
              <button
                onClick={handleReject}
                className="btn-danger"
                disabled={!rejectReason}
              >
                確認駁回
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
