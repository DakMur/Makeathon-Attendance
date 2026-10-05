'use client';

import React, { useState } from 'react';
import { Notice } from '@/lib/types';
import {
  Send,
  Bell,
  Trash2,
  CheckCircle2,
  Eye,
  EyeOff,
  Radio,
  Loader2,
  MessageSquare,
} from 'lucide-react';
import {
  createNotice,
  toggleNoticeActive,
  deleteNotice,
} from '@/lib/dataService';

interface NoticeBroadcasterProps {
  notices: Notice[];
  onRefresh: () => void;
}

const TEMPLATES = [
  'Lunch is being served at the ground floor Cafeteria.',
  'Mentoring round begins in 15 minutes. Ensure all members are present.',
  'Wi-Fi credentials refreshed: SSID: MakeathonGuest | Pass: hack2026',
  'Please submit project repository links by 18:00.',
  'Snack break and coffee are now available outside Room 404.',
];

export function NoticeBroadcaster({ notices, onRefresh }: NoticeBroadcasterProps) {
  const [targetRoom, setTargetRoom] = useState('ALL');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const rooms = ['ALL', '401', '402', '403', '404', '405', '406', '407', '408'];

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSending(true);
    try {
      await createNotice(targetRoom, message.trim());
      setMessage('');
      setActionSuccess(`Notice broadcasted to ${targetRoom === 'ALL' ? 'ALL Rooms' : `Room ${targetRoom}`}`);
      onRefresh();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to create notice:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleToggleActive = async (id: number, currentActive: boolean) => {
    try {
      await toggleNoticeActive(id, !currentActive);
      onRefresh();
    } catch (err) {
      console.error('Toggle notice active error:', err);
    }
  };

  const handleDeleteNotice = async (id: number) => {
    try {
      await deleteNotice(id);
      onRefresh();
    } catch (err) {
      console.error('Delete notice error:', err);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Broadcast Creation Form (5 cols) */}
      <div className="lg:col-span-5 rounded-xl border border-zinc-800 bg-zinc-950/80 p-5 shadow-xl">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-lg bg-blue-950/80 border border-blue-600/40 flex items-center justify-center text-blue-400">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Broadcast Announcement</h3>
            <p className="text-xs text-zinc-400">Transmit real-time notice to room headers</p>
          </div>
        </div>

        <form onSubmit={handleBroadcast} className="space-y-4">
          <div>
            <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1.5">
              Target Destination
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
              {rooms.map((room) => (
                <button
                  key={room}
                  type="button"
                  onClick={() => setTargetRoom(room)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-mono font-medium transition-all ${
                    targetRoom === room
                      ? 'bg-blue-600 text-white shadow-xs font-bold'
                      : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800'
                  }`}
                >
                  {room === 'ALL' ? '🌐 ALL' : `R-${room}`}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1.5">
              Announcement Content
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type urgent instructions or general updates..."
              rows={4}
              required
              className="w-full px-3 py-2 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-hidden focus:border-blue-500 resize-none font-sans"
            />
          </div>

          <div>
            <span className="block text-[10px] font-mono uppercase text-zinc-500 mb-1.5">
              Templates:
            </span>
            <div className="space-y-1">
              {TEMPLATES.slice(0, 3).map((tpl, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setMessage(tpl)}
                  className="w-full text-left text-[11px] px-2.5 py-1 rounded bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800/80 text-zinc-400 hover:text-zinc-200 transition-colors truncate"
                >
                  &quot;{tpl}&quot;
                </button>
              ))}
            </div>
          </div>

          {actionSuccess && (
            <div className="flex items-center gap-2 p-2 rounded bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs font-mono">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>{actionSuccess}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSending || !message.trim()}
            className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-colors disabled:opacity-50"
          >
            {isSending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Broadcasting...
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                Broadcast to {targetRoom === 'ALL' ? 'ALL Rooms' : `Room ${targetRoom}`}
              </>
            )}
          </button>
        </form>
      </div>

      {/* Active & Past Notices List (7 cols) */}
      <div className="lg:col-span-7 rounded-xl border border-zinc-800 bg-zinc-950/80 p-5 shadow-xl flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-3">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-zinc-400" />
            <h3 className="text-sm font-semibold text-white">Broadcast History & Status</h3>
          </div>
          <span className="text-xs font-mono text-zinc-500">
            {notices.length} Total Logs
          </span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[480px] pr-1">
          {notices.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-xs font-mono">
              No notices broadcasted yet. Send your first announcement.
            </div>
          ) : (
            notices.map((notice) => (
              <div
                key={notice.id}
                className={`p-3 rounded-lg border transition-all ${
                  notice.is_active
                    ? 'bg-zinc-900/60 border-zinc-700/80 ring-1 ring-blue-500/20'
                    : 'bg-zinc-950/40 border-zinc-900 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                        notice.target_room === 'ALL'
                          ? 'bg-blue-950 text-blue-400 border border-blue-800/50'
                          : 'bg-amber-950 text-amber-400 border border-amber-800/50'
                      }`}
                    >
                      {notice.target_room === 'ALL' ? 'GLOBAL (ALL)' : `ROOM ${notice.target_room}`}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                        notice.is_active
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                          : 'bg-zinc-900 text-zinc-500'
                      }`}
                    >
                      {notice.is_active ? 'PINNED' : 'INACTIVE'}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500">
                      {new Date(notice.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => notice.id && handleToggleActive(notice.id, notice.is_active)}
                      className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                      title={notice.is_active ? 'Deactivate (Hide)' : 'Activate (Show)'}
                    >
                      {notice.is_active ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => notice.id && handleDeleteNotice(notice.id)}
                      className="p-1 rounded text-red-400 hover:text-red-300 hover:bg-red-950/50 transition-colors"
                      title="Delete notice"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-zinc-200 mt-1 whitespace-pre-wrap font-sans">
                  {notice.message}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
