'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Users,
  AlertTriangle,
  Radio,
  Clock,
  Shield,
  Bell,
  RefreshCw,
  LogIn,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { PasswordModal } from '@/components/PasswordModal';
import { ClassroomTracker } from '@/components/ClassroomTracker';
import { QuickActionToolbar } from '@/components/QuickActionToolbar';
import { PingAdminModal } from '@/components/PingAdminModal';
import { ChatDrawer } from '@/components/ChatDrawer';
import {
  getSystemSettings,
  getClassroomPresence,
  toggleParticipantPresence,
  getNotices,
  DEFAULT_SETTINGS,
} from '@/lib/dataService';
import { ClassroomPresence, SystemSettings, Notice } from '@/lib/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

export default function ClassroomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: roomId } = use(params);
  const router = useRouter();

  // Validate room
  const validRooms = ['401', '402', '403', '404', '405', '406', '407', '408'];
  const isValidRoom = validRooms.includes(roomId);

  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Room data state
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [presences, setPresences] = useState<ClassroomPresence[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPingModalOpen, setIsPingModalOpen] = useState(false);
  const [isUpdatingName, setIsUpdatingName] = useState<string | null>(null);

  // Lockdown state
  const [isSystemLocked, setIsSystemLocked] = useState(false);

  // Check route guard
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const roomAuth = localStorage.getItem(`auth_card_${roomId}`) === 'true';
      const adminAuth = localStorage.getItem('auth_card_admin') === 'true';

      if (roomAuth || adminAuth) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        setShowPasswordModal(true);
      }
    }
  }, [roomId]);

  // Load classroom data
  const loadRoomData = useCallback(async () => {
    if (!isValidRoom) return;
    try {
      const currentSettings = await getSystemSettings();
      setSettings(currentSettings);

      const dayNumber = currentSettings.current_day || 1;
      const [presenceList, noticeList] = await Promise.all([
        getClassroomPresence(roomId, dayNumber),
        getNotices(roomId),
      ]);

      setPresences(presenceList);
      setNotices(noticeList.filter((n) => n.is_active));
    } catch (e) {
      console.warn('Error loading room data:', e);
    } finally {
      setIsLoading(false);
    }
  }, [roomId, isValidRoom]);

  // Automatic Day Turnover Engine check
  useEffect(() => {
    const checkDayTurnover = () => {
      if (!settings.day_turnover_time) return;
      const [turnoverHour, turnoverMin] = settings.day_turnover_time
        .split(':')
        .map(Number);
      const now = new Date();
      if (now.getHours() === turnoverHour && now.getMinutes() === turnoverMin) {
        // Reload data to catch partition
        loadRoomData();
      }
    };

    const interval = setInterval(checkDayTurnover, 30000);
    return () => clearInterval(interval);
  }, [settings.day_turnover_time, loadRoomData]);

  // Realtime & sync listener
  useEffect(() => {
    if (!isAuthenticated) return;
    loadRoomData();

    const handleSync = () => loadRoomData();
    window.addEventListener('makeathon_storage_sync', handleSync);

    let channel: any = null;
    if (isSupabaseConfigured && supabase) {
      channel = supabase
        .channel(`room_${roomId}_realtime`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'classroom_presence',
            filter: `classroom_id=eq.${roomId}`,
          },
          () => loadRoomData()
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'notices' },
          () => loadRoomData()
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'system_settings' },
          (payload) => {
            loadRoomData();
            // Lockdown engagement: invalidate this non-admin session immediately
            const newRow = payload.new as Record<string, any>;
            if (newRow?.key === 'is_system_locked') {
              const locked = Boolean(newRow.value);
              setIsSystemLocked(locked);
              const isAdmin = typeof window !== 'undefined' &&
                localStorage.getItem('auth_card_admin') === 'true';
              if (locked && !isAdmin) {
                if (typeof window !== 'undefined') {
                  localStorage.removeItem(`auth_card_${roomId}`);
                }
                setIsAuthenticated(false);
                setShowPasswordModal(true);
              }
            }
          }
        )
        .subscribe();
    }

    return () => {
      window.removeEventListener('makeathon_storage_sync', handleSync);
      if (channel && supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [isAuthenticated, roomId, loadRoomData]);

  // Handle participant status toggle
  const handleToggleParticipant = async (
    participantName: string,
    currentIsInRoom: boolean
  ) => {
    const nextState = !currentIsInRoom;
    setIsUpdatingName(participantName);

    // Optimistic UI update
    setPresences((prev) =>
      prev.map((p) =>
        p.participant_name.toLowerCase() === participantName.toLowerCase()
          ? { ...p, is_in_room: nextState, last_toggle_time: new Date().toISOString() }
          : p
      )
    );

    try {
      const coordinatorName =
        (settings.classroom_coordinators[roomId] || [])[0] || 'Room Coordinator';
      await toggleParticipantPresence(
        roomId,
        settings.current_day || 1,
        participantName,
        nextState,
        coordinatorName
      );
    } catch (err) {
      console.error('Toggle presence error:', err);
      // Revert on error
      loadRoomData();
    } finally {
      setIsUpdatingName(null);
    }
  };

  // Sign out this room's auth token
  const handleSignOut = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`auth_card_${roomId}`);
    }
    router.push('/');
  };

  if (!isValidRoom) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
        <h2 className="text-xl font-bold text-red-400 mb-2">Invalid Classroom Route</h2>
        <p className="text-xs text-zinc-400 mb-4">Classroom must be between 401 and 408.</p>
        <Link
          href="/"
          className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm hover:bg-zinc-800"
        >
          Return to Operations Hub
        </Link>
      </div>
    );
  }

  // Not authenticated
  if (isAuthenticated === false) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
        <PasswordModal
          isOpen={showPasswordModal}
          cardId={roomId}
          cardTitle={`Classroom ${roomId}`}
          onSuccess={() => {
            setIsAuthenticated(true);
            setShowPasswordModal(false);
          }}
          onClose={() => router.push('/')}
        />
      </div>
    );
  }

  // Calculate live stats
  const totalCount = presences.length;
  const inCount = presences.filter((p) => p.is_in_room).length;
  const outCount = totalCount - inCount;
  const coordinators = settings.classroom_coordinators[roomId] || [];
  const primaryCoordinator = coordinators[0] || `Coordinator ${roomId}`;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* 1. Header Section */}
      <header className="sticky top-0 z-30 bg-black/90 backdrop-blur-md border-b border-zinc-800 px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Left: Back button & Room Title */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
              title="Return to Hub"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-700/80 flex items-center justify-center font-mono font-bold text-white text-base shadow-inner">
                {roomId}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold text-white tracking-tight">
                    Classroom {roomId}
                  </h1>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800/60 font-semibold">
                    DAY {settings.current_day}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono mt-0.5">
                  <span className="text-zinc-500">Coordinators:</span>
                  <span className="text-zinc-300 font-medium">
                    {coordinators.length > 0 ? coordinators.join(', ') : 'Unassigned'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Center/Right: Live IN/OUT Counters & SOS Ping Button */}
          <div className="flex items-center gap-3">
            {/* Live Counter Badges */}
            <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800/90 rounded-xl p-1 shadow-inner">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-950/40 border border-emerald-800/50 text-emerald-400 text-xs font-mono font-bold">
                <LogIn className="w-3.5 h-3.5" />
                <span>{inCount} IN</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-950/40 border border-red-800/50 text-red-400 text-xs font-mono font-bold">
                <LogOut className="w-3.5 h-3.5" />
                <span>{outCount} OUT</span>
              </div>
            </div>

            {/* Coordinator SOS Ping Button */}
            <button
              type="button"
              onClick={() => setIsPingModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 active:scale-95 transition-all shadow-md shadow-red-950/50 border border-red-500/80 animate-pulse hover:animate-none"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Ping Admin / SOS</span>
            </button>

            {/* Sign Out */}
            <button
              type="button"
              onClick={handleSignOut}
              title="Sign out from this room"
              className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-red-400 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 space-y-4">
        {/* 2. Broadcast Notice Banner (Pinned Notices) */}
        {notices.length > 0 && (
          <div className="space-y-2">
            {notices.map((notice) => (
              <div
                key={notice.id}
                className="rounded-xl border border-blue-600/40 bg-blue-950/30 p-3 shadow-lg flex items-start gap-3 animate-in fade-in"
              >
                <div className="p-1 rounded-md bg-blue-950 text-blue-400 border border-blue-800/60 shrink-0 mt-0.5">
                  <Radio className="w-4 h-4 animate-pulse" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded font-bold bg-blue-900/60 text-blue-300 border border-blue-700/50">
                      {notice.target_room === 'ALL' ? 'GLOBAL NOTICE' : `ROOM ${notice.target_room} NOTICE`}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400">
                      {new Date(notice.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-white leading-relaxed font-sans">
                    {notice.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 3. Bulk Action Toolbar */}
        <QuickActionToolbar
          roomId={roomId}
          dayNumber={settings.current_day || 1}
          buttons={settings.quick_action_buttons || []}
          totalParticipants={totalCount}
          coordinatorName={primaryCoordinator}
          onActionComplete={loadRoomData}
        />

        {/* 4. Classroom Tracker UI (Subtle Row List) */}
        <ClassroomTracker
          roomId={roomId}
          dayNumber={settings.current_day || 1}
          presences={presences}
          onTogglePresence={handleToggleParticipant}
          isUpdatingName={isUpdatingName}
        />
      </main>

      {/* SOS Ping Modal */}
      <PingAdminModal
        isOpen={isPingModalOpen}
        roomId={roomId}
        coordinatorName={primaryCoordinator}
        onClose={() => setIsPingModalOpen(false)}
      />

      {/* Room-scoped Chat Drawer */}
      {isAuthenticated && (
        <ChatDrawer
          mode="room"
          roomId={roomId}
          senderName={primaryCoordinator}
          senderRole="coordinator"
        />
      )}
    </div>
  );
}
