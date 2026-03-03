export function getRoleBadgeColor(role) {
  const map = {
    ADMIN: 'bg-purple-100 text-purple-700 border-purple-200',
    SUPERVISOR: 'bg-blue-100 text-blue-700 border-blue-200',
    SOCIAL_WORKER: 'bg-green-100 text-green-700 border-green-200',
  };
  return map[role] || 'bg-gray-100 text-gray-700 border-gray-200';
}
