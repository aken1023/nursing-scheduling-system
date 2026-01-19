import { useEffect, useState } from 'react'
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import { employeesApi, hospitalsApi } from '../services/api'
import toast from 'react-hot-toast'

interface Employee {
  id: string
  employeeNo: string
  name: string
  gender: string
  phone: string
  email: string
  isLeader: boolean
  isDeputy: boolean
  canDay: boolean
  canNight: boolean
  status: string
  hospitals: Array<{ id: string; name: string }>
}

interface Hospital {
  id: string
  code: string
  name: string
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [formData, setFormData] = useState({
    employeeNo: '',
    name: '',
    gender: 'M',
    phone: '',
    email: '',
    isLeader: false,
    isDeputy: false,
    canDay: true,
    canNight: true,
    hospitalIds: [] as string[],
  })
  const [filter, setFilter] = useState({
    keyword: '',
    hospitalId: '',
    isLeader: '',
  })

  useEffect(() => {
    loadHospitals()
    loadEmployees()
  }, [])

  useEffect(() => {
    loadEmployees()
  }, [filter])

  const loadHospitals = async () => {
    try {
      const response = await hospitalsApi.getAll()
      setHospitals(response.data)
    } catch (error) {
      console.error('Failed to load hospitals', error)
    }
  }

  const loadEmployees = async () => {
    setLoading(true)
    try {
      const response = await employeesApi.getAll({
        keyword: filter.keyword || undefined,
        hospitalId: filter.hospitalId || undefined,
        isLeader: filter.isLeader ? filter.isLeader === 'true' : undefined,
        limit: 100,
      })
      setEmployees(response.data.items)
    } catch (error) {
      console.error('Failed to load employees', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (employee?: Employee) => {
    if (employee) {
      setEditingEmployee(employee)
      setFormData({
        employeeNo: employee.employeeNo,
        name: employee.name,
        gender: employee.gender,
        phone: employee.phone || '',
        email: employee.email || '',
        isLeader: employee.isLeader,
        isDeputy: employee.isDeputy,
        canDay: employee.canDay,
        canNight: employee.canNight,
        hospitalIds: employee.hospitals.map((h) => h.id),
      })
    } else {
      setEditingEmployee(null)
      setFormData({
        employeeNo: '',
        name: '',
        gender: 'M',
        phone: '',
        email: '',
        isLeader: false,
        isDeputy: false,
        canDay: true,
        canNight: true,
        hospitalIds: [],
      })
    }
    setShowModal(true)
  }

  const handleSubmit = async () => {
    try {
      if (editingEmployee) {
        await employeesApi.update(editingEmployee.id, formData)
        toast.success('員工資料已更新')
      } else {
        await employeesApi.create(formData)
        toast.success('員工已新增')
      }
      setShowModal(false)
      loadEmployees()
    } catch (error) {
      // Error handled by API interceptor
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('確定要刪除此員工？')) return

    try {
      await employeesApi.delete(id)
      toast.success('員工已刪除')
      loadEmployees()
    } catch (error) {
      // Error handled by API interceptor
    }
  }

  const toggleHospital = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      hospitalIds: prev.hospitalIds.includes(id)
        ? prev.hospitalIds.filter((h) => h !== id)
        : [...prev.hospitalIds, id],
    }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">員工管理</h1>
        <button
          onClick={() => handleOpenModal()}
          className="btn-primary flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          新增員工
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-wrap gap-4">
          <input
            type="text"
            placeholder="搜尋姓名/工號"
            value={filter.keyword}
            onChange={(e) => setFilter({ ...filter, keyword: e.target.value })}
            className="input w-48"
          />
          <select
            value={filter.hospitalId}
            onChange={(e) => setFilter({ ...filter, hospitalId: e.target.value })}
            className="input w-40"
          >
            <option value="">全部院區</option>
            {hospitals.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
          <select
            value={filter.isLeader}
            onChange={(e) => setFilter({ ...filter, isLeader: e.target.value })}
            className="input w-32"
          >
            <option value="">全部</option>
            <option value="true">Leader</option>
            <option value="false">一般</option>
          </select>
        </div>
      </div>

      {/* Employee list */}
      <div className="card">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">工號</th>
                  <th className="text-left py-3 px-4">姓名</th>
                  <th className="text-center py-3 px-4">性別</th>
                  <th className="text-left py-3 px-4">院區</th>
                  <th className="text-center py-3 px-4">角色</th>
                  <th className="text-center py-3 px-4">可排班別</th>
                  <th className="text-center py-3 px-4">操作</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono">{emp.employeeNo}</td>
                    <td className="py-3 px-4 font-medium">{emp.name}</td>
                    <td className="py-3 px-4 text-center">
                      {emp.gender === 'M' ? '男' : '女'}
                    </td>
                    <td className="py-3 px-4">
                      {emp.hospitals.map((h) => h.name).join(', ') || '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {emp.isLeader && (
                        <span className="badge badge-success mr-1">Leader</span>
                      )}
                      {emp.isDeputy && (
                        <span className="badge badge-pending">代理</span>
                      )}
                      {!emp.isLeader && !emp.isDeputy && '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {emp.canDay && <span className="badge-day badge mr-1">白</span>}
                      {emp.canNight && <span className="badge-night badge">夜</span>}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleOpenModal(emp)}
                        className="p-1 text-gray-500 hover:text-primary-500"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(emp.id)}
                        className="p-1 text-gray-500 hover:text-red-500 ml-2"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editingEmployee ? '編輯員工' : '新增員工'}
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    工號
                  </label>
                  <input
                    type="text"
                    value={formData.employeeNo}
                    onChange={(e) =>
                      setFormData({ ...formData, employeeNo: e.target.value })
                    }
                    className="input"
                    disabled={!!editingEmployee}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    姓名
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    性別
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) =>
                      setFormData({ ...formData, gender: e.target.value })
                    }
                    className="input"
                  >
                    <option value="M">男</option>
                    <option value="F">女</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    電話
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  服務院區
                </label>
                <div className="flex flex-wrap gap-2">
                  {hospitals.map((h) => (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => toggleHospital(h.id)}
                      className={`px-3 py-1.5 rounded-lg text-sm ${
                        formData.hospitalIds.includes(h.id)
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {h.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isLeader}
                    onChange={(e) =>
                      setFormData({ ...formData, isLeader: e.target.checked })
                    }
                    className="mr-2"
                  />
                  Leader
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isDeputy}
                    onChange={(e) =>
                      setFormData({ ...formData, isDeputy: e.target.checked })
                    }
                    className="mr-2"
                  />
                  代理 Leader
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.canDay}
                    onChange={(e) =>
                      setFormData({ ...formData, canDay: e.target.checked })
                    }
                    className="mr-2"
                  />
                  可排白班
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.canNight}
                    onChange={(e) =>
                      setFormData({ ...formData, canNight: e.target.checked })
                    }
                    className="mr-2"
                  />
                  可排夜班
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowModal(false)} className="btn-secondary">
                取消
              </button>
              <button onClick={handleSubmit} className="btn-primary">
                {editingEmployee ? '更新' : '新增'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
