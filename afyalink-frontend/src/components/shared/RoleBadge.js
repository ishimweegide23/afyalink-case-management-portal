import React from 'react';
import Badge from '../common/Badge';
import { getRoleBadgeColor } from '../../utils/getRoleBadgeColor';
import { formatEnum } from '../../utils/helpers';

export default function RoleBadge({ role }) {
  return <Badge color={getRoleBadgeColor(role)}>{formatEnum(role)}</Badge>;
}
