// Add strict prop validation to prevent runtime errors
import React from 'react';
import StatusBadge from './StatusBadge';

export default function InterventionStatusBadge({ status }) {
  return <StatusBadge status={status} />;
}
