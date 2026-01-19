import { useEffect, useState } from 'react'
import { PlusIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { leavesApi } from '../services/api'
import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { usePermissions } from '../hooks/usePermissions'

interface LeaveRequest {
  id: string
  employee: { id: string; name: string; employeeNo: string }
  leaveDate: string
  shiftType: string | null
  leaveType: string
  reason: string
  status: string
  createdAt: string
  approver?: { name: string }
  rejectReason?: string
}

export default function LeavesPage() {
  const { canApproveLeaves } = usePermissions()
  const [leaves, setLeaves] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<string>('pending')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [formData, setFormData] = useState({
    leaveDate: format(new Date(), 'yyyy-MM-dd'),
    shiftType: '',
    leaveType: 'personal',
    reason: '',
  })

  useEffect(() => {
    loadLeaves()
  }, [filter])

  const loadLeaves = async () => {
    setLoading(true)
    try {
      const response = await leavesApi.getAll({
        status: filter || undefined,
        limit: 50,
      })
      setLeaves(response.data.items)
    } catch (error) {
      console.error('Failed to load leaves', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    try {
      await leavesApi.create(formData)
      toast.success('請假申請已送出')
      setShowCreateModal(false)
      setFormData({
        leaveDate: format(new Date(), 'yyyy-MM-dd'),
        shiftType: '',
        leaveType: 'personal',
        reason: '',
      })
      loadLeaves()
    } catch (error) {
      // Error handled by API interceptor
    }
  }

  const handleApprove = async (id: string) => {
    try {
      await leavesApi.approve(id)
      toast.success('已核准')
      loadLeaves()
    } catch (error) {
      // Error handled by API interceptor
    }
  }

  const handleReject = async () => {
    if (!showRejectModal || !rejectReason) return

    try {
      await leavesApi.reject(showRejectModal, rejectReason)
      toast.success('已駁回')
      setShowRejectModal(null)
      setRejectReason('')
      loadLeaves()
    } catch (error) {
      // Error handled by API interceptor
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="badge badge-pending">待審核</span>
      case 'approved':
        return <span className="badge badge-success">已核准</span>
      case 'rejected':
        return <span className="badge badge-danger">已駁回</span>
      default:
        return null
    }
  }

  const getLeaveTypeLabel = (type: string) => {
    switch (type) {
      case 'annual':
        return '特休'
      case 'sick':
        return '病假'
      case 'personal':
        return '事假'
      case 'other':
        return '其他'
      default:
        return type
    }
  }

  const getShiftTypeLabel = (type: string | null) => {
    if (!type) return '全天'
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">請假管理</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          新增請假
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {[
          { key: 'pending', label: '待審核' },
          { key: 'approved', label: '已核准' },
          { key: 'rejected', label: '已駁回' },
          { key: '', label: '全部' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filter === tab.key
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Leave list */}
      <div className="card">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
          </div>
        ) : leaves.length === 0 ? (
          <div className="text-center py-12 text-gray-500">暫無請假申請</div>
        ) : (
          <div className="divide-y">
            {leaves.map((leave) => (
              <div key={leave.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{leave.employee?.name}</span>
                      <span className="text-gray-500 text-sm">
                        {leave.employee?.employeeNo}
                      </span>
                      {getStatusBadge(leave.status)}
                    </div>
                    <p className="text-gray-700">
                      {format(new Date(leave.leaveDate), 'yyyy/MM/dd (E)', {
                        locale: zhTW,
                      })}{' '}
                      {getShiftTypeLabel(leave.shiftType)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {getLeaveTypeLabel(leave.leaveType)}
                      {leave.reason && ` - ${leave.reason}`}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      申請時間:{' '}
                      {format(new Date(leave.createdAt), 'MM/dd HH:mm')}
                    </p>
                    {leave.rejectReason && (
                      <p className="text-sm text-red-500 mt-1">
                        駁回原因: {leave.rejectReason}
                      </p>
                    )}
                  </div>

                  {leave.status === 'pending' && canApproveLeaves && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowRejectModal(leave.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                        title="駁回"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleApprove(leave.id)}
                        className="p-2 text-green-500 hover:bg-green-50 rounded-lg"
                        title="核准"
                      >
                        <CheckIcon className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setShowCreateModal(false)}
          />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">新增請假申請</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  請假日期
                </label>
                <input
                  type="date"
                  value={formData.leaveDate}
                  onChange={(e) =>
                    setFormData({ ...formData, leaveDate: e.target.value })
                  }
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  請假班別
                </label>
                <select
                  value={formData.shiftType}
                  onChange={(e) =>
                    setFormData({ ...formData, shiftType: e.target.value })
                  }
                  className="input"
                >
                  <option value="">全天</option>
                  <option value="DAY">白班</option>
                  <option value="EVENING">小夜</option>
                  <option value="NIGHT">大夜</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  假別
                </label>
                <select
                  value={formData.leaveType}
                  onChange={(e) =>
                    setFormData({ ...formData, leaveType: e.target.value })
                  }
                  className="input"
                >
                  <option value="annual">特休</option>
                  <option value="sick">病假</option>
                  <option value="personal">事假</option>
                  <option value="other">其他</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  請假原因
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData({ ...formData, reason: e.target.value })
                  }
                  className="input"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="btn-secondary"
              >
                取消
              </button>
              <button onClick={handleCreate} className="btn-primary">
                送出申請
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setShowRejectModal(null)}
          />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">駁回原因</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="input"
              rows={3}
              placeholder="請輸入駁回原因"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowRejectModal(null)}
                className="btn-secondary"
              >
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
