import { UserRole } from '@/types/types';

/**
 * Check if a user role is guest (read-only)
 */
export const isGuest = (role: UserRole): boolean => {
  return role === 'guest';
};

/**
 * Check if a user has write permissions
 */
export const canWrite = (role: UserRole): boolean => {
  return !isGuest(role);
};

/**
 * Check if a user can be included in schedules
 */
export const canBeScheduled = (role: UserRole): boolean => {
  return !isGuest(role);
};

/**
 * Check if a user is admin
 */
export const isAdmin = (role: UserRole): boolean => {
  return role === 'admin';
};

/**
 * Check if a user has elevated permissions (admin, supervisor, quality, team_leader)
 */
export const hasElevatedPermissions = (role: UserRole): boolean => {
  return ['admin', 'supervisor', 'quality', 'team_leader'].includes(role);
};
