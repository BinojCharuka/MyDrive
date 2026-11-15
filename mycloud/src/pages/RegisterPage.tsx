import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Cloud, Lock, Mail, User, Eye, EyeOff, ArrowRight, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export const RegisterPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    try {
      const { error } = await signUp(email, password, fullName);
      if (error) {
        toast.error(error.message || 'Registration failed');
      } else {
        toast.success('Account created successfully! Check your email to verify.');
        navigate('/');
      }
    } catch (err: any) {
      toast.error('An unexpected error occurred during signup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050806] flex items-center justify-center p-4 text-[#f5f5f5]">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#13261e] border border-[#1b563f] text-[#2fd697] shadow-xl mb-4">
            <Cloud className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-normal text-[#f5f5f5] tracking-tight">
            Create your account
          </h1>
          <p className="text-sm text-[#a0a6a3] mt-1">Get 10 GB free cloud storage with Cloudflare R2 & Cloudinary</p>
        </div>

        {/* Card */}
        <div className="bg-[#101210] rounded-2xl border border-[#1c2820] p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#a0a6a3] mb-1.5 font-mono">FULL NAME</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#a0a6a3]">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Alex Rivera"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-[#050806] border border-[#1c2820] rounded-xl text-sm text-[#f5f5f5] placeholder-[#a0a6a3]/40 focus:outline-none focus:border-[#2fd697] focus:ring-1 focus:ring-[#2fd697]/30 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#a0a6a3] mb-1.5 font-mono">
                EMAIL ADDRESS
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#a0a6a3]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@example.com"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-[#050806] border border-[#1c2820] rounded-xl text-sm text-[#f5f5f5] placeholder-[#a0a6a3]/40 focus:outline-none focus:border-[#2fd697] focus:ring-1 focus:ring-[#2fd697]/30 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#a0a6a3] mb-1.5 font-mono">PASSWORD</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#a0a6a3]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full pl-10 pr-10 py-2.5 bg-[#050806] border border-[#1c2820] rounded-xl text-sm text-[#f5f5f5] placeholder-[#a0a6a3]/40 focus:outline-none focus:border-[#2fd697] focus:ring-1 focus:ring-[#2fd697]/30 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#a0a6a3] hover:text-[#f5f5f5]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-[#a0a6a3] mt-1 font-mono">Must be at least 8 characters</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#2fd697] hover:bg-[#28c287] text-[#050806] font-bold text-sm rounded-xl shadow-lg shadow-[#2fd697]/20 transition-all active:scale-[0.99] disabled:opacity-50 mt-6"
            >
              <span>{loading ? 'Creating account...' : 'Create free account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 p-3.5 bg-[#050806] rounded-2xl border border-[#1c2820] flex items-center gap-3 text-xs text-[#a0a6a3]">
            <Shield className="w-4 h-4 text-[#2fd697] shrink-0" />
            <span>Files are encrypted & stored in private Cloudflare R2 and Cloudinary CDN.</span>
          </div>
        </div>

        {/* Footer Link */}
        <p className="text-center text-xs text-[#a0a6a3] mt-6">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-[#2fd697] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;

