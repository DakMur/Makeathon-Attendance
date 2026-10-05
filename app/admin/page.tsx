'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldAlert,
  ArrowLeft,
  LayoutGrid,
  Radio,
  Sliders,
  History,
  AlertTriangle,
  CheckCircle2,
  Clock,
  KeyRound,
  Users,
  Plus,
  Trash2,
  Save,
  Check,
  RefreshCw,
  Bell,
  Sparkles,
  Eye,
  EyeOff,
  ShieldCheck,
  LogOut,
} from 'lucide-react';
import { PasswordModal } from '@/components/PasswordModal';
import { AdminMonitorGrid } from '@/components/AdminMonitorGrid';
import { NoticeBroadcaster } from '@/components/NoticeBroadcaster';
import { CsvExporter } from '@/components/CsvExporter';
import { RosterManager } from '@/components/RosterManager';
import {
  getSystemSettings,
  updateSystemSetting,
  getAllClassroomPresence,
  getActionLogs,
  getNotices,
  getCoordinatorPings,
  resolveCoordinatorPing,
  getAllCardPasswords,
  updateCardPassword,
  DEFAULT_SETTINGS,
} from '@/lib/dataService';
import {
  SystemSettings,
  ClassroomPresence,
  ClassroomActionLog,
  Notice,
  CoordinatorPing,
} from '@/lib/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

