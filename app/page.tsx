'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Senarai Perkataan Terlarang
const BAD_WORDS = ['fuck', 'fvck', 'pukimak', 'pundek', 'pantat', 'boti', 'boty', 'bowtie', 'booty', 'b00ty', 'noty', 'gay', 'g4y', 'lesbian', 'lesb', 'fwb', 'sex', 'porn', 'porno', 'pornhub', 'onlyfan', 'tetek', 'puki', 'pussy', 'puci', 'konek', 'kote', 'pepek', 'poen', 'squirt', 'lancap', 'horny', 'hony'];

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
    <div className="relative min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 overflow-hidden selection:bg-purple-500 selection:text-white">
      {/* 🌟 Kesan Glow Berwarna di Latar Belakang (Ambient Orbs) */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-purple-600/25 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-pink-600/25 rounded-full blur-[120px] pointer-events-none animate-pulse delay-1000" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* 💳 Kad Utama (Glassmorphism Effect) */}
      <div className="relative w-full max-w-lg bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-purple-950/20 z-10 transition-all duration-300">
        
        {/* Tajuk & Lencana */}
        <div className="text-center space-y-3 mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-slate-300 text-[11px] font-medium tracking-wide shadow-inner">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            100% Encrypted & Anonim
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
            Anonymous Confession
          </h1>
          
          <p className="text-xs sm:text-sm text-slate-400 max-w-xs mx-auto leading-relaxed">
            Kongsi cerita, rahsia, atau luahan hati anda tanpa mendedahkan identiti.
          </p>
        </div>

        {submitted ? (
          /* 🎉 Skrin Kejayaan (Success Screen) */
          <div className="text-center py-8 space-y-6 animate-in fade-in zoom-in duration-300">
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 rounded-3xl border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
              <span className="text-4xl">✨</span>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">Luahan Berjaya Dihantar!</h2>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Luahan anda telah diterima dan berada dalam giliran semakan admin sebelum disiarkan ke Telegram Channel.
              </p>
            </div>

            <button
              onClick={() => setSubmitted(false)}
              className="w-full py-3.5 px-6 bg-slate-800/80 hover:bg-slate-800 text-slate-200 text-xs font-semibold rounded-2xl border border-slate-700/80 transition-all duration-200 hover:border-slate-600 active:scale-[0.98]"
            >
              Hantar Luahan Lain ✍️
            </button>
          </div>
        ) : (
          /* 📝 Borang Luahan */
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* 🤫 HONEYPOT INPUT */}
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

            <div className="space-y-2">
              <div className="relative group">
                <textarea
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  placeholder="Taipkan apa sahaja yang terbuku di hati anda..."
                  rows={6}
                  maxLength={1000}
                  required
                  className="w-full bg-slate-950/80 border border-slate-800/90 rounded-2xl p-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500/80 focus:ring-4 focus:ring-purple-500/10 transition-all duration-200 resize-none leading-relaxed shadow-inner"
                />
              </div>

              {/* Bar Status / Kiraan Karakter */}
              <div className="flex justify-between items-center text-[11px] text-slate-500 px-1 font-medium">
                <span className="flex items-center gap-1.5">
                  {cooldown > 0 ? (
                    <span className="text-amber-400/90 flex items-center gap-1 font-semibold">
                      <span className="animate-spin inline-block">⏳</span> Cooldown: {cooldown}s
                    </span>
                  ) : (
                    <span className="text-emerald-400/80 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Sedia Dihantar
                    </span>
                  )}
                </span>
                <span className={content.length >= 900 ? 'text-amber-400 font-bold' : ''}>
                  {content.length}/1000
                </span>
              </div>
            </div>

            {/* Mesej Ralat */}
            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs text-center font-medium animate-in fade-in duration-200 shadow-sm">
                ⚠️ {errorMsg}
              </div>
            )}

            {/* Butang Hantar */}
            <button
              type="submit"
              disabled={loading || !content.trim() || cooldown > 0}
              className="group relative w-full py-3.5 px-6 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-500 hover:via-pink-500 hover:to-indigo-500 text-white font-semibold text-sm rounded-2xl shadow-lg shadow-purple-600/25 transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none overflow-hidden"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.9620 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Memproses...</span>
                  </>
                ) : cooldown > 0 ? (
                  `Tunggu Cooldown (${cooldown}s)`
                ) : (
                  <>
                    <span>Hantar Luahan Sekarang</span>
                    <span className="group-hover:translate-x-1 transition-transform duration-200">🚀</span>
                  </>
                )}
              </span>
            </button>
          </form>
        )}

        {/* Footer Info */}
        <div className="mt-8 pt-5 border-t border-slate-800/60 text-center">
          <p className="text-[10px] text-slate-500">
            Dikuasakan oleh Next.js, Supabase & Telegram Bot API
          </p>
        </div>
      </div>
    </div>
  );
}
