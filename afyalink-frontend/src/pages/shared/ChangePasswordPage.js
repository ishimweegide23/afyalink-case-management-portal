import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import { authApi } from '../../api/authApi';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { HiArrowLeft } from 'react-icons/hi';

const schema = yup.object({
  currentPassword: yup.string().required('Current password is required'),
  newPassword: yup.string().min(6, 'Minimum 6 characters').required('New password is required'),
  confirmPassword: yup.string().oneOf([yup.ref('newPassword')], 'Passwords must match').required('Confirm password'),
});

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: yupResolver(schema) });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await authApi.changePassword(data.currentPassword, data.newPassword);
      toast.success('Password changed successfully');
      navigate(-1);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to change password'); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-md mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6"><HiArrowLeft className="w-4 h-4" /> Back</button>
      <div className="bg-white rounded-xl shadow-card border border-gray-100 p-6">
        <h1 className="text-xl font-bold text-gray-900 mb-6">Change Password</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-1">
          <Input label="Current Password" type="password" register={register('currentPassword')} error={errors.currentPassword?.message} />
          <Input label="New Password" type="password" register={register('newPassword')} error={errors.newPassword?.message} />
          <Input label="Confirm New Password" type="password" register={register('confirmPassword')} error={errors.confirmPassword?.message} />
          <Button type="submit" loading={loading} className="w-full">Update Password</Button>
        </form>
      </div>
    </div>
  );
}
