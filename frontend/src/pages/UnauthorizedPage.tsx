import { Link } from 'react-router-dom'
import { ShieldExclamationIcon } from '@heroicons/react/24/outline'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <ShieldExclamationIcon className="mx-auto h-16 w-16 text-red-500" />
        <h1 className="mt-4 text-2xl font-bold text-gray-900">
          無權限存取
        </h1>
        <p className="mt-2 text-gray-600">
          抱歉，您沒有權限存取此頁面。
          <br />
          如需存取權限，請聯繫系統管理員。
        </p>
        <div className="mt-6 space-x-4">
          <Link
            to="/dashboard"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            返回首頁
          </Link>
          <Link
            to="/"
            onClick={() => window.history.back()}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            返回上一頁
          </Link>
        </div>
      </div>
    </div>
  )
}
