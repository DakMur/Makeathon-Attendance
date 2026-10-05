'use client';

import React, { useState } from 'react';
import { AlertTriangle, Send, X, CheckCircle2, Loader2, Bell } from 'lucide-react';
import { sendCoordinatorPing } from '@/lib/dataService';

interface PingAdminModalProps {
  isOpen: boolean;
  roomId: string;
  coordinatorName?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const PRESET_MESSAGES = [
  'Technical / Hardware Issue in Room',
  'Participant Medical Assistance Required',
  'Wi-Fi / Network Connectivity Outage',
  'Power Extension / Cable Shortage',
  'Team Dispute or Rule Inquiry',
  'Food / Refreshment Delay or Shortage',
];

export function PingAdminModal({
  isOpen,
  roomId,
  coordinatorName = '',
  onClose,
  onSuccess,
}: PingAdminModalProps) {
  const [name, setName] = useState(coordinatorName || `Room ${roomId} Coordinator`);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);
    try {
      await sendCoordinatorPing(roomId, name.trim(), message.trim());
      setIsSent(true);
      if (onSuccess) onSuccess();
      setTimeout(() => {
        setIsSent(false);
        setMessage('');
        onClose();
      }, 1400);
    } catch (err) {
      console.error('Failed to send SOS ping:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-xl border border-red-500/40 bg-[#09090b] p-6 shadow-2xl ring-1 ring-red-500/20">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300 p-1 rounded-md"
        >
          <X className="w-4 h-4" />
        </button>

        {isSent ? (
          <div className="py-8 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-center text-emerald-400 mb-3 animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-white">Alert Broadcasted!</h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-xs">
              Command Center Admin has received your SOS ping with high priority.
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-red-950/80 border border-red-500/50 flex items-center justify-center text-red-400 shrink-0">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide uppercase">
                  Coordinator SOS Ping — Room {roomId}
                </h3>
                <p className="text-xs text-zinc-400">
                  Instant high-priority dispatch to Admin Command Center
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">
                  Coordinator Identity
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name"
                  required
                  className="w-full px-3 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-hidden focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">
                  Urgent Situation / Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe emergency, missing equipment, medical request..."
                  rows={3}
                  required
                  className="w-full px-3 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-hidden focus:border-red-500 resize-none font-sans"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1.5">
                  Quick Presets:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_MESSAGES.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setMessage(preset)}
                      className="text-[10px] px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 transition-colors text-left"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-3 py-2 text-xs font-medium text-zinc-400 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !message.trim()}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors disabled:opacity-50 shadow-sm"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Broadcasting...
                    </>
                  ) : (
                    <>
                      <Bell className="w-3.5 h-3.5" />
                      Send SOS Ping
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
