'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

interface Confession {
  id: number;
  content: string;
  status: string;
  created_at: string;
}

interface AdminMessage {
  id: string;
  message: string;
  status: string;
  created_at: string;
}

export default function AdminDashboard() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');

  // State untuk Confession
  const [confessions, setConfessions] = useState<Confession[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);

  // 📨 State untuk Mesej User kepada Admin
  const [adminMessages, setAdminMessages] = useState<AdminMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [processingMsgId, setProcessingMsgId] = useState<string | null>(null);

  // Semak jika sudah log masuk sebelum ini dalam browser session
  useEffect(() => {
    const savedPass = sessionStorage.getItem('admin_password');
    if (savedPass) {
      setPassword(savedPass);
      setIsAuthenticated(true);
      fetchAllData();
    }
  }, []);

  // Fungsi memuatkan kedua-dua data (Confession + Mesej Admin)
  const fetchAllData = () => {
    fetchPendingConfessions();
    fetchAdminMessages();
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    sessionStorage.setItem('admin_password', password);
    setIsAuthenticated(true);
    setAuthError('');
    fetchAllData();
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_password');
    setPassword('');
    setIsAuthenticated(false);
  };

  // 1. Fetch Confessions
  const fetchPendingConfessions = async () => {
    setLoading(true);
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

      if (!supabaseUrl || !supabaseAnonKey) return;

      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      const { data, error } = await supabase
        .from('confessions')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setConfessions(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch Mesej Admin
  const fetchAdminMessages = async () => {
    setLoadingMessages(true);
    try {
      const res = await fetch('/api/admin/messages');
      const data = await res.json();
      if (res.ok && data.messages) {
        setAdminMessages(data.messages);
      }
    } catch (err) {
      console.error('Gagal mengambil mesej admin:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Action Approve/Reject Confession
  const handleAction = async (id: number, content: string, action: 'approve' | 'reject') => {
    setProcessingId(id);
    try {
      const res = await fetch('/api/admin/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, content, action, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setConfessions((prev) => prev.filter((item) => item.id !== id));
      } else {
        if (res.status === 401) {
          setAuthError('Kata laluan tidak sah! Sila log masuk semula.');
          setIsAuthenticated(false);
          sessionStorage.removeItem('admin_password');
        } else {
          alert(data.error || 'Gagal memproses tindakan.');
        }
      }
    } catch (err) {
      alert('Ralat sistem berlaku.');
    } finally {
      setProcessingId(null);
    }
  };

  // 🟢 Action Tekan Butang DONE pada Mesej Admin
  const handleMarkDone = async (msgId: string) => {
    setProcessingMsgId(msgId);
    try {
      const res = await fetch('/api/admin/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: msgId, password }),
      });

      if (res.ok) {
        // Buang mesej dari senarai selepas ditanda Done
        setAdminMessages((prev) => prev.filter((msg) => msg.id !== msgId));
      } else {
        alert('Gagal mengemaskini status. Sila semak kata laluan admin.');
      }
    } catch (err) {
      alert('Ralat sistem berlaku.');
    } finally {
      setProcessingMsgId(null);
    }
  };

  // 🔒 JIKA BELUM LOG MASUK: TAMPILKAN SKRIN KATA LALUAN
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
          <div className="text-center">
            <span className="text-4xl inline-block mb-2">🔒</span>
            <h1 className="text-xl font-bold text-white">Admin Authentication</h1>
            <p className="text-xs text-slate-400 mt-1">Masukkan kata laluan untuk mengakses dashboard.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-3">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Kata laluan admin..."
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />

            {authError && <p className="text-xs text-rose-500 text-center">{authError}</p>}

            <button
              type="submit"
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 font-medium text-xs rounded-xl transition-all cursor-pointer"
            >
              Log Masuk 🔓
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 🔓 JIKA SUDAH LOG MASUK: TAMPILKAN DASHBOARD ADMIN
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* HEADER */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">🛡️ Admin Dashboard</h1>
            <p className="text-xs text-slate-400 mt-1">
              Urus luahan awam dan semak mesej langsung daripada pengguna.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchAllData}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs rounded-xl border border-slate-700 cursor-pointer"
            >
              🔄 Refresh All
            </button>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs rounded-xl cursor-pointer"
            >
              🚪 Keluar
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* 📨 SEKSYEN 1: MESEJ USER KEPADA ADMIN (TAKEDOWN / ADUAN)     */}
        {/* ------------------------------------------------------------- */}
        <div className="bg-slate-900 border border-purple-900/40 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex justify-between items-center border-b border-purple-900/30 pb-3">
            <h2 className="text-lg font-bold text-purple-200 flex items-center gap-2">
              <span>📨</span> Mesej Kepada Admin ({adminMessages.length})
            </h2>
            <button
              onClick={fetchAdminMessages}
              className="text-xs text-purple-400 hover:text-purple-200 underline cursor-pointer"
            >
              Muat Semula
            </button>
          </div>

          {loadingMessages ? (
            <div className="text-center py-6 text-slate-500 text-xs">Memuatkan mesej...</div>
          ) : adminMessages.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-4">
              Tiada mesej baharu daripada pengguna.
            </p>
          ) : (
            <div className="space-y-3">
              {adminMessages.map((msg) => (
                <div
                  key={msg.id}
                  className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex flex-col sm:flex-row justify-between sm:items-center gap-3"
                >
                  <div className="space-y-1">
                    <p className="text-xs text-purple-100 whitespace-pre-wrap">{msg.message}</p>
                    <span className="text-[10px] text-slate-500 block">
                      Diterima pada: {new Date(msg.created_at).toLocaleString('ms-MY')}
                    </span>
                  </div>

                  {/* BUTANG DONE */}
                  <button
                    disabled={processingMsgId === msg.id}
                    onClick={() => handleMarkDone(msg.id)}
                    className="self-end sm:self-center px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <span>✓</span>
                    <span>{processingMsgId === msg.id ? 'Selesai...' : 'Done'}</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ------------------------------------------------------------- */}
        {/* 📝 SEKSYEN 2: CONFESSION BAHARU (PENDING APPROVAL)           */}
        {/* ------------------------------------------------------------- */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>📝</span> Confession Menunggu Kelulusan ({confessions.length})
          </h2>

          {loading ? (
            <div className="text-center py-12 text-slate-500 text-sm">Memuatkan confession...</div>
          ) : confessions.length === 0 ? (
            <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 text-sm">
              Tiada confession baharu. 👍
            </div>
          ) : (
            <div className="space-y-4">
              {confessions.map((item) => (
                <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-500 mb-2">
                      <span>ID: #{item.id}</span>
                      <span>{new Date(item.created_at).toLocaleString('ms-MY')}</span>
                    </div>
                    <p className="text-sm text-slate-200 whitespace-pre-wrap">{item.content}</p>
                  </div>

                  <div className="flex gap-3 pt-3 border-t border-slate-800 justify-end">
                    <button
                      disabled={processingId === item.id}
                      onClick={() => handleAction(item.id, item.content, 'reject')}
                      className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs rounded-xl cursor-pointer"
                    >
                      ❌ Reject
                    </button>
                    <button
                      disabled={processingId === item.id}
                      onClick={() => handleAction(item.id, item.content, 'approve')}
                      className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs rounded-xl cursor-pointer"
                    >
                      {processingId === item.id ? 'Memproses...' : '✅ Approve & Publish'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
