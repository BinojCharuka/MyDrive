import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Cloud, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await resetPassword(email);
      if (error) {
        toast.error(error.message || 'Failed to send reset link');
      } else {
        setSubmitted(true);
        toast.success('Password reset link sent to your email');
      }
    } catch (err: any) {
      toast.error('Failed to request password reset');
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
            Reset password
          </h1>
          <p className="text-sm text-[#a0a6a3] mt-1">
            We will send a password reset link to your email address
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#101210] rounded-2xl border border-[#1c2820] p-8 shadow-2xl">
          {submitted ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-2xl bg-[#13261e] border border-[#1b563f] text-[#2fd697] flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-normal text-[#f5f5f5] mb-2">Check your email</h3>
              <p className="text-xs text-[#a0a6a3] mb-6 leading-relaxed">
                If an account exists with <span className="font-semibold text-[#f5f5f5]">{email}</span>, you will receive instructions to reset your password.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-xs font-semibold text-[#2fd697] hover:underline"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to sign in</span>
              </Link>
            </div>
          ) : (
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

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-[#2fd697] hover:bg-[#28c287] text-[#050806] font-bold text-sm rounded-xl shadow-lg shadow-[#2fd697]/20 transition-all disabled:opacity-50"
              >
                {loading ? 'Sending link...' : 'Send reset link'}
              </button>

              <div className="pt-2 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-xs font-medium text-[#a0a6a3] hover:text-[#f5f5f5]"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to login</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;

