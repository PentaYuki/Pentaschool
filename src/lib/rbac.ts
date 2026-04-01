export type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT';

export interface RBACContext {
  userId: string;
  role: UserRole;
}

/**
 * Role hierarchy: ADMIN > TEACHER > STUDENT
 * Higher roles inherit permissions of lower roles
 */
const ROLE_HIERARCHY: Record<UserRole, number> = {
  ADMIN: 3,
  TEACHER: 2,
  STUDENT: 1,
};

/**
 * Check if user has required role or higher
 * @example hasRole(context, 'TEACHER') → true if user is TEACHER or ADMIN
 */
export function hasRole(context: RBACContext, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[context.role] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(context: RBACContext, roles: UserRole[]): boolean {
  return roles.includes(context.role);
}

/**
 * Check if user has exact role (no inheritance)
 */
export function hasExactRole(context: RBACContext, requiredRole: UserRole): boolean {
  return context.role === requiredRole;
}

/**
 * Permission definitions by role
 * Used to enforce fine-grained access control
 */
export const PERMISSIONS: Record<UserRole, string[]> = {
  ADMIN: [
    'manage_users',
    'manage_schools',
    'manage_classes',
    'view_analytics',
    'manage_exam_banks',
    'manage_exams',
    'view_all_attempts',
    'view_monitoring',
  ],
  TEACHER: [
    'create_exam_banks',
    'create_exams',
    'create_documents',
    'view_student_attempts',
    'create_classes',
    'manage_own_content',
  ],
  STUDENT: [
    'take_exams',
    'view_own_attempts',
    'view_own_documents',
    'submit_work',
  ],
};

/**
 * Check if user has specific permission
 */
export function hasPermission(context: RBACContext, permission: string): boolean {
  return PERMISSIONS[context.role].includes(permission);
}

/**
 * Enforce role-based access (throws error if unauthorized)
 */
export function enforceRole(context: RBACContext, requiredRole: UserRole): void {
  if (!hasRole(context, requiredRole)) {
    throw new Error(`Unauthorized: requires ${requiredRole} role, but user is ${context.role}`);
  }
}

/**
 * Enforce permission-based access (throws error if unauthorized)
 */
export function enforcePermission(context: RBACContext, permission: string): void {
  if (!hasPermission(context, permission)) {
    throw new Error(`Forbidden: user lacks "${permission}" permission`);
  }
}