export default function AdminCommandCenterPage() {
  const router = useRouter();

  // Auth guard state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Active Tab: 'monitor' | 'notices' | 'config' | 'audit'
  const [activeTab, setActiveTab] = useState<'monitor' | 'notices' | 'config' | 'audit' | 'roster'>('monitor');

  // Data states
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [presences, setPresences] = useState<ClassroomPresence[]>([]);
  const [actionLogs, setActionLogs] = useState<ClassroomActionLog[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [pings, setPings] = useState<CoordinatorPing[]>([]);
  const [passwords, setPasswords] = useState<Record<string, string>>({});

  // Config tab form states
  const [editingDay, setEditingDay] = useState(1);
  const [editingTurnoverTime, setEditingTurnoverTime] = useState('00:00');
  const [editingButtons, setEditingButtons] = useState<string[]>([]);
  const [newButtonName, setNewButtonName] = useState('');
  const [editingCoordinators, setEditingCoordinators] = useState<Record<string, string>>({});
  const [newPasswordInputs, setNewPasswordInputs] = useState<Record<string, string>>({});
  const [showPasswordVisibility, setShowPasswordVisibility] = useState<Record<string, boolean>>({});
  const [configFeedback, setConfigFeedback] = useState<string | null>(null);
  const [logFilterRoom, setLogFilterRoom] = useState<string>('ALL');

  // Verify auth on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isAuth = localStorage.getItem('auth_card_admin') === 'true';
      if (isAuth) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        setShowPasswordModal(true);
      }
    }
  }, []);

  // Fetch all data
  const loadAdminData = useCallback(async () => {
    try {
      const [sysSettings, passList, logList, noticeList, pingList] = await Promise.all([
        getSystemSettings(),
        getAllCardPasswords(),
        getActionLogs(200),
        getNotices(),
        getCoordinatorPings(),
      ]);

      setSettings(sysSettings);
      setEditingDay(sysSettings.current_day || 1);
      setEditingTurnoverTime(sysSettings.day_turnover_time || '00:00');
      setEditingButtons(sysSettings.quick_action_buttons || []);

      // Format coordinators as comma-separated strings for input
      const coordMap: Record<string, string> = {};
      const rooms = ['401', '402', '403', '404', '405', '406', '407', '408'];
      rooms.forEach((r) => {
        coordMap[r] = (sysSettings.classroom_coordinators[r] || []).join(', ');
      });
      setEditingCoordinators(coordMap);

      setPasswords(passList);
      setActionLogs(logList);
      setNotices(noticeList);
      setPings(pingList);

      // Load presences for active day
      const presList = await getAllClassroomPresence(sysSettings.current_day || 1);
      setPresences(presList);
    } catch (e) {
      console.warn('Error loading admin data:', e);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadAdminData();

    const handleSync = () => loadAdminData();
    window.addEventListener('makeathon_storage_sync', handleSync);

    const pollInterval = setInterval(loadAdminData, 6000);

    // Supabase Realtime for Admin
    let channel: any = null;
    if (isSupabaseConfigured && supabase) {
      channel = supabase
        .channel('admin_command_realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'coordinator_pings' }, () => {
          loadAdminData();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'classroom_presence' }, () => {
          loadAdminData();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'classroom_action_logs' }, () => {
          loadAdminData();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'system_settings' }, () => {
          loadAdminData();
        })
        .subscribe();
    }

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('makeathon_storage_sync', handleSync);
      if (channel && supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [isAuthenticated, loadAdminData]);

  // Handle resolving a coordinator SOS ping
  const handleResolvePing = async (id: number) => {
    try {
      await resolveCoordinatorPing(id);
      setPings((prev) => prev.map((p) => (p.id === id ? { ...p, is_resolved: true } : p)));
    } catch (e) {
      console.error('Resolve ping error:', e);
    }
  };

  // Handle saving Day Turnover Settings
  const handleSaveTurnoverSettings = async () => {
    try {
      await updateSystemSetting('current_day', Number(editingDay));
      await updateSystemSetting('day_turnover_time', editingTurnoverTime.trim());
      setConfigFeedback('Day turnover settings successfully saved!');
      loadAdminData();
      setTimeout(() => setConfigFeedback(null), 3000);
    } catch (err) {
      console.error('Save turnover settings error:', err);
    }
  };

  // Handle Action Buttons Manager
  const handleAddButton = () => {
    if (!newButtonName.trim()) return;
    const updated = [...editingButtons, newButtonName.trim()];
    setEditingButtons(updated);
    setNewButtonName('');
  };

  const handleRemoveButton = (idx: number) => {
    setEditingButtons(editingButtons.filter((_, i) => i !== idx));
  };

  const handleSaveButtons = async () => {
    try {
      await updateSystemSetting('quick_action_buttons', editingButtons);
      setConfigFeedback('Action buttons updated successfully!');
      loadAdminData();
      setTimeout(() => setConfigFeedback(null), 3000);
    } catch (err) {
      console.error('Save buttons error:', err);
    }
  };

  // Handle saving Coordinators
  const handleSaveCoordinators = async () => {
    try {
      const parsed: Record<string, string[]> = {};
      Object.entries(editingCoordinators).forEach(([room, namesStr]) => {
        parsed[room] = namesStr
          .split(',')
          .map((n) => n.trim())
          .filter(Boolean);
      });
      await updateSystemSetting('classroom_coordinators', parsed);
      setConfigFeedback('Coordinator assignments saved!');
      loadAdminData();
      setTimeout(() => setConfigFeedback(null), 3000);
    } catch (err) {
      console.error('Save coordinators error:', err);
    }
  };

  // Handle updating route passcodes
  const handleUpdatePassword = async (cardId: string) => {
    const newPass = newPasswordInputs[cardId];
    if (!newPass || !newPass.trim()) return;
    try {
      await updateCardPassword(cardId, newPass.trim());
      setPasswords((prev) => ({ ...prev, [cardId]: newPass.trim() }));
      setNewPasswordInputs((prev) => ({ ...prev, [cardId]: '' }));
      setConfigFeedback(`Passcode for ${cardId.toUpperCase()} updated!`);
      setTimeout(() => setConfigFeedback(null), 3000);
    } catch (err) {
      console.error('Update password error:', err);
    }
  };

  // Revoke all active coordinator sessions (forces re-auth on all devices)
  const handleRevokeAllSessions = () => {
    if (typeof window !== 'undefined') {
      const cardIds = ['admin', 'checkin', '401', '402', '403', '404', '405', '406', '407', '408'];
      cardIds.forEach((id) => localStorage.removeItem(`auth_card_${id}`));
      // Re-grant admin's own session so they aren't kicked out
      localStorage.setItem('auth_card_admin', 'true');
      setConfigFeedback('All coordinator sessions revoked — they must re-authenticate on next visit.');
      setTimeout(() => setConfigFeedback(null), 4000);
    }
  };

  const handleAdminSignOut = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_card_admin');
    }
    router.push('/');
  };

  if (isAuthenticated === false) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
        <PasswordModal
          isOpen={showPasswordModal}
          cardId="admin"
          cardTitle="Admin Command Center"
          onSuccess={() => {
            setIsAuthenticated(true);
            setShowPasswordModal(false);
          }}
          onClose={() => router.push('/')}
        />
      </div>
    );
  }

  const unresolvedPings = pings.filter((p) => !p.is_resolved);
  const filteredActionLogs =
    logFilterRoom === 'ALL'
      ? actionLogs
      : actionLogs.filter((l) => l.classroom_id === logFilterRoom);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-black/90 backdrop-blur-md border-b border-zinc-800 px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Back & Title */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
              title="Return to Operations Hub"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-950/80 border border-blue-600/50 flex items-center justify-center text-blue-400 shadow-inner">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold text-white tracking-tight">
                    Admin Command Center
                  </h1>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800/60 font-semibold">
                    DAY {settings.current_day}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 font-mono">
                  Multi-room real-time coordination & event telemetry
                </p>
              </div>
            </div>
          </div>

          {/* SOS Alert Counter Badge */}
          <div className="flex items-center gap-2">
            {unresolvedPings.length > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-950/80 border border-red-500/60 text-red-400 text-xs font-mono font-bold animate-pulse shadow-lg">
                <AlertTriangle className="w-4 h-4" />
                <span>{unresolvedPings.length} ACTIVE SOS PING(S)</span>
              </div>
            )}
            <button
              type="button"
              onClick={loadAdminData}
              className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
              title="Refresh Telemetry"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleAdminSignOut}
              className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-red-400 transition-colors"
              title="Sign out of Admin Command Center"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* SOS Alert Notification Hub (Pops up when active pings exist) */}
      {unresolvedPings.length > 0 && (
        <div className="bg-red-950/40 border-b border-red-500/40 px-4 py-3">
          <div className="max-w-7xl mx-auto space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-red-400 tracking-wider">
              <Bell className="w-4 h-4 animate-bounce" />
              <span>High Priority Coordinator Alerts ({unresolvedPings.length}):</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {unresolvedPings.map((ping) => (
                <div
                  key={ping.id}
                  className="rounded-lg border border-red-500/50 bg-[#0d0404] p-3 flex items-start justify-between gap-3 shadow-md"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-red-900/80 text-white">
                        ROOM {ping.classroom_id}
                      </span>
                      <span className="text-xs font-semibold text-white">
                        {ping.coordinator_name}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400">
                        {new Date(ping.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-red-200 font-sans">{ping.message}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => ping.id && handleResolvePing(ping.id)}
                    className="shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium bg-emerald-950 hover:bg-emerald-900 text-emerald-400 border border-emerald-600/50 transition-colors"
                  >
                    Mark Resolved
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Command Center Tabs Bar */}
      <div className="border-b border-zinc-800 bg-zinc-950/60 px-4">
        <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto py-2">
          <button
            type="button"
            onClick={() => setActiveTab('monitor')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono font-medium transition-all ${
              activeTab === 'monitor'
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Tab 1: Live 8-Room Monitor</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('notices')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono font-medium transition-all ${
              activeTab === 'notices'
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Tab 2: Notice Broadcaster</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono font-medium transition-all ${
              activeTab === 'config'
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Tab 3: Dynamic No-Code Settings</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono font-medium transition-all ${
              activeTab === 'audit'
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Tab 4: Master Timeline & Audit</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('roster')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono font-medium transition-all ${
              activeTab === 'roster'
                ? 'bg-violet-600 text-white shadow-xs font-bold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Tab 5: Roster Management</span>
          </button>
        </div>
      </div>

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 space-y-6">
        {/* ========================================================================= */}
        {/* TAB 1: LIVE 8-ROOM MONITOR */}
        {/* ========================================================================= */}
        {activeTab === 'monitor' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <div>
                <h2 className="text-sm font-semibold text-white">
                  Live Multi-Classroom Status (Rooms 401–408)
                </h2>
                <p className="text-xs text-zinc-400">
                  Instant telemetry of all participants across all 8 venues
                </p>
              </div>
              <div className="text-xs font-mono text-zinc-400">
                Total Tracked Participants:{' '}
                <span className="text-white font-bold">{presences.length}</span>
              </div>
            </div>

            <AdminMonitorGrid
              presences={presences}
              coordinators={settings.classroom_coordinators || {}}
              dayNumber={settings.current_day || 1}
            />
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: NOTICE & ANNOUNCEMENT BROADCASTER */}
        {/* ========================================================================= */}
        {activeTab === 'notices' && (
          <NoticeBroadcaster notices={notices} onRefresh={loadAdminData} />
        )}

        {/* ========================================================================= */}
        {/* TAB 3: DYNAMIC NO-CODE CONFIGURATION */}
        {/* ========================================================================= */}
        {activeTab === 'config' && (
          <div className="space-y-6">
            {configFeedback && (
              <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs font-mono flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{configFeedback}</span>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 1. Day Turnover Engine Settings */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-5 shadow-xl space-y-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <h3 className="text-sm font-semibold text-white">
                    Automatic Day Turnover Engine
                  </h3>
                </div>
                <p className="text-xs text-zinc-400">
                  When current time reaches turnover hour, the system automatically advances
                  active day and maintains historical presence logs.
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">
                      Active Event Day
                    </label>
                    <select
                      value={editingDay}
                      onChange={(e) => setEditingDay(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs font-mono bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-hidden focus:border-blue-500"
                    >
                      <option value={1}>Day 1 (Oct 7)</option>
                      <option value={2}>Day 2 (Oct 8)</option>
                      <option value={3}>Day 3 (Oct 9)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">
                      Turnover Time (HH:mm)
                    </label>
                    <input
                      type="text"
                      value={editingTurnoverTime}
                      onChange={(e) => setEditingTurnoverTime(e.target.value)}
                      placeholder="00:00"
                      className="w-full px-3 py-2 text-xs font-mono bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSaveTurnoverSettings}
                  className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Turnover Configuration
                </button>
              </div>

              {/* 2. Bulk Action Buttons Manager */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-5 shadow-xl space-y-4">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-semibold text-white">
                    Bulk Movement Buttons Manager
                  </h3>
                </div>
                <p className="text-xs text-zinc-400">
                  Manage the bulk meal and event action buttons displayed inside all 8 classroom
                  trackers.
                </p>

                {/* Current Buttons */}
                <div className="flex flex-wrap gap-2">
                  {editingButtons.map((btn, idx) => (
                    <div
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-medium text-zinc-200"
                    >
                      <span>{btn}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveButton(idx)}
                        className="text-zinc-500 hover:text-red-400 p-0.5 rounded transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add new button */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newButtonName}
                    onChange={(e) => setNewButtonName(e.target.value)}
                    placeholder="New button name (e.g. Midnight Snack)..."
                    className="flex-1 px-3 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-hidden focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddButton}
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-white inline-flex items-center gap-1 border border-zinc-700"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleSaveButtons}
                  className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Action Buttons
                </button>
              </div>

              {/* 3. Route Password Manager (10 Cards) */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-5 shadow-xl space-y-4">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-semibold text-white">
                    Passcode Guard Manager (10 Routes)
                  </h3>
                </div>
                <p className="text-xs text-zinc-400">
                  Update access passcodes for Admin, Check-In, and Classrooms 401–408.
                </p>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {['admin', 'checkin', '401', '402', '403', '404', '405', '406', '407', '408'].map(
                    (cardId) => (
                      <div
                        key={cardId}
                        className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800"
                      >
                        <div className="w-28 shrink-0">
                          <span className="text-xs font-mono font-bold text-white uppercase flex items-center gap-1.5">
                            {cardId}
                          </span>
                          <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 mt-0.5">
                            <ShieldCheck className="w-3 h-3 text-emerald-400" />
                            <span>Protected</span>
                          </span>
                        </div>

                        <div className="flex-1 relative flex items-center">
                          <input
                            type={showPasswordVisibility[cardId] ? 'text' : 'password'}
                            value={newPasswordInputs[cardId] || ''}
                            onChange={(e) =>
                              setNewPasswordInputs((prev) => ({
                                ...prev,
                                [cardId]: e.target.value,
                              }))
                            }
                            placeholder="Set new passcode..."
                            className="w-full pr-8 px-2.5 py-1 text-xs font-mono bg-zinc-950 border border-zinc-800 rounded text-white placeholder-zinc-600 focus:outline-hidden focus:border-amber-500"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowPasswordVisibility((prev) => ({
                                ...prev,
                                [cardId]: !prev[cardId],
                              }))
                            }
                            className="absolute right-2 text-zinc-500 hover:text-zinc-300 p-0.5"
                            title={showPasswordVisibility[cardId] ? 'Hide' : 'Show'}
                          >
                            {showPasswordVisibility[cardId] ? (
                              <EyeOff className="w-3.5 h-3.5" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleUpdatePassword(cardId)}
                          disabled={!newPasswordInputs[cardId]?.trim()}
                          className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-mono font-medium disabled:opacity-30 transition-colors shrink-0"
                        >
                          Update
                        </button>
                      </div>
                    )
                  )}
                </div>

                {/* Revoke All Sessions control */}
                <div className="pt-3 border-t border-zinc-900 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-300">Coordinator Sessions</h4>
                    <p className="text-[11px] text-zinc-500">Revoke stored browser auth tokens</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRevokeAllSessions}
                    className="px-3 py-1.5 rounded-lg bg-red-950/80 hover:bg-red-900 border border-red-800/60 text-red-300 hover:text-red-200 text-xs font-mono font-medium transition-colors inline-flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Revoke All Sessions
                  </button>
                </div>
              </div>

              {/* 4. Classroom Coordinator Assignments */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-5 shadow-xl space-y-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-400" />
                  <h3 className="text-sm font-semibold text-white">
                    Coordinator Room Assignments
                  </h3>
                </div>
                <p className="text-xs text-zinc-400">
                  Assign coordinators to each classroom (comma-separated names).
                </p>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {['401', '402', '403', '404', '405', '406', '407', '408'].map((r) => (
                    <div
                      key={r}
                      className="flex items-center gap-3 p-2 rounded-lg bg-zinc-900/60 border border-zinc-800"
                    >
                      <span className="w-16 text-xs font-mono font-bold text-white">
                        Room {r}:
                      </span>
                      <input
                        type="text"
                        value={editingCoordinators[r] || ''}
                        onChange={(e) =>
                          setEditingCoordinators((prev) => ({ ...prev, [r]: e.target.value }))
                        }
                        placeholder="Coordinator names..."
                        className="flex-1 px-2.5 py-1 text-xs bg-zinc-950 border border-zinc-800 rounded text-white focus:outline-hidden focus:border-purple-500 font-sans"
                      />
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleSaveCoordinators}
                  className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-sm transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Coordinator Assignments
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: MASTER TIMELINE & AUDIT LOGS */}
        {/* ========================================================================= */}
        {activeTab === 'audit' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-800">
              <div>
                <h2 className="text-sm font-semibold text-white">
                  Classroom Movement Audit Timeline
                </h2>
                <p className="text-xs text-zinc-400">
                  Timestamped records of bulk exits, meal breaks, and manual overrides
                </p>
              </div>

              {/* Master CSV Exporter */}
              <CsvExporter
                presences={presences}
                actionLogs={actionLogs}
              />
            </div>

            {/* Room Filter Selector */}
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-zinc-500 uppercase">Filter Room:</span>
              {['ALL', '401', '402', '403', '404', '405', '406', '407', '408'].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setLogFilterRoom(r)}
                  className={`px-2 py-1 rounded text-xs transition-colors ${
                    logFilterRoom === r
                      ? 'bg-blue-600 text-white font-bold'
                      : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {/* Audit Logs List */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 overflow-hidden shadow-xl">
              <div className="grid grid-cols-12 px-4 py-2.5 bg-zinc-900/80 border-b border-zinc-800 text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                <div className="col-span-3">Timestamp</div>
                <div className="col-span-2">Classroom</div>
                <div className="col-span-3">Action Event</div>
                <div className="col-span-2">Affected Count</div>
                <div className="col-span-2 text-right">Executor</div>
              </div>

              <div className="divide-y divide-zinc-800/60 max-h-[550px] overflow-y-auto">
                {filteredActionLogs.length === 0 ? (
                  <div className="py-12 text-center text-xs font-mono text-zinc-500">
                    No movement logs recorded for selected room.
                  </div>
                ) : (
                  filteredActionLogs.map((log) => (
                    <div
                      key={log.id}
                      className="grid grid-cols-12 px-4 py-3 text-xs font-mono hover:bg-zinc-900/40 transition-colors items-center"
                    >
                      <div className="col-span-3 text-zinc-400">
                        {new Date(log.created_at).toLocaleString()}
                      </div>
                      <div className="col-span-2">
                        <span className="px-2 py-0.5 rounded font-bold bg-zinc-900 border border-zinc-800 text-white">
                          R-{log.classroom_id}
                        </span>
                      </div>
                      <div className="col-span-3 font-semibold text-zinc-200">
                        {log.action_type}
                      </div>
                      <div className="col-span-2 text-zinc-300">
                        <span className="text-red-400 font-bold">{log.affected_count}</span>{' '}
                        participants
                      </div>
                      <div className="col-span-2 text-right text-zinc-400 truncate">
                        {log.executed_by || 'coordinator'}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: ROSTER MANAGEMENT (Classrooms, Teams, Participants)               */}
        {/* ========================================================================= */}
        {activeTab === 'roster' && (
          <RosterManager />
        )}
      </main>
    </div>
  );
}
