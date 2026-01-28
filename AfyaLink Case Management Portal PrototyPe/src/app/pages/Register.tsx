import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Eye, EyeOff, Mail, Lock, User, Phone, Shield, ArrowRight, Sparkles, CheckCircle2, Building2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useAuth, UserRole } from '../context/AuthContext';

export function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const passwordMatch = password && confirmPassword && password === confirmPassword;
  const passwordLength = password.length >= 8;
  const passwordStrength = password.length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    if (!passwordLength) {
      alert('Password must be at least 8 characters long');
      return;
    }
    if (role) {
      register(name, email, phone, password, role);
      navigate(`/${role.replace('_', '-')}/dashboard`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 flex relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl animate-pulse" 
           style={{ animationDuration: '4s' }} />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-secondary/10 rounded-full blur-3xl animate-pulse" 
           style={{ animationDuration: '6s', animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl animate-pulse" 
           style={{ animationDuration: '8s', animationDelay: '2s' }} />
      
      {/* Left Side - Hero Section (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12 bg-gradient-to-br from-primary via-primary/95 to-secondary">
        <div className="absolute inset-0 opacity-10" 
             style={{
               backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255,255,255,0.05) 20px, rgba(255,255,255,0.05) 40px)'
             }}>
        </div>
        
        <div className="relative z-10 max-w-lg text-white">
          <div className="mb-8">
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="relative">
                <Heart className="h-16 w-16 fill-white drop-shadow-lg" />
                <Sparkles className="h-6 w-6 text-yellow-300 absolute -top-2 -right-2 animate-pulse" />
              </div>
              <h1 className="text-5xl font-bold">AfyaLink</h1>
            </div>
            <p className="text-2xl font-semibold mb-4">Join Our Community</p>
            <p className="text-lg text-white/90 leading-relaxed mb-8">
              Create your account and start managing vulnerable children and families with our comprehensive case management system.
            </p>
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <CheckCircle2 className="h-6 w-6 flex-shrink-0" />
              <span className="text-sm">Secure and encrypted data storage</span>
            </div>
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <CheckCircle2 className="h-6 w-6 flex-shrink-0" />
              <span className="text-sm">Real-time case tracking and updates</span>
            </div>
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <CheckCircle2 className="h-6 w-6 flex-shrink-0" />
              <span className="text-sm">Comprehensive reporting and analytics</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-white/80">
            <Building2 className="h-4 w-4" />
            <span>Powered by Mwana Ukundwa (AMU) - Kicukiro, Rwanda</span>
          </div>
        </div>
      </div>

      {/* Right Side - Registration Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 relative z-10">
        <div className="w-full max-w-xl">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-4 group">
              <div className="relative">
                <Heart className="h-10 w-10 text-primary fill-primary transition-transform group-hover:scale-110" />
                <Sparkles className="h-3 w-3 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
              </div>
              <span className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                AfyaLink
              </span>
            </Link>
          </div>

          <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-xl">
            <CardHeader className="space-y-2 pb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-secondary/20 to-secondary/10 rounded-xl flex items-center justify-center">
                    <User className="h-6 w-6 text-secondary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl sm:text-3xl font-bold">Create Account</CardTitle>
                    <CardDescription className="text-sm">Get started with AfyaLink</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-primary" />
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="h-11 bg-gray-50 border-gray-200 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-primary" />
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-11 bg-gray-50 border-gray-200 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-primary" />
                      Phone
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+250 XXX XXX XXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      className="h-11 bg-gray-50 border-gray-200 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                </div>

                {/* Role */}
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-sm font-semibold text-gray-700">
                    Select Your Role
                  </Label>
                  <Select value={role || ''} onValueChange={(value) => setRole(value as UserRole)}>
                    <SelectTrigger 
                      id="role" 
                      className="h-11 bg-gray-50 border-gray-200 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    >
                      <SelectValue placeholder="Choose your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">👤 Administrator</SelectItem>
                      <SelectItem value="social_worker">🤝 Social Worker</SelectItem>
                      <SelectItem value="supervisor">👔 Supervisor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Lock className="h-3.5 w-3.5 text-primary" />
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a strong password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-11 bg-gray-50 border-gray-200 pr-10 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {passwordStrength && (
                    <div className="flex items-center gap-2 text-xs">
                      {passwordLength ? (
                        <CheckCircle2 className="h-3 w-3 text-secondary" />
                      ) : (
                        <div className="h-3 w-3 rounded-full border-2 border-gray-300" />
                      )}
                      <span className={passwordLength ? 'text-secondary font-medium' : 'text-gray-500'}>
                        At least 8 characters
                      </span>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Lock className="h-3.5 w-3.5 text-primary" />
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className={`h-11 bg-gray-50 pr-10 focus:bg-white focus:ring-2 transition-all ${
                        confirmPassword && passwordMatch
                          ? 'border-secondary focus:border-secondary focus:ring-secondary/20'
                          : confirmPassword && !passwordMatch
                          ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                          : 'border-gray-200 focus:border-primary focus:ring-primary/20'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {confirmPassword && (
                    <div className="flex items-center gap-2 text-xs">
                      {passwordMatch ? (
                        <>
                          <CheckCircle2 className="h-3 w-3 text-secondary" />
                          <span className="text-secondary font-medium">Passwords match</span>
                        </>
                      ) : (
                        <>
                          <div className="h-3 w-3 rounded-full bg-red-500" />
                          <span className="text-red-600 font-medium">Passwords do not match</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <Button 
                    type="submit" 
                    className="w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] bg-gradient-to-r from-primary to-secondary" 
                    size="lg"
                    disabled={!role || !passwordMatch || !passwordLength}
                  >
                    Create Account
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </div>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-3 text-gray-500 font-medium">Already have an account?</span>
                  </div>
                </div>

                {/* Sign In Link */}
                <Button 
                  asChild 
                  variant="outline" 
                  className="w-full h-11 text-base border-2 border-gray-200 hover:bg-gray-50 hover:border-primary/30 transition-all"
                >
                  <Link to="/login">
                    Sign In Instead
                  </Link>
                </Button>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-gray-500 mt-6 flex items-center justify-center gap-1">
            <Shield className="h-3.5 w-3.5" />
            Secure registration • Encrypted data • Rwanda-based
          </p>
        </div>
      </div>
    </div>
  );
}