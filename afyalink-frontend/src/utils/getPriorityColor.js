export function getPriorityColor(priority) {
  const map = {
    HIGH: 'bg-red-100 text-red-700 border-red-200',
    MEDIUM: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    LOW: 'bg-green-100 text-green-700 border-green-200',
  };
  return map[priority] || 'bg-gray-100 text-gray-600 border-gray-200';
}
