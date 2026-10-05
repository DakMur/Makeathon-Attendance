'use client';

import React, { useMemo } from 'react';
import { ClassroomPresence } from '@/lib/types';
import { Check, X, Phone, UserCheck, Shield } from 'lucide-react';

interface ClassroomTrackerProps {
  roomId: string;
  dayNumber: number;
  presences: ClassroomPresence[];
  onTogglePresence: (participantName: string, currentIsInRoom: boolean) => void;
  isUpdatingName?: string | null;
}

interface TeamGroup {
  teamName: string;
  members: ClassroomPresence[];
}

export function ClassroomTracker({
  roomId,
  dayNumber,
  presences,
  onTogglePresence,
  isUpdatingName,
}: ClassroomTrackerProps) {
  // Group participants by team
  const teamGroups: TeamGroup[] = useMemo(() => {
    const map = new Map<string, ClassroomPresence[]>();
    presences.forEach((p) => {
      const list = map.get(p.team_name) || [];
      list.push(p);
      map.set(p.team_name, list);
    });

    const groups: TeamGroup[] = [];
    map.forEach((members, teamName) => {
      // Sort so team lead is first
      const sorted = [...members].sort((a, b) => {
        if (a.is_team_lead && !b.is_team_lead) return -1;
        if (!a.is_team_lead && b.is_team_lead) return 1;
        return 0;
      });
      groups.push({ teamName, members: sorted });
    });

    return groups;
  }, [presences]);

  if (presences.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-12 text-center">
        <p className="text-zinc-500 text-sm font-mono">
          No participants registered in Room {roomId} for Day {dayNumber} yet.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/70 overflow-hidden shadow-2xl">
      {/* Table header */}
      <div className="grid grid-cols-12 px-4 py-2.5 bg-zinc-900/60 border-b border-zinc-800/80 text-[11px] font-mono uppercase tracking-wider text-zinc-400">
        <div className="col-span-3 font-semibold">Assigned Team</div>
        <div className="col-span-6 font-semibold">Participant & Phone</div>
        <div className="col-span-3 text-right font-semibold">Room Status</div>
      </div>

      {/* Team rows list */}
      <div className="divide-y divide-zinc-800/60">
        {teamGroups.map((group, groupIdx) => {
          const totalIn = group.members.filter((m) => m.is_in_room).length;
          const totalMembers = group.members.length;

          return (
            <div
              key={group.teamName}
              className={`grid grid-cols-12 p-3 transition-colors ${
                groupIdx % 2 === 0 ? 'bg-zinc-950/30' : 'bg-zinc-900/20'
              } hover:bg-zinc-900/40`}
            >
              {/* LEFT COLUMN: Team Name rendered ONCE per team */}
              <div className="col-span-3 pr-3 flex flex-col justify-start pt-1 border-r border-zinc-800/40">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-white text-sm tracking-tight truncate">
                    {group.teamName}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded-sm border ${
                      totalIn === totalMembers
                        ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40'
                        : totalIn === 0
                        ? 'bg-red-950/40 text-red-400 border-red-800/40'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                    }`}
                  >
                    {totalIn}/{totalMembers} IN
                  </span>
                </div>
              </div>

              {/* RIGHT 2 COLUMNS: Member list + Interactive Toggles */}
              <div className="col-span-9 pl-3 divide-y divide-zinc-800/40">
                {group.members.map((member) => {
                  const isUpdating = isUpdatingName === member.participant_name;

                  return (
                    <div
                      key={member.participant_name}
                      className="py-2 first:pt-0 last:pb-0 flex items-center justify-between gap-3 group"
                    >
                      {/* MEMBER COLUMN */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {member.is_team_lead ? (
                            <span className="font-bold text-white text-sm flex items-center gap-1.5">
                              {member.participant_name}
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-mono uppercase px-1.5 py-0.2 bg-blue-950/80 text-blue-400 border border-blue-800/50 rounded-xs">
                                <Shield className="w-2.5 h-2.5" />
                                Lead
                              </span>
                            </span>
                          ) : (
                            <span className="text-zinc-300 text-xs font-normal">
                              {member.participant_name}
                            </span>
                          )}
                        </div>

                        {/* Phone Number rendered subtly beneath name in mono */}
                        <div className="flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-zinc-600 shrink-0" />
                          <span className="text-[11px] font-mono text-zinc-500 tracking-wide">
                            {member.phone_number || 'No phone recorded'}
                          </span>
                        </div>
                      </div>

                      {/* STATUS TOGGLE: Red/Green Switch */}
                      <div className="shrink-0 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            onTogglePresence(member.participant_name, member.is_in_room)
                          }
                          disabled={isUpdating}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all duration-150 border active:scale-95 shadow-sm ${
                            member.is_in_room
                              ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/50 hover:bg-emerald-950/70 hover:border-emerald-400'
                              : 'bg-red-950/40 text-red-400 border-red-500/50 hover:bg-red-950/70 hover:border-red-400'
                          } ${isUpdating ? 'opacity-50 pointer-events-none' : ''}`}
                          title={`Click to mark ${member.is_in_room ? 'OUT' : 'IN'}`}
                        >
                          {member.is_in_room ? (
                            <>
                              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>IN ROOM</span>
                            </>
                          ) : (
                            <>
                              <X className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>OUT</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
