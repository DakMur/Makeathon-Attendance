'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { INITIAL_TEAMS } from '@/lib/defaultTeams';
import { Team, AttendanceField, AdminPresence } from '@/lib/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { AttendanceGrid } from '@/components/AttendanceGrid';
import { SearchBar } from '@/components/SearchBar';
import { PresenceBar } from '@/components/PresenceBar';
import { ExportCsvButton } from '@/components/ExportCsvButton';
import { SettingsModal } from '@/components/SettingsModal';
import { ThemeToggle } from '@/components/ThemeToggle';
import { PasswordModal } from '@/components/PasswordModal';
import { getOptimizedSearchResults } from '@/lib/searchUtils';
import { ArrowLeft, Database, AlertCircle, Sparkles, Filter, X, LogOut } from 'lucide-react';

export default function CheckInPage() {
  const router = useRouter();

  // Auth guard
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Teams & Spreadsheet state
  const [teams, setTeams] = useState<Team[]>(INITIAL_TEAMS);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedSlNo, setFocusedSlNo] = useState<number | null>(1);
  const [focusedCol, setFocusedCol] = useState<number>(0);
  const [selectedTeamForSettings, setSelectedTeamForSettings] = useState<Team | null>(null);

  // Admin presence slot
  const [currentAdminSlot, setCurrentAdminSlot] = useState<
    'admin_1' | 'admin_2' | 'admin_3' | 'admin_4'
  >('admin_1');
  const [activePresences, setActivePresences] = useState<AdminPresence[]>([]);
  const [isSupabaseLive, setIsSupabaseLive] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'saving' | 'synced' | 'error'>('idle');

  // Verify auth on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isCheckinAuth = localStorage.getItem('auth_card_checkin') === 'true';
      const isAdminAuth = localStorage.getItem('auth_card_admin') === 'true';
      if (isCheckinAuth || isAdminAuth) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        setShowPasswordModal(true);
      }
    }
  }, []);

  // Theme setup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('makeathon_theme') as 'dark' | 'light';
      if (savedTheme) {
        setTheme(savedTheme);
        document.documentElement.classList.toggle('dark', savedTheme === 'dark');
      } else {
        document.documentElement.classList.add('dark');
      }
    }
  }, []);

  const handleToggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('makeathon_theme', nextTheme);
      document.documentElement.classList.toggle('dark', nextTheme === 'dark');
    }
  };

  // Browser Session ID
  const sessionId = useMemo(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('admin_session_id');
      if (stored) return stored;
      const newId = `session_${Math.random().toString(36).substring(2, 9)}`;
      sessionStorage.setItem('admin_session_id', newId);
      return newId;
    }
    return 'session_default';
  }, []);

  // Load teams from Supabase or localStorage
  const loadTeams = useCallback(async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('teams')
          .select('*')
          .order('sl_no', { ascending: true });

        if (!error && data && data.length > 0) {
          setTeams(data as Team[]);
          setIsSupabaseLive(true);
          return;
        }
      } catch (err) {
        console.warn('Supabase teams fetch failed:', err);
      }
    }

    // LocalStorage fallback
    if (typeof window !== 'undefined') {
      const local = localStorage.getItem('makeathon_teams_data');
      if (local) {
        try {
          setTeams(JSON.parse(local));
          return;
        } catch (e) {
          console.warn('Error reading local teams', e);
        }
      }
    }
    setTeams(INITIAL_TEAMS);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadTeams();
    }
  }, [isAuthenticated, loadTeams]);

  // Realtime subscription for teams
  useEffect(() => {
    if (!isAuthenticated || !isSupabaseConfigured || !supabase) return;

    const channel = supabase
      .channel('checkin_teams_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'teams' },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Team;
            setTeams((prev) =>
              prev.map((t) => (t.sl_no === updated.sl_no ? { ...t, ...updated } : t))
            );
          } else if (payload.eventType === 'INSERT') {
            const inserted = payload.new as Team;
            setTeams((prev) => {
              if (prev.some((t) => t.sl_no === inserted.sl_no)) return prev;
              return [...prev, inserted].sort((a, b) => a.sl_no - b.sl_no);
            });
          }
        }
      )
      .subscribe((status) => {
        setIsSupabaseLive(status === 'SUBSCRIBED');
      });

    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [isAuthenticated]);

  // Save team changes
  const saveTeamUpdate = async (slNo: number, patch: Partial<Team>) => {
    setSyncStatus('saving');
    // Local state update
    setTeams((prev) => {
      const updated = prev.map((t) => (t.sl_no === slNo ? { ...t, ...patch } : t));
      if (typeof window !== 'undefined') {
        localStorage.setItem('makeathon_teams_data', JSON.stringify(updated));
      }
      return updated;
    });

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('teams')
          .update(patch)
          .eq('sl_no', slNo);

        if (!error) {
          setSyncStatus('synced');
          setTimeout(() => setSyncStatus('idle'), 2000);
          return;
        }
      } catch (e) {
        console.warn('Supabase team update error:', e);
      }
    }

    setSyncStatus('synced');
    setTimeout(() => setSyncStatus('idle'), 2000);
  };

  const handleToggleAttendance = (
    slNo: number,
    field: AttendanceField,
    value: boolean
  ) => {
    saveTeamUpdate(slNo, { [field]: value });
  };

  const handleMarkTeamDayPresent = (
    slNo: number,
    dayKey: 'oct7' | 'oct8' | 'oct9'
  ) => {
    const patch: Partial<Team> = {
      [`member_1_${dayKey}`]: true,
      [`member_2_${dayKey}`]: true,
      [`member_3_${dayKey}`]: true,
      [`member_4_${dayKey}`]: true,
    };
    saveTeamUpdate(slNo, patch);
  };

  const handleUpdateComments = (slNo: number, comments: string) => {
    saveTeamUpdate(slNo, { comments });
  };

  const handleSaveTeamSettings = async (updatedTeam: Team) => {
    saveTeamUpdate(updatedTeam.sl_no, updatedTeam);
  };

  // Search results
  const filteredTeams = useMemo(() => {
    if (!searchQuery.trim()) return teams;
    return getOptimizedSearchResults(teams, searchQuery).all;
  }, [teams, searchQuery]);

  const handleSignOut = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_card_checkin');
    }
    router.push('/');
  };

  if (isAuthenticated === false) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
        <PasswordModal
          isOpen={showPasswordModal}
          cardId="checkin"
          cardTitle="Check-In Attendance"
          onSuccess={() => {
            setIsAuthenticated(true);
            setShowPasswordModal(false);
          }}
          onClose={() => router.push('/')}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#09090b] text-zinc-900 dark:text-white transition-colors duration-150">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#09090b]/95 backdrop-blur-md border-b border-zinc-200 dark:border-[#27272a] px-4 py-2.5">
        <div className="max-w-[1700px] mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Left: Back & Title */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-300 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
              title="Return to Operations Hub"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold font-mono text-zinc-900 dark:text-white tracking-tight uppercase">
                  Main Check-In Attendance Sheet
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-800/60 font-semibold">
                  60 Teams • Phone Directory
                </span>
              </div>
              <p className="text-[11px] font-mono text-zinc-500 dark:text-[#71717a]">
                Multi-day attendance matrix with individual participant phone numbers
              </p>
            </div>
          </div>

          {/* Right: Presence, Sync Status & Actions */}
          <div className="flex items-center gap-3">
            {/* Sync status badge */}
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <span
                className={`w-2 h-2 rounded-full ${
                  isSupabaseLive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              <span className="text-[11px] text-zinc-500 dark:text-[#71717a]">
                {syncStatus === 'saving'
                  ? 'Saving...'
                  : isSupabaseLive
                  ? 'Cloud Synced'
                  : 'Local Cache'}
              </span>
            </div>

            <PresenceBar
              currentAdminSlot={currentAdminSlot}
              onAdminSlotChange={setCurrentAdminSlot}
              activePresences={activePresences}
              isConnected={isSupabaseLive}
            />

            <ExportCsvButton teams={teams} />

            <ThemeToggle theme={theme} onToggle={handleToggleTheme} />

            <button
              type="button"
              onClick={handleSignOut}
              className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-300 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-red-500 transition-colors"
              title="Sign out of Check-In Attendance"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Search & Shortcuts Bar */}
      <div className="border-b border-zinc-200 dark:border-[#27272a] bg-zinc-50/70 dark:bg-[#101013] px-4 py-2">
        <div className="max-w-[1700px] mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="w-full sm:w-80">
            <SearchBar
              teams={teams}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSelectTeam={(slNo) => {
                setFocusedSlNo(slNo);
                setFocusedCol(0);
              }}
            />
          </div>

          {/* Keyboard hints */}
          <div className="hidden lg:flex items-center gap-3 text-[10px] font-mono text-zinc-400 dark:text-[#52525b]">
            <span>Navigate: <kbd className="px-1 py-0.5 bg-zinc-200 dark:bg-zinc-800 rounded">Arrows</kbd> / <kbd className="px-1 py-0.5 bg-zinc-200 dark:bg-zinc-800 rounded">Tab</kbd></span>
            <span>Toggle: <kbd className="px-1 py-0.5 bg-zinc-200 dark:bg-zinc-800 rounded">Space</kbd></span>
            <span>Mark Whole Day: <kbd className="px-1 py-0.5 bg-zinc-200 dark:bg-zinc-800 rounded">Shift+P</kbd></span>
          </div>
        </div>
      </div>

      {/* Main Spreadsheet Grid */}
      <main className="flex-1 max-w-[1700px] w-full mx-auto p-4 overflow-hidden flex flex-col">
        <AttendanceGrid
          teams={filteredTeams}
          focusedSlNo={focusedSlNo}
          focusedCol={focusedCol}
          onFocusCell={(slNo, col) => {
            setFocusedSlNo(slNo);
            setFocusedCol(col);
          }}
          onToggleAttendance={handleToggleAttendance}
          onMarkTeamDayPresent={handleMarkTeamDayPresent}
          onUpdateComments={handleUpdateComments}
          onOpenSettings={(team) => setSelectedTeamForSettings(team)}
          activePresences={activePresences}
          currentAdminSlot={currentAdminSlot}
        />
      </main>

      {/* Team Settings / Edit Modal */}
      <SettingsModal
        team={selectedTeamForSettings}
        isOpen={Boolean(selectedTeamForSettings)}
        onClose={() => setSelectedTeamForSettings(null)}
        onSave={handleSaveTeamSettings}
        onMarkTeamDayPresent={handleMarkTeamDayPresent}
      />
    </div>
  );
}
