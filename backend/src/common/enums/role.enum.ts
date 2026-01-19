export enum Role {
  ADMIN = 'admin',
  MANAGER = 'manager',
  LEADER = 'leader',
  STAFF = 'staff',
}

// Role hierarchy - higher index = more permissions
export const ROLE_HIERARCHY: Role[] = [
  Role.STAFF,
  Role.LEADER,
  Role.MANAGER,
  Role.ADMIN,
];

// Helper to check if role A has higher or equal privileges to role B
export function hasRolePrivilege(userRole: Role, requiredRole: Role): boolean {
  const userIndex = ROLE_HIERARCHY.indexOf(userRole);
  const requiredIndex = ROLE_HIERARCHY.indexOf(requiredRole);
  return userIndex >= requiredIndex;
}
