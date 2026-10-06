'use client';

import React, { useMemo, useState } from 'react';
import { ClassroomPresence } from '@/lib/types';
import {
  Users,
  LogOut,
  LogIn,
  Eye,
  X,
  ExternalLink,
  Phone,
  Shield,
  Search,
} from 'lucide-react';
import Link from 'next/link';
import { INITIAL_TEAMS } from '@/lib/defaultTeams';

interface AdminMonitorGridProps {
  presences: ClassroomPresence[];
  coordinators: Record<string, string[]>;
  dayNumber: number;
}

export function AdminMonitorGrid({
  presences,
  coordinators,
  dayNumber,
}: AdminMonitorGridProps) {
  const rooms = ['401', '402', '403', '404', '405', '406', '407', '408'];
  const [inspectRoomId, setInspectRoomId] = useState<string | null>(null);
  const [filterQuery, setFilterQuery] = useState('');

  // Build a per-room fallback from the static roster (all OUT) for rooms
  // that haven't been seeded into classroom_presence yet.
  const fallbackByRoom = useMemo(() => {
    const map: Record<string, ClassroomPresence[]> = {};
    INITIAL_TEAMS.forEach((team) => {
      const rid = team.classroom_id || '401';
      if (!map[rid]) map[rid] = [];
      const members = [
        { name: team.member_1, phone: team.member_1_phone, isLead: true },
        { name: team.member_2, phone: team.member_2_phone, isLead: false },
        { name: team.member_3, phone: team.member_3_phone, isLead: false },
        { name: team.member_4, phone: team.member_4_phone, isLead: false },
      ];
      members.forEach((m) => {
        if (m.name && m.name.trim()) {
          map[rid].push({
            day_number: dayNumber,
            classroom_id: rid,
            team_name: team.team_name,
            participant_name: m.name.trim(),
            phone_number: m.phone || '',
            is_team_lead: m.isLead,
            is_in_room: false,   // Default: OUT
            last_toggle_time: new Date().toISOString(),
            updated_by: 'system',
          });
        }
      });
    });
    return map;
  }, [dayNumber]);

  // Calculate room statistics — use DB presences if available, else fallback roster
  const roomStats = rooms.map((roomId) => {
    const dbPresences = presences.filter((p) => p.classroom_id === roomId);
    const roomPresences = dbPresences.length > 0
      ? dbPresences
      : (fallbackByRoom[roomId] ?? []);

    const total = roomPresences.length;
    const inCount = roomPresences.filter((p) => p.is_in_room).length;
    const outCount = total - inCount;
    const inPercentage = total > 0 ? Math.round((inCount / total) * 100) : 0;
    const roomCoordinators = coordinators[roomId] || [];

    return {
      roomId,
      total,
      inCount,
      outCount,
      inPercentage,
      coordinators: roomCoordinators,
      outParticipants: roomPresences.filter((p) => !p.is_in_room),
    };
  });

  const inspectedRoom = inspectRoomId
    ? roomStats.find((r) => r.roomId === inspectRoomId)
    : null;

  const filteredOutParticipants = inspectedRoom
    ? inspectedRoom.outParticipants.filter(
        (p) =>
          p.participant_name.toLowerCase().includes(filterQuery.toLowerCase()) ||
          p.team_name.toLowerCase().includes(filterQuery.toLowerCase()) ||
          (p.phone_number && p.phone_number.includes(filterQuery))
      )
    : [];

  return (
    <div className="space-y-6">
      {/* 8-Grid Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {roomStats.map((room) => (
          <div
            key={room.roomId}
            className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-4 shadow-xl hover:border-zinc-700 transition-all flex flex-col justify-between"
          >
            <div>
              {/* Card Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700/60 flex items-center justify-center font-mono font-bold text-white text-sm">
                    {room.roomId}
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">
                      Classroom {room.roomId}
                    </h4>
                    <p className="text-[10px] text-zinc-500 font-mono truncate max-w-[120px]">
                      {room.coordinators.length > 0
                        ? room.coordinators.join(', ')
                        : 'Unassigned'}
                    </p>
                  </div>
                </div>

                <Link
                  href={`/room/${room.roomId}`}
                  className="text-zinc-500 hover:text-zinc-300 p-1 rounded transition-colors"
                  title="Open Room Tracker"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Attendance Counts */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="p-2 rounded-lg bg-emerald-950/30 border border-emerald-800/40">
                  <div className="flex items-center justify-between text-emerald-400 mb-0.5">
                    <span className="text-[10px] font-mono uppercase">IN ROOM</span>
                    <LogIn className="w-3 h-3" />
                  </div>
                  <div className="text-xl font-bold font-mono text-emerald-400">
                    {room.inCount}
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-red-950/30 border border-red-800/40">
                  <div className="flex items-center justify-between text-red-400 mb-0.5">
                    <span className="text-[10px] font-mono uppercase">OUT</span>
                    <LogOut className="w-3 h-3" />
                  </div>
                  <div className="text-xl font-bold font-mono text-red-400">
                    {room.outCount}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1 mb-2">
                <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                  <span>Occupancy</span>
                  <span>{room.inPercentage}%</span>
                </div>
                <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                  <div
                    className={`h-full transition-all duration-300 ${
                      room.inPercentage >= 80
                        ? 'bg-emerald-500'
                        : room.inPercentage >= 50
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${room.inPercentage}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Inspect OUT participants button */}
            <button
              type="button"
              onClick={() => {
                setInspectRoomId(room.roomId);
                setFilterQuery('');
              }}
              className="w-full mt-2 inline-flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-mono font-medium text-zinc-300 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Inspect OUT ({room.outCount})</span>
            </button>
          </div>
        ))}
      </div>

      {/* Expandable Modal for OUT Participants */}
      {inspectedRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-2xl rounded-xl border border-zinc-800 bg-[#09090b] p-6 shadow-2xl max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-950/70 border border-red-500/40 flex items-center justify-center text-red-400 font-mono font-bold">
                  {inspectedRoom.roomId}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">
                    Room {inspectedRoom.roomId} — Missing / OUT Participants
                  </h3>
                  <p className="text-xs text-zinc-400 font-mono">
                    {inspectedRoom.outCount} participants currently outside the room on Day {dayNumber}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectRoomId(null)}
                className="text-zinc-500 hover:text-zinc-300 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Filter inside modal */}
            <div className="pt-4 pb-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  placeholder="Filter by name, team, or phone..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-hidden focus:border-zinc-600 font-mono"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto py-2 divide-y divide-zinc-800/60">
              {filteredOutParticipants.length === 0 ? (
                <div className="py-8 text-center text-xs font-mono text-zinc-500">
                  {inspectedRoom.outCount === 0
                    ? 'All participants are present IN the classroom.'
                    : 'No participants match the filter query.'}
                </div>
              ) : (
                filteredOutParticipants.map((p) => (
                  <div
                    key={p.participant_name}
                    className="py-2.5 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">
                          {p.participant_name}
                        </span>
                        {p.is_team_lead && (
                          <span className="text-[9px] font-mono uppercase px-1 py-0.2 bg-blue-950/80 text-blue-400 border border-blue-800/50 rounded-xs flex items-center gap-0.5">
                            <Shield className="w-2.5 h-2.5" />
                            Lead
                          </span>
                        )}
                        <span className="text-[11px] font-mono text-zinc-400">
                          ({p.team_name})
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 text-zinc-500 font-mono text-[11px]">
                        <Phone className="w-3 h-3 text-zinc-600" />
                        <span>{p.phone_number || 'No phone'}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-950/80 text-red-400 border border-red-800/50">
                        <LogOut className="w-3 h-3" />
                        OUT
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-zinc-800 flex justify-between items-center text-xs font-mono text-zinc-500">
              <span>Classroom {inspectedRoom.roomId}</span>
              <button
                onClick={() => setInspectRoomId(null)}
                className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
