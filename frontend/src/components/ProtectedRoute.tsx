import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { Role, Permission } from '../types/auth.types'
import { hasRole, hasAnyPermission } from '../utils/permissions'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: Role
  requiredPermissions?: Permission[]
  redirectTo?: string
}

/**
 * 路由保護元件
 * 根據角色或權限限制路由存取
 */
export function ProtectedRoute({
  children,
  requiredRole,
  requiredPermissions,
  redirectTo = '/unauthorized',
}: ProtectedRouteProps) {
  const user = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const location = useLocation()

  // 未登入則導向登入頁
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // 檢查角色要求
  if (requiredRole && !hasRole(user, requiredRole)) {
    return <Navigate to={redirectTo} replace />
  }

  // 檢查權限要求
  if (requiredPermissions && !hasAnyPermission(user, requiredPermissions)) {
    return <Navigate to={redirectTo} replace />
  }

  return <>{children}</>
}

export default ProtectedRoute
