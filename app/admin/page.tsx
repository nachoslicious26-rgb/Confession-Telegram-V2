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
  const [confessions, setConfessions] = useState<Confession[]>([]);
  const [adminMessages, setAdminMessages] = useState<AdminMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  // Inisialisasi Supabase Client
  const getSupabase = () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    return createClient(url, key);
  };

  // 1. Ambil data Confession Menunggu (pending)
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

  // 2. Ambil data Mesej Kepada Admin
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

  // Refresh Semua Data
  const refreshAllData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchPendingConfessions(), fetchAdminMessages()]);
    setLoading(false);
  }, [fetchPendingConfessions, fetchAdminMessages]);

  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  // Kelulusan Confession (Approve)
  const handleApprove = async (id: number) => {
    setActionLoadingId(id);
    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('confessions')
        .update({ status: 'approved' })
        .eq('id', id);

      if (error) throw error;
      setConfessions((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      alert('Gagal meluluskan confession.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Penolakan Confession (Reject)
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

  // Padam Mesej Admin
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

  // Format Tarikh & Masa
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

  return (
    <div className="min-h-screen bg-[#06040d] text-slate-100 p-4 sm:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* 🛡️ HEADER DASHBOARD */}
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
          </div>
        </div>

        {/* 📨 SECTION 1: MESEJ KEPADA ADMIN */}
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

        {/* 📝 SECTION 2: CONFESSION MENUNGGU KELULUSAN */}
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
                      onClick={() => handleApprove(item.id)}
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
