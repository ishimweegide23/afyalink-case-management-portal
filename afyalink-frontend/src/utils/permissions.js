import { USER_ROLES } from './constants';

export function canManageUsers(role) {
  return role === USER_ROLES.ADMIN;
}

export function canManageSystemSettings(role) {
  return role === USER_ROLES.ADMIN;
}

export function canViewAuditLogs(role) {
  return role === USER_ROLES.ADMIN;
}

export function canCreateCase(role) {
  return [USER_ROLES.ADMIN, USER_ROLES.SOCIAL_WORKER].includes(role);
}

export function canEditCase(role) {
  return [USER_ROLES.ADMIN, USER_ROLES.SOCIAL_WORKER].includes(role);
}

export function canDeleteCase(role) {
  return role === USER_ROLES.ADMIN;
}

export function canCreateBeneficiary(role) {
  return [USER_ROLES.ADMIN, USER_ROLES.SOCIAL_WORKER].includes(role);
}

export function canCreateIntervention(role) {
  return [USER_ROLES.ADMIN, USER_ROLES.SOCIAL_WORKER].includes(role);
}

export function canAssignStaff(role) {
  return [USER_ROLES.ADMIN, USER_ROLES.SUPERVISOR].includes(role);
}

export function canViewReports(role) {
  return [USER_ROLES.ADMIN, USER_ROLES.SUPERVISOR].includes(role);
}

export function canUploadDocuments(role) {
  return [USER_ROLES.ADMIN, USER_ROLES.SOCIAL_WORKER].includes(role);
}
