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
import {
  HiOutlineHeart,
  HiOutlineUser,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineLockClosed,
  HiOutlineShieldCheck,
  HiOutlineClipboardList,
  HiOutlineCheckCircle,
  HiOutlineEye,
  HiOutlineEyeOff,
} from 'react-icons/hi';

const schema = yup.object({
  fullName: yup.string().min(2, 'Minimum 2 characters').required('Full name is required'),
  email: yup.string().email('Invalid email address').required('Email is required'),
  phoneNumber: yup.string().matches(/^[0-9+\-\s()]*$/, 'Invalid phone number').required('Phone number is required'),
  password: yup.string().min(6, 'Minimum 6 characters').required('Password is required'),
  confirmPassword: yup.string().oneOf([yup.ref('password')], 'Passwords do not match').required('Please confirm your password'),
  role: yup.string().oneOf(['SOCIAL_WORKER', 'SUPERVISOR'], 'Please select a role').required('Please select your role'),
});

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { role: '' },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const { confirmPassword, ...registerData } = data;
      const user = await registerUser(registerData);
      toast.success('Account created successfully! Welcome to AfyaLink');
      navigate(getDashboardPath(user.role));
    } catch (err) {
      const message = err?.message || err?.response?.data?.message || 'Registration failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    {
      value: 'SOCIAL_WORKER',
      label: 'Social Worker',
      desc: 'Manage cases, conduct home visits, and provide direct support to beneficiaries',
      icon: HiOutlineClipboardList,
      color: 'border-blue-300 bg-blue-50 text-blue-700',
      activeColor: 'border-blue-500 bg-blue-50 ring-2 ring-blue-500/20',
    },
    {
      value: 'SUPERVISOR',
      label: 'Supervisor',
      desc: 'Oversee team performance, review cases, and manage social workers',
      icon: HiOutlineShieldCheck,
      color: 'border-purple-300 bg-purple-50 text-purple-700',
      activeColor: 'border-purple-500 bg-purple-50 ring-2 ring-purple-500/20',
    },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left - Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 via-white to-sky-50/50">
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

            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 tracking-tight">Create Account</h2>
            <p className="text-gray-500 text-sm mb-6">Join the AfyaLink platform to make a difference</p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-1">
            <div className="relative">
              <HiOutlineUser className="absolute left-3 top-[38px] w-4 h-4 text-gray-400 z-10 pointer-events-none" />
              <Input
                label="Full Name"
                placeholder="e.g. Ishimwe Egide"
                register={register('fullName')}
                error={errors.fullName?.message}
                className="[&_input]:pl-9"
              />
            </div>
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
              <HiOutlinePhone className="absolute left-3 top-[38px] w-4 h-4 text-gray-400 z-10 pointer-events-none" />
              <Input
                label="Phone Number"
                type="tel"
                placeholder="+250 788 123 456"
                register={register('phoneNumber')}
                error={errors.phoneNumber?.message}
                className="[&_input]:pl-9"
              />
            </div>
            <div className="relative">
              <HiOutlineLockClosed className="absolute left-3 top-[38px] w-4 h-4 text-gray-400 z-10 pointer-events-none" />
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a strong password (min 6 characters)"
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
                    {showPassword ? <HiOutlineEyeOff className="w-5 h-5 text-gray-500" /> : <HiOutlineEye className="w-5 h-5 text-gray-500" />}
                  </button>
                }
              />
            </div>
            <div className="relative">
              <HiOutlineLockClosed className="absolute left-3 top-[38px] w-4 h-4 text-gray-400 z-10 pointer-events-none" />
              <Input
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Re-enter your password"
                register={register('confirmPassword')}
                error={errors.confirmPassword?.message}
                className="[&_input]:pl-9"
                rightAddon={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((p) => !p)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-1"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <HiOutlineEyeOff className="w-5 h-5 text-gray-500" /> : <HiOutlineEye className="w-5 h-5 text-gray-500" />}
                  </button>
                }
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
              <p className="text-xs text-gray-500 mb-3">Choose your role. This determines your access in the system.</p>
              <div className="space-y-2">
                {roles.map((r) => {
                  const isSelected = selectedRole === r.value;
                  return (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setValue('role', r.value, { shouldValidate: true })}
                      className={`w-full flex items-center gap-3 p-3 rounded-2xl border-2 text-left transition-all ${
                        isSelected ? r.activeColor : 'border-gray-200 bg-gray-50/50 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isSelected ? r.color : 'bg-gray-100 text-gray-400'}`}>
                        <r.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{r.label}</p>
                        <p className="text-xs text-gray-500 truncate">{r.desc}</p>
                      </div>
                      {isSelected && <HiOutlineCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
              {errors.role && <p className="mt-1 text-xs text-red-500">{errors.role.message}</p>}
            </div>

            <Button type="submit" loading={loading} className="w-full" size="lg">
              Create Account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:text-primary-700 font-semibold">Sign in</Link>
          </p>
          </div>
        </div>
      </div>

      {/* Right - Visual */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary via-primary to-secondary relative items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_50%,rgba(255,255,255,0.15),transparent)]" />
        <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute bottom-32 right-16 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
        <div className="relative z-10 text-center text-white px-12 max-w-lg">
          <div className="w-20 h-20 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl border border-white/20">
            <HiOutlineHeart className="w-10 h-10" />
          </div>
          <h2 className="text-4xl font-bold mb-4 tracking-tight">Join Our Mission</h2>
          <p className="text-lg text-white/90 leading-relaxed mb-10">
            Help us protect and empower vulnerable children, youth, and families across Rwanda through better case management.
          </p>
          <div className="grid grid-cols-3 gap-4">
            {[
              { val: '500+', lbl: 'Beneficiaries Served' },
              { val: '50+', lbl: 'Active Workers' },
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
