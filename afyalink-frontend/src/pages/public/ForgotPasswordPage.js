import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import { HiOutlineHeart, HiOutlineMail } from 'react-icons/hi';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { authApi } from '../../api/authApi';
import { ROUTES } from '../../routes/routeConstants';

const schema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
});

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await authApi.forgotPassword(data.email.trim().toLowerCase());
      toast.success('Check the server terminal for your 6-digit OTP, then enter it on the next page.');
      navigate(ROUTES.VERIFY_OTP, { state: { email: data.email.trim().toLowerCase() } });
    } catch (err) {
      const msg = err?.message || err?.response?.data?.message || 'Something went wrong. Try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 via-white to-sky-50/50">
        <div className="w-full max-w-md">
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-gray-100 bg-white shadow-xl shadow-gray-200/50 p-6 sm:p-8">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-secondary" />
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                <HiOutlineHeart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">AfyaLink</h1>
                <p className="text-xs text-gray-500">Case Management Portal</p>
              </div>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 tracking-tight">Forgot password?</h2>
            <p className="text-gray-500 mb-6">
              Enter your email. We&apos;ll generate a 6-digit OTP and show it in the server terminal. Use it on the next page to verify.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-1">
              <div className="relative">
                <HiOutlineMail className="absolute left-3 top-[38px] w-4 h-4 text-gray-400 z-10 pointer-events-none" />
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="you@example.com"
                  register={register('email')}
                  error={errors.email?.message}
                  className="[&_input]:pl-9"
                />
              </div>
              <Button type="submit" loading={loading} className="w-full" size="lg">
                Send OTP (check terminal)
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
              Remember your password?{' '}
              <Link to={ROUTES.LOGIN} className="text-primary hover:text-primary-700 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary via-primary to-secondary relative items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_50%,rgba(255,255,255,0.15),transparent)]" />
        <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute bottom-32 right-16 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
        <div className="relative z-10 text-center text-white px-12 max-w-lg">
          <div className="w-20 h-20 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl border border-white/20">
            <HiOutlineHeart className="w-10 h-10" />
          </div>
          <h2 className="text-4xl font-bold mb-4 tracking-tight">Reset your password</h2>
          <p className="text-lg text-white/90 leading-relaxed">
            For security, we show the OTP in the server terminal. Enter it on the verify step to set a new password.
          </p>
        </div>
      </div>
    </div>
  );
}
