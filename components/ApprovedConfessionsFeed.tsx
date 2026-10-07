'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

interface Confession {
  id: number;
  content: string;
  created_at: string;
}

export default function ApprovedConfessionsFeed() {
  const [confessions, setConfessions] = useState<Confession[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApprovedConfessions = async () => {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      // Hanya ambil mesej yang mempunyai status 'approved'
      const { data, error } = await supabase
        .from('confessions')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConfessions(data || []);
    } catch (err) {
      console.error('Ralat mengambil confession approved:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovedConfessions();
  }, []);

  return (
    <div className="w-full max-w-md mx-auto space-y-4 mt-6">
      <h2 className="text-lg font-bold text-purple-200 border-b border-purple-900/50 pb-2 flex items-center justify-between">
        <span>🔥 Confession Terkini</span>
        <button
          onClick={fetchApprovedConfessions}
          className="text-xs text-purple-400 hover:underline font-normal"
        >
          Refresh
        </button>
      </h2>

      {loading ? (
        <p className="text-xs text-slate-500 text-center py-4">Memuatkan confession...</p>
      ) : confessions.length === 0 ? (
        <p className="text-xs text-slate-500 text-center py-4">
          Belum ada confession yang diluluskan.
        </p>
      ) : (
        <div className="space-y-3">
          {confessions.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900/80 border border-purple-900/40 rounded-2xl p-4 shadow-md space-y-2"
            >
              <div className="flex justify-between items-center text-[10px] text-purple-400 font-mono">
                <span>#Confession{item.id}</span>
                <span>
                  {new Date(item.created_at).toLocaleDateString('ms-MY', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <p className="text-sm text-slate-100 whitespace-pre-wrap leading-relaxed">
                {item.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
