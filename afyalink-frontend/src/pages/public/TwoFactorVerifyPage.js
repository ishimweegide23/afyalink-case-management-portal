import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { authApi } from '../../api/authApi';
import { useAuth } from '../../context/AuthContext';
import { getDashboardPath } from '../../utils/helpers';
import Button from '../../components/common/Button';
import { HiOutlineShieldCheck, HiOutlineArrowLeft, HiOutlineRefresh } from 'react-icons/hi';

export default function TwoFactorVerifyPage() {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithToken } = useAuth();
  
  const userId = location.state?.userId || sessionStorage.getItem('pending2FAUserId');
  const userEmail = location.state?.email || sessionStorage.getItem('pending2FAEmail');
  
  useEffect(() => {
    if (!userId) {
      navigate('/login');
    }
  }, [userId, navigate]);
  
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const handleChange = (index, value) => {
    if (value.length > 1) {
      // Handle paste
      const pastedData = value.slice(0, 6).split('');
      const newCode = [...code];
      pastedData.forEach((char, i) => {
        if (i < 6 && /^\d$/.test(char)) {
          newCode[i] = char;
        }
      });
      setCode(newCode);
      const nextIndex = Math.min(pastedData.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }
    
    if (!/^\d*$/.test(value)) return;
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    
    if (value !== '' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };
  
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && index > 0 && code[index] === '') {
      inputRefs.current[index - 1]?.focus();
    }
  };
  
  const handleVerify = async (e) => {
    e?.preventDefault();
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      toast.error('Please enter the 6-digit code');
      return;
    }
    
    setLoading(true);
    try {
      const response = await authApi.verifyTwoFactorLogin(userId, fullCode);
      const data = response?.data?.data || response?.data || response;
      
      // We got a JWT back!
      if (data && data.token) {
        sessionStorage.removeItem('pending2FAUserId');
        sessionStorage.removeItem('pending2FAEmail');
        loginWithToken(data);
        toast.success(`Welcome back!`);
        navigate(getDashboardPath(data.role));
      } else {
        toast.error('Invalid response from server');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired code');
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };
  
  const handleResend = async () => {
    if (timeLeft > 0) return;
    setResending(true);
    try {
      await authApi.sendTwoFactorLoginOtp(userId);
      toast.success('A new code has been sent to your email');
      setTimeLeft(60);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend code');
    } finally {
      setResending(false);
    }
  };
  
  const obfuscateEmail = (email) => {
    if (!email) return '';
    const [name, domain] = email.split('@');
    if (!name || !domain) return email;
    return `${name.substring(0, 2)}***@${domain}`;
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 via-white to-sky-50/50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl shadow-gray-200/50 p-6 sm:p-8">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-secondary" />
          
          <button 
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary mb-6 transition-colors"
          >
            <HiOutlineArrowLeft className="w-4 h-4" />
            Back to login
          </button>
          
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mb-4 border border-primary-100">
              <HiOutlineShieldCheck className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Two-Factor Authentication</h2>
            <p className="text-gray-500 text-sm">
              We've sent a verification code to your email <br/>
              <span className="font-medium text-gray-700">{obfuscateEmail(userEmail)}</span>
            </p>
          </div>
          
          <form onSubmit={handleVerify} className="space-y-6">
            <div className="flex justify-center gap-2 sm:gap-3">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={el => inputRefs.current[index] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-semibold border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              ))}
            </div>
            
            <Button type="submit" loading={loading} className="w-full" size="lg">
              Verify & Sign In
            </Button>
          </form>
          
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500 mb-2">Didn't receive the code?</p>
            <button
              onClick={handleResend}
              disabled={timeLeft > 0 || resending}
              className={`flex items-center justify-center gap-2 mx-auto text-sm font-medium transition-colors ${
                timeLeft > 0 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-primary hover:text-primary-700'
              }`}
            >
              <HiOutlineRefresh className={`w-4 h-4 ${resending ? 'animate-spin' : ''}`} />
              {timeLeft > 0 ? `Resend code in ${timeLeft}s` : 'Resend Code'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
