import { SetMetadata } from '@nestjs/common';

export enum Permission {
  // Employee permissions
  EMPLOYEE_READ = 'employee:read',
  EMPLOYEE_CREATE = 'employee:create',
  EMPLOYEE_UPDATE = 'employee:update',
  EMPLOYEE_DELETE = 'employee:delete',

  // Hospital permissions
  HOSPITAL_READ = 'hospital:read',
  HOSPITAL_CREATE = 'hospital:create',
  HOSPITAL_UPDATE = 'hospital:update',
  HOSPITAL_DELETE = 'hospital:delete',

  // Shift permissions
  SHIFT_READ = 'shift:read',
  SHIFT_CREATE = 'shift:create',
  SHIFT_UPDATE = 'shift:update',
  SHIFT_DELETE = 'shift:delete',
  SHIFT_BATCH = 'shift:batch',

  // Leave permissions
  LEAVE_READ = 'leave:read',
  LEAVE_CREATE = 'leave:create',
  LEAVE_APPROVE = 'leave:approve',
  LEAVE_REJECT = 'leave:reject',

  // Swap permissions
  SWAP_READ = 'swap:read',
  SWAP_CREATE = 'swap:create',
  SWAP_APPROVE = 'swap:approve',
  SWAP_REJECT = 'swap:reject',

  // Cross-hospital permissions
  CROSS_HOSPITAL_READ = 'cross-hospital:read',
  CROSS_HOSPITAL_CREATE = 'cross-hospital:create',
  CROSS_HOSPITAL_APPROVE = 'cross-hospital:approve',

  // Auto-schedule permissions
  AUTO_SCHEDULE_PREVIEW = 'auto-schedule:preview',
  AUTO_SCHEDULE_EXECUTE = 'auto-schedule:execute',

  // Export permissions
  EXPORT_READ = 'export:read',

  // Template permissions
  TEMPLATE_READ = 'template:read',
  TEMPLATE_CREATE = 'template:create',
  TEMPLATE_UPDATE = 'template:update',
  TEMPLATE_DELETE = 'template:delete',
  TEMPLATE_APPLY = 'template:apply',
}

export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
