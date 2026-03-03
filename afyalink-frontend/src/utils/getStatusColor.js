export function getStatusColor(status) {
  const map = {
    ACTIVE: 'bg-green-100 text-green-700 border-green-200',
    OPEN: 'bg-blue-100 text-blue-700 border-blue-200',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    CLOSED: 'bg-gray-100 text-gray-600 border-gray-200',
    PENDING: 'bg-orange-100 text-orange-700 border-orange-200',
    COMPLETED: 'bg-green-100 text-green-700 border-green-200',
    OVERDUE: 'bg-red-100 text-red-700 border-red-200',
    PLANNED: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    SCHEDULED: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  };
  return map[status] || 'bg-gray-100 text-gray-600 border-gray-200';
}
