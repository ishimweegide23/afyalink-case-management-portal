import React from 'react';
import Badge from '../common/Badge';
import { getPriorityColor } from '../../utils/getPriorityColor';

export default function PriorityBadge({ priority }) {
  return <Badge color={getPriorityColor(priority)}>{priority}</Badge>;
}
