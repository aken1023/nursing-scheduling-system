import { useCallback, useMemo } from 'react'
import { useAuthStore } from '../stores/authStore'
import { Role, Permission, getEffectiveRole } from '../types/auth.types'
import {
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  hasRole,
  canAccessHospital,
  canAccessRoute,
} from '../utils/permissions'

/**
 * 權限檢查 Hook
 * 提供各種權限檢查方法
 */
export function usePermissions() {
  const user = useAuthStore((state) => state.user)

  // 取得有效角色
  const effectiveRole = useMemo(() => getEffectiveRole(user), [user])

  // 檢查單一權限
  const can = useCallback(
    (permission: Permission) => hasPermission(user, permission),
    [user]
  )

  // 檢查是否有全部權限
  const canAll = useCallback(
    (permissions: Permission[]) => hasAllPermissions(user, permissions),
    [user]
  )

  // 檢查是否有任一權限
  const canAny = useCallback(
    (permissions: Permission[]) => hasAnyPermission(user, permissions),
    [user]
  )

  // 檢查角色層級
  const is = useCallback(
    (role: Role) => hasRole(user, role),
    [user]
  )

  // 檢查是否為特定角色 (精確比較)
  const isExactly = useCallback(
    (role: Role) => effectiveRole === role,
    [effectiveRole]
  )

  // 檢查是否可以存取院區
  const canAccessHospitalFn = useCallback(
    (hospitalId: string) => canAccessHospital(user, hospitalId),
    [user]
  )

  // 檢查是否可以存取路由
  const canAccessRouteFn = useCallback(
    (path: string) => canAccessRoute(user, path),
    [user]
  )

  // 快捷權限檢查
  const permissions = useMemo(
    () => ({
      // 員工管理
      canReadEmployees: hasPermission(user, Permission.EMPLOYEE_READ),
      canCreateEmployees: hasPermission(user, Permission.EMPLOYEE_CREATE),
      canUpdateEmployees: hasPermission(user, Permission.EMPLOYEE_UPDATE),
      canDeleteEmployees: hasPermission(user, Permission.EMPLOYEE_DELETE),

      // 班表管理
      canReadShifts: hasPermission(user, Permission.SHIFT_READ),
      canCreateShifts: hasPermission(user, Permission.SHIFT_CREATE),
      canUpdateShifts: hasPermission(user, Permission.SHIFT_UPDATE),
      canDeleteShifts: hasPermission(user, Permission.SHIFT_DELETE),

      // 請假管理
      canReadLeaves: hasPermission(user, Permission.LEAVE_READ),
      canCreateLeaves: hasPermission(user, Permission.LEAVE_CREATE),
      canApproveLeaves: hasPermission(user, Permission.LEAVE_APPROVE),

      // 換班管理
      canReadSwaps: hasPermission(user, Permission.SWAP_READ),
      canCreateSwaps: hasPermission(user, Permission.SWAP_CREATE),
      canApproveSwaps: hasPermission(user, Permission.SWAP_APPROVE),

      // 跨院調度
      canReadCrossHospital: hasPermission(user, Permission.CROSS_HOSPITAL_READ),
      canCreateCrossHospital: hasPermission(user, Permission.CROSS_HOSPITAL_CREATE),
      canApproveCrossHospital: hasPermission(user, Permission.CROSS_HOSPITAL_APPROVE),

      // 自動排班
      canPreviewAutoSchedule: hasPermission(user, Permission.AUTO_SCHEDULE_PREVIEW),
      canExecuteAutoSchedule: hasPermission(user, Permission.AUTO_SCHEDULE_EXECUTE),

      // 班表範本
      canReadTemplates: hasPermission(user, Permission.TEMPLATE_READ),
      canCreateTemplates: hasPermission(user, Permission.TEMPLATE_CREATE),
      canUpdateTemplates: hasPermission(user, Permission.TEMPLATE_UPDATE),
      canDeleteTemplates: hasPermission(user, Permission.TEMPLATE_DELETE),
      canApplyTemplates: hasPermission(user, Permission.TEMPLATE_APPLY),

      // 報表匯出
      canExportExcel: hasPermission(user, Permission.EXPORT_EXCEL),
      canExportPdf: hasPermission(user, Permission.EXPORT_PDF),

      // 院區管理
      canReadHospitals: hasPermission(user, Permission.HOSPITAL_READ),
      canCreateHospitals: hasPermission(user, Permission.HOSPITAL_CREATE),
      canUpdateHospitals: hasPermission(user, Permission.HOSPITAL_UPDATE),
      canDeleteHospitals: hasPermission(user, Permission.HOSPITAL_DELETE),
    }),
    [user]
  )

  // 角色檢查快捷方法
  const roles = useMemo(
    () => ({
      isAdmin: effectiveRole === Role.ADMIN,
      isManager: hasRole(user, Role.MANAGER),
      isLeader: hasRole(user, Role.LEADER),
      isStaff: effectiveRole === Role.STAFF,
    }),
    [user, effectiveRole]
  )

  return {
    user,
    effectiveRole,
    can,
    canAll,
    canAny,
    is,
    isExactly,
    canAccessHospital: canAccessHospitalFn,
    canAccessRoute: canAccessRouteFn,
    ...permissions,
    ...roles,
  }
}

export default usePermissions
