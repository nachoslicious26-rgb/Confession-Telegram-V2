'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Senarai Perkataan Terlarang (Boleh tambah/kurangkan mengikut keperluan)
const BAD_WORDS = ['babi', 'sial', 'anjing', 'pukimak', 'pundek', 'bodoh', 'pantat'];

export default function PublicConfessionForm() {
  const [content, setContent] = useState('');
  const [honeypot, setHoneypot] = useState(''); // 🛡️ Anti-Spam (Honeypot)
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // ⏱️ Cooldown State (60 Saat / 1 Minit)
  const [cooldown, setCooldown] = useState<number>(0);

  // Semak cooldown apabila halaman dibuka
  useEffect(() => {
    const lastSubmit = localStorage.getItem('last_confession_time');
    if (lastSubmit) {
      const timePassed = Math.floor((Date.now() - parseInt(lastSubmit)) / 1000);
      const remainingTime = 60 - timePassed; // 60 saat = 1 minit
      if (remainingTime > 0) {
        setCooldown(remainingTime);
      }
    }
  }, []);

  // Timer mengira saat ke bawah (countdown)
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown]);

  // Fungsi Penapis Perkataan Kesat
  const validateContent = (text: string): string | null => {
    const lowerContent = text.toLowerCase();

    for (const word of BAD_WORDS) {
      if (lowerContent.includes(word)) {
        return `Kandungan mengandungi perkataan terlarang: "${word}". Sila jaga bahasa anda.`;
      }
    }

    return null; // Tiada masalah
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 🛡️ 1. Anti-Spam Check (Honeypot)
    if (honeypot.trim() !== '') {
      // Jika field tersembunyi ini terisi (bot sahaja akan isi), pura-pura berjaya tanpa simpan ke database
      setSubmitted(true);
      return;
    }

    // ⏱️ 2. Cooldown Check (1 Minit)
    if (cooldown > 0) {
      setErrorMsg(`Sila tunggu ${cooldown} saat lagi sebelum menghantar luahan baharu.`);
      return;
    }

    // 🔞 3. Penapis Perkataan Kesat
    const validationError = validateContent(content);
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    if (!content.trim()) return;

    setLoading(true);
    setErrorMsg('');

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Sila semak Environment Variables di Vercel.');
      }

      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      const { error } = await supabase
        .from('confessions')
        .insert([{ content: content.trim(), status: 'pending' }]);

      if (error) throw error;

      // Berjaya: Tetapkan Cooldown 60 saat (1 Minit)
      localStorage.setItem('last_confession_time', Date.now().toString());
      setCooldown(60);

      setSubmitted(true);
      setContent('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menghantar confession. Sila cuba lagi.');
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
            
            {/* 🤫 HONEYPOT INPUT (Sembunyi daripada manusia, bot sahaja yang nampak) */}
            <div className="hidden" aria-hidden="true" style={{ display: 'none' }}>
              <input
                type="text"
                name="website_url_check"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            <div>
              <textarea
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  if (errorMsg) setErrorMsg(''); // Padamkan mesej error semasa menaip
                }}
                placeholder="Taipkan luahan hati anda di sini..."
                rows={5}
                maxLength={1000}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all resize-none"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>{cooldown > 0 ? `⏱️ Cooldown: ${cooldown}s` : '✅ Sedia menghantar'}</span>
                <span>{content.length}/1000</span>
              </div>
            </div>

            {errorMsg && (
              <p className="text-xs text-rose-500 text-center bg-rose-500/10 border border-rose-500/20 p-2 rounded-lg">
                ⚠️ {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !content.trim() || cooldown > 0}
              className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 font-medium text-sm rounded-xl transition-all disabled:opacity-50"
            >
              {loading
                ? 'Menghantar...'
                : cooldown > 0
                ? `Tunggu (${cooldown}s)`
                : 'Hantar Secara Anonim 🚀'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
