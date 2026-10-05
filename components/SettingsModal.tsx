'use client';

import React, { useState, useEffect } from 'react';
import { X, Check, User, Phone, CheckCheck, Building2 } from 'lucide-react';
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
  const [classroomId, setClassroomId] = useState('401');
  const [m1, setM1] = useState('');
  const [m1Phone, setM1Phone] = useState('');
  const [m2, setM2] = useState('');
  const [m2Phone, setM2Phone] = useState('');
  const [m3, setM3] = useState('');
  const [m3Phone, setM3Phone] = useState('');
  const [m4, setM4] = useState('');
  const [m4Phone, setM4Phone] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [markedNotification, setMarkedNotification] = useState<string | null>(null);

  useEffect(() => {
    if (team) {
      setTeamName(team.team_name || '');
      setClassroomId(team.classroom_id || '401');
      setM1(team.member_1 || '');
      setM1Phone(team.member_1_phone || '');
      setM2(team.member_2 || '');
      setM2Phone(team.member_2_phone || '');
      setM3(team.member_3 || '');
      setM3Phone(team.member_3_phone || '');
      setM4(team.member_4 || '');
      setM4Phone(team.member_4_phone || '');
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
        classroom_id: classroomId,
        member_1: m1.trim(),
        member_1_phone: m1Phone.trim(),
        member_2: m2.trim(),
        member_2_phone: m2Phone.trim(),
        member_3: m3.trim(),
        member_3_phone: m3Phone.trim(),
        member_4: m4.trim(),
        member_4_phone: m4Phone.trim(),
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
        className="w-full max-w-lg bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-[#27272a] shadow-2xl rounded-none text-zinc-900 dark:text-white font-sans overflow-hidden max-h-[90vh] flex flex-col"
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
              Edit team details, phone numbers, and classroom ({activeMembersCount}/4 members)
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
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-mono text-zinc-600 dark:text-[#a1a1aa] mb-1.5 uppercase tracking-wider">
                Team Name
              </label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-[#18181b] border border-zinc-300 dark:border-[#27272a] focus:border-zinc-900 dark:focus:border-white focus:outline-hidden px-3 py-1.5 text-xs font-mono text-zinc-900 dark:text-white transition-colors"
                placeholder="e.g. SAKSHI"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-zinc-600 dark:text-[#a1a1aa] mb-1.5 uppercase tracking-wider">
                Classroom
              </label>
              <select
                value={classroomId}
                onChange={(e) => setClassroomId(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-[#18181b] border border-zinc-300 dark:border-[#27272a] focus:border-zinc-900 dark:focus:border-white focus:outline-hidden px-2 py-1.5 text-xs font-mono text-zinc-900 dark:text-white transition-colors"
              >
                {['401', '402', '403', '404', '405', '406', '407', '408'].map((r) => (
                  <option key={r} value={r}>Room {r}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <label className="block text-xs font-mono text-zinc-600 dark:text-[#a1a1aa] uppercase tracking-wider">
              Roster & Phone Numbers
            </label>

            {/* Member 1 */}
            <div className="p-2.5 rounded border border-zinc-200 dark:border-[#27272a] bg-zinc-50/50 dark:bg-[#121215]">
              <div className="flex items-center gap-1.5 mb-1.5">
                <User className="w-3 h-3 text-blue-500" />
                <span className="text-[11px] font-mono text-zinc-700 dark:text-zinc-300 font-semibold">
                  Member 1 (Team Leader)
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={m1}
                  onChange={(e) => setM1(e.target.value)}
                  className="bg-white dark:bg-[#18181b] border border-zinc-300 dark:border-[#27272a] px-2.5 py-1 text-xs text-zinc-900 dark:text-white"
                  placeholder="Leader Name"
                />
                <div className="relative">
                  <Phone className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    value={m1Phone}
                    onChange={(e) => setM1Phone(e.target.value)}
                    className="w-full pl-6 pr-2 py-1 text-xs font-mono bg-white dark:bg-[#18181b] border border-zinc-300 dark:border-[#27272a] text-zinc-900 dark:text-white"
                    placeholder="Phone number"
                  />
                </div>
              </div>
            </div>

            {/* Member 2 */}
            <div className="p-2.5 rounded border border-zinc-200 dark:border-[#27272a] bg-zinc-50/50 dark:bg-[#121215]">
              <div className="flex items-center gap-1.5 mb-1.5">
                <User className="w-3 h-3 text-zinc-400" />
                <span className="text-[11px] font-mono text-zinc-700 dark:text-zinc-300">
                  Member 2
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={m2}
                  onChange={(e) => setM2(e.target.value)}
                  className="bg-white dark:bg-[#18181b] border border-zinc-300 dark:border-[#27272a] px-2.5 py-1 text-xs text-zinc-900 dark:text-white"
                  placeholder="Member 2 Name"
                />
                <div className="relative">
                  <Phone className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    value={m2Phone}
                    onChange={(e) => setM2Phone(e.target.value)}
                    className="w-full pl-6 pr-2 py-1 text-xs font-mono bg-white dark:bg-[#18181b] border border-zinc-300 dark:border-[#27272a] text-zinc-900 dark:text-white"
                    placeholder="Phone number"
                  />
                </div>
              </div>
            </div>

            {/* Member 3 */}
            <div className="p-2.5 rounded border border-zinc-200 dark:border-[#27272a] bg-zinc-50/50 dark:bg-[#121215]">
              <div className="flex items-center gap-1.5 mb-1.5">
                <User className="w-3 h-3 text-zinc-400" />
                <span className="text-[11px] font-mono text-zinc-700 dark:text-zinc-300">
                  Member 3
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={m3}
                  onChange={(e) => setM3(e.target.value)}
                  className="bg-white dark:bg-[#18181b] border border-zinc-300 dark:border-[#27272a] px-2.5 py-1 text-xs text-zinc-900 dark:text-white"
                  placeholder="Leave blank if 2-member team"
                />
                <div className="relative">
                  <Phone className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    value={m3Phone}
                    onChange={(e) => setM3Phone(e.target.value)}
                    className="w-full pl-6 pr-2 py-1 text-xs font-mono bg-white dark:bg-[#18181b] border border-zinc-300 dark:border-[#27272a] text-zinc-900 dark:text-white"
                    placeholder="Phone number"
                  />
                </div>
              </div>
            </div>

            {/* Member 4 */}
            <div className="p-2.5 rounded border border-zinc-200 dark:border-[#27272a] bg-zinc-50/50 dark:bg-[#121215]">
              <div className="flex items-center gap-1.5 mb-1.5">
                <User className="w-3 h-3 text-zinc-400" />
                <span className="text-[11px] font-mono text-zinc-700 dark:text-zinc-300">
                  Member 4
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={m4}
                  onChange={(e) => setM4(e.target.value)}
                  className="bg-white dark:bg-[#18181b] border border-zinc-300 dark:border-[#27272a] px-2.5 py-1 text-xs text-zinc-900 dark:text-white"
                  placeholder="Leave blank if 3-member team"
                />
                <div className="relative">
                  <Phone className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    value={m4Phone}
                    onChange={(e) => setM4Phone(e.target.value)}
                    className="w-full pl-6 pr-2 py-1 text-xs font-mono bg-white dark:bg-[#18181b] border border-zinc-300 dark:border-[#27272a] text-zinc-900 dark:text-white"
                    placeholder="Phone number"
                  />
                </div>
              </div>
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
