import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { id, action, content, password } = await request.json();

    // 1. Semak kata laluan admin
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
    if (!password || password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Kata laluan admin salah!' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: 'Maklumat Supabase tidak dijumpai' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    if (!id || !action) {
      return NextResponse.json({ error: 'Maklumat tidak lengkap' }, { status: 400 });
    }

    if (action === 'approve') {
      if (BOT_TOKEN && CHANNEL_ID) {
        // Hantar kandungan mesej sahaja secara terus
        const telegramRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: CHANNEL_ID,
            text: content, // 👈 Terus hantar isi kandungan tanpa #Confession
          }),
        });

        if (!telegramRes.ok) {
          const errorData = await telegramRes.json();
          console.error('Telegram Error:', errorData);
          return NextResponse.json({ error: 'Gagal hantar ke Telegram Channel' }, { status: 500 });
        }
      }

      const { error } = await supabase
        .from('confessions')
        .update({ status: 'approved' })
        .eq('id', id);

      if (error) throw error;
      return NextResponse.json({ success: true, status: 'approved' });

    } else if (action === 'reject') {
      const { error } = await supabase
        .from('confessions')
        .update({ status: 'rejected' })
        .eq('id', id);

      if (error) throw error;
      return NextResponse.json({ success: true, status: 'rejected' });
    }

    return NextResponse.json({ error: 'Tindakan tidak sah' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
