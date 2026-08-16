'use client';

import React from 'react';
import { useAuthStore } from '@/store/authStore';
import { FileText, Plus } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuthStore();
  
  // Guard for server-side rendering or missing user
  if (!user) return null;

  return (
    <main className="p-10">
      <header className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user.email.split('@')[0]}</h1>
          <p className="text-gray-400 mt-1">Here is what is happening with your knowledge base.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium text-white">{user.email.split('@')[0]}</p>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">{user.role}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-gray-700 to-gray-600 border border-white/10" />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#111111] border border-white/5 p-8 rounded-2xl shadow-sm">
          <p className="text-gray-400 text-sm font-medium mb-1">Total Documents</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-4xl font-black">0</h3>
            <span className="text-xs text-blue-500 font-bold bg-blue-500/10 px-2 py-0.5 rounded-full">Coming soon</span>
          </div>
        </div>
        <div className="bg-[#111111] border border-white/5 p-8 rounded-2xl shadow-sm">
          <p className="text-gray-400 text-sm font-medium mb-1">Total Queries</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-4xl font-black">0</h3>
          </div>
        </div>
        <div className="bg-[#111111] border border-white/5 p-8 rounded-2xl shadow-sm">
          <p className="text-gray-400 text-sm font-medium mb-1">System Health</p>
          <div className="flex items-center gap-2">
            <h3 className="text-4xl font-black text-green-500">Active</h3>
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          </div>
        </div>
      </div>

      <div className="mt-10 bg-[#111111] border border-white/5 rounded-3xl h-[360px] flex flex-col items-center justify-center text-center p-10 relative overflow-hidden group">
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-3xl rounded-full" />
        
        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
          <FileText size={32} className="text-gray-500" />
        </div>
        <h4 className="text-2xl font-bold mb-2">No documents indexed yet</h4>
        <p className="text-gray-400 max-w-sm font-medium">Upload your first PDF or DOCX to start chatting with your knowledge base.</p>
        
        <Link 
          href="/dashboard/documents"
          className="mt-8 px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-2xl text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95"
        >
          <Plus size={18} />
          Go to Documents
        </Link>
      </div>
    </main>
  );
}
