'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Building2,
  ShieldCheck,
  Lock,
  Unlock,
  Radio,
  Clock,
  Sparkles,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import { PasswordModal } from '@/components/PasswordModal';
import {
  getSystemSettings,
  getAllClassroomPresence,
  getCoordinatorPings,
  getNotices,
} from '@/lib/dataService';
import { ClassroomPresence, SystemSettings, CoordinatorPing } from '@/lib/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

interface CardDef {
  id: string; // 'checkin', '401'..'408', 'admin'
  title: string;
  subtitle: string;
  href: string;
  iconType: 'checkin' | 'room' | 'admin';
  badgeLabel?: string;
  isSecured: boolean;
}

const CARDS: CardDef[] = [
  {
    id: 'checkin',
    title: 'Check-In Attendance',
    subtitle: 'Main 60-team spreadsheet view & phone roster',
    href: '/checkin',
    iconType: 'checkin',
    badgeLabel: 'Master Roster',
    isSecured: true,
  },
  {
    id: '401',
    title: 'Classroom 401',
    subtitle: 'Teams 1 to 8 • Realtime Presence',
    href: '/room/401',
    iconType: 'room',
    isSecured: true,
  },
  {
    id: '402',
    title: 'Classroom 402',
    subtitle: 'Teams 9 to 16 • Realtime Presence',
    href: '/room/402',
    iconType: 'room',
    isSecured: true,
  },
  {
    id: '403',
    title: 'Classroom 403',
    subtitle: 'Teams 17 to 24 • Realtime Presence',
    href: '/room/403',
    iconType: 'room',
    isSecured: true,
  },
  {
    id: '404',
    title: 'Classroom 404',
    subtitle: 'Teams 25 to 32 • Realtime Presence',
    href: '/room/404',
    iconType: 'room',
    isSecured: true,
  },
  {
    id: '405',
    title: 'Classroom 405',
    subtitle: 'Teams 33 to 39 • Realtime Presence',
    href: '/room/405',
    iconType: 'room',
    isSecured: true,
  },
  {
    id: '406',
    title: 'Classroom 406',
    subtitle: 'Teams 40 to 46 • Realtime Presence',
    href: '/room/406',
    iconType: 'room',
    isSecured: true,
  },
  {
    id: '407',
    title: 'Classroom 407',
    subtitle: 'Teams 47 to 53 • Realtime Presence',
    href: '/room/407',
    iconType: 'room',
    isSecured: true,
  },
  {
    id: '408',
    title: 'Classroom 408',
    subtitle: 'Teams 54 to 60 • Realtime Presence',
    href: '/room/408',
    iconType: 'room',
    isSecured: true,
  },
  {
    id: 'admin',
    title: 'Admin Command Center',
    subtitle: 'Live 8-room monitor, notices & SOS center',
    href: '/admin',
    iconType: 'admin',
    badgeLabel: 'Supercharged',
    isSecured: true,
  },
];

