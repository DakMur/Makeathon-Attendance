'use client';

import React, { useState } from 'react';
import { Download, Check } from 'lucide-react';
import { Team } from '@/lib/types';

interface ExportCsvButtonProps {
  teams: Team[];
}

export function ExportCsvButton({ teams }: ExportCsvButtonProps) {
  const [downloaded, setDownloaded] = useState(false);

  const handleExport = () => {
    // CSV Header matching prompt specs:
    // Sl. No, Team Name, Member Name, Oct 7 Attendance, Oct 8 Attendance, Oct 9 Attendance, Comments
    const headers = [
      'Sl. No',
      'Team Name',
      'Member Role',
      'Member Name',
      'Oct 7 Attendance',
      'Oct 8 Attendance',
      'Oct 9 Attendance',
      'Comments',
    ];

    const rows: string[][] = [];

    teams.forEach((team) => {
      const members = [
        {
          role: 'Member 1',
          name: team.member_1,
          oct7: team.member_1_oct7,
          oct8: team.member_1_oct8,
          oct9: team.member_1_oct9,
        },
        {
          role: 'Member 2',
          name: team.member_2,
          oct7: team.member_2_oct7,
          oct8: team.member_2_oct8,
          oct9: team.member_2_oct9,
        },
        {
          role: 'Member 3',
          name: team.member_3,
          oct7: team.member_3_oct7,
          oct8: team.member_3_oct8,
          oct9: team.member_3_oct9,
        },
        {
          role: 'Member 4',
          name: team.member_4,
          oct7: team.member_4_oct7,
          oct8: team.member_4_oct8,
          oct9: team.member_4_oct9,
        },
      ];

      members.forEach((m) => {
        if (m.name && m.name.trim() !== '') {
          rows.push([
            String(team.sl_no),
            `"${(team.team_name || '').replace(/"/g, '""')}"`,
            `"${m.role}"`,
            `"${(m.name || '').replace(/"/g, '""')}"`,
            m.oct7 ? 'PRESENT' : 'ABSENT',
            m.oct8 ? 'PRESENT' : 'ABSENT',
            m.oct9 ? 'PRESENT' : 'ABSENT',
            `"${(team.comments || '').replace(/"/g, '""')}"`,
          ]);
        }
      });
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'attendance_oct_7_8_9.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2500);
  };

  return (
    <button
      onClick={handleExport}
      id="export-csv-btn"
      className="inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-[#18181b] dark:hover:bg-[#27272a] text-xs font-mono font-medium text-zinc-900 dark:text-white border border-zinc-300 dark:border-[#27272a] hover:border-zinc-400 dark:hover:border-[#3f3f46] transition-colors rounded-sm shadow-sm"
      title="Export CSV (attendance_oct_7_8_9.csv)"
    >
      {downloaded ? (
        <>
          <Check className="w-3.5 h-3.5 text-blue-500" />
          <span className="text-zinc-900 dark:text-white">Exported</span>
        </>
      ) : (
        <>
          <Download className="w-3.5 h-3.5 text-zinc-500 dark:text-[#a1a1aa]" />
          <span>Export CSV</span>
        </>
      )}
    </button>
  );
}
