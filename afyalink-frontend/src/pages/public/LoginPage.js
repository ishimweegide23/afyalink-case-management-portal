import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { getDashboardPath } from '../../utils/helpers';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import ContactAdminModal from '../../components/auth/ContactAdminModal';
import {
  HiOutlineHeart,
  HiOutlineMail,
  HiOutlineLockClosed,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineSupport,
} from 'react-icons/hi';

const schema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(6, 'Minimum 6 characters').required('Password is required'),
});

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: yupResolver(schema) });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const result = await login(data.email, data.password);
      
      if (result?.requiresTwoFactor) {
        sessionStorage.setItem('pending2FAUserId', result.userId);
        sessionStorage.setItem('pending2FAEmail', result.email);
        navigate('/2fa-verify', { state: { userId: result.userId, email: result.email } });
        return;
      }
      
      toast.success(`Welcome back, ${result?.fullName || result?.name || 'there'}!`);
      navigate(getDashboardPath(result.role));
    } catch (err) {
      const message = err?.message || err?.response?.data?.message || 'Invalid credentials. Please try again.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
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

            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 tracking-tight">Welcome back</h2>
            <p className="text-gray-500 mb-6">Sign in to your account to continue</p>

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
              <div className="relative">
                <HiOutlineLockClosed className="absolute left-3 top-[38px] w-4 h-4 text-gray-400 z-10 pointer-events-none" />
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  register={register('password')}
                  error={errors.password?.message}
                  className="[&_input]:pl-9"
                  rightAddon={
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-1"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <HiOutlineEyeOff className="w-5 h-5 text-gray-500" />
                      ) : (
                        <HiOutlineEye className="w-5 h-5 text-gray-500" />
                      )}
                    </button>
                  }
                />
              </div>

              <div className="flex items-center justify-between mb-6">
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
                  <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" />
                  Remember me
                </label>
                <Link to="/forgot-password" className="text-sm text-primary hover:text-primary-700 font-medium">
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" loading={loading} className="w-full" size="lg">
                Sign In
              </Button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 font-medium">Need help?</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Contact Admin link */}
            <button
              type="button"
              onClick={() => setContactModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm text-gray-500 hover:text-primary hover:bg-primary/5 border border-gray-200 hover:border-primary/30 transition-all group"
            >
              <HiOutlineSupport className="w-4 h-4 group-hover:text-primary transition-colors" />
              Contact your system administrator
            </button>
          </div>

          {/* Contact Admin Modal */}
          <ContactAdminModal
            isOpen={contactModalOpen}
            onClose={() => setContactModalOpen(false)}
          />
        </div>
      </div>

      {/* Right side - Visual */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary via-primary to-secondary relative items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_50%,rgba(255,255,255,0.15),transparent)]" />
        <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute bottom-32 right-16 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
        <div className="relative z-10 text-center text-white px-12 max-w-lg">
          <div className="w-20 h-20 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl border border-white/20">
            <HiOutlineHeart className="w-10 h-10" />
          </div>
          <h2 className="text-4xl font-bold mb-4 tracking-tight">AfyaLink Portal</h2>
          <p className="text-lg text-white/90 leading-relaxed mb-10">
            Manage and track vulnerable children, youth, and families with a secure, centralized case management system.
          </p>
          <div className="grid grid-cols-3 gap-4">
            {[
              { val: '500+', lbl: 'Beneficiaries' },
              { val: '50+', lbl: 'Social Workers' },
              { val: '1000+', lbl: 'Cases Managed' },
            ].map((s) => (
              <div key={s.lbl} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                <p className="text-2xl font-bold">{s.val}</p>
                <p className="text-xs text-white/80 mt-1">{s.lbl}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