export default function ViewportLandingPage() {
  const router = useRouter();
  const [activeCardForAuth, setActiveCardForAuth] = useState<CardDef | null>(null);
  const [unlockedCards, setUnlockedCards] = useState<Record<string, boolean>>({});
  const [currentDay, setCurrentDay] = useState(1);
  const [presences, setPresences] = useState<ClassroomPresence[]>([]);
  const [unresolvedPingsCount, setUnresolvedPingsCount] = useState(0);
  const [currentTime, setCurrentTime] = useState('');

  // Check which cards are already authenticated in sessionStorage
  const checkUnlockedCards = useCallback(() => {
    if (typeof window === 'undefined') return;
    const authStatus: Record<string, boolean> = {};
    CARDS.forEach((card) => {
      authStatus[card.id] = sessionStorage.getItem(`auth_card_${card.id}`) === 'true';
    });
    setUnlockedCards(authStatus);
  }, []);

  const loadData = useCallback(async () => {
    try {
      const settings = await getSystemSettings();
      setCurrentDay(settings.current_day || 1);

      const [presenceData, pings] = await Promise.all([
        getAllClassroomPresence(settings.current_day || 1),
        getCoordinatorPings(true),
      ]);
      setPresences(presenceData);
      setUnresolvedPingsCount(pings.length);
    } catch (e) {
      console.warn('Load landing data error:', e);
    }
  }, []);

  useEffect(() => {
    checkUnlockedCards();
    loadData();

    // Live clock
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateClock();
    const clockInterval = setInterval(updateClock, 1000);

    // Refresh data periodically
    const pollInterval = setInterval(loadData, 5000);

    // Listen for local storage sync events
    const handleSync = () => {
      checkUnlockedCards();
      loadData();
    };
    window.addEventListener('makeathon_storage_sync', handleSync);

    // Supabase Realtime channel
    let channel: any = null;
    if (isSupabaseConfigured && supabase) {
      channel = supabase
        .channel('landing_realtime_channel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'classroom_presence' }, () => {
          loadData();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'coordinator_pings' }, () => {
          loadData();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'system_settings' }, () => {
          loadData();
        })
        .subscribe();
    }

    return () => {
      clearInterval(clockInterval);
      clearInterval(pollInterval);
      window.removeEventListener('makeathon_storage_sync', handleSync);
      if (channel && supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [checkUnlockedCards, loadData]);

  // Click card handler
  const handleCardClick = (card: CardDef) => {
    const isUnlocked = unlockedCards[card.id];
    // If admin is unlocked, it can access everything as well
    const isAdminUnlocked = unlockedCards['admin'];

    if (isUnlocked || isAdminUnlocked) {
      router.push(card.href);
    } else {
      setActiveCardForAuth(card);
    }
  };

  const handleAuthSuccess = () => {
    if (activeCardForAuth) {
      const href = activeCardForAuth.href;
      checkUnlockedCards();
      setActiveCardForAuth(null);
      router.push(href);
    }
  };

  // Helper for room presence stats
  const getRoomStats = (roomId: string) => {
    const roomP = presences.filter((p) => p.classroom_id === roomId);
    const total = roomP.length;
    const inCount = roomP.filter((p) => p.is_in_room).length;
    return { total, inCount, outCount: total - inCount };
  };

  return (
    <main className="h-screen h-[100dvh] w-screen overflow-hidden bg-black text-white flex flex-col justify-between p-2.5 sm:p-4 select-none">
      {/* Viewport Header */}
      <header className="shrink-0 flex items-center justify-between pb-2 border-b border-zinc-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse" />
          <div>
            <h1 className="text-xs sm:text-sm font-bold tracking-wider uppercase text-white font-mono flex items-center gap-2">
              MAKEATHON OPERATIONS
              <span className="text-[10px] px-1.5 py-0.2 bg-blue-950 text-blue-400 border border-blue-800/60 rounded font-mono font-medium">
                DAY {currentDay}
              </span>
            </h1>
          </div>
        </div>

        {/* Status / Clock */}
        <div className="flex items-center gap-2 sm:gap-3 text-[11px] font-mono">
          {unresolvedPingsCount > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-950/80 text-red-400 border border-red-500/50 animate-pulse">
              <AlertTriangle className="w-3 h-3" />
              <span className="font-bold">{unresolvedPingsCount} SOS ALERT</span>
            </div>
          )}
          <div className="hidden sm:flex items-center gap-1 text-zinc-400">
            <Clock className="w-3.5 h-3.5 text-zinc-500" />
            <span>{currentTime}</span>
          </div>
          <div className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
            10 NODES ACTIVE
          </div>
        </div>
      </header>

      {/* 10 Quick-Access Cards Matrix strictly inside viewport */}
      {/* Desktop: 5x2 grid (grid-cols-5 grid-rows-2). Mobile: 2x5 grid (grid-cols-2 grid-rows-5) */}
      <div className="flex-1 my-2 grid grid-cols-2 grid-rows-5 sm:grid-cols-5 sm:grid-rows-2 gap-2 sm:gap-3 min-h-0">
        {CARDS.map((card) => {
          const isUnlocked = unlockedCards[card.id] || unlockedCards['admin'];
          const isRoom = card.iconType === 'room';
          const isAdmin = card.iconType === 'admin';
          const isCheckin = card.iconType === 'checkin';
          const roomStats = isRoom ? getRoomStats(card.id) : null;

          return (
            <button
              key={card.id}
              onClick={() => handleCardClick(card)}
              className={`group relative text-left h-full w-full rounded-xl border p-2.5 sm:p-3 flex flex-col justify-between transition-all duration-200 overflow-hidden ${
                isAdmin
                  ? 'border-blue-900/60 bg-gradient-to-br from-zinc-950 via-zinc-950 to-blue-950/30 hover:border-blue-500/80 hover:shadow-[0_0_15px_rgba(37,99,235,0.2)]'
                  : isCheckin
                  ? 'border-zinc-800 bg-zinc-950 hover:border-zinc-500 hover:shadow-[0_0_15px_rgba(255,255,255,0.05)]'
                  : 'border-zinc-800/90 bg-zinc-950/80 hover:border-zinc-500 hover:bg-zinc-900/40'
              } active:scale-[0.98] cursor-pointer`}
            >
              {/* Card Top: Icon & Lock Status */}
              <div className="flex items-center justify-between w-full">
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center border transition-colors ${
                    isAdmin
                      ? 'bg-blue-950/80 text-blue-400 border-blue-800/60 group-hover:border-blue-500'
                      : isCheckin
                      ? 'bg-zinc-900 text-white border-zinc-700/80 group-hover:border-zinc-500'
                      : 'bg-zinc-900 text-zinc-300 border-zinc-800 group-hover:border-zinc-600'
                  }`}
                >
                  {isAdmin ? (
                    <ShieldCheck className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                  ) : isCheckin ? (
                    <Users className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                  ) : (
                    <span className="font-mono font-bold text-xs sm:text-sm">
                      {card.id}
                    </span>
                  )}
                </div>

                {/* Lock indicator status */}
                <div className="flex items-center gap-1.5">
                  {isAdmin && unresolvedPingsCount > 0 && (
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  )}
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded flex items-center gap-1 border ${
                      isUnlocked
                        ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/40'
                        : 'bg-zinc-900 text-zinc-500 border-zinc-800'
                    }`}
                  >
                    {isUnlocked ? (
                      <>
                        <Unlock className="w-2.5 h-2.5 text-emerald-400" />
                        <span className="hidden sm:inline">AUTH</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-2.5 h-2.5" />
                        <span className="hidden sm:inline">LOCKED</span>
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Card Middle: Title & Subtitle */}
              <div className="my-auto py-1">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-xs sm:text-sm font-semibold text-white tracking-tight group-hover:text-blue-400 transition-colors truncate">
                    {card.title}
                  </h2>
                </div>
                <p className="text-[10px] sm:text-[11px] text-zinc-400 truncate mt-0.5 font-sans">
                  {card.subtitle}
                </p>
              </div>

              {/* Card Bottom: Room Presence Stats or Action Badge */}
              <div className="w-full pt-1 border-t border-zinc-900 flex items-center justify-between text-[10px] font-mono">
                {isRoom && roomStats ? (
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-medium">
                      {roomStats.inCount} IN
                    </span>
                    <span className="text-zinc-600">•</span>
                    <span className="text-red-400 font-medium">
                      {roomStats.outCount} OUT
                    </span>
                  </div>
                ) : isCheckin ? (
                  <span className="text-zinc-400">60 Teams Roster</span>
                ) : (
                  <span className="text-blue-400 flex items-center gap-1 font-medium">
                    <Radio className="w-3 h-3" />
                    Live Monitor
                  </span>
                )}

                <div className="flex items-center gap-1 text-zinc-500 group-hover:text-zinc-300 transition-colors">
                  <ChevronRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Viewport Footer Bar */}
      <footer className="shrink-0 flex items-center justify-between pt-2 border-t border-zinc-800/80 text-[10px] font-mono text-zinc-500">
        <div className="flex items-center gap-2">
          <span>Makeathon Ops v2.4</span>
          <span>•</span>
          <span className="text-emerald-500 flex items-center gap-1 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Security Guard Active
          </span>
        </div>
        <div className="flex items-center gap-1 text-zinc-400">
          <span>Zero-Scroll Matrix</span>
        </div>
      </footer>

      {/* Password Guard Modal */}
      {activeCardForAuth && (
        <PasswordModal
          isOpen={Boolean(activeCardForAuth)}
          cardId={activeCardForAuth.id}
          cardTitle={activeCardForAuth.title}
          onSuccess={handleAuthSuccess}
          onClose={() => setActiveCardForAuth(null)}
        />
      )}
    </main>
  );
}
