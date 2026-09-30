'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { Settings, Lock, Check, CheckCheck } from 'lucide-react';
import { Team, AttendanceField, AdminPresence } from '@/lib/types';

interface AttendanceGridProps {
  teams: Team[];
  focusedSlNo: number | null;
  focusedCol: number;
  onFocusCell: (slNo: number, colIndex: number) => void;
  onToggleAttendance: (slNo: number, field: AttendanceField, value: boolean) => void;
  onMarkTeamDayPresent: (slNo: number, dayKey: 'oct7' | 'oct8' | 'oct9') => void;
  onUpdateComments: (slNo: number, comments: string) => void;
  onOpenSettings: (team: Team) => void;
  activePresences: AdminPresence[];
  currentAdminSlot: 'admin_1' | 'admin_2' | 'admin_3' | 'admin_4';
}

const COL_COUNT = 14;

// Column definitions mapping:
// 0: Team Name
// 1..3: Member 1 (Oct 7, Oct 8, Oct 9)
// 4..6: Member 2 (Oct 7, Oct 8, Oct 9)
// 7..9: Member 3 (Oct 7, Oct 8, Oct 9)
// 10..12: Member 4 (Oct 7, Oct 8, Oct 9)
// 13: Comments

const FIELD_BY_COL: Record<number, { memberKey: keyof Team; field: AttendanceField; dayLabel: string; dayKey: 'oct7' | 'oct8' | 'oct9' }> = {
  1: { memberKey: 'member_1', field: 'member_1_oct7', dayLabel: 'Oct 7', dayKey: 'oct7' },
  2: { memberKey: 'member_1', field: 'member_1_oct8', dayLabel: 'Oct 8', dayKey: 'oct8' },
  3: { memberKey: 'member_1', field: 'member_1_oct9', dayLabel: 'Oct 9', dayKey: 'oct9' },
  4: { memberKey: 'member_2', field: 'member_2_oct7', dayLabel: 'Oct 7', dayKey: 'oct7' },
  5: { memberKey: 'member_2', field: 'member_2_oct8', dayLabel: 'Oct 8', dayKey: 'oct8' },
  6: { memberKey: 'member_2', field: 'member_2_oct9', dayLabel: 'Oct 9', dayKey: 'oct9' },
  7: { memberKey: 'member_3', field: 'member_3_oct7', dayLabel: 'Oct 7', dayKey: 'oct7' },
  8: { memberKey: 'member_3', field: 'member_3_oct8', dayLabel: 'Oct 8', dayKey: 'oct8' },
  9: { memberKey: 'member_3', field: 'member_3_oct9', dayLabel: 'Oct 9', dayKey: 'oct9' },
  10: { memberKey: 'member_4', field: 'member_4_oct7', dayLabel: 'Oct 7', dayKey: 'oct7' },
  11: { memberKey: 'member_4', field: 'member_4_oct8', dayLabel: 'Oct 8', dayKey: 'oct8' },
  12: { memberKey: 'member_4', field: 'member_4_oct9', dayLabel: 'Oct 9', dayKey: 'oct9' },
};

