'use client';

import React, { useState } from 'react';
import {
  Coffee,
  Utensils,
  Moon,
  Cookie,
  Calendar,
  LogOut,
  LogIn,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { bulkSetRoomPresence } from '@/lib/dataService';

interface QuickActionToolbarProps {
  roomId: string;
  dayNumber: number;
  buttons: string[];
  totalParticipants: number;
  coordinatorName?: string;
  onActionComplete: () => void;
}

export function QuickActionToolbar({
  roomId,
  dayNumber,
  buttons,
  totalParticipants,
  coordinatorName = 'Room Coordinator',
  onActionComplete,
}: QuickActionToolbarProps) {
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isReturningAll, setIsReturningAll] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const getActionIcon = (action: string) => {
    const lower = action.toLowerCase();
    if (lower.includes('break')) return <Coffee className="w-3.5 h-3.5" />;
    if (lower.includes('lunch') || lower.includes('food')) return <Utensils className="w-3.5 h-3.5" />;
    if (lower.includes('dinner')) return <Moon className="w-3.5 h-3.5" />;
    if (lower.includes('snack')) return <Cookie className="w-3.5 h-3.5" />;
    if (lower.includes('event')) return <Calendar className="w-3.5 h-3.5" />;
    return <LogOut className="w-3.5 h-3.5" />;
  };

  const handleExecuteBulkExit = async () => {
    if (!selectedAction) return;

    setIsProcessing(true);
    try {
      const res = await bulkSetRoomPresence(
        roomId,
        dayNumber,
        false, // OUT
        selectedAction,
        coordinatorName
      );
      setFeedback(`Marked ${res.affectedCount} participants OUT for ${selectedAction}`);
      setSelectedAction(null);
      onActionComplete();
      setTimeout(() => setFeedback(null), 3500);
    } catch (err) {
      console.error('Bulk exit error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkReturnAll = async () => {
    setIsProcessing(true);
    try {
      const res = await bulkSetRoomPresence(
        roomId,
        dayNumber,
        true, // IN
        'Returned to Room',
        coordinatorName
      );
      setFeedback(`All ${res.affectedCount} participants marked IN`);
      setIsReturningAll(false);
      onActionComplete();
      setTimeout(() => setFeedback(null), 3500);
    } catch (err) {
      console.error('Bulk return error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-zinc-950/90 border border-zinc-800/80 rounded-xl p-3 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Section Label */}
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
            Bulk Movement Toolbar:
          </span>
        </div>

        {/* Middle: Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {buttons.map((action) => (
            <button
              key={action}
              type="button"
              onClick={() => setSelectedAction(action)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-900 hover:bg-zinc-800 hover:text-white border border-zinc-800 hover:border-zinc-700 rounded-lg transition-colors shadow-xs active:scale-95"
            >
              {getActionIcon(action)}
              <span>{action} Exit</span>
            </button>
          ))}

          {/* Quick Return Button */}
          <button
            type="button"
            onClick={() => setIsReturningAll(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-400 bg-emerald-950/40 hover:bg-emerald-950/70 border border-emerald-800/50 hover:border-emerald-600 rounded-lg transition-colors shadow-xs active:scale-95"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Mark All IN</span>
          </button>
        </div>
      </div>

      {/* Temporary Success Feedback */}
      {feedback && (
        <div className="mt-2.5 px-3 py-1.5 text-xs font-mono bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 rounded-md flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Confirmation Modal for Bulk Exit */}
      {selectedAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm rounded-xl border border-zinc-800 bg-[#0c0c0e] p-5 shadow-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-amber-950/80 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">
                  Bulk Exit: {selectedAction}
                </h4>
                <p className="text-xs text-zinc-400">
                  Mark all room participants as OUT
                </p>
              </div>
            </div>

            <p className="text-xs text-zinc-300 mb-4 bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800/60 font-mono">
              This will toggle all {totalParticipants} participants in Room {roomId} to{' '}
              <span className="text-red-400 font-bold">OUT</span> for{' '}
              <span className="text-white font-bold">{selectedAction}</span> and log the event with timestamps.
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedAction(null)}
                disabled={isProcessing}
                className="flex-1 px-3 py-2 text-xs font-medium text-zinc-400 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteBulkExit}
                disabled={isProcessing}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-lg disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Updating...
                  </>
                ) : (
                  `Confirm ${selectedAction}`
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Bulk Return */}
      {isReturningAll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm rounded-xl border border-zinc-800 bg-[#0c0c0e] p-5 shadow-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <LogIn className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">
                  Bulk Return: All IN
                </h4>
                <p className="text-xs text-zinc-400">
                  Mark all room participants as IN
                </p>
              </div>
            </div>

            <p className="text-xs text-zinc-300 mb-4 bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800/60 font-mono">
              Set all {totalParticipants} participants in Room {roomId} to{' '}
              <span className="text-emerald-400 font-bold">IN (Present)</span>.
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsReturningAll(false)}
                disabled={isProcessing}
                className="flex-1 px-3 py-2 text-xs font-medium text-zinc-400 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkReturnAll}
                disabled={isProcessing}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Mark All IN'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
