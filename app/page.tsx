'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function PublicConfessionForm() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    setErrorMsg('');

    try {
      const { error } = await supabase
        .from('confessions')
        .insert([{ content: content.trim(), status: 'pending' }]);

      if (error) throw error;

      setSubmitted(true);
      setContent('');
    } catch (err: any) {
      setErrorMsg('Gagal menghantar confession. Sila cuba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
        <div className="text-center mb-6">
          <span className="text-4xl inline-block mb-2">🤫</span>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
            Anonymous Confession
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Luahkan apa sahaja secara 100% rahsia. Identiti anda tidak disimpan.
          </p>
        </div>

        {submitted ? (
          <div className="text-center py-8 space-y-4">
            <div className="text-5xl">🎉</div>
            <h2 className="text-lg font-semibold text-emerald-400">
              Confession Berjaya Dihantar!
            </h2>
            <p className="text-xs text-slate-400">
              Confession anda sedang ditinjau oleh admin sebelum disiarkan di channel.
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-medium rounded-xl transition-all"
            >
              Hantar Luahan Lain 🚀
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Taipkan luahan hati anda di sini..."
                rows={5}
                maxLength={1000}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all resize-none"
              />
              <div className="flex justify-end text-[10px] text-slate-500 mt-1">
                {content.length}/1000
              </div>
            </div>

            {errorMsg && (
              <p className="text-xs text-rose-500 text-center">{errorMsg}</p>
            )}

            <button
              type="submit"
              disabled={loading || !content.trim()}
              className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 font-medium text-sm rounded-xl transition-all disabled:opacity-50"
            >
              {loading ? 'Menghantar...' : 'Hantar Secara Anonim 🚀'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
