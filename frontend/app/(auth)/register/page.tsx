'use client';

import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, LifeBuoy, Loader2, ChevronLeft, Building2 } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setAuth = useAuthStore((state) => state.setAuth);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/auth/register', { 
        email, 
        password, 
        companyName 
      });
      // Backend returns { success, message, data: { user, token } }
      const { user, token } = response.data.data;
      setAuth(user, token);
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Registration failed:', err);
      setError(err.response?.data?.message || 'Could not create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060606] text-white flex flex-col items-center justify-center p-6 selection:bg-blue-500/30">
      {/* Background Ambience */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-600/10 blur-[120px] rounded-full" />
      </div>

      <Link 
        href="/" 
        className="absolute top-8 left-8 flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors group"
      >
        <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        Back to home
      </Link>

      <div className="w-full max-w-[440px] flex flex-col items-center">
        {/* Brand Header */}
        <div className="mb-12 text-center">
          <div className="w-14 h-14 bg-gradient-to-tr from-indigo-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/20 mx-auto mb-6">
            <LifeBuoy className="text-white w-8 h-8" />
          </div>
          <h1 className="text-4xl font-black tracking-tight mb-2">Build your brain</h1>
          <p className="text-gray-500 font-medium">Join 500+ teams using Intelligent RAG</p>
        </div>

        {/* Auth Card */}
        <div className="w-full bg-[#0c0c0c] border border-white/5 p-10 rounded-[28px] shadow-2xl backdrop-blur-3xl">
          {error && (
            <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-sm font-medium animate-in fade-in slide-in-from-top-4 duration-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-400 ml-1">Company Name</label>
              <div className="relative group">
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-5 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40 transition-all font-sans placeholder:text-gray-700"
                  placeholder="Acme Industries"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-400 ml-1">Work Email</label>
              <div className="relative group">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-5 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40 transition-all font-sans placeholder:text-gray-700"
                  placeholder="name@company.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-400 ml-1">Password</label>
              <div className="relative group">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-5 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40 transition-all font-sans placeholder:text-gray-700"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-xl shadow-indigo-600/20 mt-10"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Creating space...</span>
                </>
              ) : (
                <>
                  <span>Create Workspace</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <p className="mt-10 text-center text-gray-500 text-sm font-medium">
            Already have an account?{' '}
            <Link href="/login" className="text-indigo-500 hover:text-indigo-400 font-bold ml-1 hover:underline underline-offset-4 decoration-2">
              Sign In
            </Link>
          </p>
        </div>

        <div className="mt-12 text-center opacity-30 pointer-events-none">
           <p className="text-[10px] uppercase tracking-[0.2em] font-black text-gray-400">
             By joining you agree to our Terms of Service
           </p>
        </div>
      </div>
    </div>
  );
}