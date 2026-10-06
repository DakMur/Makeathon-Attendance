'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageSquare,
  X,
  Send,
  ChevronDown,
  Hash,
  ShieldAlert,
  Loader2,
  Radio,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { ChatMessage } from '@/lib/types';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ChatDrawerProps {
  /** 'admin' → shows full Chat Hub with channel selector.
   *  'room'  → locked to a single channel (room_<roomId>). */
  mode: 'admin' | 'room';
  /** Room id when mode === 'room', e.g. '401' */
  roomId?: string;
  /** Display name of the sender */
  senderName: string;
  /** Role shown in the message */
  senderRole: 'admin' | 'coordinator';
}

const ROOM_IDS = ['401', '402', '403', '404', '405', '406', '407', '408'];

const ADMIN_CHANNELS = [
  { id: 'admin_global', label: 'Admin Global', icon: ShieldAlert },
  ...ROOM_IDS.map((r) => ({ id: `room_${r}`, label: `Room ${r}`, icon: Hash })),
];

// ─── Chat service helpers ─────────────────────────────────────────────────────

async function fetchMessages(channelId: string, limit = 60): Promise<ChatMessage[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('channel_id', channelId)
    .order('created_at', { ascending: true })
    .limit(limit);
  if (error) {
    console.warn('ChatDrawer fetchMessages error:', error);
    return [];
  }
  return (data ?? []) as ChatMessage[];
}

