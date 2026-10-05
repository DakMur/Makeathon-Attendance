import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { SERVER_DEFAULT_PASSWORDS, verifyPasscodeMatch } from '@/lib/serverAuth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { cardId, passcode } = body;

    if (!cardId || typeof passcode !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Invalid request payload' },
        { status: 400 }
      );
    }

    const trimmed = passcode.trim();

    // 1. Check if input matches target card or Admin master passcode
    let isAdmin = false;
    let isMatched = false;

    // Check Supabase if configured
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: rows } = await supabase
          .from('card_passwords')
          .select('card_id, password_hash')
          .in('card_id', cardId === 'admin' ? ['admin'] : [cardId, 'admin']);

        if (rows && rows.length > 0) {
          const cardRow = rows.find((r) => r.card_id === cardId);
          const adminRow = rows.find((r) => r.card_id === 'admin');

          // Target card match
          if (cardRow?.password_hash && verifyPasscodeMatch(trimmed, cardRow.password_hash)) {
            isMatched = true;
            isAdmin = cardId === 'admin';
          }

          // Admin master key match (unlocks any card)
          if (!isMatched && adminRow?.password_hash && verifyPasscodeMatch(trimmed, adminRow.password_hash)) {
            isMatched = true;
            isAdmin = true;
          }
        }
      } catch (err) {
        console.warn('Supabase auth query error:', err);
      }
    }

    // 2. Server fallback if Supabase didn't match or failed
    if (!isMatched) {
      const expected = SERVER_DEFAULT_PASSWORDS[cardId];
      const adminExpected = SERVER_DEFAULT_PASSWORDS['admin'];

      if (expected && expected === trimmed) {
        isMatched = true;
        isAdmin = cardId === 'admin';
      } else if (adminExpected && adminExpected === trimmed) {
        isMatched = true;
        isAdmin = true;
      }
    }

    if (!isMatched) {
      await new Promise((r) => setTimeout(r, 200));
      return NextResponse.json({ success: false });
    }

    return NextResponse.json({ success: true, isAdmin });
  } catch (err) {
    console.error('Auth verification error:', err);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
