import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Cloud, Lock, Mail, Eye, EyeOff, ArrowRight, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false);
  const [resending, setResending] = useState(false);

  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setEmailNotConfirmed(false);
    try {
      const { error } = await signIn(email, password);
      if (error) {
        if (error.message.toLowerCase().includes('email not confirmed')) {
          setEmailNotConfirmed(true);
          toast.error('Email not confirmed yet. Check your inbox or verify in Supabase.');
        } else {
          toast.error(error.message || 'Invalid credentials');
        }
      } else {
        toast.success('Welcome back to MyCloud!');
        navigate('/');
      }
    } catch (err: any) {
      toast.error('An unexpected error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!email) {
      toast.error('Please enter your email address first');
      return;
    }
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
      });
      if (error) throw error;
      toast.success('Confirmation link resent! Check your inbox.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to resend confirmation email');
    } finally {
      setResending(false);
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
            Sign in to MyCloud
          </h1>
          <p className="text-sm text-[#a0a6a3] mt-1">Your Files. Your Cloud. Anywhere.</p>
        </div>

        {/* Card */}
        <div className="bg-[#101210] rounded-2xl border border-[#1c2820] p-8 shadow-2xl">
          {emailNotConfirmed && (
            <div className="mb-5 p-4 rounded-2xl bg-amber-950/40 border border-amber-800 text-xs text-amber-300 animate-slide-up">
              <div className="flex items-start gap-2.5 mb-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-200">Email confirmation required</p>
                  <p className="text-[11px] text-amber-300 mt-0.5">
                    Supabase sent a confirmation link to <span className="font-semibold">{email}</span>. Click that link or verify the user in your Supabase dashboard.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleResendConfirmation}
                disabled={resending}
                className="w-full mt-2 py-1.5 px-3 bg-amber-900/60 hover:bg-amber-800/80 text-amber-100 font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                <span>{resending ? 'Sending...' : 'Resend confirmation email'}</span>
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-[#050806] border border-[#1c2820] rounded-xl text-sm text-[#f5f5f5] placeholder-[#a0a6a3]/40 focus:outline-none focus:border-[#2fd697] focus:ring-1 focus:ring-[#2fd697]/30 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-[#a0a6a3] font-mono">PASSWORD</label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-[#2fd697] hover:underline transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#a0a6a3]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
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
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#2fd697] hover:bg-[#28c287] text-[#050806] font-bold text-sm rounded-xl shadow-lg shadow-[#2fd697]/20 transition-all active:scale-[0.99] disabled:opacity-50"
            >
              <span>{loading ? 'Signing in...' : 'Sign in'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Footer Link */}
        <p className="text-center text-xs text-[#a0a6a3] mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-[#2fd697] hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;

