import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { userApi } from '../../api/userApi';
import Spinner from '../../components/common/Spinner';
import { formatDate } from '../../utils/formatDate';
import { USER_ROLES } from '../../utils/constants';
import PageHeader from '../../components/layout/PageHeader';
import { HiArrowLeft, HiOutlinePencil, HiOutlineUser, HiOutlineLocationMarker } from 'react-icons/hi';

function formatLocation(user) {
  const parts = [user.village, user.cell, user.sector, user.district, user.province].filter(Boolean);
  return parts.length ? parts.join(', ') : '—';
}

export default function UserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const res = await userApi.getById(id);
        setUser(res?.data);
      } catch {
        toast.error('Failed to load user');
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }
  if (!user) return <p className="text-center text-gray-500 py-20">User not found</p>;

  return (
    <div className="space-y-6 pb-8 max-w-4xl mx-auto">
      <PageHeader
        badge={user.role || 'User'}
        badgeIcon={HiOutlineUser}
        title={user.fullName}
        subtitle={user.email}
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-white text-sm font-medium transition-colors"
            >
              <HiArrowLeft className="w-4 h-4" /> Back
            </button>
            <Link to={`/admin/users/${id}/edit`}>
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-white text-sm font-medium transition-colors cursor-pointer">
                <HiOutlinePencil className="w-4 h-4" /> Edit
              </span>
            </Link>
          </div>
        }
      />
      <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-6 sm:p-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-100">
            <p className="text-gray-400 text-xs mb-1">Email</p>
            <p className="font-medium text-gray-900">{user.email}</p>
          </div>
          <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-100">
            <p className="text-gray-400 text-xs mb-1">Role</p>
            <p className="font-medium text-gray-900">{user.role}</p>
          </div>
          <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-100">
            <p className="text-gray-400 text-xs mb-1">Phone</p>
            <p className="font-medium text-gray-900">{user.phoneNumber || '—'}</p>
          </div>
          <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-100">
            <p className="text-gray-400 text-xs mb-1">Member Since</p>
            <p className="font-medium text-gray-900">{formatDate(user.createdAt)}</p>
          </div>
        </div>

        {(user.role === USER_ROLES.SOCIAL_WORKER || user.role === USER_ROLES.SUPERVISOR) && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <HiOutlineLocationMarker className="w-4 h-4 text-primary" /> Location
            </h3>
            <p className="text-gray-800">{formatLocation(user)}</p>
          </div>
        )}

        {user.role === USER_ROLES.SUPERVISOR && user.assignedDistrict && (
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 text-sm">
            <p className="text-blue-900">
              <span className="font-semibold">Assigned district:</span> {user.assignedDistrict}
              {user.assignedProvince ? ` (${user.assignedProvince})` : ''}
            </p>
          </div>
        )}

        {user.role === USER_ROLES.SOCIAL_WORKER && (
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 text-sm">
            <p className="text-amber-900">
              <span className="font-semibold">Supervisor:</span>{' '}
              {user.supervisorName || 'Not assigned'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