export function AttendanceGrid({
  teams,
  focusedSlNo,
  focusedCol,
  onFocusCell,
  onToggleAttendance,
  onMarkTeamDayPresent,
  onUpdateComments,
  onOpenSettings,
  activePresences,
  currentAdminSlot,
}: AttendanceGridProps) {
  const gridContainerRef = useRef<HTMLDivElement>(null);

  // Map remote locked teams (locked by another connected admin)
  const lockedByMap = React.useMemo(() => {
    const map = new Map<number, string>();
    activePresences.forEach((p) => {
      if (p.adminSlot !== currentAdminSlot && p.focusedSlNo !== null) {
        map.set(p.focusedSlNo, p.adminName);
      }
    });
    return map;
  }, [activePresences, currentAdminSlot]);

  // Find index of currently focused team
  const currentTeamIndex = React.useMemo(() => {
    if (focusedSlNo === null) return -1;
    return teams.findIndex((t) => t.sl_no === focusedSlNo);
  }, [teams, focusedSlNo]);

  // Auto-scroll focused team into view when selected
  useEffect(() => {
    if (focusedSlNo !== null) {
      const rowElem = document.getElementById(`team-row-${focusedSlNo}`);
      if (rowElem) {
        rowElem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [focusedSlNo]);

  // Helper to handle keyboard actions on attendance cell
  const handleAttendanceKey = useCallback(
    (action: 'present' | 'absent' | 'toggle') => {
      if (focusedSlNo === null) return;
      const team = teams.find((t) => t.sl_no === focusedSlNo);
      if (!team) return;

      // Check if locked remotely
      if (lockedByMap.has(team.sl_no)) return;

      const colDef = FIELD_BY_COL[focusedCol];
      if (!colDef) return;

      const memberName = (team[colDef.memberKey] as string) || '';
      if (!memberName.trim()) return; // Blank member slot

      const currentValue = Boolean(team[colDef.field]);
      let nextValue = currentValue;

      if (action === 'present') {
        nextValue = true;
      } else if (action === 'absent') {
        nextValue = false;
      } else if (action === 'toggle') {
        nextValue = !currentValue;
      }

      if (nextValue !== currentValue) {
        onToggleAttendance(team.sl_no, colDef.field, nextValue);
      }
    },
    [focusedSlNo, focusedCol, teams, lockedByMap, onToggleAttendance]
  );

  // Keyboard navigation listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      // If typing in input/textarea, allow native typing
      if (activeTag === 'input' || activeTag === 'textarea') {
        if (e.key === 'Escape') {
          (document.activeElement as HTMLElement)?.blur();
          gridContainerRef.current?.focus();
        }
        return;
      }

      // Shift + P: Mark the whole team present for the focused day!
      if (e.key === 'P' && e.shiftKey) {
        e.preventDefault();
        if (focusedSlNo !== null) {
          let dayKey: 'oct7' | 'oct8' | 'oct9' = 'oct7';
          if ([1, 4, 7, 10].includes(focusedCol)) dayKey = 'oct7';
          else if ([2, 5, 8, 11].includes(focusedCol)) dayKey = 'oct8';
          else if ([3, 6, 9, 12].includes(focusedCol)) dayKey = 'oct9';
          onMarkTeamDayPresent(focusedSlNo, dayKey);
        }
        return;
      }

      // If nothing is focused yet, default to first team on navigation
      if (focusedSlNo === null) {
        if (['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft', 'Tab', 'Enter'].includes(e.key)) {
          e.preventDefault();
          if (teams.length > 0) {
            onFocusCell(teams[0].sl_no, 0);
          }
        }
        return;
      }

      if (currentTeamIndex === -1) return;

      switch (e.key) {
        case 'ArrowUp': {
          e.preventDefault();
          if (currentTeamIndex > 0) {
            onFocusCell(teams[currentTeamIndex - 1].sl_no, focusedCol);
          }
          break;
        }
        case 'ArrowDown': {
          e.preventDefault();
          if (currentTeamIndex < teams.length - 1) {
            onFocusCell(teams[currentTeamIndex + 1].sl_no, focusedCol);
          }
          break;
        }
        case 'ArrowLeft': {
          e.preventDefault();
          if (focusedCol > 0) {
            onFocusCell(teams[currentTeamIndex].sl_no, focusedCol - 1);
          }
          break;
        }
        case 'ArrowRight': {
          e.preventDefault();
          if (focusedCol < COL_COUNT - 1) {
            onFocusCell(teams[currentTeamIndex].sl_no, focusedCol + 1);
          }
          break;
        }
        case 'Tab': {
          e.preventDefault();
          if (e.shiftKey) {
            if (focusedCol > 0) {
              onFocusCell(teams[currentTeamIndex].sl_no, focusedCol - 1);
            } else if (currentTeamIndex > 0) {
              onFocusCell(teams[currentTeamIndex - 1].sl_no, COL_COUNT - 1);
            }
          } else {
            if (focusedCol < COL_COUNT - 1) {
              onFocusCell(teams[currentTeamIndex].sl_no, focusedCol + 1);
            } else if (currentTeamIndex < teams.length - 1) {
              onFocusCell(teams[currentTeamIndex + 1].sl_no, 0);
            }
          }
          break;
        }
        case 'Enter': {
          e.preventDefault();
          if (focusedCol === 13) {
            const commentInput = document.getElementById(`comments-${teams[currentTeamIndex].sl_no}`);
            commentInput?.focus();
          } else if (currentTeamIndex < teams.length - 1) {
            onFocusCell(teams[currentTeamIndex + 1].sl_no, focusedCol);
          }
          break;
        }
        case 'p':
        case 'P': {
          e.preventDefault();
          handleAttendanceKey('present');
          break;
        }
        case 'a':
        case 'A':
        case 'x':
        case 'X': {
          e.preventDefault();
          handleAttendanceKey('absent');
          break;
        }
        case ' ': {
          e.preventDefault();
          handleAttendanceKey('toggle');
          break;
        }
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    focusedSlNo,
    focusedCol,
    currentTeamIndex,
    teams,
    onFocusCell,
    handleAttendanceKey,
    onMarkTeamDayPresent,
  ]);

  return (
    <div
      ref={gridContainerRef}
      tabIndex={0}
      className="w-full overflow-x-auto focus:outline-hidden border-t border-zinc-200 dark:border-[#27272a] bg-white dark:bg-[#09090b] transition-colors"
    >
      <table className="w-full border-collapse text-left select-none min-w-[1520px]">
        {/* Table Header */}
        <thead>
          {/* Top header row: Grouping columns */}
          <tr className="bg-zinc-100 dark:bg-[#121215] text-[11px] font-mono text-zinc-600 dark:text-[#a1a1aa] border-b border-zinc-200 dark:border-[#27272a]">
            <th
              scope="col"
              rowSpan={2}
              className="sticky left-0 z-30 w-14 bg-zinc-100 dark:bg-[#121215] px-3 py-2 text-center border-r border-zinc-200 dark:border-[#27272a] font-semibold text-zinc-500 dark:text-[#71717a]"
            >
              SL#
            </th>
            <th
              scope="col"
              rowSpan={2}
              className="sticky left-14 z-30 w-44 bg-zinc-100 dark:bg-[#121215] px-3 py-2 border-r border-zinc-200 dark:border-[#27272a] font-semibold text-zinc-900 dark:text-white tracking-wider"
            >
              TEAM NAME
            </th>

            {/* Actions & Mark Whole Team Present Column */}
            <th
              scope="col"
              rowSpan={2}
              className="w-48 bg-zinc-100 dark:bg-[#121215] px-2 py-2 text-center border-r border-zinc-200 dark:border-[#27272a] font-semibold text-zinc-700 dark:text-[#a1a1aa]"
            >
              <div className="flex items-center justify-center gap-1">
                <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                <span>MARK TEAM PRESENT</span>
              </div>
            </th>

            {/* Member 1 Group */}
            <th
              scope="col"
              colSpan={4}
              className="px-3 py-1.5 text-center border-r border-zinc-200 dark:border-[#27272a] bg-zinc-200/60 dark:bg-[#141418] text-zinc-700 dark:text-[#a1a1aa]"
            >
              MEMBER 1 (LEADER)
            </th>

            {/* Member 2 Group */}
            <th
              scope="col"
              colSpan={4}
              className="px-3 py-1.5 text-center border-r border-zinc-200 dark:border-[#27272a] bg-zinc-100 dark:bg-[#121215] text-zinc-700 dark:text-[#a1a1aa]"
            >
              MEMBER 2
            </th>

            {/* Member 3 Group */}
            <th
              scope="col"
              colSpan={4}
              className="px-3 py-1.5 text-center border-r border-zinc-200 dark:border-[#27272a] bg-zinc-200/60 dark:bg-[#141418] text-zinc-700 dark:text-[#a1a1aa]"
            >
              MEMBER 3
            </th>

            {/* Member 4 Group */}
            <th
              scope="col"
              colSpan={4}
              className="px-3 py-1.5 text-center border-r border-zinc-200 dark:border-[#27272a] bg-zinc-100 dark:bg-[#121215] text-zinc-700 dark:text-[#a1a1aa]"
            >
              MEMBER 4
            </th>

            {/* Comments Header */}
            <th
              scope="col"
              rowSpan={2}
              className="w-56 px-3 py-2 text-left border-l border-zinc-200 dark:border-[#27272a] text-zinc-500 dark:text-[#71717a] font-semibold"
            >
              COMMENTS / NOTES
            </th>
          </tr>

          {/* Sub header row: Member Name + Day Columns */}
          <tr className="bg-zinc-50 dark:bg-[#101013] text-[10px] font-mono text-zinc-500 dark:text-[#71717a] border-b border-zinc-200 dark:border-[#27272a]">
            {/* Member 1 sub-columns */}
            <th className="px-3 py-1.5 border-r border-zinc-200 dark:border-[#27272a] w-36 text-left">Name</th>
            <th className="px-2 py-1.5 border-r border-zinc-200 dark:border-[#27272a] w-14 text-center font-bold text-blue-600 dark:text-blue-400">07 Oct</th>
            <th className="px-2 py-1.5 border-r border-zinc-200 dark:border-[#27272a] w-14 text-center font-bold text-blue-600 dark:text-blue-400">08 Oct</th>
            <th className="px-2 py-1.5 border-r border-zinc-200 dark:border-[#27272a] w-14 text-center font-bold text-blue-600 dark:text-blue-400">09 Oct</th>

            {/* Member 2 sub-columns */}
            <th className="px-3 py-1.5 border-r border-zinc-200 dark:border-[#27272a] w-36 text-left">Name</th>
            <th className="px-2 py-1.5 border-r border-zinc-200 dark:border-[#27272a] w-14 text-center font-bold text-blue-600 dark:text-blue-400">07 Oct</th>
            <th className="px-2 py-1.5 border-r border-zinc-200 dark:border-[#27272a] w-14 text-center font-bold text-blue-600 dark:text-blue-400">08 Oct</th>
            <th className="px-2 py-1.5 border-r border-zinc-200 dark:border-[#27272a] w-14 text-center font-bold text-blue-600 dark:text-blue-400">09 Oct</th>

            {/* Member 3 sub-columns */}
            <th className="px-3 py-1.5 border-r border-zinc-200 dark:border-[#27272a] w-36 text-left">Name</th>
            <th className="px-2 py-1.5 border-r border-zinc-200 dark:border-[#27272a] w-14 text-center font-bold text-blue-600 dark:text-blue-400">07 Oct</th>
            <th className="px-2 py-1.5 border-r border-zinc-200 dark:border-[#27272a] w-14 text-center font-bold text-blue-600 dark:text-blue-400">08 Oct</th>
            <th className="px-2 py-1.5 border-r border-zinc-200 dark:border-[#27272a] w-14 text-center font-bold text-blue-600 dark:text-blue-400">09 Oct</th>

            {/* Member 4 sub-columns */}
            <th className="px-3 py-1.5 border-r border-zinc-200 dark:border-[#27272a] w-36 text-left">Name</th>
            <th className="px-2 py-1.5 border-r border-zinc-200 dark:border-[#27272a] w-14 text-center font-bold text-blue-600 dark:text-blue-400">07 Oct</th>
            <th className="px-2 py-1.5 border-r border-zinc-200 dark:border-[#27272a] w-14 text-center font-bold text-blue-600 dark:text-blue-400">08 Oct</th>
            <th className="px-2 py-1.5 border-r border-zinc-200 dark:border-[#27272a] w-14 text-center font-bold text-blue-600 dark:text-blue-400">09 Oct</th>
          </tr>
        </thead>

        {/* Table Body */}
        <tbody className="divide-y divide-zinc-200 dark:divide-[#1f1f23]">
          {teams.map((team) => {
            const isRowFocused = focusedSlNo === team.sl_no;
            const remoteLockerName = lockedByMap.get(team.sl_no);
            const isRemoteLocked = Boolean(remoteLockerName);

            return (
              <tr
                key={team.sl_no}
                id={`team-row-${team.sl_no}`}
                className={`group transition-colors ${
                  isRemoteLocked
                    ? 'row-locked opacity-50 bg-zinc-100 dark:bg-[#121215]'
                    : isRowFocused
                    ? 'row-selected bg-blue-50/50 dark:bg-[#141418]'
                    : 'hover:bg-zinc-50 dark:hover:bg-[#121215]'
                }`}
              >
                {/* 1. Sl. No (Sticky counter) */}
                <td
                  className={`sticky left-0 z-20 px-3 py-2 text-center text-xs font-mono border-r border-zinc-200 dark:border-[#27272a] ${
                    isRowFocused
                      ? 'bg-zinc-100 dark:bg-[#18181b] text-zinc-900 dark:text-white font-bold'
                      : 'bg-zinc-50 dark:bg-[#09090b] text-zinc-500 dark:text-[#71717a]'
                  }`}
                >
                  <span className="num-mono">{team.sl_no}</span>
                </td>

                {/* 2. Team Name (Sticky frozen column & colIndex=0) */}
                <td
                  onClick={() => onFocusCell(team.sl_no, 0)}
                  className={`sticky left-14 z-20 px-3 py-2 text-xs font-mono font-medium border-r border-zinc-200 dark:border-[#27272a] cursor-pointer truncate max-w-[176px] transition-all ${
                    isRowFocused && focusedCol === 0
                      ? 'bg-zinc-100 dark:bg-black text-zinc-900 dark:text-white cell-selected ring-1 ring-zinc-900 dark:ring-white'
                      : isRowFocused
                      ? 'bg-zinc-100 dark:bg-[#18181b] text-zinc-900 dark:text-white'
                      : 'bg-white dark:bg-[#09090b] text-zinc-900 dark:text-white group-hover:text-black dark:group-hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="truncate">{team.team_name}</span>
                    {isRemoteLocked && (
                      <span className="inline-flex items-center gap-1 text-[9px] px-1 py-0.2 bg-zinc-200 dark:bg-[#27272a] text-zinc-700 dark:text-[#a1a1aa] rounded-xs font-mono shrink-0">
                        <Lock className="w-2.5 h-2.5 text-amber-500" />
                        {remoteLockerName}
                      </span>
                    )}
                  </div>
                </td>

                {/* 3. Settings & "Mark Whole Team Present" Day Buttons */}
                <td className="px-2 py-1.5 text-center border-r border-zinc-200 dark:border-[#27272a] bg-zinc-50/50 dark:bg-transparent">
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      onClick={() => onOpenSettings(team)}
                      disabled={isRemoteLocked}
                      className="p-1 text-zinc-500 hover:text-zinc-900 dark:text-[#71717a] dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-[#27272a] rounded-xs transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title={`Edit team ${team.team_name} roster & names`}
                    >
                      <Settings className="w-3.5 h-3.5" />
                    </button>
                    <div className="h-3 w-px bg-zinc-300 dark:bg-zinc-800" />
                    <div className="flex items-center gap-1 font-mono text-[10px]">
                      <button
                        onClick={() => onMarkTeamDayPresent(team.sl_no, 'oct7')}
                        disabled={isRemoteLocked}
                        className="px-1.5 py-0.5 bg-zinc-200/70 hover:bg-blue-600 hover:text-white dark:bg-[#18181b] dark:hover:bg-[#2563eb] text-zinc-700 dark:text-[#a1a1aa] border border-zinc-300 dark:border-[#27272a] rounded-xs transition-colors disabled:opacity-30 font-medium"
                        title={`Mark entire ${team.team_name} Present for Oct 7 (Shift+P on Oct 7)`}
                      >
                        +7th
                      </button>
                      <button
                        onClick={() => onMarkTeamDayPresent(team.sl_no, 'oct8')}
                        disabled={isRemoteLocked}
                        className="px-1.5 py-0.5 bg-zinc-200/70 hover:bg-blue-600 hover:text-white dark:bg-[#18181b] dark:hover:bg-[#2563eb] text-zinc-700 dark:text-[#a1a1aa] border border-zinc-300 dark:border-[#27272a] rounded-xs transition-colors disabled:opacity-30 font-medium"
                        title={`Mark entire ${team.team_name} Present for Oct 8 (Shift+P on Oct 8)`}
                      >
                        +8th
                      </button>
                      <button
                        onClick={() => onMarkTeamDayPresent(team.sl_no, 'oct9')}
                        disabled={isRemoteLocked}
                        className="px-1.5 py-0.5 bg-zinc-200/70 hover:bg-blue-600 hover:text-white dark:bg-[#18181b] dark:hover:bg-[#2563eb] text-zinc-700 dark:text-[#a1a1aa] border border-zinc-300 dark:border-[#27272a] rounded-xs transition-colors disabled:opacity-30 font-medium"
                        title={`Mark entire ${team.team_name} Present for Oct 9 (Shift+P on Oct 9)`}
                      >
                        +9th
                      </button>
                    </div>
                  </div>
                </td>

                {/* 4. MEMBER 1 */}
                <td className="px-3 py-2 text-xs border-r border-zinc-200 dark:border-[#27272a] text-zinc-800 dark:text-[#d4d4d8] truncate max-w-[144px]">
                  {team.member_1 || <span className="text-zinc-400 dark:text-[#3f3f46] italic">None</span>}
                </td>
                {renderAttendanceCell(team, 1, 'member_1', 'member_1_oct7', 1)}
                {renderAttendanceCell(team, 1, 'member_1', 'member_1_oct8', 2)}
                {renderAttendanceCell(team, 1, 'member_1', 'member_1_oct9', 3)}

                {/* 5. MEMBER 2 */}
                <td className="px-3 py-2 text-xs border-r border-zinc-200 dark:border-[#27272a] text-zinc-800 dark:text-[#d4d4d8] truncate max-w-[144px]">
                  {team.member_2 || <span className="text-zinc-400 dark:text-[#3f3f46] italic">None</span>}
                </td>
                {renderAttendanceCell(team, 2, 'member_2', 'member_2_oct7', 4)}
                {renderAttendanceCell(team, 2, 'member_2', 'member_2_oct8', 5)}
                {renderAttendanceCell(team, 2, 'member_2', 'member_2_oct9', 6)}

                {/* 6. MEMBER 3 */}
                <td className="px-3 py-2 text-xs border-r border-zinc-200 dark:border-[#27272a] text-zinc-800 dark:text-[#d4d4d8] truncate max-w-[144px]">
                  {team.member_3 || <span className="text-zinc-400 dark:text-[#3f3f46] italic">—</span>}
                </td>
                {renderAttendanceCell(team, 3, 'member_3', 'member_3_oct7', 7)}
                {renderAttendanceCell(team, 3, 'member_3', 'member_3_oct8', 8)}
                {renderAttendanceCell(team, 3, 'member_3', 'member_3_oct9', 9)}

                {/* 7. MEMBER 4 */}
                <td className="px-3 py-2 text-xs border-r border-zinc-200 dark:border-[#27272a] text-zinc-800 dark:text-[#d4d4d8] truncate max-w-[144px]">
                  {team.member_4 || <span className="text-zinc-400 dark:text-[#3f3f46] italic">—</span>}
                </td>
                {renderAttendanceCell(team, 4, 'member_4', 'member_4_oct7', 10)}
                {renderAttendanceCell(team, 4, 'member_4', 'member_4_oct8', 11)}
                {renderAttendanceCell(team, 4, 'member_4', 'member_4_oct9', 12)}

                {/* 8. Comments Cell (colIndex=13) */}
                <td
                  onClick={() => onFocusCell(team.sl_no, 13)}
                  className={`px-3 py-1.5 border-l border-zinc-200 dark:border-[#27272a] ${
                    isRowFocused && focusedCol === 13 ? 'cell-selected' : ''
                  }`}
                >
                  <input
                    id={`comments-${team.sl_no}`}
                    type="text"
                    disabled={isRemoteLocked}
                    value={team.comments || ''}
                    onChange={(e) => onUpdateComments(team.sl_no, e.target.value)}
                    onFocus={() => onFocusCell(team.sl_no, 13)}
                    placeholder={isRemoteLocked ? 'Locked by admin...' : 'Add remark...'}
                    className="w-full bg-transparent text-xs font-mono text-zinc-800 dark:text-[#d4d4d8] placeholder-zinc-400 dark:placeholder-[#3f3f46] focus:outline-hidden disabled:opacity-40"
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  // Helper renderer for each attendance toggle cell
  function renderAttendanceCell(
    team: Team,
    memberNumber: number,
    memberNameKey: keyof Team,
    fieldKey: AttendanceField,
    colIdx: number
  ) {
    const memberName = (team[memberNameKey] as string) || '';
    const hasMember = Boolean(memberName.trim());
    const isPresent = Boolean(team[fieldKey]);
    const isSelected = focusedSlNo === team.sl_no && focusedCol === colIdx;
    const isRemoteLocked = lockedByMap.has(team.sl_no);

    if (!hasMember) {
      // Disabled empty member slot (e.g. 2-member or 3-member team)
      return (
        <td
          key={colIdx}
          onClick={() => onFocusCell(team.sl_no, colIdx)}
          className={`px-2 py-2 text-center border-r border-zinc-200 dark:border-[#27272a] bg-zinc-100/50 dark:bg-[#0c0c0e]/60 cursor-not-allowed ${
            isSelected ? 'cell-selected' : ''
          }`}
          title="Slot empty"
        >
          <span className="text-zinc-300 dark:text-[#27272a] font-mono text-xs select-none">·</span>
        </td>
      );
    }

    return (
      <td
        key={colIdx}
        onClick={() => {
          onFocusCell(team.sl_no, colIdx);
          if (!isRemoteLocked) {
            onToggleAttendance(team.sl_no, fieldKey, !isPresent);
          }
        }}
        className={`px-2 py-2 text-center border-r border-zinc-200 dark:border-[#27272a] cursor-pointer transition-colors relative ${
          isSelected
            ? 'cell-selected bg-blue-500/10 dark:bg-white/5'
            : 'hover:bg-zinc-100 dark:hover:bg-[#1a1a1f]'
        }`}
        title={`${memberName}: ${isPresent ? 'Present (P)' : 'Absent (A)'} - Click or press Space/P/A`}
      >
        {isPresent ? (
          <span className="inline-flex items-center justify-center w-7 h-5 rounded-xs bg-[#2563eb] text-white text-[10px] font-mono font-semibold shadow-xs">
            <Check className="w-3 h-3 stroke-[2.5]" />
          </span>
        ) : (
          <span className="inline-flex items-center justify-center w-7 h-5 rounded-xs bg-zinc-200 dark:bg-[#1f1f23] text-zinc-500 dark:text-[#71717a] text-[10px] font-mono font-medium border border-zinc-300 dark:border-[#27272a]">
            —
          </span>
        )}
      </td>
    );
  }
}
