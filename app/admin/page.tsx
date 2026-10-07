'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

interface Confession {
  id: number;
  content: string;
  created_at: string;
  status: string;
}

interface AdminMessage {
  id: number;
  message: string;
  created_at: string;
  status: string;
}

export default function AdminDashboardPage() {
  // 🔒 State Keselamatan & Authentication
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');

  // 📊 State Data Admin
  const [confessions, setConfessions] = useState<Confession[]>([]);
  const [adminMessages, setAdminMessages] = useState<AdminMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  // Semak sesi log masuk sedia ada di sessionStorage
  useEffect(() => {
    const authSession = sessionStorage.getItem('admin_authenticated');
    if (authSession === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const getSupabase = () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    return createClient(url, key);
  };

  // 🔑 Log Masuk Admin (Tanpa Default Password)
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

    if (!correctPassword) {
      setAuthError('Kata laluan belum ditetapkan dalam Environment Variables.');
      return;
    }

    if (passwordInput === correctPassword) {
      sessionStorage.setItem('admin_authenticated', 'true');
      setIsAuthenticated(true);
      setAuthError('');
      setPasswordInput('');
    } else {
      setAuthError('Kata laluan tidak sah! Sila cuba lagi.');
    }
  };

  // 🚪 Log Keluar Admin
  const handleLogout = () => {
    sessionStorage.removeItem('admin_authenticated');
    setIsAuthenticated(false);
  };

  // 1. Ambil data Confession Pending
  const fetchPendingConfessions = useCallback(async () => {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('confessions')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConfessions(data || []);
    } catch (err) {
      console.error('Ralat mengambil confessions:', err);
    }
  }, []);

  // 2. Ambil data Mesej Admin
  const fetchAdminMessages = useCallback(async () => {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('admin_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAdminMessages(data || []);
    } catch (err) {
      console.error('Ralat mengambil admin_messages:', err);
    }
  }, []);

  const refreshAllData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchPendingConfessions(), fetchAdminMessages()]);
    setLoading(false);
  }, [fetchPendingConfessions, fetchAdminMessages]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshAllData();
    }
  }, [isAuthenticated, refreshAllData]);

  // ✈️ Hantar ke Telegram Channel
  const sendToTelegram = async (id: number, content: string) => {
    const botToken = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN;
    const chatId = process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      console.warn('TELEGRAM_BOT_TOKEN atau TELEGRAM_CHAT_ID tidak dijumpai dalam env.');
      return;
    }

    const telegramText = `📩 *CONFESSION (#${id})*\n\n${content}`;

    try {
      const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: telegramText,
          parse_mode: 'Markdown',
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        console.error('Gagal hantar ke Telegram API:', errData);
      }
    } catch (err) {
      console.error('Ralat rangkaian semasa hantar ke Telegram:', err);
    }
  };

  // ✅ Kelulusan Confession
  const handleApprove = async (id: number, content: string) => {
    setActionLoadingId(id);
    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('confessions')
        .update({ status: 'approved' })
        .eq('id', id);

      if (error) throw error;

      await sendToTelegram(id, content);
      setConfessions((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      alert('Gagal meluluskan confession.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // ❌ Penolakan Confession
  const handleReject = async (id: number) => {
    setActionLoadingId(id);
    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('confessions')
        .update({ status: 'rejected' })
        .eq('id', id);

      if (error) throw error;
      setConfessions((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      alert('Gagal menolak confession.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // 🗑️ Padam Mesej Admin
  const handleDeleteAdminMessage = async (id: number) => {
    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('admin_messages')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setAdminMessages((prev) => prev.filter((msg) => msg.id !== id));
    } catch (err) {
      alert('Gagal memadam mesej admin.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ms-MY', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  // 🔒 PAPARAN 1: SKRIN LOG MASUK JIKA BELUM LOG IN
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#030008] text-white flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-sm bg-gradient-to-b from-purple-950/60 via-slate-900/80 to-black border border-purple-500/30 rounded-3xl p-8 space-y-6 shadow-[0_0_50px_rgba(88,28,135,0.3)]">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 mx-auto bg-purple-900/40 border border-purple-500/40 rounded-2xl flex items-center justify-center text-3xl mb-2">
              🛡️
            </div>
            <h1 className="text-2xl font-bold text-white">Admin Access</h1>
            <p className="text-xs text-purple-200/60">
              Sila masukkan kata laluan untuk mengakses Dashboard.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Masukkan kata laluan..."
                required
                className="w-full bg-black/70 border border-purple-900/60 rounded-xl px-4 py-3 text-sm text-purple-100 placeholder-purple-400/30 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400/50"
              />
            </div>

            {authError && (
              <div className="p-3 bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs rounded-xl text-center font-medium">
                ⚠️ {authError}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer"
            >
              Log Masuk Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 🔓 PAPARAN 2: DASHBOARD ADMIN JIKA DAH LOG IN
  return (
    <div className="min-h-screen bg-[#06040d] text-slate-100 p-4 sm:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* HEADER DASHBOARD */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2">
              <span>🛡️</span> Admin Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Urus luahan awam dan semak mesej langsung daripada pengguna.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={refreshAllData}
              disabled={loading}
              className="px-4 py-2 bg-blue-900/40 hover:bg-blue-800/60 border border-blue-500/30 rounded-xl text-xs font-semibold text-blue-200 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>🔄</span> Refresh All
            </button>

            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-rose-950/50 hover:bg-rose-900/80 border border-rose-500/40 rounded-xl text-xs font-semibold text-rose-200 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>🚪</span> Keluar
            </button>
          </div>
        </div>

        {/* SECTION 1: MESEJ KEPADA ADMIN */}
        <section className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-md">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-800/60">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>📨</span> Mesej Kepada Admin ({adminMessages.length})
            </h2>
            <button
              onClick={fetchAdminMessages}
              className="text-xs text-purple-400 hover:text-purple-300 underline font-medium cursor-pointer"
            >
              Muat Semula
            </button>
          </div>

          {adminMessages.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              Tiada mesej baharu daripada pengguna.
            </div>
          ) : (
            <div className="space-y-3">
              {adminMessages.map((msg) => (
                <div
                  key={msg.id}
                  className="bg-slate-900/80 border border-purple-900/30 hover:border-purple-500/30 rounded-xl p-4 transition-all"
                >
                  <div className="flex justify-between items-start gap-4 mb-2">
                    <span className="text-[10px] font-mono text-slate-400">
                      ID Mesej: #{msg.id}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {formatDate(msg.created_at)}
                    </span>
                  </div>

                  <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {msg.message}
                  </p>

                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => handleDeleteAdminMessage(msg.id)}
                      className="px-3 py-1 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 rounded-lg text-[11px] font-medium text-rose-300 transition-all cursor-pointer"
                    >
                      🗑️ Selesai / Padam
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* SECTION 2: CONFESSION MENUNGGU KELULUSAN */}
        <section className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-md">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-800/60">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>📝</span> Confession Menunggu Kelulusan ({confessions.length})
            </h2>
          </div>

          {confessions.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              Tiada confession menunggu kelulusan.
            </div>
          ) : (
            <div className="space-y-4">
              {confessions.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-3 transition-all hover:border-slate-700"
                >
                  <div className="flex justify-between items-center text-xs text-slate-400 font-mono">
                    <span>ID: #{item.id}</span>
                    <span>{formatDate(item.created_at)}</span>
                  </div>

                  <p className="text-sm text-slate-100 font-normal whitespace-pre-wrap leading-relaxed">
                    {item.content}
                  </p>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      onClick={() => handleReject(item.id)}
                      disabled={actionLoadingId === item.id}
                      className="px-4 py-2 bg-rose-950/50 hover:bg-rose-900/80 border border-rose-500/40 text-rose-300 rounded-xl text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <span>✕</span> Reject
                    </button>

                    <button
                      onClick={() => handleApprove(item.id, item.content)}
                      disabled={actionLoadingId === item.id}
                      className="px-4 py-2 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <span>✓</span> Approve & Publish
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
