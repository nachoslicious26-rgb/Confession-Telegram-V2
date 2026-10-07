'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

interface Confession {
  id: number;
  content: string;
  status: string;
  created_at: string;
}

export default function AdminDashboard() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');

  const [confessions, setConfessions] = useState<Confession[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);

  // Semak jika sudah log masuk sebelum ini dalam browser session
  useEffect(() => {
    const savedPass = sessionStorage.getItem('admin_password');
    if (savedPass) {
      setPassword(savedPass);
      setIsAuthenticated(true);
      fetchPendingConfessions();
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    sessionStorage.setItem('admin_password', password);
    setIsAuthenticated(true);
    setAuthError('');
    fetchPendingConfessions();
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_password');
    setPassword('');
    setIsAuthenticated(false);
  };

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
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 font-medium text-xs rounded-xl transition-all"
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
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">🛡️ Admin Dashboard</h1>
            <p className="text-xs text-slate-400 mt-1">
              Luluskan luahan awam sebelum disiarkan ke Telegram Channel.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchPendingConfessions}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs rounded-xl border border-slate-700"
            >
              🔄 Refresh
            </button>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs rounded-xl"
            >
              🚪 Keluar
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-500 text-sm">Memuatkan...</div>
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
                    className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs rounded-xl"
                  >
                    ❌ Reject
                  </button>
                  <button
                    disabled={processingId === item.id}
                    onClick={() => handleAction(item.id, item.content, 'approve')}
                    className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs rounded-xl"
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
  );
}
