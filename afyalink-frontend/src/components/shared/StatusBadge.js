// UI alignment and styling tweaks applied here
import React from 'react';
import Badge from '../common/Badge';
import { getStatusColor } from '../../utils/getStatusColor';
import { formatEnum } from '../../utils/helpers';

export default function StatusBadge({ status }) {
  return <Badge color={getStatusColor(status)}>{formatEnum(status)}</Badge>;
}
