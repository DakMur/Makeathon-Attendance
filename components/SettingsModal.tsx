'use client';

import React, { useState, useEffect } from 'react';
import { X, Check, User, CheckCheck } from 'lucide-react';
import { Team } from '@/lib/types';

interface SettingsModalProps {
  team: Team | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedTeam: Team) => Promise<void> | void;
  onMarkTeamDayPresent?: (slNo: number, dayKey: 'oct7' | 'oct8' | 'oct9') => void;
}

export function SettingsModal({
  team,
  isOpen,
  onClose,
  onSave,
  onMarkTeamDayPresent,
}: SettingsModalProps) {
  const [teamName, setTeamName] = useState('');
  const [m1, setM1] = useState('');
  const [m2, setM2] = useState('');
  const [m3, setM3] = useState('');
  const [m4, setM4] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [markedNotification, setMarkedNotification] = useState<string | null>(null);

  useEffect(() => {
    if (team) {
      setTeamName(team.team_name || '');
      setM1(team.member_1 || '');
      setM2(team.member_2 || '');
      setM3(team.member_3 || '');
      setM4(team.member_4 || '');
    }
  }, [team]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !team) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave({
        ...team,
        team_name: teamName.trim(),
        member_1: m1.trim(),
        member_2: m2.trim(),
        member_3: m3.trim(),
        member_4: m4.trim(),
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuickMarkDay = (dayKey: 'oct7' | 'oct8' | 'oct9', label: string) => {
    if (onMarkTeamDayPresent && team) {
      onMarkTeamDayPresent(team.sl_no, dayKey);
      setMarkedNotification(`Marked entire team present for ${label}!`);
      setTimeout(() => setMarkedNotification(null), 2500);
    }
  };

  const activeMembersCount = [m1, m2, m3, m4].filter((m) => m && m.trim() !== '').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-lg bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-[#27272a] shadow-2xl rounded-none text-zinc-900 dark:text-white font-sans overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-[#27272a] bg-zinc-50 dark:bg-[#121215]">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 text-[10px] font-mono bg-zinc-200 dark:bg-[#27272a] text-zinc-700 dark:text-[#a1a1aa] rounded-xs uppercase">
                Team #{team.sl_no}
              </span>
              <h2 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-white font-mono">
                {team.team_name || `Team ${team.sl_no}`}
              </h2>
            </div>
            <p className="text-xs text-zinc-500 dark:text-[#71717a] mt-0.5">
              Edit team details and roster ({activeMembersCount}/4 members)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-900 dark:text-[#71717a] dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-[#27272a] rounded-xs transition-colors"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-mono text-zinc-600 dark:text-[#a1a1aa] mb-1.5 uppercase tracking-wider">
              Team Name
            </label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-[#18181b] border border-zinc-300 dark:border-[#27272a] focus:border-zinc-900 dark:focus:border-white focus:outline-hidden px-3 py-2 text-xs font-mono text-zinc-900 dark:text-white transition-colors"
              placeholder="e.g. SAKSHI"
              required
            />
          </div>

          <div className="space-y-3 pt-2">
            <label className="block text-xs font-mono text-zinc-600 dark:text-[#a1a1aa] uppercase tracking-wider">
              Roster / Members
            </label>

            {/* Member 1 */}
            <div className="relative">
              <div className="flex items-center gap-2 mb-1">
                <User className="w-3 h-3 text-zinc-400 dark:text-[#71717a]" />
                <span className="text-[11px] font-mono text-zinc-500 dark:text-[#71717a]">Member 1 (Leader / Primary)</span>
              </div>
              <input
                type="text"
                value={m1}
                onChange={(e) => setM1(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-[#18181b] border border-zinc-300 dark:border-[#27272a] focus:border-zinc-900 dark:focus:border-white focus:outline-hidden px-3 py-1.5 text-xs text-zinc-900 dark:text-white transition-colors"
                placeholder="Member 1 Full Name"
              />
            </div>

            {/* Member 2 */}
            <div className="relative">
              <div className="flex items-center gap-2 mb-1">
                <User className="w-3 h-3 text-zinc-400 dark:text-[#71717a]" />
                <span className="text-[11px] font-mono text-zinc-500 dark:text-[#71717a]">Member 2</span>
              </div>
              <input
                type="text"
                value={m2}
                onChange={(e) => setM2(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-[#18181b] border border-zinc-300 dark:border-[#27272a] focus:border-zinc-900 dark:focus:border-white focus:outline-hidden px-3 py-1.5 text-xs text-zinc-900 dark:text-white transition-colors"
                placeholder="Member 2 Full Name"
              />
            </div>

            {/* Member 3 */}
            <div className="relative">
              <div className="flex items-center gap-2 mb-1">
                <User className="w-3 h-3 text-zinc-400 dark:text-[#71717a]" />
                <span className="text-[11px] font-mono text-zinc-500 dark:text-[#71717a]">Member 3</span>
              </div>
              <input
                type="text"
                value={m3}
                onChange={(e) => setM3(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-[#18181b] border border-zinc-300 dark:border-[#27272a] focus:border-zinc-900 dark:focus:border-white focus:outline-hidden px-3 py-1.5 text-xs text-zinc-900 dark:text-white transition-colors"
                placeholder="Leave blank if 2-member team"
              />
            </div>

            {/* Member 4 */}
            <div className="relative">
              <div className="flex items-center gap-2 mb-1">
                <User className="w-3 h-3 text-zinc-400 dark:text-[#71717a]" />
                <span className="text-[11px] font-mono text-zinc-500 dark:text-[#71717a]">Member 4</span>
              </div>
              <input
                type="text"
                value={m4}
                onChange={(e) => setM4(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-[#18181b] border border-zinc-300 dark:border-[#27272a] focus:border-zinc-900 dark:focus:border-white focus:outline-hidden px-3 py-1.5 text-xs text-zinc-900 dark:text-white transition-colors"
                placeholder="Leave blank if 3-member team"
              />
            </div>
          </div>

          {/* Quick Action: Mark Entire Team Present for a Day */}
          <div className="p-3 bg-zinc-100 dark:bg-[#141418] border border-zinc-200 dark:border-[#27272a] rounded-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-medium text-zinc-700 dark:text-[#a1a1aa] flex items-center gap-1.5">
                <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                Quick Attendance Action:
              </span>
              {markedNotification && (
                <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                  {markedNotification}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleQuickMarkDay('oct7', 'Oct 7')}
                className="px-2.5 py-1 text-xs font-mono bg-white dark:bg-[#1f1f23] hover:bg-[#2563eb] hover:text-white text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-[#2e2e34] rounded-xs transition-colors shadow-xs"
              >
                Mark Oct 7 Present
              </button>
              <button
                type="button"
                onClick={() => handleQuickMarkDay('oct8', 'Oct 8')}
                className="px-2.5 py-1 text-xs font-mono bg-white dark:bg-[#1f1f23] hover:bg-[#2563eb] hover:text-white text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-[#2e2e34] rounded-xs transition-colors shadow-xs"
              >
                Mark Oct 8 Present
              </button>
              <button
                type="button"
                onClick={() => handleQuickMarkDay('oct9', 'Oct 9')}
                className="px-2.5 py-1 text-xs font-mono bg-white dark:bg-[#1f1f23] hover:bg-[#2563eb] hover:text-white text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-[#2e2e34] rounded-xs transition-colors shadow-xs"
              >
                Mark Oct 9 Present
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-zinc-200 dark:border-[#27272a] mt-6">
            <span className="text-[11px] text-zinc-500 dark:text-[#71717a] font-mono">
              Press Esc to cancel
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs font-mono text-zinc-600 dark:text-[#a1a1aa] hover:text-zinc-900 dark:hover:text-white border border-zinc-300 dark:border-[#27272a] hover:bg-zinc-100 dark:hover:bg-[#18181b] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-mono font-medium text-white bg-[#2563eb] hover:bg-[#1d4ed8] border border-[#3b82f6] transition-colors disabled:opacity-50"
              >
                {isSaving ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
