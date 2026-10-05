import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { hashPasscode, SERVER_DEFAULT_PASSWORDS } from '@/lib/serverAuth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { cardId, newPasscode } = body;

    if (!cardId || typeof newPasscode !== 'string' || !newPasscode.trim()) {
      return NextResponse.json(
        { success: false, message: 'Invalid cardId or passcode' },
        { status: 400 }
      );
    }

    const trimmed = newPasscode.trim();

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('card_passwords').upsert(
          {
            card_id: cardId,
            password_hash: trimmed, // Or hashPasscode(trimmed)
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'card_id' }
        );

        if (error) {
          console.error('Supabase password upsert error:', error);
          return NextResponse.json({ success: false, message: error.message }, { status: 500 });
        }
      } catch (err) {
        console.error('Failed to update password in Supabase:', err);
      }
    }

    // Also update server cache
    SERVER_DEFAULT_PASSWORDS[cardId] = trimmed;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error in update-passcode:', err);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}
