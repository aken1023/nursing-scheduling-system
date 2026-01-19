// 角色枚舉
export enum Role {
  ADMIN = 'admin',
  MANAGER = 'manager',
  LEADER = 'leader',
  STAFF = 'staff',
}

// 角色層級 (由低到高)
export const ROLE_HIERARCHY: Role[] = [
  Role.STAFF,
  Role.LEADER,
  Role.MANAGER,
  Role.ADMIN,
]

// 權限枚舉
export enum Permission {
  // 員工管理
  EMPLOYEE_READ = 'employee:read',
  EMPLOYEE_CREATE = 'employee:create',
  EMPLOYEE_UPDATE = 'employee:update',
  EMPLOYEE_DELETE = 'employee:delete',

  // 班表管理
  SHIFT_READ = 'shift:read',
  SHIFT_CREATE = 'shift:create',
  SHIFT_UPDATE = 'shift:update',
  SHIFT_DELETE = 'shift:delete',

  // 請假管理
  LEAVE_READ = 'leave:read',
  LEAVE_CREATE = 'leave:create',
  LEAVE_APPROVE = 'leave:approve',

  // 換班管理
  SWAP_READ = 'swap:read',
  SWAP_CREATE = 'swap:create',
  SWAP_APPROVE = 'swap:approve',

  // 跨院調度
  CROSS_HOSPITAL_READ = 'cross-hospital:read',
  CROSS_HOSPITAL_CREATE = 'cross-hospital:create',
  CROSS_HOSPITAL_APPROVE = 'cross-hospital:approve',

  // 自動排班
  AUTO_SCHEDULE_PREVIEW = 'auto-schedule:preview',
  AUTO_SCHEDULE_EXECUTE = 'auto-schedule:execute',

  // 班表範本
  TEMPLATE_READ = 'template:read',
  TEMPLATE_CREATE = 'template:create',
  TEMPLATE_UPDATE = 'template:update',
  TEMPLATE_DELETE = 'template:delete',
  TEMPLATE_APPLY = 'template:apply',

  // 報表匯出
  EXPORT_EXCEL = 'export:excel',
  EXPORT_PDF = 'export:pdf',

  // 院區管理
  HOSPITAL_READ = 'hospital:read',
  HOSPITAL_CREATE = 'hospital:create',
  HOSPITAL_UPDATE = 'hospital:update',
  HOSPITAL_DELETE = 'hospital:delete',
}

// 角色權限對應
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.ADMIN]: Object.values(Permission),

  [Role.MANAGER]: [
    // 員工管理 (除了刪除)
    Permission.EMPLOYEE_READ,
    Permission.EMPLOYEE_CREATE,
    Permission.EMPLOYEE_UPDATE,
    // 班表管理
    Permission.SHIFT_READ,
    Permission.SHIFT_CREATE,
    Permission.SHIFT_UPDATE,
    Permission.SHIFT_DELETE,
    // 請假管理
    Permission.LEAVE_READ,
    Permission.LEAVE_CREATE,
    Permission.LEAVE_APPROVE,
    // 換班管理
    Permission.SWAP_READ,
    Permission.SWAP_CREATE,
    Permission.SWAP_APPROVE,
    // 跨院調度
    Permission.CROSS_HOSPITAL_READ,
    Permission.CROSS_HOSPITAL_CREATE,
    Permission.CROSS_HOSPITAL_APPROVE,
    // 自動排班
    Permission.AUTO_SCHEDULE_PREVIEW,
    Permission.AUTO_SCHEDULE_EXECUTE,
    // 班表範本
    Permission.TEMPLATE_READ,
    Permission.TEMPLATE_CREATE,
    Permission.TEMPLATE_UPDATE,
    Permission.TEMPLATE_DELETE,
    Permission.TEMPLATE_APPLY,
    // 報表匯出
    Permission.EXPORT_EXCEL,
    Permission.EXPORT_PDF,
    // 院區管理 (除了新增/刪除)
    Permission.HOSPITAL_READ,
    Permission.HOSPITAL_UPDATE,
  ],

  [Role.LEADER]: [
    // 員工管理 (只有讀取)
    Permission.EMPLOYEE_READ,
    // 班表管理
    Permission.SHIFT_READ,
    Permission.SHIFT_CREATE,
    Permission.SHIFT_UPDATE,
    Permission.SHIFT_DELETE,
    // 請假管理
    Permission.LEAVE_READ,
    Permission.LEAVE_CREATE,
    Permission.LEAVE_APPROVE,
    // 換班管理
    Permission.SWAP_READ,
    Permission.SWAP_CREATE,
    Permission.SWAP_APPROVE,
    // 跨院調度 (只能發起)
    Permission.CROSS_HOSPITAL_READ,
    Permission.CROSS_HOSPITAL_CREATE,
    // 自動排班 (只能預覽)
    Permission.AUTO_SCHEDULE_PREVIEW,
    // 班表範本 (只能套用)
    Permission.TEMPLATE_READ,
    Permission.TEMPLATE_APPLY,
    // 報表匯出
    Permission.EXPORT_EXCEL,
    Permission.EXPORT_PDF,
    // 院區管理 (只有讀取)
    Permission.HOSPITAL_READ,
  ],

  [Role.STAFF]: [
    Permission.SHIFT_READ,
    Permission.LEAVE_READ,
    Permission.LEAVE_CREATE,
    Permission.SWAP_READ,
    Permission.SWAP_CREATE,
    Permission.HOSPITAL_READ,
  ],
}

// 使用者介面
export interface User {
  id: string
  employeeNo: string
  name: string
  role: Role | string
  isLeader: boolean
  isDeputy?: boolean
  hospitals: Array<{ id: string; name: string }>
}

// 取得有效角色 (考慮 isLeader 旗標)
export function getEffectiveRole(user: User | null): Role {
  if (!user) return Role.STAFF

  const baseRole = user.role as Role

  // 如果 isLeader 為 true 且 role 是 staff，則提升為 leader
  if ((user.isLeader || user.isDeputy) && baseRole === Role.STAFF) {
    return Role.LEADER
  }

  return baseRole
}

// 檢查角色層級
export function hasRolePrivilege(userRole: Role, requiredRole: Role): boolean {
  const userIndex = ROLE_HIERARCHY.indexOf(userRole)
  const requiredIndex = ROLE_HIERARCHY.indexOf(requiredRole)
  return userIndex >= requiredIndex
}
