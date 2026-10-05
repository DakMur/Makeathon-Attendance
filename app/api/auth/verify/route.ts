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

    // 1. Try Supabase verification
    if (isSupabaseConfigured && supabase) {
      try {
        // Attempt RPC first if configured
        const { data: rpcMatch, error: rpcError } = await supabase.rpc(
          'verify_card_passcode',
          { p_card_id: cardId, p_passcode: trimmed }
        );

        if (!rpcError && typeof rpcMatch === 'boolean') {
          if (!rpcMatch) {
            // Anti-brute force delay
            await new Promise((r) => setTimeout(r, 200));
          }
          return NextResponse.json({ success: rpcMatch });
        }

        // Direct check if RPC not created yet
        const { data, error } = await supabase
          .from('card_passwords')
          .select('password_hash')
          .eq('card_id', cardId)
          .maybeSingle();

        if (!error && data && data.password_hash) {
          const isMatch = verifyPasscodeMatch(trimmed, data.password_hash);
          if (!isMatch) {
            await new Promise((r) => setTimeout(r, 200));
          }
          return NextResponse.json({ success: isMatch });
        }
      } catch (err) {
        console.warn('Supabase auth query error:', err);
      }
    }

    // 2. Fallback to server defaults (never exposed to browser bundle)
    const expected = SERVER_DEFAULT_PASSWORDS[cardId];
    const isMatch = Boolean(expected && expected === trimmed);

    if (!isMatch) {
      await new Promise((r) => setTimeout(r, 200));
    }

    return NextResponse.json({ success: isMatch });
  } catch (err) {
    console.error('Auth verification error:', err);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
