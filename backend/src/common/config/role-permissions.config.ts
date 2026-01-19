import { Role } from '../enums/role.enum';
import { Permission } from '../decorators/permissions.decorator';

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.ADMIN]: Object.values(Permission), // Admin has all permissions

  [Role.MANAGER]: [
    // Employee permissions
    Permission.EMPLOYEE_READ,
    Permission.EMPLOYEE_CREATE,
    Permission.EMPLOYEE_UPDATE,
    // Hospital permissions
    Permission.HOSPITAL_READ,
    Permission.HOSPITAL_CREATE,
    Permission.HOSPITAL_UPDATE,
    // Shift permissions
    Permission.SHIFT_READ,
    Permission.SHIFT_CREATE,
    Permission.SHIFT_UPDATE,
    Permission.SHIFT_DELETE,
    Permission.SHIFT_BATCH,
    // Leave permissions
    Permission.LEAVE_READ,
    Permission.LEAVE_CREATE,
    Permission.LEAVE_APPROVE,
    Permission.LEAVE_REJECT,
    // Swap permissions
    Permission.SWAP_READ,
    Permission.SWAP_CREATE,
    Permission.SWAP_APPROVE,
    Permission.SWAP_REJECT,
    // Cross-hospital permissions
    Permission.CROSS_HOSPITAL_READ,
    Permission.CROSS_HOSPITAL_CREATE,
    Permission.CROSS_HOSPITAL_APPROVE,
    // Auto-schedule permissions
    Permission.AUTO_SCHEDULE_PREVIEW,
    Permission.AUTO_SCHEDULE_EXECUTE,
    // Export permissions
    Permission.EXPORT_READ,
    // Template permissions
    Permission.TEMPLATE_READ,
    Permission.TEMPLATE_CREATE,
    Permission.TEMPLATE_UPDATE,
    Permission.TEMPLATE_DELETE,
    Permission.TEMPLATE_APPLY,
  ],

  [Role.LEADER]: [
    Permission.EMPLOYEE_READ,
    Permission.SHIFT_READ,
    Permission.SHIFT_CREATE,
    Permission.SHIFT_UPDATE,
    Permission.SHIFT_DELETE,
    Permission.LEAVE_READ,
    Permission.LEAVE_CREATE,
    Permission.LEAVE_APPROVE,
    Permission.LEAVE_REJECT,
    Permission.SWAP_READ,
    Permission.SWAP_CREATE,
    Permission.SWAP_APPROVE,
    Permission.SWAP_REJECT,
    Permission.CROSS_HOSPITAL_READ,
    Permission.CROSS_HOSPITAL_CREATE,
    Permission.AUTO_SCHEDULE_PREVIEW,
    Permission.EXPORT_READ,
    Permission.TEMPLATE_READ,
    Permission.TEMPLATE_APPLY,
  ],

  [Role.STAFF]: [
    Permission.EMPLOYEE_READ, // Own profile only (enforced at service level)
    Permission.SHIFT_READ, // Own shifts only (enforced at service level)
    Permission.LEAVE_READ, // Own leaves only
    Permission.LEAVE_CREATE,
    Permission.SWAP_READ, // Own swaps only
    Permission.SWAP_CREATE,
  ],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
