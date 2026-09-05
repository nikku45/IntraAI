'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  ChevronRight, 
  MessageSquare,
  Sparkles,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  Clock
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  id?: string;
  created_at?: string;
}

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  queries?: { query_text: string; created_at: string }[];
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const { token } = useAuthStore();

  // Scroll to bottom whenever messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Fetch all sessions for the user
  const fetchSessions = useCallback(async () => {
    try {
      setSessionsLoading(true);
      const res = await api.get('/chat/sessions');
      setSessions(res.data || []);
    } catch (err) {
      console.error('Error fetching sessions:', err);
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Fetch chat history for a selected session
  const selectSession = async (id: string) => {
    if (loading || id === sessionId) return;
    try {
      setHistoryLoading(true);
      setSessionId(id);
      const res = await api.get(`/chat/history/${id}`);
      const rawQueries = res.data.messages || [];

      // Transform queries into message pairs (User question & Assistant response)
      const formattedMessages: Message[] = [];
      rawQueries.forEach((q: any) => {
        if (q.query_text) {
          formattedMessages.push({
            role: 'user',
            content: q.query_text,
            id: `${q.id}-user`,
            created_at: q.created_at
          });
        }
        if (q.response_text) {
          formattedMessages.push({
            role: 'assistant',
            content: q.response_text,
            id: `${q.id}-assistant`,
            created_at: q.created_at
          });
        }
      });

      setMessages(formattedMessages);
    } catch (err) {
      console.error('Error fetching chat history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Start a new chat
  const handleNewChat = () => {
    if (loading) return;
    setSessionId(null);
    setMessages([]);
  };

  // Rename a session
  const handleRenameSession = async (id: string, e: React.FormEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!editTitle.trim()) return;

    try {
      await api.patch(`/chat/sessions/${id}`, { title: editTitle.trim() });
      setSessions(prev =>
        prev.map(s => (s.id === id ? { ...s, title: editTitle.trim() } : s))
      );
      setEditingSessionId(null);
      setEditTitle('');
    } catch (err) {
      console.error('Error renaming session:', err);
    }
  };

  // Delete a session
  const handleDeleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this chat session?')) return;

    try {
      await api.delete(`/chat/sessions/${id}`);
      setSessions(prev => prev.filter(s => s.id !== id));
      if (sessionId === id) {
        handleNewChat();
      }
    } catch (err) {
      console.error('Error deleting session:', err);
    }
  };

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
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'}/chat/query`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            query: input,
            sessionId: sessionId
          })
        }
      );

      if (!response.ok) throw new Error('Failed to connect to chat');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      const decoder = new TextDecoder();
      let accumulatedContent = '';
      let currentSessionId = sessionId;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'start') {
                currentSessionId = data.sessionId;
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
                // Refresh sessions list after complete message
                fetchSessions();
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
        return [
          ...others,
          { role: 'assistant', content: 'Sorry, I encountered an error. Please try again later.' }
        ];
      });
    } finally {
      setLoading(false);
    }
  };

  // Format date helper
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const currentSession = sessions.find(s => s.id === sessionId);

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white overflow-hidden">
      {/* History Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-80' : 'w-0'
        } transition-all duration-300 border-r border-white/5 bg-[#0c0c0c] flex flex-col relative z-20 flex-shrink-0`}
      >
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare size={18} className="text-blue-500" />
            <span className="font-bold text-sm tracking-tight text-gray-200">Chat History</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-all md:flex hidden"
            title="Collapse sidebar"
          >
            <PanelLeftClose size={18} />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-4">
          <button
            onClick={handleNewChat}
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <Plus size={18} />
            <span className="text-sm">New Chat</span>
          </button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto px-3 space-y-1">
          {sessionsLoading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-gray-500">
              <Loader2 size={24} className="animate-spin text-blue-500" />
              <span className="text-xs font-medium">Loading history...</span>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-10 px-4 text-gray-600 font-medium text-xs">
              No chat history yet. Start a conversation to save your chats!
            </div>
          ) : (
            sessions.map(session => {
              const isActive = session.id === sessionId;
              const isEditing = editingSessionId === session.id;

              return (
                <div
                  key={session.id}
                  onClick={() => selectSession(session.id)}
                  className={`group relative flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                    isActive
                      ? 'bg-blue-600/15 border border-blue-500/30 text-white'
                      : 'text-gray-400 hover:bg-white/5 hover:text-gray-200 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                    <MessageSquare
                      size={16}
                      className={`flex-shrink-0 ${
                        isActive ? 'text-blue-400' : 'text-gray-500 group-hover:text-gray-300'
                      }`}
                    />
                    {isEditing ? (
                      <form
                        onSubmit={e => handleRenameSession(session.id, e)}
                        className="flex items-center gap-1 flex-1"
                        onClick={e => e.stopPropagation()}
                      >
                        <input
                          type="text"
                          value={editTitle}
                          onChange={e => setEditTitle(e.target.value)}
                          className="w-full bg-black/60 border border-blue-500/50 rounded px-2 py-1 text-xs text-white focus:outline-none"
                          autoFocus
                        />
                        <button
                          type="submit"
                          className="p-1 text-green-400 hover:text-green-300"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingSessionId(null)}
                          className="p-1 text-red-400 hover:text-red-300"
                        >
                          <X size={14} />
                        </button>
                      </form>
                    ) : (
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold truncate leading-tight">
                          {session.title || 'Untitled Chat'}
                        </p>
                        <span className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
                          <Clock size={10} />
                          {formatDate(session.updated_at || session.created_at)}
                        </span>
                      </div>
                    )}
                  </div>

                  {!isEditing && (
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setEditingSessionId(session.id);
                          setEditTitle(session.title);
                        }}
                        className="p-1 hover:bg-white/10 text-gray-400 hover:text-white rounded"
                        title="Rename"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={e => handleDeleteSession(session.id, e)}
                        className="p-1 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded"
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* Main Chat Interface */}
      <main className="flex-1 flex flex-col h-screen bg-[#0a0a0a] min-w-0 relative">
        {/* Top Navigation Header */}
        <header className="border-b border-white/5 p-4 md:px-8 flex justify-between items-center bg-[#0c0c0c]/80 backdrop-blur-xl z-10">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 hover:bg-white/5 rounded-xl text-gray-400 hover:text-white transition-all mr-1"
                title="Open sidebar"
              >
                <PanelLeftOpen size={20} />
              </button>
            )}
            <div className="w-9 h-9 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Sparkles size={18} className="text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-bold tracking-tight truncate max-w-xs md:max-w-md">
                {currentSession ? currentSession.title : 'AI Knowledge Assistant'}
              </h1>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                IntraAI Knowledge Base
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleNewChat}
              disabled={loading}
              className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-gray-300 hover:text-white transition-all flex items-center gap-2 text-xs font-bold border border-white/5"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">New Chat</span>
            </button>
          </div>
        </header>

        {/* Messages Scroll Area */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scroll-smooth"
        >
          {historyLoading ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-3">
              <Loader2 size={32} className="animate-spin text-blue-500" />
              <p className="text-sm font-medium">Loading chat history...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto py-12">
              <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center mb-6 animate-pulse border border-blue-500/20">
                <Bot size={32} className="text-blue-500" />
              </div>
              <h2 className="text-2xl font-black mb-3 tracking-tight">How can I help you today?</h2>
              <p className="text-gray-500 font-medium text-sm mb-8 leading-relaxed">
                Ask questions about your uploaded documents, company policies, or workspace knowledge.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                {[
                  'Summarize the recent security policy',
                  'How do I request a vacation?',
                  'What are our Q2 objectives?',
                  'Explain the technical architecture'
                ].map(suggestion => (
                  <button
                    key={suggestion}
                    onClick={() => setInput(suggestion)}
                    className="p-3.5 bg-[#111111] border border-white/5 rounded-xl text-xs font-bold text-gray-400 hover:text-white hover:border-white/20 hover:bg-white/5 transition-all text-left flex items-center justify-between group"
                  >
                    <span>{suggestion}</span>
                    <ChevronRight
                      size={14}
                      className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-blue-400"
                    />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div
                key={msg.id || i}
                className={`flex gap-4 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                  msg.role === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center ${
                    msg.role === 'assistant'
                      ? 'bg-blue-600/10 text-blue-500 border border-blue-500/20'
                      : 'bg-white/5 text-gray-400 border border-white/10'
                  }`}
                >
                  {msg.role === 'assistant' ? <Bot size={18} /> : <User size={18} />}
                </div>

                <div
                  className={`flex-1 space-y-1.5 min-w-0 ${
                    msg.role === 'user' ? 'text-right' : ''
                  }`}
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600">
                    {msg.role === 'assistant' ? 'System Intelligence' : 'You'}
                  </p>
                  <div
                    className={`text-gray-200 leading-relaxed font-medium text-base whitespace-pre-wrap ${
                      msg.role === 'assistant'
                        ? 'bg-[#111111] p-5 rounded-2xl rounded-tl-none border border-white/5 shadow-2xl'
                        : 'bg-blue-600/20 text-white p-4 rounded-2xl rounded-tr-none border border-blue-500/30 inline-block text-left'
                    }`}
                  >
                    {msg.content || (loading && i === messages.length - 1 ? (
                      <div className="flex gap-1.5 items-center h-6 py-2">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
                      </div>
                    ) : (
                      msg.content
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input Footer */}
        <footer className="p-4 md:p-6 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a] to-transparent">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative group">
            <div className="absolute inset-0 bg-blue-600/5 blur-3xl rounded-full scale-110 opacity-0 group-focus-within:opacity-100 transition-opacity" />

            <div className="relative flex items-center bg-[#111111] border border-white/10 rounded-2xl p-1.5 pr-3 shadow-2xl focus-within:border-blue-500/50 transition-all">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Type your question here..."
                className="flex-1 bg-transparent py-3 px-4 focus:outline-none text-white font-medium text-sm placeholder:text-gray-600"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="p-3 bg-blue-600 hover:bg-blue-500 disabled:bg-white/5 disabled:text-gray-700 text-white rounded-xl transition-all shadow-xl shadow-blue-600/20 active:scale-95 flex items-center justify-center font-bold"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </div>

            <p className="mt-2 text-center text-[10px] text-gray-600 font-bold uppercase tracking-widest">
              Chat history is securely stored per user workspace.
            </p>
          </form>
        </footer>
      </main>
    </div>
  );
}