async function sendMessage(
  msg: Omit<ChatMessage, 'id' | 'created_at'>
): Promise<ChatMessage | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data, error } = await supabase
    .from('chat_messages')
    .insert(msg)
    .select()
    .single();
  if (error) {
    console.warn('ChatDrawer sendMessage error:', error);
    return null;
  }
  return data as ChatMessage;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ChatDrawer({ mode, roomId, senderName, senderRole }: ChatDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeChannel, setActiveChannel] = useState<string>(
    mode === 'admin' ? 'admin_global' : `room_${roomId}`
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [unread, setUnread] = useState(0);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const channelRef = useRef<any>(null);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }, []);

  // Load messages for the active channel
  const loadMessages = useCallback(async (channelId: string) => {
    setIsLoading(true);
    const msgs = await fetchMessages(channelId);
    // Deduplicate by id if any duplicates exist in database
    const uniqueMsgs: ChatMessage[] = [];
    const seenIds = new Set<number>();
    msgs.forEach((m) => {
      if (m.id && seenIds.has(m.id)) return;
      if (m.id) seenIds.add(m.id);
      uniqueMsgs.push(m);
    });
    setMessages(uniqueMsgs);
    setIsLoading(false);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'instant' }), 60);
  }, []);

  // Subscribe to realtime for the active channel
  const subscribeToChannel = useCallback(
    (channelId: string) => {
      if (!isSupabaseConfigured || !supabase) return;

      // Clean up previous subscription
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      channelRef.current = supabase
        .channel(`chat_realtime_${channelId}_${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `channel_id=eq.${channelId}`,
          },
          (payload) => {
            const newMsg = payload.new as ChatMessage;
            setMessages((prev) => {
              // 1. Direct deduplication by real database id
              if (prev.some((m) => m.id === newMsg.id)) return prev;

              // 2. Check if this matches a pending optimistic message from the current client
              const optimisticIdx = prev.findIndex(
                (m) =>
                  Boolean(m.tempId) &&
                  m.channel_id === newMsg.channel_id &&
                  m.sender_name === newMsg.sender_name &&
                  m.message === newMsg.message &&
                  Math.abs(
                    new Date(m.created_at).getTime() - new Date(newMsg.created_at).getTime()
                  ) < 15000
              );

              if (optimisticIdx !== -1) {
                // Replace optimistic message with confirmed backend row
                const next = [...prev];
                next[optimisticIdx] = newMsg;
                return next;
              }

              // 3. Otherwise append new incoming message from socket
              return [...prev, newMsg];
            });
            if (!isOpen) {
              setUnread((n) => n + 1);
            } else {
              scrollToBottom();
            }
          }
        )
        .subscribe();
    },
    [isOpen, scrollToBottom]
  );

  // When active channel changes — reload messages & resubscribe
  useEffect(() => {
    loadMessages(activeChannel);
    subscribeToChannel(activeChannel);
    return () => {
      if (channelRef.current && supabase) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChannel]);

  // When drawer opens — clear unread & scroll
  useEffect(() => {
    if (isOpen) {
      setUnread(0);
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [isOpen, scrollToBottom]);

  // Keyboard shortcut: Escape closes drawer
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) setIsOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = draft.trim();
    if (!text || isSending) return;

    setIsSending(true);
    setDraft('');

    const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    // Optimistic insert with unique tempId
    const optimistic: ChatMessage = {
      tempId,
      channel_id: activeChannel,
      sender_name: senderName || (senderRole === 'admin' ? 'Admin' : 'Coordinator'),
      sender_role: senderRole,
      message: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    scrollToBottom();

    const confirmed = await sendMessage({
      channel_id: activeChannel,
      sender_name: optimistic.sender_name,
      sender_role: senderRole,
      message: text,
    });

    if (confirmed) {
      setMessages((prev) => {
        // If realtime subscription already replaced or inserted it, filter out tempId
        if (prev.some((m) => m.id === confirmed.id)) {
          return prev.filter((m) => m.tempId !== tempId);
        }
        // Otherwise replace optimistic with confirmed row
        return prev.map((m) => (m.tempId === tempId ? confirmed : m));
      });
    }

    setIsSending(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  const activeChannelLabel =
    mode === 'admin'
      ? ADMIN_CHANNELS.find((c) => c.id === activeChannel)?.label ?? activeChannel
      : `Room ${roomId}`;

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        id="chat-drawer-toggle"
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        title={isOpen ? 'Close Chat' : 'Open Chat'}
        className={`fixed bottom-5 right-5 z-40 w-12 h-12 rounded-full shadow-xl flex items-center justify-center transition-all active:scale-95
          ${
            isOpen
              ? 'bg-zinc-800 border border-zinc-600 text-zinc-300'
              : 'bg-blue-600 hover:bg-blue-500 border border-blue-400/40 text-white'
          }
        `}
      >
        {isOpen ? <X className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
        {!isOpen && unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center ring-2 ring-black">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {/* Drawer Panel */}
      <div
        className={`fixed bottom-20 right-5 z-40 w-80 md:w-96 rounded-2xl border border-zinc-800 bg-[#0a0a0c] shadow-2xl flex flex-col overflow-hidden transition-all duration-200
          ${isOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'}
        `}
        style={{ maxHeight: 'min(520px, calc(100vh - 120px))' }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 bg-zinc-900/80 border-b border-zinc-800 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-blue-950 border border-blue-700/50 flex items-center justify-center text-blue-400">
            <MessageSquare className="w-3.5 h-3.5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">
              {mode === 'admin' ? 'Chat Hub' : `Room ${roomId} Chat`}
            </p>
            <p className="text-[10px] text-zinc-500 font-mono truncate flex items-center gap-1">
              <Radio className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
              {activeChannelLabel}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="text-zinc-500 hover:text-zinc-300 p-1 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Channel Selector (admin only) */}
        {mode === 'admin' && (
          <div className="flex gap-1.5 p-2 bg-zinc-950/60 border-b border-zinc-800/80 overflow-x-auto shrink-0 scrollbar-none">
            {ADMIN_CHANNELS.map((ch) => {
              const Icon = ch.icon;
              const isActive = ch.id === activeChannel;
              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => {
                    setActiveChannel(ch.id);
                    setMessages([]);
                  }}
                  title={ch.label}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold whitespace-nowrap transition-all shrink-0
                    ${
                      isActive
                        ? 'bg-blue-600 text-white border border-blue-500/60'
                        : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                    }
                  `}
                >
                  <Icon className="w-3 h-3" />
                  {ch.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Messages list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5 min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-20">
              <Loader2 className="w-5 h-5 text-zinc-600 animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-20 text-zinc-600 text-xs font-mono">
              <MessageSquare className="w-6 h-6 mb-1 opacity-30" />
              No messages yet — say hello!
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isMe = msg.sender_name === senderName;
              const isAdmin = msg.sender_role === 'admin';
              return (
                <div
                  key={msg.id ?? msg.tempId ?? idx}
                  className={`flex flex-col gap-0.5 ${isMe ? 'items-end' : 'items-start'}`}
                >
                  {/* Sender label */}
                  <div className="flex items-center gap-1.5 px-1">
                    <span
                      className={`text-[10px] font-mono font-bold ${
                        isAdmin ? 'text-blue-400' : 'text-emerald-400'
                      }`}
                    >
                      {msg.sender_name}
                    </span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                        isAdmin
                          ? 'bg-blue-950/60 text-blue-500 border border-blue-800/40'
                          : 'bg-emerald-950/60 text-emerald-600 border border-emerald-800/40'
                      }`}
                    >
                      {isAdmin ? 'admin' : 'coord'}
                    </span>
                    <span className="text-[9px] text-zinc-600 font-mono">
                      {new Date(msg.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  {/* Bubble */}
                  <div
                    className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed break-words
                      ${
                        isMe
                          ? 'bg-blue-600/80 text-white rounded-br-sm'
                          : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-bl-sm'
                      }
                    `}
                  >
                    {msg.message}
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input form */}
        <form
          onSubmit={handleSend}
          className="flex items-center gap-2 px-3 py-2.5 bg-zinc-900/80 border-t border-zinc-800 shrink-0"
        >
          <input
            ref={inputRef}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${activeChannelLabel}…`}
            maxLength={500}
            className="flex-1 px-3 py-1.5 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/40 transition-colors"
          />
          <button
            type="submit"
            disabled={!draft.trim() || isSending}
            className="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white flex items-center justify-center transition-colors shrink-0"
          >
            {isSending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
          </button>
        </form>
      </div>
    </>
  );
}
