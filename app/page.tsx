'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { INITIAL_TEAMS } from '@/lib/defaultTeams';
import { Team, AttendanceField, AdminPresence } from '@/lib/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { AttendanceGrid } from '@/components/AttendanceGrid';
import { SearchBar } from '@/components/SearchBar';
import { PresenceBar } from '@/components/PresenceBar';
import { ExportCsvButton } from '@/components/ExportCsvButton';
import { SettingsModal } from '@/components/SettingsModal';
import { ThemeToggle } from '@/components/ThemeToggle';
import { getOptimizedSearchResults } from '@/lib/searchUtils';
import { Database, AlertCircle, Sparkles, Filter, X } from 'lucide-react';

export default function AttendancePage() {
  const [teams, setTeams] = useState<Team[]>(INITIAL_TEAMS);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedSlNo, setFocusedSlNo] = useState<number | null>(1);
  const [focusedCol, setFocusedCol] = useState<number>(0);
  const [selectedTeamForSettings, setSelectedTeamForSettings] = useState<Team | null>(null);

  // Initialize theme from localStorage
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

  // Admin slot state for current tab (admin_1, admin_2, admin_3, admin_4)
  const [currentAdminSlot, setCurrentAdminSlot] = useState<
    'admin_1' | 'admin_2' | 'admin_3' | 'admin_4'
  >('admin_1');

  // Realtime active admin presences
  const [activePresences, setActivePresences] = useState<AdminPresence[]>([]);
  const [isSupabaseLive, setIsSupabaseLive] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'saving' | 'synced' | 'error'>('idle');

  // Generate unique browser tab ID
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

  // Set or cycle admin slot from local storage if previously used
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSlot = localStorage.getItem('makeathon_admin_slot');
      if (
        savedSlot &&
        ['admin_1', 'admin_2', 'admin_3', 'admin_4'].includes(savedSlot)
      ) {
        setCurrentAdminSlot(savedSlot as any);
      }
    }
  }, []);

  const handleAdminSlotChange = (slot: 'admin_1' | 'admin_2' | 'admin_3' | 'admin_4') => {
    setCurrentAdminSlot(slot);
    if (typeof window !== 'undefined') {
      localStorage.setItem('makeathon_admin_slot', slot);
    }
  };

  // 1. Initial Load from Supabase (if available)
  useEffect(() => {
    async function loadTeamsFromSupabase() {
      if (!isSupabaseConfigured || !supabase) {
        setIsSupabaseLive(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('teams')
          .select('*')
          .order('sl_no', { ascending: true });

        if (error) {
          console.warn('Supabase fetch error, fallback to initial dataset:', error);
          setIsSupabaseLive(false);
        } else if (data && data.length > 0) {
          setTeams(data as Team[]);
          setIsSupabaseLive(true);
        } else {
          // Table exists but is empty -> seed with initial teams
          console.info('Teams table is empty. Pre-seeding initial teams...');
          const { error: seedError } = await supabase.from('teams').upsert(INITIAL_TEAMS);
          if (!seedError) {
            setTeams(INITIAL_TEAMS);
            setIsSupabaseLive(true);
          }
        }
      } catch (err) {
        console.error('Error connecting to Supabase:', err);
        setIsSupabaseLive(false);
      }
    }

    loadTeamsFromSupabase();
  }, []);

  // 2. Realtime Postgres Changes Subscription
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    const channel = supabase
      .channel('public:teams')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'teams' },
        (payload) => {
          if (payload.eventType === 'UPDATE' && payload.new) {
            const updatedTeam = payload.new as Team;
            setTeams((prev) =>
              prev.map((t) => (t.sl_no === updatedTeam.sl_no ? { ...t, ...updatedTeam } : t))
            );
          } else if (payload.eventType === 'INSERT' && payload.new) {
            const newTeam = payload.new as Team;
            setTeams((prev) => {
              if (prev.some((t) => t.sl_no === newTeam.sl_no)) {
                return prev.map((t) => (t.sl_no === newTeam.sl_no ? newTeam : t));
              }
              return [...prev, newTeam].sort((a, b) => a.sl_no - b.sl_no);
            });
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsSupabaseLive(true);
        }
      });

    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  // 3. Multi-Admin Presence & Lock Synchronization (Supabase Realtime Channel + Local Broadcast fallback)
  useEffect(() => {
    const adminNum = currentAdminSlot.split('_')[1];
    const adminName = `Admin ${adminNum}`;

    const currentPresence: AdminPresence = {
      id: sessionId,
      adminSlot: currentAdminSlot,
      adminName: adminName,
      focusedSlNo: focusedSlNo,
      lastActive: Date.now(),
    };

    // A. Inter-tab broadcast support for multi-window testing on localhost
    let localBroadcast: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      localBroadcast = new BroadcastChannel('makeathon_admin_presence');

      localBroadcast.postMessage({
        type: 'PRESENCE_SYNC',
        presence: currentPresence,
      });

      localBroadcast.onmessage = (event) => {
        if (event.data?.type === 'PRESENCE_SYNC') {
          const peer = event.data.presence as AdminPresence;
          if (peer.id !== sessionId) {
            setActivePresences((prev) => {
              const filtered = prev.filter((p) => p.id !== peer.id);
              return [...filtered, peer];
            });
          }
        }
      };
    }

    // B. Supabase Realtime Presence Channel (when Supabase is live)
    let supabaseChannel: any = null;
    if (isSupabaseConfigured && supabase) {
      supabaseChannel = supabase.channel('makeathon_presence_room', {
        config: {
          presence: {
            key: sessionId,
          },
        },
      });

      supabaseChannel
        .on('presence', { event: 'sync' }, () => {
          const state = supabaseChannel.presenceState();
          const remoteList: AdminPresence[] = [];
          Object.keys(state).forEach((key) => {
            const presences = state[key] as any[];
            if (presences && presences.length > 0) {
              const p = presences[presences.length - 1];
              if (p.id !== sessionId) {
                remoteList.push(p as AdminPresence);
              }
            }
          });
          setActivePresences(remoteList);
        })
        .subscribe(async (status: string) => {
          if (status === 'SUBSCRIBED') {
            await supabaseChannel.track(currentPresence);
          }
        });
    }

    // Send heartbeat cleanup for stale presences
    const interval = setInterval(() => {
      const now = Date.now();
      setActivePresences((prev) => prev.filter((p) => now - p.lastActive < 30000));
    }, 10000);

    return () => {
      clearInterval(interval);
      if (localBroadcast) {
        localBroadcast.close();
      }
      if (supabaseChannel && supabase) {
        supabase.removeChannel(supabaseChannel);
      }
    };
  }, [sessionId, currentAdminSlot, focusedSlNo]);

  // Update cell attendance
  const handleToggleAttendance = useCallback(
    async (slNo: number, field: AttendanceField, value: boolean) => {
      // Optimistic state update
      setTeams((prev) =>
        prev.map((t) => (t.sl_no === slNo ? { ...t, [field]: value } : t))
      );

      setSyncStatus('saving');

      if (isSupabaseConfigured && supabase) {
        try {
          const { error } = await supabase
            .from('teams')
            .update({ [field]: value, updated_at: new Date().toISOString() })
            .eq('sl_no', slNo);

          if (error) {
            console.error('Failed to update attendance on Supabase:', error);
            setSyncStatus('error');
          } else {
            setSyncStatus('synced');
            setTimeout(() => setSyncStatus('idle'), 1500);
          }
        } catch (err) {
          console.error('Error writing attendance:', err);
          setSyncStatus('error');
        }
      } else {
        setSyncStatus('synced');
        setTimeout(() => setSyncStatus('idle'), 1500);
      }
    },
    []
  );

  // Mark all active members of a team present for a given day (e.g. 'oct7', 'oct8', 'oct9')
  const handleMarkTeamDayPresent = useCallback(
    async (slNo: number, dayKey: 'oct7' | 'oct8' | 'oct9') => {
      const targetTeam = teams.find((t) => t.sl_no === slNo);
      if (!targetTeam) return;

      const updates: Partial<Team> = {
        updated_at: new Date().toISOString(),
      };

      if (targetTeam.member_1?.trim()) updates[`member_1_${dayKey}` as AttendanceField] = true;
      if (targetTeam.member_2?.trim()) updates[`member_2_${dayKey}` as AttendanceField] = true;
      if (targetTeam.member_3?.trim()) updates[`member_3_${dayKey}` as AttendanceField] = true;
      if (targetTeam.member_4?.trim()) updates[`member_4_${dayKey}` as AttendanceField] = true;

      // Optimistic state update
      setTeams((prev) =>
        prev.map((t) => (t.sl_no === slNo ? { ...t, ...updates } : t))
      );

      setSyncStatus('saving');

      if (isSupabaseConfigured && supabase) {
        try {
          const { error } = await supabase
            .from('teams')
            .update(updates)
            .eq('sl_no', slNo);

          if (error) {
            console.error('Failed to mark whole team present on Supabase:', error);
            setSyncStatus('error');
          } else {
            setSyncStatus('synced');
            setTimeout(() => setSyncStatus('idle'), 1500);
          }
        } catch (err) {
          console.error('Error marking whole team present:', err);
          setSyncStatus('error');
        }
      } else {
        setSyncStatus('synced');
        setTimeout(() => setSyncStatus('idle'), 1500);
      }
    },
    [teams]
  );

  // Update comments
  const handleUpdateComments = useCallback(
    async (slNo: number, comments: string) => {
      // Optimistic update
      setTeams((prev) =>
        prev.map((t) => (t.sl_no === slNo ? { ...t, comments } : t))
      );

      if (isSupabaseConfigured && supabase) {
        try {
          await supabase
            .from('teams')
            .update({ comments, updated_at: new Date().toISOString() })
            .eq('sl_no', slNo);
        } catch (err) {
          console.error('Error saving comments:', err);
        }
      }
    },
    []
  );

  // Update team settings (member names) from modal
  const handleSaveTeamSettings = async (updatedTeam: Team) => {
    setTeams((prev) =>
      prev.map((t) => (t.sl_no === updatedTeam.sl_no ? updatedTeam : t))
    );

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('teams')
          .update({
            team_name: updatedTeam.team_name,
            member_1: updatedTeam.member_1,
            member_2: updatedTeam.member_2,
            member_3: updatedTeam.member_3,
            member_4: updatedTeam.member_4,
            updated_at: new Date().toISOString(),
          })
          .eq('sl_no', updatedTeam.sl_no);
      } catch (err) {
        console.error('Failed saving team settings:', err);
      }
    }
  };

  const handleSelectTeamFromSearch = (slNo: number) => {
    setFocusedSlNo(slNo);
    setFocusedCol(0);
  };

  const handleFocusCell = (slNo: number, colIndex: number) => {
    setFocusedSlNo(slNo);
    setFocusedCol(colIndex);
  };

  // Instant Search & Ranking: Starts with query first, then Contains query
  const searchResults = useMemo(() => {
    return getOptimizedSearchResults(teams, searchQuery);
  }, [teams, searchQuery]);

  const displayedTeams = searchResults.all;

  // Auto-focus first matching team when search query changes
  useEffect(() => {
    if (searchQuery.trim() && displayedTeams.length > 0) {
      if (!displayedTeams.some((t) => t.sl_no === focusedSlNo)) {
        setFocusedSlNo(displayedTeams[0].sl_no);
        setFocusedCol(0);
      }
    }
  }, [searchQuery, displayedTeams, focusedSlNo]);

  // Metric aggregates
  const stats = useMemo(() => {
    let totalMembers = 0;
    let oct7Count = 0;
    let oct8Count = 0;
    let oct9Count = 0;

    teams.forEach((t) => {
      if (t.member_1?.trim()) {
        totalMembers++;
        if (t.member_1_oct7) oct7Count++;
        if (t.member_1_oct8) oct8Count++;
        if (t.member_1_oct9) oct9Count++;
      }
      if (t.member_2?.trim()) {
        totalMembers++;
        if (t.member_2_oct7) oct7Count++;
        if (t.member_2_oct8) oct8Count++;
        if (t.member_2_oct9) oct9Count++;
      }
      if (t.member_3?.trim()) {
        totalMembers++;
        if (t.member_3_oct7) oct7Count++;
        if (t.member_3_oct8) oct8Count++;
        if (t.member_3_oct9) oct9Count++;
      }
      if (t.member_4?.trim()) {
        totalMembers++;
        if (t.member_4_oct7) oct7Count++;
        if (t.member_4_oct8) oct8Count++;
        if (t.member_4_oct9) oct9Count++;
      }
    });

    return {
      totalTeams: teams.length,
      totalMembers,
      oct7Count,
      oct8Count,
      oct9Count,
    };
  }, [teams]);

  return (
    <main className="flex flex-col min-h-screen bg-white dark:bg-[#09090b] text-zinc-900 dark:text-[#fafafa] transition-colors duration-150">
      {/* 1. Header Toolbar */}
      <header className="sticky top-0 z-40 bg-white dark:bg-[#09090b] border-b border-zinc-200 dark:border-[#27272a] shadow-xs dark:shadow-md transition-colors">
        <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-2.5">
          {/* Brand & Stats */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-[#2563eb] rounded-none animate-pulse" />
              <h1 className="text-xs font-mono font-bold tracking-wider text-zinc-900 dark:text-white uppercase">
                Makeathon Attendance
              </h1>
            </div>

            {/* Quick Metrics */}
            <div className="hidden lg:flex items-center gap-2 ml-4 pl-4 border-l border-zinc-200 dark:border-[#27272a] text-[11px] font-mono text-zinc-600 dark:text-[#a1a1aa]">
              <span>
                Teams: <strong className="text-zinc-900 dark:text-white font-mono">{stats.totalTeams}</strong>
              </span>
              <span className="text-zinc-300 dark:text-[#3f3f46]">|</span>
              <span>
                Candidates: <strong className="text-zinc-900 dark:text-white font-mono">{stats.totalMembers}</strong>
              </span>
              <span className="text-zinc-300 dark:text-[#3f3f46]">|</span>
              <span className="text-blue-600 dark:text-blue-400">
                Oct 7: <strong>{stats.oct7Count}</strong>
              </span>
              <span className="text-blue-600 dark:text-blue-400">
                Oct 8: <strong>{stats.oct8Count}</strong>
              </span>
              <span className="text-blue-600 dark:text-blue-400">
                Oct 9: <strong>{stats.oct9Count}</strong>
              </span>
            </div>
          </div>

          {/* Optimized Search bar */}
          <div className="flex-1 max-w-sm sm:max-w-md">
            <SearchBar
              teams={teams}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSelectTeam={handleSelectTeamFromSearch}
            />
          </div>

          {/* Header Action Tools */}
          <div className="flex items-center gap-2">
            {syncStatus === 'saving' && (
              <span className="text-[11px] font-mono text-zinc-500 dark:text-[#71717a] animate-pulse">
                Saving...
              </span>
            )}
            {syncStatus === 'synced' && (
              <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                Saved ✓
              </span>
            )}
            <ThemeToggle theme={theme} onToggle={handleToggleTheme} />
            <ExportCsvButton teams={teams} />
          </div>
        </div>

        {/* 2. Multi-Admin Presence & Lock Status Bar */}
        <PresenceBar
          currentAdminSlot={currentAdminSlot}
          onAdminSlotChange={handleAdminSlotChange}
          activePresences={activePresences}
          isConnected={isSupabaseLive}
        />
      </header>

      {/* Database setup notice if Supabase keys not set */}
      {!isSupabaseConfigured && (
        <div className="bg-amber-50/70 dark:bg-[#121215] border-b border-amber-200 dark:border-[#27272a] px-4 py-2 text-xs font-mono text-zinc-700 dark:text-[#a1a1aa] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>
              <strong>Local Mode:</strong> 60 teams loaded with offline persistence &amp; tab sync. To connect cloud PostgreSQL &amp; Realtime, paste your Supabase URL &amp; Anon Key into <code className="text-zinc-900 dark:text-white bg-zinc-200 dark:bg-[#1f1f23] px-1 py-0.5">.env.local</code>.
            </span>
          </div>
          <span className="hidden md:inline text-[11px] text-zinc-500 dark:text-[#71717a]">
            Schema file available in <code className="text-zinc-700 dark:text-[#a1a1aa]">supabase_schema.sql</code>
          </span>
        </div>
      )}

      {/* Active Search Filter Banner */}
      {searchQuery.trim() && (
        <div className="flex items-center justify-between px-4 py-1.5 bg-blue-50/80 dark:bg-[#121215] border-b border-blue-200 dark:border-[#27272a] text-xs font-mono text-zinc-700 dark:text-[#a1a1aa]">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-blue-500" />
            <span>
              Showing <strong className="text-zinc-900 dark:text-white">{displayedTeams.length}</strong> matching teams for &quot;{searchQuery}&quot;:
              <span className="text-blue-600 dark:text-blue-400 ml-1 font-semibold">{searchResults.startsWith.length} starting with &quot;{searchQuery}&quot;</span>,
              <span className="text-zinc-600 dark:text-[#a1a1aa] ml-1">{searchResults.contains.length} containing</span>
            </span>
          </div>
          <button
            onClick={() => setSearchQuery('')}
            className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 bg-white dark:bg-[#18181b] hover:bg-zinc-100 dark:hover:bg-[#27272a] text-zinc-900 dark:text-white border border-zinc-300 dark:border-[#27272a] rounded-xs transition-colors"
          >
            <X className="w-3 h-3" />
            <span>Show All 60 Teams (Esc)</span>
          </button>
        </div>
      )}

      {/* 3. Keyboard Shortcut Reference Strip */}
      <div className="hidden sm:flex items-center justify-between px-4 py-1.5 bg-zinc-50 dark:bg-[#0c0c0e] border-b border-zinc-200 dark:border-[#1f1f23] text-[10px] font-mono text-zinc-500 dark:text-[#71717a]">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-zinc-700 dark:text-[#a1a1aa] font-semibold">Shortcuts:</span>
          <span>
            <kbd className="px-1 py-0.5 bg-zinc-200 dark:bg-[#18181b] border border-zinc-300 dark:border-[#27272a] text-zinc-900 dark:text-white">P</kbd> Present
          </span>
          <span>
            <kbd className="px-1 py-0.5 bg-zinc-200 dark:bg-[#18181b] border border-zinc-300 dark:border-[#27272a] text-zinc-900 dark:text-white">A</kbd>/<kbd className="px-1 py-0.5 bg-zinc-200 dark:bg-[#18181b] border border-zinc-300 dark:border-[#27272a] text-zinc-900 dark:text-white">X</kbd> Absent
          </span>
          <span>
            <kbd className="px-1 py-0.5 bg-zinc-200 dark:bg-[#18181b] border border-zinc-300 dark:border-[#27272a] text-zinc-900 dark:text-white">Space</kbd> Toggle
          </span>
          <span>
            <kbd className="px-1 py-0.5 bg-blue-100 dark:bg-blue-950/60 border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 font-semibold">Shift+P</kbd> Mark Team Day Present
          </span>
          <span>
            <kbd className="px-1 py-0.5 bg-zinc-200 dark:bg-[#18181b] border border-zinc-300 dark:border-[#27272a] text-zinc-900 dark:text-white">↑↓←→</kbd> Move
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span>Focus:</span>
          <span className="inline-block px-1.5 py-0.5 text-[9px] bg-zinc-900 text-white dark:bg-white dark:text-black font-semibold">
            {focusedSlNo !== null
              ? `Team #${focusedSlNo} (${teams.find((t) => t.sl_no === focusedSlNo)?.team_name || ''})`
              : 'None'}
          </span>
        </div>
      </div>

      {/* 4. Core Excel Spreadsheet Grid */}
      <div className="flex-1 overflow-auto">
        <AttendanceGrid
          teams={displayedTeams}
          focusedSlNo={focusedSlNo}
          focusedCol={focusedCol}
          onFocusCell={handleFocusCell}
          onToggleAttendance={handleToggleAttendance}
          onMarkTeamDayPresent={handleMarkTeamDayPresent}
          onUpdateComments={handleUpdateComments}
          onOpenSettings={(team) => setSelectedTeamForSettings(team)}
          activePresences={activePresences}
          currentAdminSlot={currentAdminSlot}
        />
      </div>

      {/* 5. Team Settings Drawer / Modal */}
      <SettingsModal
        team={selectedTeamForSettings}
        isOpen={Boolean(selectedTeamForSettings)}
        onClose={() => setSelectedTeamForSettings(null)}
        onSave={handleSaveTeamSettings}
        onMarkTeamDayPresent={handleMarkTeamDayPresent}
      />
    </main>
  );
}
