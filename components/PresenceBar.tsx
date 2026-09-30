'use client';

import React from 'react';
import { User, Lock, Radio } from 'lucide-react';
import { AdminPresence } from '@/lib/types';

interface PresenceBarProps {
  currentAdminSlot: 'admin_1' | 'admin_2' | 'admin_3' | 'admin_4';
  onAdminSlotChange: (slot: 'admin_1' | 'admin_2' | 'admin_3' | 'admin_4') => void;
  activePresences: AdminPresence[];
  isConnected: boolean;
}

const ADMIN_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  admin_1: { bg: 'bg-blue-100 dark:bg-blue-950/40', border: 'border-blue-300 dark:border-blue-500/40', text: 'text-blue-700 dark:text-blue-400' },
  admin_2: { bg: 'bg-emerald-100 dark:bg-emerald-950/40', border: 'border-emerald-300 dark:border-emerald-500/40', text: 'text-emerald-700 dark:text-emerald-400' },
  admin_3: { bg: 'bg-amber-100 dark:bg-amber-950/40', border: 'border-amber-300 dark:border-amber-500/40', text: 'text-amber-700 dark:text-amber-400' },
  admin_4: { bg: 'bg-purple-100 dark:bg-purple-950/40', border: 'border-purple-300 dark:border-purple-500/40', text: 'text-purple-700 dark:text-purple-400' },
};

export function PresenceBar({
  currentAdminSlot,
  onAdminSlotChange,
  activePresences,
  isConnected,
}: PresenceBarProps) {
  const adminSlots: Array<'admin_1' | 'admin_2' | 'admin_3' | 'admin_4'> = [
    'admin_1',
    'admin_2',
    'admin_3',
    'admin_4',
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 border-b border-zinc-200 dark:border-[#27272a] bg-zinc-50 dark:bg-[#0c0c0e] text-xs font-mono transition-colors">
      {/* Left side: Admin Slot Selector & Identity */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-zinc-500 dark:text-[#71717a] flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
          <User className="w-3.5 h-3.5 text-zinc-600 dark:text-[#a1a1aa]" />
          Your Admin Session:
        </span>
        <div className="flex items-center gap-1 bg-zinc-200/70 dark:bg-[#18181b] p-0.5 border border-zinc-300 dark:border-[#27272a] rounded-none">
          {adminSlots.map((slot) => {
            const isSelected = currentAdminSlot === slot;
            const slotNumber = slot.split('_')[1];
            return (
              <button
                key={slot}
                onClick={() => onAdminSlotChange(slot)}
                className={`px-2.5 py-1 text-[11px] transition-all font-mono ${
                  isSelected
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-black font-semibold shadow-xs'
                    : 'text-zinc-600 dark:text-[#a1a1aa] hover:text-black dark:hover:text-white hover:bg-zinc-300/60 dark:hover:bg-[#27272a]'
                }`}
                title={`Switch session to Admin ${slotNumber}`}
              >
                Admin {slotNumber}
              </button>
            );
          })}
        </div>
      </div>

      {/* Right side: Realtime Peer Activity & Network Status */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Remote Active Admins & Locks */}
        <div className="flex items-center gap-2">
          {activePresences
            .filter((p) => p.adminSlot !== currentAdminSlot)
            .map((p) => {
              const colors = ADMIN_COLORS[p.adminSlot] || ADMIN_COLORS.admin_1;
              return (
                <div
                  key={p.id}
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 border text-[11px] font-mono ${colors.bg} ${colors.border} ${colors.text}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                  <span>{p.adminName}</span>
                  {p.focusedSlNo ? (
                    <span className="text-zinc-500 dark:text-[#a1a1aa] flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" />
                      Team #{p.focusedSlNo}
                    </span>
                  ) : (
                    <span className="text-zinc-400 dark:text-[#71717a]">idle</span>
                  )}
                </div>
              );
            })}
        </div>

        {/* Realtime Connection Status Indicator */}
        <div
          className="flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] text-[11px] text-zinc-600 dark:text-[#a1a1aa]"
          title={
            isConnected
              ? 'Supabase Realtime Postgres & Presence Connected'
              : 'Standalone Mode (Enter Supabase credentials in .env.local for cloud realtime)'
          }
        >
          <Radio
            className={`w-3 h-3 ${
              isConnected ? 'text-emerald-500 animate-pulse' : 'text-amber-500'
            }`}
          />
          <span className="hidden sm:inline">
            {isConnected ? 'Realtime Connected' : 'Local / Offline Sync'}
          </span>
        </div>
      </div>
    </div>
  );
}
