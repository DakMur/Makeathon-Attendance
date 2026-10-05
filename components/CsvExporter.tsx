'use client';

import React, { useState } from 'react';
import { Download, FileSpreadsheet, Check, Clock, Users } from 'lucide-react';
import { Team, ClassroomPresence, ClassroomActionLog } from '@/lib/types';

interface CsvExporterProps {
  teams?: Team[];
  presences?: ClassroomPresence[];
  actionLogs?: ClassroomActionLog[];
}

export function CsvExporter({ teams = [], presences = [], actionLogs = [] }: CsvExporterProps) {
  const [downloadedType, setDownloadedType] = useState<string | null>(null);

  const downloadFile = (csvContent: string, fileName: string, typeKey: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadedType(typeKey);
    setTimeout(() => setDownloadedType(null), 3000);
  };

  // 1. Export Master Attendance Roster
  const exportMasterRoster = () => {
    const headers = [
      'Sl No',
      'Team Name',
      'Classroom',
      'Member 1 Name',
      'Member 1 Phone',
      'Member 1 Oct 7',
      'Member 1 Oct 8',
      'Member 1 Oct 9',
      'Member 2 Name',
      'Member 2 Phone',
      'Member 2 Oct 7',
      'Member 2 Oct 8',
      'Member 2 Oct 9',
      'Member 3 Name',
      'Member 3 Phone',
      'Member 3 Oct 7',
      'Member 3 Oct 8',
      'Member 3 Oct 9',
      'Member 4 Name',
      'Member 4 Phone',
      'Member 4 Oct 7',
      'Member 4 Oct 8',
      'Member 4 Oct 9',
      'Comments',
    ];

    const rows = teams.map((t) => [
      t.sl_no,
      `"${(t.team_name || '').replace(/"/g, '""')}"`,
      t.classroom_id || '',
      `"${(t.member_1 || '').replace(/"/g, '""')}"`,
      `"${(t.member_1_phone || '').replace(/"/g, '""')}"`,
      t.member_1_oct7 ? 'PRESENT' : 'ABSENT',
      t.member_1_oct8 ? 'PRESENT' : 'ABSENT',
      t.member_1_oct9 ? 'PRESENT' : 'ABSENT',
      `"${(t.member_2 || '').replace(/"/g, '""')}"`,
      `"${(t.member_2_phone || '').replace(/"/g, '""')}"`,
      t.member_2_oct7 ? 'PRESENT' : 'ABSENT',
      t.member_2_oct8 ? 'PRESENT' : 'ABSENT',
      t.member_2_oct9 ? 'PRESENT' : 'ABSENT',
      `"${(t.member_3 || '').replace(/"/g, '""')}"`,
      `"${(t.member_3_phone || '').replace(/"/g, '""')}"`,
      t.member_3_oct7 ? 'PRESENT' : 'ABSENT',
      t.member_3_oct8 ? 'PRESENT' : 'ABSENT',
      t.member_3_oct9 ? 'PRESENT' : 'ABSENT',
      `"${(t.member_4 || '').replace(/"/g, '""')}"`,
      `"${(t.member_4_phone || '').replace(/"/g, '""')}"`,
      t.member_4_oct7 ? 'PRESENT' : 'ABSENT',
      t.member_4_oct8 ? 'PRESENT' : 'ABSENT',
      t.member_4_oct9 ? 'PRESENT' : 'ABSENT',
      `"${(t.comments || '').replace(/"/g, '""')}"`,
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    downloadFile(csv, `Makeathon_Master_Attendance_${new Date().toISOString().slice(0, 10)}.csv`, 'roster');
  };

  // 2. Export Live Classroom Presence
  const exportPresence = () => {
    const headers = [
      'Day',
      'Classroom',
      'Team Name',
      'Participant Name',
      'Phone Number',
      'Is Team Lead',
      'Current Status',
      'Last Toggle Timestamp',
      'Updated By',
    ];

    const rows = presences.map((p) => [
      p.day_number,
      p.classroom_id,
      `"${(p.team_name || '').replace(/"/g, '""')}"`,
      `"${(p.participant_name || '').replace(/"/g, '""')}"`,
      `"${(p.phone_number || '').replace(/"/g, '""')}"`,
      p.is_team_lead ? 'YES' : 'NO',
      p.is_in_room ? 'IN ROOM' : 'OUT',
      p.last_toggle_time,
      `"${(p.updated_by || '').replace(/"/g, '""')}"`,
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    downloadFile(csv, `Makeathon_Live_Presence_${new Date().toISOString().slice(0, 10)}.csv`, 'presence');
  };

  // 3. Export Action Logs Timeline
  const exportLogs = () => {
    const headers = [
      'Timestamp (ISO)',
      'Local Time',
      'Day',
      'Classroom',
      'Action Type',
      'Affected Count',
      'Executed By',
    ];

    const rows = actionLogs.map((l) => [
      l.created_at,
      new Date(l.created_at).toLocaleString(),
      l.day_number,
      l.classroom_id,
      `"${(l.action_type || '').replace(/"/g, '""')}"`,
      l.affected_count,
      `"${(l.executed_by || '').replace(/"/g, '""')}"`,
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    downloadFile(csv, `Makeathon_Action_Timeline_${new Date().toISOString().slice(0, 10)}.csv`, 'logs');
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={exportMasterRoster}
        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-mono font-medium rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80 transition-colors shadow-xs"
      >
        {downloadedType === 'roster' ? (
          <Check className="w-3.5 h-3.5 text-emerald-400" />
        ) : (
          <FileSpreadsheet className="w-3.5 h-3.5 text-blue-400" />
        )}
        <span>Export Roster CSV</span>
      </button>

      <button
        type="button"
        onClick={exportPresence}
        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-mono font-medium rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80 transition-colors shadow-xs"
      >
        {downloadedType === 'presence' ? (
          <Check className="w-3.5 h-3.5 text-emerald-400" />
        ) : (
          <Users className="w-3.5 h-3.5 text-emerald-400" />
        )}
        <span>Export Presence CSV</span>
      </button>

      <button
        type="button"
        onClick={exportLogs}
        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-mono font-medium rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80 transition-colors shadow-xs"
      >
        {downloadedType === 'logs' ? (
          <Check className="w-3.5 h-3.5 text-emerald-400" />
        ) : (
          <Clock className="w-3.5 h-3.5 text-amber-400" />
        )}
        <span>Export Action Logs CSV</span>
      </button>
    </div>
  );
}
