'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Wrench,
  Plus,
  LogIn,
  LogOut,
  Clock,
  Search,
  Trash2,
  CheckCircle2,
  CircleDot,
  Loader2,
  X,
  AlertTriangle,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { PasswordModal } from '@/components/PasswordModal';
import { getMakerspaceLogs, checkInMakerspace, checkOutMakerspace, deleteMakerspaceLog } from '@/lib/dataService';
import { MakerspaceLog } from '@/lib/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

// ── helpers ──────────────────────────────────────────────────────────────────

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function fmtDuration(start: string, end?: string | null): string {
  const ms = (end ? new Date(end) : new Date()).getTime() - new Date(start).getTime();
  const totalMins = Math.floor(ms / 60000);
  if (totalMins < 60) return `${totalMins}m`;
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return `${h}h ${m}m`;
}

// ── Modal ────────────────────────────────────────────────────────────────────

interface CheckInModalProps {
  onClose: () => void;
  onConfirm: (teamName: string, personName: string, resource: string, notes: string) => Promise<void>;
  isSubmitting: boolean;
}

function CheckInModal({ onClose, onConfirm, isSubmitting }: CheckInModalProps) {
  const [teamName, setTeamName] = useState('');
  const [personName, setPersonName] = useState('');
  const [resource, setResource] = useState('');
  const [notes, setNotes] = useState('');
  const firstRef = useRef<HTMLInputElement>(null);

  useEffect(() => { firstRef.current?.focus(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim() || !personName.trim() || !resource.trim()) return;
    await onConfirm(teamName, personName, resource, notes);
  };

  const isValid = teamName.trim() && personName.trim() && resource.trim();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md bg-[#0d0d10] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-700/50 flex items-center justify-center">
              <LogIn className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">New Check-In</h3>
              <p className="text-[10px] text-zinc-500 font-mono">Makerspace entry log</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Team Name */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wide">
              Team Name <span className="text-red-400">*</span>
            </label>
            <input
              ref={firstRef}
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="e.g. QuadraAI"
              maxLength={80}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/30 transition-colors font-mono"
            />
          </div>

          {/* Member Name */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wide">
              Member Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              placeholder="e.g. Meghana M"
              maxLength={80}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/30 transition-colors font-mono"
            />
          </div>

          {/* Resource Requested */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wide">
              Resource / Tool Requested <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={resource}
              onChange={(e) => setResource(e.target.value)}
              placeholder="e.g. 3D Printer, Soldering Station, Laser Cutter"
              maxLength={120}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/30 transition-colors font-mono"
            />
          </div>

          {/* Notes (optional) */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wide">
              Notes <span className="text-zinc-600">(optional)</span>
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes"
              maxLength={200}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-700 transition-colors font-mono"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-xl border border-zinc-800 text-sm text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="flex-1 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Logging...</>
              ) : (
                <><LogIn className="w-4 h-4" /> Check In</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function MakerspacePage() {
  const router = useRouter();

  // Auth
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Data
  const [logs, setLogs] = useState<MakerspaceLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // UI
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'checked_in' | 'checked_out'>('all');
  const [checkingOutId, setCheckingOutId] = useState<number | string | null>(null);
  const [deletingId, setDeletingId] = useState<number | string | null>(null);

  // Auth check
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const makerAuth = localStorage.getItem('auth_card_makerspace') === 'true';
      const adminAuth = localStorage.getItem('auth_card_admin') === 'true';
      if (makerAuth || adminAuth) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        setShowPasswordModal(true);
      }
    }
  }, []);

  // Load logs
  const loadLogs = useCallback(async () => {
    try {
      const data = await getMakerspaceLogs();
      setLogs(data);
    } catch (e) {
      console.warn('Error loading makerspace logs:', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Supabase realtime
  useEffect(() => {
    if (!isAuthenticated) return;
    loadLogs();

    let channel: any = null;
    if (isSupabaseConfigured && supabase) {
      channel = supabase
        .channel('makerspace_realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'makerspace_logs' }, () => {
          loadLogs();
        })
        .subscribe();
    }

    return () => {
      if (channel && supabase) supabase.removeChannel(channel);
    };
  }, [isAuthenticated, loadLogs]);

  // Actions
  const handleCheckIn = async (
    teamName: string,
    personName: string,
    resource: string,
    notes: string
  ) => {
    setIsSubmitting(true);
    try {
      const newLog = await checkInMakerspace(teamName, personName, resource, notes);
      setLogs((prev) => [newLog, ...prev]);
      setShowCheckInModal(false);
    } catch (e) {
      console.warn('Check-in error:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckOut = async (logId: number | string) => {
    setCheckingOutId(logId);
    try {
      await checkOutMakerspace(logId);
      setLogs((prev) =>
        prev.map((l) =>
          l.id === logId
            ? { ...l, status: 'checked_out', check_out_time: new Date().toISOString() }
            : l
        )
      );
    } catch (e) {
      console.warn('Check-out error:', e);
    } finally {
      setCheckingOutId(null);
    }
  };

  const handleDelete = async (logId: number | string) => {
    if (!confirm('Delete this log entry?')) return;
    setDeletingId(logId);
    try {
      await deleteMakerspaceLog(logId);
      setLogs((prev) => prev.filter((l) => l.id !== logId));
    } catch (e) {
      console.warn('Delete error:', e);
    } finally {
      setDeletingId(null);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadLogs();
  };

  // Filtered logs
  const filteredLogs = logs.filter((l) => {
    const matchStatus = filterStatus === 'all' || l.status === filterStatus;
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      l.team_name.toLowerCase().includes(q) ||
      l.person_name.toLowerCase().includes(q) ||
      l.resource_requested.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const activeCount = logs.filter((l) => l.status === 'checked_in').length;
  const totalToday = logs.length;

  // ── Auth gate ────────────────────────────────────────────────────────────

  if (isAuthenticated === false) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <PasswordModal
          isOpen={showPasswordModal}
          cardId="makerspace"
          cardTitle="Makerspace Check-In"
          onSuccess={() => {
            setIsAuthenticated(true);
            setShowPasswordModal(false);
          }}
          onClose={() => router.push('/')}
        />
      </div>
    );
  }

  // ── Main render ──────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-black/90 backdrop-blur-md border-b border-zinc-800 px-4 py-3">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Left */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-violet-950/60 border border-violet-700/50 flex items-center justify-center shadow-inner">
                <Wrench className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <h1 className="text-base font-bold text-white tracking-tight">Makerspace Check-In</h1>
                <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Resource allocation & live session log</p>
              </div>
            </div>
          </div>

          {/* Right: Stats + actions */}
          <div className="flex items-center gap-2.5">
            {/* Active count */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/50 border border-emerald-800/50 text-emerald-400 text-xs font-mono font-bold">
              <Zap className="w-3.5 h-3.5 animate-pulse" />
              <span>{activeCount} ACTIVE</span>
            </div>

            {/* Refresh */}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              title="Refresh logs"
              className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors disabled:opacity-40"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>

            {/* Check In button */}
            <button
              type="button"
              onClick={() => setShowCheckInModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-md shadow-emerald-950/50 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Check In
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 space-y-4">

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3.5 flex flex-col gap-1">
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">Currently In</p>
            <p className="text-2xl font-bold text-emerald-400 font-mono">{activeCount}</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3.5 flex flex-col gap-1">
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">Total Sessions</p>
            <p className="text-2xl font-bold text-white font-mono">{totalToday}</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3.5 flex flex-col gap-1">
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">Checked Out</p>
            <p className="text-2xl font-bold text-zinc-400 font-mono">{totalToday - activeCount}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search team, member, resource…"
              className="w-full pl-8 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors font-mono"
            />
          </div>

          {/* Status filter */}
          {(['all', 'checked_in', 'checked_out'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilterStatus(f)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-mono font-semibold transition-all ${
                filterStatus === f
                  ? f === 'checked_in'
                    ? 'bg-emerald-600 text-white'
                    : f === 'checked_out'
                    ? 'bg-zinc-600 text-white'
                    : 'bg-blue-600 text-white'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              {f === 'all' ? 'All' : f === 'checked_in' ? '● Active' : '○ Checked Out'}
            </button>
          ))}
        </div>

        {/* Log Table */}
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/40 overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_1fr_1.5fr_auto_auto] gap-3 px-4 py-2.5 bg-zinc-900/60 border-b border-zinc-800 text-[10px] font-mono font-semibold text-zinc-500 uppercase tracking-wider">
            <span>Team</span>
            <span>Member</span>
            <span>Resource</span>
            <span>Time / Duration</span>
            <span>Actions</span>
          </div>

          {/* Rows */}
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 text-zinc-600 animate-spin" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-zinc-600 text-xs font-mono gap-2">
              <Wrench className="w-7 h-7 opacity-30" />
              {searchQuery || filterStatus !== 'all' ? 'No matching entries' : 'No sessions yet — click "Check In" to start'}
            </div>
          ) : (
            filteredLogs.map((log) => {
              const isActive = log.status === 'checked_in';
              const isCheckingThisOut = checkingOutId === log.id;
              const isDeletingThis = deletingId === log.id;

              return (
                <div
                  key={log.id}
                  className={`grid grid-cols-[1fr_1fr_1.5fr_auto_auto] gap-3 px-4 py-3 border-b border-zinc-900/80 items-center transition-colors ${
                    isActive ? 'bg-emerald-950/10 hover:bg-emerald-950/20' : 'hover:bg-zinc-900/30'
                  }`}
                >
                  {/* Team */}
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{log.team_name}</p>
                  </div>

                  {/* Member */}
                  <div className="min-w-0">
                    <p className="text-xs text-zinc-300 truncate font-mono">{log.person_name}</p>
                  </div>

                  {/* Resource */}
                  <div className="min-w-0">
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-violet-950/60 text-violet-300 border border-violet-800/40 truncate max-w-full">
                      <Wrench className="w-2.5 h-2.5 shrink-0" />
                      <span className="truncate">{log.resource_requested}</span>
                    </span>
                    {log.notes && (
                      <p className="text-[10px] text-zinc-600 truncate mt-0.5 font-mono">{log.notes}</p>
                    )}
                  </div>

                  {/* Time */}
                  <div className="text-right whitespace-nowrap">
                    <div className="flex items-center gap-1.5 justify-end">
                      {isActive ? (
                        <CircleDot className="w-3 h-3 text-emerald-400 animate-pulse shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-3 h-3 text-zinc-500 shrink-0" />
                      )}
                      <span className={`text-[10px] font-mono font-semibold ${isActive ? 'text-emerald-400' : 'text-zinc-500'}`}>
                        {isActive ? 'IN' : 'OUT'}
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                      {fmtTime(log.check_in_time)}
                      {!isActive && log.check_out_time && ` → ${fmtTime(log.check_out_time)}`}
                    </p>
                    <p className="text-[10px] text-zinc-600 font-mono">
                      <Clock className="w-2.5 h-2.5 inline mr-0.5" />
                      {fmtDuration(log.check_in_time, log.check_out_time)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 justify-end">
                    {isActive && (
                      <button
                        type="button"
                        onClick={() => handleCheckOut(log.id)}
                        disabled={isCheckingThisOut}
                        title="Check Out"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-mono font-semibold transition-colors disabled:opacity-40"
                      >
                        {isCheckingThisOut ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <LogOut className="w-3 h-3" />
                        )}
                        <span>Out</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(log.id)}
                      disabled={isDeletingThis}
                      title="Delete log"
                      className="p-1.5 rounded-lg hover:bg-red-950/60 text-zinc-600 hover:text-red-400 transition-colors disabled:opacity-40"
                    >
                      {isDeletingThis ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Check In Modal */}
      {showCheckInModal && (
        <CheckInModal
          onClose={() => setShowCheckInModal(false)}
          onConfirm={handleCheckIn}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}
