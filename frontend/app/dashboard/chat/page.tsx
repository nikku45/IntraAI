'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  ChevronRight, 
  MessageSquare,
  Sparkles,
  Search,
  Plus
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  id?: string;
  created_at?: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user, token } = useAuthStore();

  // Scroll to bottom whenever messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    const assistantMessage: Message = { role: 'assistant', content: '' };
    setMessages(prev => [...prev, assistantMessage]);

    try {
      // We use the native Fetch API because Axios doesn't support SSE streaming well out-of-the-box
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'}/chat/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          query: input,
          sessionId: sessionId
        })
      });

      if (!response.ok) throw new Error('Failed to connect to chat');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      const decoder = new TextDecoder();
      let accumulatedContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        
        // SSE messages start with "data: " and end with "\n\n"
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'start') {
                setSessionId(data.sessionId);
              } else if (data.type === 'chunk') {
                const content = data.content;
                accumulatedContent += content;
                setMessages(prev => {
                  const last = prev[prev.length - 1];
                  const others = prev.slice(0, -1);
                  return [...others, { ...last, content: accumulatedContent }];
                });
              } else if (data.type === 'end') {
                // Stream finished
              }
            } catch (err) {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      setMessages(prev => {
        const others = prev.slice(0, -1);
        return [...others, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again later.' }];
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex flex-col h-screen bg-[#0a0a0a]">
      {/* Top Header */}
      <header className="border-b border-white/5 p-6 flex justify-between items-center bg-[#0c0c0c]/50 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Sparkles size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">AI Knowledge Assistant</h1>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Powered by IntraAI RAG</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end">
             <span className="text-xs font-black text-blue-500 tracking-widest uppercase">Global Knowledge</span>
             <span className="text-[10px] text-gray-500 font-medium">Synced & Secure</span>
          </div>
          <button 
            onClick={() => { setMessages([]); setSessionId(null); }}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-all flex items-center gap-2"
          >
            <Plus size={18} />
            <span className="text-sm font-bold">New Chat</span>
          </button>
        </div>
      </header>

      {/* Messages Container */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 scroll-smooth"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto">
            <div className="w-20 h-20 bg-blue-600/10 rounded-3xl flex items-center justify-center mb-8 animate-pulse">
              <Bot size={40} className="text-blue-500" />
            </div>
            <h2 className="text-3xl font-black mb-4 tracking-tight">How can I help you today?</h2>
            <p className="text-gray-500 font-medium text-lg mb-10 leading-relaxed">
              Ask questions about your uploaded documents, company policies, or any knowledge stored in your workspace.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
               {[
                 "Summarize the recent security policy",
                 "How do I request a vacation?",
                 "What are our Q2 objectives?",
                 "Explain the technical architecture"
               ].map((suggestion) => (
                 <button 
                   key={suggestion}
                   onClick={() => setInput(suggestion)}
                   className="p-4 bg-[#111111] border border-white/5 rounded-2xl text-sm font-bold text-gray-400 hover:text-white hover:border-white/20 hover:bg-white/5 transition-all text-left flex items-center justify-between group"
                 >
                   {suggestion}
                   <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                 </button>
               ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div 
              key={i} 
              className={`flex gap-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center ${
                msg.role === 'assistant' 
                  ? 'bg-blue-600/10 text-blue-500 border border-blue-500/20' 
                  : 'bg-white/5 text-gray-400 border border-white/10'
              }`}>
                {msg.role === 'assistant' ? <Bot size={20} /> : <User size={20} />}
              </div>
              
              <div className={`flex-1 space-y-2 mt-1 ${msg.role === 'user' ? 'text-right' : ''}`}>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-700">
                  {msg.role === 'assistant' ? 'System Intelligence' : 'Your Question'}
                </p>
                <div className={`text-gray-200 leading-relaxed font-medium text-lg whitespace-pre-wrap ${
                  msg.role === 'assistant' ? 'bg-[#111111] p-6 rounded-3xl rounded-tl-none border border-white/5 shadow-2xl' : ''
                }`}>
                  {msg.content || (loading && i === messages.length - 1 ? (
                    <div className="flex gap-1 items-center h-6">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
                    </div>
                  ) : msg.content)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input Area */}
      <footer className="p-6 md:p-10 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a] to-transparent">
        <form 
          onSubmit={handleSubmit}
          className="max-w-4xl mx-auto relative group"
        >
          <div className="absolute inset-0 bg-blue-600/5 blur-3xl rounded-full scale-110 opacity-0 group-focus-within:opacity-100 transition-opacity" />
          
          <div className="relative flex items-center bg-[#111111] border border-white/10 rounded-[28px] p-2 pr-4 shadow-2xl focus-within:border-blue-500/50 transition-all">
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message here..."
              className="flex-1 bg-transparent py-4 px-6 focus:outline-none text-white font-medium text-lg placeholder:text-gray-700"
              disabled={loading}
            />
            <button 
              type="submit"
              disabled={!input.trim() || loading}
              className="p-4 bg-blue-600 hover:bg-blue-700 disabled:bg-white/5 disabled:text-gray-700 text-white rounded-2xl transition-all shadow-xl shadow-blue-600/20 active:scale-95 flex items-center gap-2 font-bold"
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
            </button>
          </div>
          
          <p className="mt-4 text-center text-[10px] text-gray-600 font-bold uppercase tracking-widest">
            Always verify important information. AI can make mistakes.
          </p>
        </form>
      </footer>
    </main>
  );
}
