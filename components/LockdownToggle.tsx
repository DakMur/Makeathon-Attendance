'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Lock, Unlock, ShieldOff, Loader2 } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

interface LockdownToggleProps {
  /** Current lockdown state — should come from the parent's settings */
  isLocked: boolean;
  /** Called with the new state after a successful DB write */
  onToggle: (newLocked: boolean) => void;
}

export function LockdownToggle({ isLocked, onToggle }: LockdownToggleProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleClick = () => {
    if (!isLocked) {
      // Engaging lockdown — ask for confirmation
      setShowConfirm(true);
    } else {
      // Disengaging — apply immediately
      applyLockdown(false);
    }
  };

  const applyLockdown = useCallback(
    async (newLocked: boolean) => {
      setIsSaving(true);
      setShowConfirm(false);

      try {
        if (isSupabaseConfigured && supabase) {
          await supabase
            .from('system_settings')
            .upsert({ key: 'is_system_locked', value: newLocked }, { onConflict: 'key' });
        }
        onToggle(newLocked);
      } catch (e) {
        console.error('Lockdown toggle error:', e);
      } finally {
        setIsSaving(false);
      }
    },
    [onToggle]
  );

  return (
    <>
      {/* Lockdown Button */}
      <button
        type="button"
        onClick={handleClick}
        disabled={isSaving}
        title={isLocked ? 'Disengage System Lockdown' : 'Engage Emergency System Lockdown'}
        className={`relative inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all border shadow-sm disabled:opacity-60
          ${
            isLocked
              ? 'bg-red-950/90 hover:bg-red-900 border-red-500/70 text-red-300 hover:text-red-200 animate-pulse hover:animate-none'
              : 'bg-zinc-900 hover:bg-amber-950/50 border-zinc-700 hover:border-amber-500/60 text-zinc-400 hover:text-amber-300'
          }
        `}
      >
        {isSaving ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isLocked ? (
          <Lock className="w-4 h-4" />
        ) : (
          <Unlock className="w-4 h-4" />
        )}
        <span className="hidden sm:inline">
          {isSaving ? 'Updating…' : isLocked ? 'LOCKED' : 'Lock System'}
        </span>
        {isLocked && (
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-black animate-pulse" />
        )}
      </button>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-xl border border-red-800/60 bg-[#100505] p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-950 border border-red-700/60 flex items-center justify-center shrink-0">
                <ShieldOff className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Engage System Lockdown?</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  All non-admin routes will be immediately blocked.
                </p>
              </div>
            </div>

            <div className="rounded-lg bg-red-950/30 border border-red-800/40 p-3 text-xs text-red-300 space-y-1 font-mono leading-relaxed">
              <div>• Check-In terminal will be disabled</div>
              <div>• All 8 classroom coordinators will be locked out</div>
              <div>• Admin command center remains fully accessible</div>
              <div>• Active sessions are invalidated in real-time</div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-3 py-2 text-xs font-medium text-zinc-400 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => applyLockdown(true)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-red-700 hover:bg-red-600 rounded-lg transition-colors border border-red-500/60"
              >
                <Lock className="w-3.5 h-3.5" />
                Engage Lockdown
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
