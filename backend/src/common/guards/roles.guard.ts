import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role, hasRolePrivilege } from '../enums/role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PERMISSIONS_KEY, Permission } from '../decorators/permissions.decorator';
import { hasPermission } from '../config/role-permissions.config';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Check for @Roles() decorator
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Check for @RequirePermissions() decorator
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no roles or permissions required, allow access
    if (!requiredRoles && !requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('未授權的存取');
    }

    // Determine effective role (consider isLeader flag)
    let effectiveRole = user.role as Role;
    if ((user.isLeader || user.isDeputy) && effectiveRole === Role.STAFF) {
      effectiveRole = Role.LEADER;
    }

    // Check role-based access
    if (requiredRoles) {
      const hasRequiredRole = requiredRoles.some((role) =>
        hasRolePrivilege(effectiveRole, role),
      );
      if (!hasRequiredRole) {
        throw new ForbiddenException('您沒有權限執行此操作');
      }
    }

    // Check permission-based access
    if (requiredPermissions) {
      const hasRequiredPermission = requiredPermissions.every((permission) =>
        hasPermission(effectiveRole, permission),
      );
      if (!hasRequiredPermission) {
        throw new ForbiddenException('您沒有權限執行此操作');
      }
    }

    return true;
  }
}
