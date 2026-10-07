import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Paksa Next.js menganggap API route ini sebagai dinamik penuh
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: 'Maklumat Supabase tidak dijumpai' }, { status: 500 });
    }

    // Sambungan Supabase diwujudkan di DALAM fungsi semasa request diproses
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { id, action, content } = await request.json();

    if (!id || !action) {
      return NextResponse.json({ error: 'Maklumat tidak lengkap' }, { status: 400 });
    }

    if (action === 'approve') {
      // 1. Hantar mesej ke Telegram Channel
      if (BOT_TOKEN && CHANNEL_ID) {
        const messageText = `📢 **#Confession**\n\n${content}`;
        const telegramRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: CHANNEL_ID,
            text: messageText,
            parse_mode: 'Markdown',
          }),
        });

        if (!telegramRes.ok) {
          return NextResponse.json({ error: 'Gagal hantar ke Telegram Channel' }, { status: 500 });
        }
      }

      // 2. Kemaskini status dalam Supabase
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
