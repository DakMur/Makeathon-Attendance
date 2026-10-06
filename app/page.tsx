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
  LogOut,
  Wrench,
  Plus,
  Trash2,
  X,
  Check,
  Loader2,
} from 'lucide-react';
import { PasswordModal } from '@/components/PasswordModal';
import {
  getSystemSettings,
  getAllClassroomPresence,
  getCoordinatorPings,
} from '@/lib/dataService';
import { ClassroomPresence, SystemSettings, CoordinatorPing } from '@/lib/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

// ─── Card definition ──────────────────────────────────────────────────────────

interface CardDef {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  iconType: 'checkin' | 'room' | 'admin' | 'makerspace' | 'custom';
  badgeLabel?: string;
  isSecured: boolean;
}

// Default static cards — rooms 405 marked reserved
const BASE_CARDS: CardDef[] = [
  {
    id: 'checkin',
    title: 'Check-In Attendance',
    subtitle: 'Master 51-team spreadsheet view & phone roster',
    href: '/checkin',
    iconType: 'checkin',
    badgeLabel: 'Master Roster',
    isSecured: true,
  },
  {
    id: '401',
    title: 'Classroom 401',
    subtitle: '6 Teams (23 Members) • Realtime Presence',
    href: '/room/401',
    iconType: 'room',
    isSecured: true,
  },
  {
    id: '402',
    title: 'Classroom 402',
    subtitle: '5 Teams (18 Members) • Realtime Presence',
    href: '/room/402',
    iconType: 'room',
    isSecured: true,
  },
  {
    id: '403',
    title: 'Classroom 403',
    subtitle: '6 Teams (19 Members) • Realtime Presence',
    href: '/room/403',
    iconType: 'room',
    isSecured: true,
  },
  {
    id: '404',
    title: 'Classroom 404',
    subtitle: '9 Teams (31 Members) • Realtime Presence',
    href: '/room/404',
    iconType: 'room',
    isSecured: true,
  },
  {
    id: '405',
    title: 'Classroom 405',
    subtitle: 'Reserved / Unallocated',
    href: '/room/405',
    iconType: 'room',
    isSecured: true,
  },
  {
    id: '406',
    title: 'Classroom 406',
    subtitle: '9 Teams (32 Members) • Realtime Presence',
    href: '/room/406',
    iconType: 'room',
    isSecured: true,
  },
  {
    id: '407',
    title: 'Classroom 407',
    subtitle: '8 Teams (31 Members) • Realtime Presence',
    href: '/room/407',
    iconType: 'room',
    isSecured: true,
  },
  {
    id: '408',
    title: 'Classroom 408',
    subtitle: '8 Teams (29 Members) • Realtime Presence',
    href: '/room/408',
    iconType: 'room',
    isSecured: true,
  },
  {
    id: 'makerspace',
    title: 'Makerspace Check-In',
    subtitle: 'Resource allocation & live session log',
    href: '/makerspace',
    iconType: 'makerspace',
    badgeLabel: 'Live Log',
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

const CARDS_STORAGE_KEY = 'makeathon_dashboard_cards';
// IDs that can never be removed
const PROTECTED_IDS = new Set(['checkin', 'admin']);

function loadCards(): CardDef[] {
  if (typeof window === 'undefined') return BASE_CARDS;
  try {
    const stored = localStorage.getItem(CARDS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as CardDef[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return BASE_CARDS;
}

function saveCards(cards: CardDef[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CARDS_STORAGE_KEY, JSON.stringify(cards));
}

// ─── Add Card Modal ───────────────────────────────────────────────────────────

interface AddCardModalProps {
  existingIds: Set<string>;
  onClose: () => void;
  onAdd: (card: CardDef) => void;
}

function AddCardModal({ existingIds, onClose, onAdd }: AddCardModalProps) {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [href, setHref] = useState('');
  const [iconType, setIconType] = useState<CardDef['iconType']>('room');
  const [isSecured, setIsSecured] = useState(true);

  const handleAdd = () => {
    const id = title.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') || `card_${Date.now()}`;
    const safeId = existingIds.has(id) ? `${id}_${Date.now()}` : id;
    onAdd({
      id: safeId,
      title: title.trim(),
      subtitle: subtitle.trim() || 'Custom card',
      href: href.trim() || `#${safeId}`,
      iconType,
      isSecured,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-sm bg-[#0d0d10] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold text-white">Add New Card</h3>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-[10px] font-semibold text-zinc-400 mb-1 uppercase tracking-wider">Card Title *</label>
            <input
              autoFocus
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Workshop Room A"
              maxLength={60}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 transition-colors font-mono"
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-zinc-400 mb-1 uppercase tracking-wider">Subtitle</label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Short description"
              maxLength={80}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 transition-colors font-mono"
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-zinc-400 mb-1 uppercase tracking-wider">Link / Route</label>
            <input
              type="text"
              value={href}
              onChange={(e) => setHref(e.target.value)}
              placeholder="/room/409 or https://..."
              maxLength={200}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 transition-colors font-mono"
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-zinc-400 mb-1 uppercase tracking-wider">Icon Type</label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['room', 'checkin', 'admin', 'makerspace', 'custom'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setIconType(t)}
                  className={`py-1.5 rounded-lg text-[10px] font-mono font-semibold transition-all ${
                    iconType === t
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Password Protected</label>
            <button
              type="button"
              onClick={() => setIsSecured((v) => !v)}
              className={`w-10 h-5 rounded-full relative transition-colors ${isSecured ? 'bg-blue-600' : 'bg-zinc-700'}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${isSecured ? 'left-5' : 'left-0.5'}`} />
            </button>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-xl border border-zinc-800 text-xs text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={!title.trim()}
              className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Card
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ViewportLandingPage() {
  const router = useRouter();

  const [cards, setCards] = useState<CardDef[]>(BASE_CARDS);
  const [activeCardForAuth, setActiveCardForAuth] = useState<CardDef | null>(null);
  const [unlockedCards, setUnlockedCards] = useState<Record<string, boolean>>({});
  const [currentDay, setCurrentDay] = useState(1);
  const [presences, setPresences] = useState<ClassroomPresence[]>([]);
  const [unresolvedPingsCount, setUnresolvedPingsCount] = useState(0);
  const [currentTime, setCurrentTime] = useState('');

  // Card management state
  const [isEditMode, setIsEditMode] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Init cards from localStorage
  useEffect(() => {
    setCards(loadCards());
  }, []);

  // Check which cards are already authenticated
  const checkUnlockedCards = useCallback((currentCards: CardDef[]) => {
    if (typeof window === 'undefined') return;
    const authStatus: Record<string, boolean> = {};
    currentCards.forEach((card) => {
      authStatus[card.id] = localStorage.getItem(`auth_card_${card.id}`) === 'true';
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
    checkUnlockedCards(cards);
    loadData();

    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateClock();
    const clockInterval = setInterval(updateClock, 1000);
    const pollInterval = setInterval(loadData, 5000);

    const handleSync = () => { checkUnlockedCards(cards); loadData(); };
    window.addEventListener('makeathon_storage_sync', handleSync);

    let channel: any = null;
    if (isSupabaseConfigured && supabase) {
      channel = supabase
        .channel('landing_realtime_channel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'classroom_presence' }, () => loadData())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'coordinator_pings' }, () => loadData())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'system_settings' }, () => loadData())
        .subscribe();
    }

    return () => {
      clearInterval(clockInterval);
      clearInterval(pollInterval);
      window.removeEventListener('makeathon_storage_sync', handleSync);
      if (channel && supabase) supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep auth status in sync when cards change
  useEffect(() => {
    checkUnlockedCards(cards);
  }, [cards, checkUnlockedCards]);

  // Card management helpers
  const handleAddCard = (card: CardDef) => {
    const updated = [...cards, card];
    setCards(updated);
    saveCards(updated);
    setShowAddModal(false);
  };

  const handleDeleteCard = (cardId: string) => {
    if (PROTECTED_IDS.has(cardId)) return; // Prevent deleting protected cards
    setDeletingId(cardId);
    setTimeout(() => {
      setCards((prev) => {
        const updated = prev.filter((c) => c.id !== cardId);
        saveCards(updated);
        return updated;
      });
      setDeletingId(null);
    }, 300);
  };

  // Click card handler
  const handleCardClick = (card: CardDef) => {
    if (isEditMode) return; // Don't navigate in edit mode
    const isUnlocked = unlockedCards[card.id];
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
      checkUnlockedCards(cards);
      setActiveCardForAuth(null);
      router.push(href);
    }
  };

  // Room presence stats
  const getRoomStats = (roomId: string) => {
    const roomP = presences.filter((p) => p.classroom_id === roomId);
    const total = roomP.length;
    const inCount = roomP.filter((p) => p.is_in_room).length;
    return { total, inCount, outCount: total - inCount };
  };

  const handleSignOutAll = () => {
    if (typeof window !== 'undefined') {
      cards.forEach((c) => localStorage.removeItem(`auth_card_${c.id}`));
      checkUnlockedCards(cards);
    }
  };

  // Dynamic grid: calculate columns based on card count
  const cardCount = cards.length;
  const gridCols =
    cardCount <= 6
      ? 'sm:grid-cols-3'
      : cardCount <= 8
      ? 'sm:grid-cols-4'
      : cardCount <= 10
      ? 'sm:grid-cols-5'
      : 'sm:grid-cols-6';
  const gridRows =
    cardCount <= 6
      ? 'sm:grid-rows-2'
      : cardCount <= 8
      ? 'sm:grid-rows-2'
      : cardCount <= 10
      ? 'sm:grid-rows-2'
      : 'sm:grid-rows-2';

  return (
    <main className="h-screen h-[100dvh] w-screen overflow-hidden bg-black text-white flex flex-col justify-between p-2.5 sm:p-4 select-none">
      {/* Header */}
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
            {cards.length} NODES
          </div>

          {/* Edit Mode Toggle */}
          <button
            type="button"
            onClick={() => setIsEditMode((v) => !v)}
            title={isEditMode ? 'Done editing' : 'Manage cards'}
            className={`text-[10px] px-2 py-0.5 rounded border flex items-center gap-1 transition-colors cursor-pointer ${
              isEditMode
                ? 'bg-blue-950 border-blue-700 text-blue-400 hover:bg-blue-900'
                : 'bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            {isEditMode ? <><Check className="w-3 h-3" /><span>Done</span></> : <><Plus className="w-3 h-3" /><span>EDIT</span></>}
          </button>

          {Object.values(unlockedCards).some(Boolean) && !isEditMode && (
            <button
              type="button"
              onClick={handleSignOutAll}
              title="Lock all active sessions on this device"
              className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-red-400 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <LogOut className="w-3 h-3" />
              <span>LOCK</span>
            </button>
          )}
        </div>
      </header>

      {/* Cards Grid */}
      <div
        className={`flex-1 my-2 grid grid-cols-2 grid-rows-${Math.ceil(cardCount / 2)} ${gridCols} ${gridRows} gap-2 sm:gap-3 min-h-0`}
      >
        {cards.map((card) => {
          const isUnlocked = unlockedCards[card.id] || unlockedCards['admin'];
          const isRoom = card.iconType === 'room';
          const isAdmin = card.iconType === 'admin';
          const isCheckin = card.iconType === 'checkin';
          const isMakerspace = card.iconType === 'makerspace';
          const roomStats = isRoom ? getRoomStats(card.id) : null;
          const isDying = deletingId === card.id;
          const isProtected = PROTECTED_IDS.has(card.id);

          return (
            <div
              key={card.id}
              className={`relative transition-all duration-300 ${isDying ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
            >
              {/* Delete button in edit mode */}
              {isEditMode && !isProtected && (
                <button
                  type="button"
                  onClick={() => handleDeleteCard(card.id)}
                  title="Remove card"
                  className="absolute -top-1.5 -right-1.5 z-10 w-5 h-5 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg border border-red-400/50 transition-all hover:scale-110 active:scale-95"
                >
                  <X className="w-3 h-3" />
                </button>
              )}

              <button
                onClick={() => handleCardClick(card)}
                className={`group relative text-left h-full w-full rounded-xl border p-2.5 sm:p-3 flex flex-col justify-between transition-all duration-200 overflow-hidden ${
                  isAdmin
                    ? 'border-blue-900/60 bg-gradient-to-br from-zinc-950 via-zinc-950 to-blue-950/30 hover:border-blue-500/80 hover:shadow-[0_0_15px_rgba(37,99,235,0.2)]'
                    : isMakerspace
                    ? 'border-violet-900/60 bg-gradient-to-br from-zinc-950 via-zinc-950 to-violet-950/30 hover:border-violet-500/80 hover:shadow-[0_0_15px_rgba(139,92,246,0.2)]'
                    : isCheckin
                    ? 'border-zinc-800 bg-zinc-950 hover:border-zinc-500 hover:shadow-[0_0_15px_rgba(255,255,255,0.05)]'
                    : 'border-zinc-800/90 bg-zinc-950/80 hover:border-zinc-500 hover:bg-zinc-900/40'
                } active:scale-[0.98] cursor-pointer ${isEditMode ? 'ring-1 ring-blue-700/40' : ''}`}
              >
                {/* Top: Icon & Lock */}
                <div className="flex items-center justify-between w-full">
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center border transition-colors ${
                      isAdmin
                        ? 'bg-blue-950/80 text-blue-400 border-blue-800/60 group-hover:border-blue-500'
                        : isMakerspace
                        ? 'bg-violet-950/80 text-violet-400 border-violet-800/60 group-hover:border-violet-500'
                        : isCheckin
                        ? 'bg-zinc-900 text-white border-zinc-700/80 group-hover:border-zinc-500'
                        : 'bg-zinc-900 text-zinc-300 border-zinc-800 group-hover:border-zinc-600'
                    }`}
                  >
                    {isAdmin ? (
                      <ShieldCheck className="w-4 h-4" />
                    ) : isCheckin ? (
                      <Users className="w-4 h-4" />
                    ) : isMakerspace ? (
                      <Wrench className="w-4 h-4" />
                    ) : (
                      <span className="font-mono font-bold text-xs sm:text-sm">{card.id}</span>
                    )}
                  </div>

                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded flex items-center gap-1 border ${
                      isUnlocked
                        ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/40'
                        : 'bg-zinc-900 text-zinc-500 border-zinc-800'
                    }`}
                  >
                    {isUnlocked ? (
                      <><Unlock className="w-2.5 h-2.5 text-emerald-400" /><span className="hidden sm:inline">AUTH</span></>
                    ) : (
                      <><Lock className="w-2.5 h-2.5" /><span className="hidden sm:inline">LOCKED</span></>
                    )}
                  </span>
                </div>

                {/* Middle: Title & Subtitle */}
                <div className="my-auto py-1">
                  <h2 className="text-xs sm:text-sm font-semibold text-white tracking-tight group-hover:text-blue-400 transition-colors truncate">
                    {card.title}
                  </h2>
                  <p className="text-[10px] sm:text-[11px] text-zinc-400 truncate mt-0.5 font-sans">
                    {card.subtitle}
                  </p>
                </div>

                {/* Bottom */}
                <div className="w-full pt-1 border-t border-zinc-900 flex items-center justify-between text-[10px] font-mono">
                  {isRoom && roomStats ? (
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 font-medium">{roomStats.inCount} IN</span>
                      <span className="text-zinc-600">•</span>
                      <span className="text-red-400 font-medium">{roomStats.outCount} OUT</span>
                    </div>
                  ) : isCheckin ? (
                    <span className="text-zinc-400">51 Teams Roster</span>
                  ) : isMakerspace ? (
                    <span className="text-violet-400 flex items-center gap-1 font-medium">
                      <Wrench className="w-3 h-3" />
                      Resource Log
                    </span>
                  ) : (
                    <span className="text-blue-400 flex items-center gap-1 font-medium">
                      <Radio className="w-3 h-3" />
                      Live Monitor
                    </span>
                  )}
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300 transform group-hover:translate-x-0.5 transition-all" />
                </div>
              </button>
            </div>
          );
        })}

        {/* Add New Card button (visible in edit mode) */}
        {isEditMode && (
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="group h-full w-full rounded-xl border-2 border-dashed border-zinc-700/60 hover:border-blue-600/60 bg-zinc-950/30 hover:bg-blue-950/10 flex flex-col items-center justify-center gap-2 transition-all duration-200 text-zinc-600 hover:text-blue-400 active:scale-[0.98]"
          >
            <div className="w-8 h-8 rounded-full border border-zinc-700 group-hover:border-blue-600/60 flex items-center justify-center transition-colors">
              <Plus className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider">Add Card</span>
          </button>
        )}
      </div>

      {/* Footer */}
      <footer className="shrink-0 flex items-center justify-between pt-2 border-t border-zinc-800/80 text-[10px] font-mono text-zinc-500">
        <div className="flex items-center gap-2">
          <span>Makeathon Ops v2.5</span>
          <span>•</span>
          <span className="text-emerald-500 flex items-center gap-1 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Security Guard Active
          </span>
        </div>
        <div className="flex items-center gap-1 text-zinc-400">
          {isEditMode ? (
            <span className="text-blue-400">Edit Mode · Click <X className="w-2.5 h-2.5 inline" /> on a card to remove</span>
          ) : (
            <span>Zero-Scroll Matrix</span>
          )}
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

      {/* Add Card Modal */}
      {showAddModal && (
        <AddCardModal
          existingIds={new Set(cards.map((c) => c.id))}
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddCard}
        />
      )}
    </main>
  );
}
