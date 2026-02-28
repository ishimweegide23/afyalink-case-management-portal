import React from 'react';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../../components/shared/Avatar';
import RoleBadge from '../../components/shared/RoleBadge';
import { Link } from 'react-router-dom';
import Button from '../../components/common/Button';
import { ROUTES } from '../../routes/routeConstants';
import { HiOutlineLockClosed } from 'react-icons/hi';

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>
      <div className="bg-white rounded-xl shadow-card border border-gray-100 p-6">
        <div className="flex items-center gap-4 mb-6">
          <Avatar name={user?.fullName} size="xl" />
          <div>
            <h2 className="text-xl font-bold text-gray-900">{user?.fullName}</h2>
            <p className="text-gray-500">{user?.email}</p>
            <RoleBadge role={user?.role} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-400 text-xs mb-1">User ID</p>
            <p className="font-medium">{user?.id}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-400 text-xs mb-1">Role</p>
            <p className="font-medium">{user?.role?.replace('_', ' ')}</p>
          </div>
        </div>
        <Link to={ROUTES.SHARED.CHANGE_PASSWORD}>
          <Button variant="outline" icon={HiOutlineLockClosed} size="sm">Change Password</Button>
        </Link>
      </div>
    </div>
  );
}
