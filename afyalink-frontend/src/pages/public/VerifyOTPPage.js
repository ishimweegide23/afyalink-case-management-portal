// Fix linting warnings and format code
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import { HiOutlineHeart, HiOutlineKey } from 'react-icons/hi';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { authApi } from '../../api/authApi';
import { ROUTES } from '../../routes/routeConstants';

const schema = yup.object({
  otp: yup
    .string()
    .required('OTP is required')
    .length(6, 'OTP must be exactly 6 digits')
    .matches(/^\d{6}$/, 'OTP must be 6 digits'),
});

export default function VerifyOTPPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { otp: '' },
  });

  React.useEffect(() => {
    if (!email) {
      toast.info('Please enter your email on the forgot password page first.');
      navigate(ROUTES.FORGOT_PASSWORD);
    }
  }, [email, navigate]);

  const onSubmit = async (data) => {
    if (!email) return;
    setLoading(true);
    try {
      await authApi.verifyOtp(email, data.otp.trim());
      toast.success('OTP verified. Set your new password.');
      navigate(ROUTES.RESET_PASSWORD, { state: { email, otp: data.otp.trim() } });
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid or expired OTP. Request a new code.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 via-white to-sky-50/50">
        <div className="rounded-2xl border border-gray-100 bg-white shadow-lg px-6 py-4">
          <p className="text-gray-500">Redirecting...</p>
        </div>
      </div>
    );
  }

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

            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 tracking-tight">Verify OTP</h2>
            <p className="text-gray-500 mb-2">
              Enter the 6-digit code shown in the server terminal for:
            </p>
            <p className="text-primary font-medium mb-6 break-all">{email}</p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-1">
              <div className="relative">
                <HiOutlineKey className="absolute left-3 top-[38px] w-4 h-4 text-gray-400 z-10 pointer-events-none" />
                <Input
                  label="6-digit OTP"
                  type="text"
                  placeholder="000000"
                  maxLength={6}
                  autoComplete="one-time-code"
                  register={register('otp')}
                  error={errors.otp?.message}
                  className="[&_input]:pl-9 [&_input]:tracking-[0.5em] [&_input]:text-center"
                />
              </div>
              <Button type="submit" loading={loading} className="w-full" size="lg">
                Verify & continue
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
              <Link to={ROUTES.FORGOT_PASSWORD} className="text-primary hover:text-primary-700 font-medium">
                Use a different email
              </Link>
              {' · '}
              <Link to={ROUTES.LOGIN} className="text-primary hover:text-primary-700 font-medium">
                Back to sign in
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
            <HiOutlineKey className="w-10 h-10" />
          </div>
          <h2 className="text-4xl font-bold mb-4 tracking-tight">Check the terminal</h2>
          <p className="text-lg text-white/90 leading-relaxed">
            The OTP was printed in the backend server console. Copy the 6-digit code and enter it here.
          </p>
        </div>
      </div>
    </div>
  );
}
