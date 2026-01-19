import {
  Role,
  Permission,
  ROLE_PERMISSIONS,
  User,
  getEffectiveRole,
  hasRolePrivilege,
} from '../types/auth.types'

/**
 * 檢查使用者是否有指定權限
 */
export function hasPermission(user: User | null, permission: Permission): boolean {
  if (!user) return false

  const effectiveRole = getEffectiveRole(user)
  const permissions = ROLE_PERMISSIONS[effectiveRole] || []

  return permissions.includes(permission)
}

/**
 * 檢查使用者是否有全部指定權限
 */
export function hasAllPermissions(user: User | null, permissions: Permission[]): boolean {
  return permissions.every((p) => hasPermission(user, p))
}

/**
 * 檢查使用者是否有任一指定權限
 */
export function hasAnyPermission(user: User | null, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(user, p))
}

/**
 * 檢查使用者是否有指定角色或更高層級
 */
export function hasRole(user: User | null, requiredRole: Role): boolean {
  if (!user) return false

  const effectiveRole = getEffectiveRole(user)
  return hasRolePrivilege(effectiveRole, requiredRole)
}

/**
 * 檢查使用者是否可以存取指定院區
 */
export function canAccessHospital(user: User | null, hospitalId: string): boolean {
  if (!user) return false

  const effectiveRole = getEffectiveRole(user)

  // Admin 可以存取所有院區
  if (effectiveRole === Role.ADMIN) return true

  // 其他角色只能存取自己所屬院區
  return user.hospitals.some((h) => h.id === hospitalId)
}

/**
 * 取得使用者可存取的院區列表
 */
export function getAccessibleHospitals(user: User | null): Array<{ id: string; name: string }> {
  if (!user) return []

  const effectiveRole = getEffectiveRole(user)

  // Admin 可以存取所有院區 (需要從 API 取得)
  // 這裡只回傳使用者的院區列表
  return user.hospitals
}

// 導航項目的權限配置
export interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  requiredRole?: Role
  requiredPermissions?: Permission[]
}

/**
 * 過濾導航項目，只回傳使用者有權限存取的項目
 */
export function filterNavigation(user: User | null, items: NavItem[]): NavItem[] {
  return items.filter((item) => {
    // 如果沒有權限要求，則所有人都可以看到
    if (!item.requiredRole && !item.requiredPermissions) {
      return true
    }

    // 檢查角色
    if (item.requiredRole && !hasRole(user, item.requiredRole)) {
      return false
    }

    // 檢查權限
    if (item.requiredPermissions && !hasAnyPermission(user, item.requiredPermissions)) {
      return false
    }

    return true
  })
}

// 路由權限配置
export interface RouteConfig {
  path: string
  requiredRole?: Role
  requiredPermissions?: Permission[]
}

// 預設路由配置
export const ROUTE_PERMISSIONS: RouteConfig[] = [
  { path: '/dashboard' }, // 所有人可以存取
  { path: '/shifts', requiredPermissions: [Permission.SHIFT_READ] },
  { path: '/auto-schedule', requiredRole: Role.LEADER },
  { path: '/shift-templates', requiredRole: Role.LEADER },
  { path: '/shift-swaps', requiredPermissions: [Permission.SWAP_READ] },
  { path: '/leaves', requiredPermissions: [Permission.LEAVE_READ] },
  { path: '/cross-hospital', requiredRole: Role.LEADER },
  { path: '/export', requiredRole: Role.LEADER },
  { path: '/employees', requiredPermissions: [Permission.EMPLOYEE_READ] },
]

/**
 * 檢查使用者是否可以存取指定路由
 */
export function canAccessRoute(user: User | null, path: string): boolean {
  const config = ROUTE_PERMISSIONS.find((r) => path.startsWith(r.path))

  if (!config) return true // 沒有設定的路由預設允許存取

  if (config.requiredRole && !hasRole(user, config.requiredRole)) {
    return false
  }

  if (config.requiredPermissions && !hasAnyPermission(user, config.requiredPermissions)) {
    return false
  }

  return true
}
