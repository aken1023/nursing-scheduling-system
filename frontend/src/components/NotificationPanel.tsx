import { Fragment, useEffect, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon, BellIcon } from '@heroicons/react/24/outline'
import { notificationsApi } from '../services/api'
import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'

interface Notification {
  id: string
  type: string
  title: string
  content: string
  status: string
  createdAt: string
  readAt: string | null
}

interface Props {
  open: boolean
  onClose: () => void
}

export default function NotificationPanel({ open, onClose }: Props) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      loadNotifications()
    }
  }, [open])

  const loadNotifications = async () => {
    setLoading(true)
    try {
      const response = await notificationsApi.getAll(50)
      setNotifications(response.data)
    } catch (error) {
      console.error('Failed to load notifications', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id)
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, status: 'read', readAt: new Date().toISOString() } : n
        )
      )
    } catch (error) {
      console.error('Failed to mark as read', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead()
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, status: 'read', readAt: new Date().toISOString() }))
      )
    } catch (error) {
      console.error('Failed to mark all as read', error)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'leader_gap':
        return '🔴'
      case 'leave_approved':
        return '✅'
      case 'leave_rejected':
        return '❌'
      case 'cross_hospital_request':
        return '🔄'
      case 'shift_change':
        return '📅'
      default:
        return '📢'
    }
  }

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-300"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                  <div className="flex h-full flex-col bg-white shadow-xl">
                    <div className="flex items-center justify-between px-4 py-4 border-b">
                      <Dialog.Title className="flex items-center text-lg font-medium">
                        <BellIcon className="h-5 w-5 mr-2" />
                        通知中心
                      </Dialog.Title>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleMarkAllAsRead}
                          className="text-sm text-primary-600 hover:text-primary-700"
                        >
                          全部已讀
                        </button>
                        <button onClick={onClose}>
                          <XMarkIcon className="h-6 w-6" />
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                      {loading ? (
                        <div className="flex items-center justify-center py-12">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                          <BellIcon className="h-12 w-12 mb-2" />
                          <p>暫無通知</p>
                        </div>
                      ) : (
                        <div className="divide-y">
                          {notifications.map((notification) => (
                            <div
                              key={notification.id}
                              className={`p-4 hover:bg-gray-50 cursor-pointer ${
                                notification.status !== 'read' ? 'bg-blue-50' : ''
                              }`}
                              onClick={() => handleMarkAsRead(notification.id)}
                            >
                              <div className="flex items-start gap-3">
                                <span className="text-xl">
                                  {getTypeIcon(notification.type)}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-900">
                                    {notification.title}
                                  </p>
                                  <p className="text-sm text-gray-600 mt-1">
                                    {notification.content}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-2">
                                    {format(
                                      new Date(notification.createdAt),
                                      'MM/dd HH:mm',
                                      { locale: zhTW }
                                    )}
                                  </p>
                                </div>
                                {notification.status !== 'read' && (
                                  <span className="h-2 w-2 bg-blue-500 rounded-full" />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
