'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  FileText, 
  Upload, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search,
  RefreshCw,
  Plus
} from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

interface Document {
  id: string;
  name: string;
  file_size: string;
  mime_type: string;
  status: 'pending' | 'processing' | 'indexed' | 'failed';
  error_message: string | null;
  created_at: string;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const fetchDocuments = useCallback(async () => {
    try {
      const response = await api.get('/documents');
      setDocuments(response.data);
    } catch (err: any) {
      console.error('Failed to fetch documents:', err);
      // Only set error if we don't already have documents (to avoid breaking the UI on poll)
      if (documents.length === 0) {
        setError('Could not load documents. Please check your connection.');
      }
    } finally {
      setLoading(false);
    }
  }, [documents.length]);

  useEffect(() => {
    fetchDocuments();
    
    // Poll for updates every 5 seconds if there are pending/processing docs
    const hasPending = documents.some(d => d.status === 'pending' || d.status === 'processing');
    let interval: NodeJS.Timeout;
    
    if (hasPending) {
      interval = setInterval(fetchDocuments, 5000);
    }
    
    return () => clearInterval(interval);
  }, [documents, fetchDocuments]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic validation
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      alert('File is too large. Maximum size is 10MB.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      await api.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      fetchDocuments(); // Refresh list
    } catch (err: any) {
      console.error('Upload failed:', err);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const statusIcons = {
    pending: <Clock className="text-yellow-500 w-4 h-4" />,
    processing: <Loader2 className="text-blue-500 w-4 h-4 animate-spin" />,
    indexed: <CheckCircle2 className="text-green-500 w-4 h-4" />,
    failed: <XCircle className="text-red-500 w-4 h-4" />,
  };

  const filteredDocs = documents.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="p-10 max-w-6xl mx-auto">
      <header className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
          <p className="text-gray-400 mt-1 font-medium">Manage and monitor your uploaded knowledge base.</p>
        </div>
        
        <div className="relative group">
          <input 
            type="file" 
            id="file-upload" 
            className="hidden" 
            accept=".pdf,.docx,.txt"
            onChange={handleFileUpload}
            disabled={uploading}
          />
          <label 
            htmlFor="file-upload"
            className={`flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all cursor-pointer shadow-lg shadow-blue-500/20 active:scale-95 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus size={20} />}
            {uploading ? 'Uploading...' : 'Upload Document'}
          </label>
        </div>
      </header>

      {/* Stats row or filter row */}
      <div className="flex gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input 
            type="text"
            placeholder="Search documents by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#111111] border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all font-medium placeholder:text-gray-600"
          />
        </div>
        <button 
          onClick={() => { setLoading(true); fetchDocuments(); }}
          className="p-4 bg-[#111111] border border-white/5 rounded-2xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
          title="Refresh List"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading && documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
          <p className="text-gray-500 font-medium">Loading your documents...</p>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="bg-[#111111] border border-white/5 rounded-3xl p-20 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
            <Upload size={40} className="text-gray-700" />
          </div>
          <h3 className="text-xl font-bold mb-2">No documents found</h3>
          <p className="text-gray-500 max-w-sm font-medium">
            {search ? `We couldn't find anything matching "${search}"` : "Get started by uploading your first technical document or PDF."}
          </p>
        </div>
      ) : (
        <div className="bg-[#111111] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="text-left py-5 px-8 text-xs font-black uppercase tracking-wider text-gray-500">Document Name</th>
                <th className="text-left py-5 px-6 text-xs font-black uppercase tracking-wider text-gray-500">Status</th>
                <th className="text-left py-5 px-6 text-xs font-black uppercase tracking-wider text-gray-500">Size</th>
                <th className="text-left py-5 px-8 text-xs font-black uppercase tracking-wider text-gray-500">Uploaded</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredDocs.map((doc) => (
                <tr key={doc.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="py-5 px-8">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500/20 transition-colors">
                        <FileText size={20} />
                      </div>
                      <span className="font-bold text-gray-200">{doc.name}</span>
                    </div>
                  </td>
                  <td className="py-5 px-6">
                    <div className="flex items-center gap-2">
                       {statusIcons[doc.status]}
                       <span className={`text-sm font-bold capitalize ${
                         doc.status === 'indexed' ? 'text-green-500' : 
                         doc.status === 'failed' ? 'text-red-500' : 
                         doc.status === 'processing' ? 'text-blue-500' : 'text-yellow-500'
                       }`}>
                         {doc.status}
                       </span>
                    </div>
                  </td>
                  <td className="py-5 px-6 text-sm font-medium text-gray-500 font-mono">
                    {(parseInt(doc.file_size) / 1024).toFixed(1)} KB
                  </td>
                  <td className="py-5 px-8 text-sm font-medium text-gray-500">
                    {new Date(doc.created_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
