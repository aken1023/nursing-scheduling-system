import { ReactNode } from 'react'
import { useAuthStore } from '../stores/authStore'
import { Role, Permission } from '../types/auth.types'
import { hasRole, hasPermission, hasAnyPermission, hasAllPermissions } from '../utils/permissions'

interface CanProps {
  children: ReactNode
  fallback?: ReactNode
}

interface RoleCanProps extends CanProps {
  role: Role
}

interface PermissionCanProps extends CanProps {
  permission: Permission
}

interface PermissionsCanProps extends CanProps {
  permissions: Permission[]
  requireAll?: boolean
}

/**
 * 根據角色條件渲染元件
 * 使用者須具有指定角色或更高層級才能看到內容
 */
export function CanRole({ role, children, fallback = null }: RoleCanProps) {
  const user = useAuthStore((state) => state.user)

  if (!hasRole(user, role)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

/**
 * 根據單一權限條件渲染元件
 */
export function CanPermission({ permission, children, fallback = null }: PermissionCanProps) {
  const user = useAuthStore((state) => state.user)

  if (!hasPermission(user, permission)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

/**
 * 根據多個權限條件渲染元件
 * @param requireAll - 是否需要全部權限 (預設為 false，只需要任一權限)
 */
export function CanPermissions({
  permissions,
  requireAll = false,
  children,
  fallback = null,
}: PermissionsCanProps) {
  const user = useAuthStore((state) => state.user)

  const hasAccess = requireAll
    ? hasAllPermissions(user, permissions)
    : hasAnyPermission(user, permissions)

  if (!hasAccess) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

/**
 * 通用條件渲染元件
 * 支援角色或權限檢查
 */
interface CanAllProps extends CanProps {
  role?: Role
  permission?: Permission
  permissions?: Permission[]
  requireAllPermissions?: boolean
}

export function Can({
  role,
  permission,
  permissions,
  requireAllPermissions = false,
  children,
  fallback = null,
}: CanAllProps) {
  const user = useAuthStore((state) => state.user)

  // 檢查角色
  if (role && !hasRole(user, role)) {
    return <>{fallback}</>
  }

  // 檢查單一權限
  if (permission && !hasPermission(user, permission)) {
    return <>{fallback}</>
  }

  // 檢查多個權限
  if (permissions) {
    const hasAccess = requireAllPermissions
      ? hasAllPermissions(user, permissions)
      : hasAnyPermission(user, permissions)

    if (!hasAccess) {
      return <>{fallback}</>
    }
  }

  return <>{children}</>
}

export default Can
