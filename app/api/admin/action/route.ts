import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID;

export async function POST(request: Request) {
  try {
    const { id, action, content } = await request.json();

    if (!id || !action) {
      return NextResponse.json({ error: 'Maklumat tidak lengkap' }, { status: 400 });
    }

    if (action === 'approve') {
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
