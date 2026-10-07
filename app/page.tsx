'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const BAD_WORDS = ['fuck', 'fvck', 'pukimak', 'pundek', 'pantat', 'boti', 'boty', 'bowtie', 'booty', 'b00ty', 'noty', 'gay', 'g4y', 'lesbian', 'lesb', 'fwb', 'sex', 'porn', 'porno', 'pornhub', 'onlyfan', 'tetek', 'puki', 'pussy', 'puci', 'konek', 'kote', 'pepek', 'poen', 'squirt', 'lancap', 'horny', 'hony'];

export default function NGLConfessionForm() {
  const [content, setContent] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [cooldown, setCooldown] = useState<number>(0);

  useEffect(() => {
    const lastSubmit = localStorage.getItem('last_confession_time');
    if (lastSubmit) {
      const timePassed = Math.floor((Date.now() - parseInt(lastSubmit)) / 1000);
      const remainingTime = 60 - timePassed;
      if (remainingTime > 0) {
        setCooldown(remainingTime);
      }
    }
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev <= 1 ? (clearInterval(timer), 0) : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const validateContent = (text: string): string | null => {
    const lowerContent = text.toLowerCase();
    for (const word of BAD_WORDS) {
      if (lowerContent.includes(word)) {
        return `Aip! Terdapat perkataan terlarang: "${word}". Sila guna bahasa lebih sopan.`;
      }
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (honeypot.trim() !== '') {
      setSubmitted(true);
      return;
    }

    if (cooldown > 0) {
      setErrorMsg(`Sila tunggu ${cooldown} saat lagi sebelum menghantar mesej baharu.`);
      return;
    }

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
    <div className="relative min-h-screen bg-[#030008] text-white flex items-center justify-center p-4 overflow-hidden font-sans">
      
      {/* 🔮 ANIMATED BACKGROUND ORBS (Ungu Gelap, Hitam, & Biru Pekat) */}
      <div className="absolute top-1/4 left-1/2 -translate-x-full w-96 h-96 bg-purple-900/40 rounded-full blur-[130px] animate-blob pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/2 translate-x-full w-96 h-96 bg-blue-950/60 rounded-full blur-[130px] animate-blob animation-delay-2000 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[30rem] bg-indigo-950/30 rounded-full blur-[150px] animate-blob animation-delay-4000 pointer-events-none" />

      {/* 💳 NGL STYLE CARD */}
      <div className="relative w-full max-w-md bg-gradient-to-b from-purple-950/40 via-slate-900/60 to-black/80 backdrop-blur-2xl border border-purple-500/20 rounded-[2.5rem] p-7 sm:p-9 shadow-[0_0_50px_rgba(88,28,135,0.25)] transition-all duration-300 hover:border-purple-500/40">
        
        {/* NGL Header Badge */}
        <div className="text-center space-y-3 mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-900/60 to-blue-900/60 border border-purple-400/30 text-purple-200 text-xs font-semibold tracking-wide shadow-lg shadow-purple-950/50">
            <span className="animate-pulse text-sm">💬</span> send me anonymous messages!
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight bg-gradient-to-r from-purple-300 via-indigo-200 to-blue-400 bg-clip-text text-transparent drop-shadow-sm">
            Anonymous Confession
          </h1>

          <p className="text-xs text-purple-200/60 font-medium">
            🔒 100% rahsia. Identiti anda tidak akan diketahui.
          </p>
        </div>

        {submitted ? (
          /* 🎉 NGL Success State */
          <div className="text-center py-8 space-y-6">
            <div className="w-20 h-20 mx-auto flex items-center justify-center bg-gradient-to-tr from-purple-600 to-blue-600 rounded-full shadow-[0_0_30px_rgba(168,85,247,0.5)] animate-bounce">
              <span className="text-4xl">🚀</span>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-blue-300">
                Mesej Dihantar!
              </h2>
              <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                Luahan anda telah dihantar ke peti simpanan admin dan sedang menunggu kelulusan.
              </p>
            </div>

            <button
              onClick={() => setSubmitted(false)}
              className="w-full py-4 bg-purple-950/60 hover:bg-purple-900/80 text-purple-200 text-xs font-bold rounded-2xl border border-purple-500/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(168,85,247,0.3)] active:scale-95"
            >
              Hantar Mesej Lain ✍️
            </button>
          </div>
        ) : (
          /* 📝 Form NGL Input */
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Honeypot */}
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
                  placeholder="hantar luahan rahsia kat sini..."
                  rows={5}
                  maxLength={1000}
                  required
                  className="w-full bg-black/60 border border-purple-900/50 rounded-2xl p-4 text-sm text-purple-100 placeholder-purple-400/40 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/30 transition-all duration-300 resize-none shadow-inner group-hover:border-purple-700/60"
                />
              </div>

              <div className="flex justify-between items-center text-[11px] text-purple-300/50 px-2 font-medium">
                <span>
                  {cooldown > 0 ? (
                    <span className="text-amber-400 flex items-center gap-1 font-bold">
                      ⏱️ Cooldown: {cooldown}s
                    </span>
                  ) : (
                    '✨ Sedia hantar'
                  )}
                </span>
                <span>{content.length}/1000</span>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs text-center font-medium shadow-lg">
                ⚠️ {errorMsg}
              </div>
            )}

            {/* ⚡ HOVER GLOW BUTTON */}
            <button
              type="submit"
              disabled={loading || !content.trim() || cooldown > 0}
              className="relative w-full py-4 px-6 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:via-indigo-500 hover:to-blue-500 text-white font-extrabold text-sm rounded-2xl shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_35px_rgba(168,85,247,0.6)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-40 disabled:hover:scale-100 disabled:hover:shadow-none cursor-pointer disabled:cursor-not-allowed overflow-hidden"
            >
              <span className="relative z-10 flex items-center justify-center gap-2 tracking-wider uppercase text-xs">
                {loading ? (
                  'Menghantar...'
                ) : cooldown > 0 ? (
                  `Tunggu (${cooldown}s)`
                ) : (
                  <>
                    <span>Hantar Mesej</span>
                    <span className="text-base transition-transform duration-300 group-hover:translate-x-1">🔥</span>
                  </>
                )}
              </span>
            </button>
          </form>
        )}

        <div className="mt-8 text-center">
          <p className="text-[10px] text-purple-300/30 tracking-widest uppercase font-semibold">
            Confession V2 • Powered by Next.js
          </p>
        </div>
      </div>
    </div>
  );
}
