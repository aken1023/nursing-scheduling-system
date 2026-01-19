import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  HomeIcon,
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
  ArrowsRightLeftIcon,
  DocumentArrowDownIcon,
  UsersIcon,
  BellIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline'
import { useAuthStore } from '../stores/authStore'
import NotificationPanel from './NotificationPanel'

const navigation = [
  { name: '首頁', href: '/dashboard', icon: HomeIcon },
  { name: '班表管理', href: '/shifts', icon: CalendarDaysIcon },
  { name: '請假管理', href: '/leaves', icon: ClipboardDocumentListIcon },
  { name: '跨院調度', href: '/cross-hospital', icon: ArrowsRightLeftIcon },
  { name: '報表匯出', href: '/export', icon: DocumentArrowDownIcon },
  { name: '員工管理', href: '/employees', icon: UsersIcon },
]

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notificationOpen, setNotificationOpen] = useState(false)
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile sidebar */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? '' : 'hidden'}`}
      >
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75"
          onClick={() => setSidebarOpen(false)}
        />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
          <div className="flex h-16 items-center justify-between px-4">
            <span className="text-xl font-semibold text-primary-600">
              照護排班系統
            </span>
            <button onClick={() => setSidebarOpen(false)}>
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center px-4 py-2 text-sm font-medium rounded-lg ${
                    isActive
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`
                }
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col bg-white border-r border-gray-200">
          <div className="flex h-16 items-center px-4 border-b border-gray-200">
            <span className="text-xl font-semibold text-primary-600">
              照護排班系統
            </span>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center px-4 py-2 text-sm font-medium rounded-lg ${
                    isActive
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`
                }
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top navbar */}
        <div className="sticky top-0 z-40 flex h-16 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm">
          <button
            type="button"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>

          <div className="flex flex-1 justify-end gap-x-4">
            {/* Notification button */}
            <button
              className="relative p-2 text-gray-400 hover:text-gray-500"
              onClick={() => setNotificationOpen(true)}
            >
              <BellIcon className="h-6 w-6" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
            </button>

            {/* User menu */}
            <div className="flex items-center gap-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-gray-500"
                title="登出"
              >
                <ArrowRightOnRectangleIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>

      {/* Notification panel */}
      <NotificationPanel
        open={notificationOpen}
        onClose={() => setNotificationOpen(false)}
      />
    </div>
  )
}
