'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2,
  Plus,
  Trash2,
  Users,
  ChevronDown,
  ChevronRight,
  Phone,
  UserPlus,
  UserMinus,
  PencilLine,
  Check,
  X,
  GripVertical,
  AlertTriangle,
  RefreshCw,
  ArrowRightLeft,
} from 'lucide-react';
import {
  getClassrooms,
  addClassroom,
  removeClassroom,
  getTeams,
  addTeam,
  updateTeam,
  removeTeam,
  addParticipantToTeam,
  removeParticipantFromTeam,
} from '@/lib/dataService';
import { Team } from '@/lib/types';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
type Slot = 1 | 2 | 3 | 4;

interface EditingParticipant {
  teamId: number;
  slot: Slot;
  name: string;
  phone: string;
}

interface AddTeamForm {
  team_name: string;
  classroom_id: string;
  member_1: string;
  member_1_phone: string;
  member_2: string;
  member_2_phone: string;
  member_3: string;
  member_3_phone: string;
  member_4: string;
  member_4_phone: string;
}

const EMPTY_ADD_TEAM: AddTeamForm = {
  team_name: '',
  classroom_id: '401',
  member_1: '',
  member_1_phone: '',
  member_2: '',
  member_2_phone: '',
  member_3: '',
  member_3_phone: '',
  member_4: '',
  member_4_phone: '',
};

// ─────────────────────────────────────────────────────────────
// Helper: Member slot accessors
// ─────────────────────────────────────────────────────────────
function getMemberName(team: Team, slot: Slot): string {
  return (team[`member_${slot}` as keyof Team] as string) || '';
}
function getMemberPhone(team: Team, slot: Slot): string {
  return (team[`member_${slot}_phone` as keyof Team] as string) || '';
}

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────
export function RosterManager() {
  // Data
  const [classrooms, setClassrooms] = useState<string[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [feedback, setFeedback] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);

  // UI State
  const [expandedTeams, setExpandedTeams] = useState<Set<number>>(new Set());
  const [activeSection, setActiveSection] = useState<'classrooms' | 'teams'>('classrooms');

  // Classroom form
  const [newRoomInput, setNewRoomInput] = useState('');

  // Team add form
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [addTeamForm, setAddTeamForm] = useState<AddTeamForm>(EMPTY_ADD_TEAM);

  // Team reassign / rename
  const [reassigningTeam, setReassigningTeam] = useState<number | null>(null);
  const [reassignTarget, setReassignTarget] = useState('');
  const [renamingTeam, setRenamingTeam] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // Participant editing
  const [editingParticipant, setEditingParticipant] = useState<EditingParticipant | null>(null);

  // Search / filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRoom, setFilterRoom] = useState('ALL');

  // Confirm deletes
  const [confirmDeleteTeam, setConfirmDeleteTeam] = useState<number | null>(null);
  const [confirmDeleteRoom, setConfirmDeleteRoom] = useState<string | null>(null);

  const showFeedback = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 3000);
  };

  const reload = useCallback(() => {
    Promise.resolve(getClassrooms()).then(setClassrooms);
    setTeams(getTeams());
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  // ── Classroom handlers ───────────────────────────────────────
  const handleAddRoom = async () => {
    const val = newRoomInput.trim().toUpperCase();
    if (!val) return;
    if (classrooms.includes(val)) {
      showFeedback(`Room ${val} already exists`, 'err');
      return;
    }
    await addClassroom(val);
    setNewRoomInput('');
    reload();
    showFeedback(`Classroom ${val} added successfully`);
  };

  const handleRemoveRoom = async (roomId: string) => {
    await removeClassroom(roomId);
    setConfirmDeleteRoom(null);
    reload();
    showFeedback(`Classroom ${roomId} removed`);
  };

  // ── Team handlers ────────────────────────────────────────────
  const handleAddTeam = () => {
    if (!addTeamForm.team_name.trim()) {
      showFeedback('Team name is required', 'err');
      return;
    }
    if (!addTeamForm.member_1.trim()) {
      showFeedback('At least one team member (Member 1) is required', 'err');
      return;
    }
    const maxSlNo = Math.max(0, ...teams.map((t) => t.sl_no)) + 1;
    addTeam({
      sl_no: maxSlNo,
      team_name: addTeamForm.team_name.trim(),
      classroom_id: addTeamForm.classroom_id || classrooms[0] || '401',
      member_1: addTeamForm.member_1.trim(),
      member_1_phone: addTeamForm.member_1_phone.trim(),
      member_1_oct7: false,
      member_1_oct8: false,
      member_1_oct9: false,
      member_2: addTeamForm.member_2.trim(),
      member_2_phone: addTeamForm.member_2_phone.trim(),
      member_2_oct7: false,
      member_2_oct8: false,
      member_2_oct9: false,
      member_3: addTeamForm.member_3.trim(),
      member_3_phone: addTeamForm.member_3_phone.trim(),
      member_3_oct7: false,
      member_3_oct8: false,
      member_3_oct9: false,
      member_4: addTeamForm.member_4.trim(),
      member_4_phone: addTeamForm.member_4_phone.trim(),
      member_4_oct7: false,
      member_4_oct8: false,
      member_4_oct9: false,
      comments: '',
    });
    setAddTeamForm({ ...EMPTY_ADD_TEAM, classroom_id: addTeamForm.classroom_id });
    setShowAddTeam(false);
    reload();
    showFeedback(`Team "${addTeamForm.team_name.trim()}" added`);
  };

  const handleRemoveTeam = (teamId: number) => {
    removeTeam(teamId);
    setConfirmDeleteTeam(null);
    setExpandedTeams((prev) => {
      const next = new Set(prev);
      next.delete(teamId);
      return next;
    });
    reload();
    showFeedback('Team removed');
  };

  const handleRenameTeam = (teamId: number) => {
    if (!renameValue.trim()) return;
    updateTeam(teamId, { team_name: renameValue.trim() });
    setRenamingTeam(null);
    setRenameValue('');
    reload();
    showFeedback('Team renamed');
  };

  const handleReassignTeam = (teamId: number) => {
    if (!reassignTarget) return;
    updateTeam(teamId, { classroom_id: reassignTarget });
    setReassigningTeam(null);
    setReassignTarget('');
    reload();
    showFeedback('Team reassigned to room ' + reassignTarget);
  };

  // ── Participant handlers ─────────────────────────────────────
  const handleSaveParticipant = () => {
    if (!editingParticipant) return;
    const { teamId, slot, name, phone } = editingParticipant;
    if (name.trim()) {
      addParticipantToTeam(teamId, slot, name, phone);
    } else {
      removeParticipantFromTeam(teamId, slot);
    }
    setEditingParticipant(null);
    reload();
    showFeedback('Participant updated');
  };

  const handleRemoveParticipant = (teamId: number, slot: Slot) => {
    removeParticipantFromTeam(teamId, slot);
    reload();
    showFeedback('Participant removed');
  };

  // ── Filtered teams ───────────────────────────────────────────
  const filteredTeams = teams.filter((t) => {
    const matchesRoom = filterRoom === 'ALL' || t.classroom_id === filterRoom;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      t.team_name.toLowerCase().includes(q) ||
      ([1, 2, 3, 4] as Slot[]).some((s) =>
        getMemberName(t, s).toLowerCase().includes(q)
      );
    return matchesRoom && matchesSearch;
  });

  const teamsByRoom = (roomId: string) => filteredTeams.filter((t) => t.classroom_id === roomId);
  const unassignedTeams = filteredTeams.filter(
    (t) => !t.classroom_id || !classrooms.includes(t.classroom_id)
  );

  const memberSlots = [1, 2, 3, 4] as Slot[];
  const totalParticipants = teams.reduce(
    (acc, t) => acc + memberSlots.filter((s) => getMemberName(t, s)).length,
    0
  );

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-800">
        <div>
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <GripVertical className="w-4 h-4 text-violet-400" />
            Roster Management
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Manage classrooms, teams, and participant slots in real time
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-zinc-400">
            {classrooms.length} rooms · {teams.length} teams · {totalParticipants} participants
          </span>
          <button
            onClick={reload}
            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
            title="Reload roster"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3 rounded-lg border text-xs font-mono flex items-center gap-2 transition-all ${
            feedback.type === 'ok'
              ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
              : 'bg-red-950/60 border-red-500/50 text-red-300'
          }`}
        >
          {feedback.type === 'ok' ? (
            <Check className="w-3.5 h-3.5 shrink-0" />
          ) : (
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          )}
          {feedback.msg}
        </div>
      )}

      {/* Section Switcher */}
      <div className="flex items-center gap-1.5 p-1 bg-zinc-900 rounded-xl border border-zinc-800 w-fit">
        <button
          onClick={() => setActiveSection('classrooms')}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
            activeSection === 'classrooms'
              ? 'bg-violet-600 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          Classrooms
        </button>
        <button
          onClick={() => setActiveSection('teams')}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
            activeSection === 'teams'
              ? 'bg-violet-600 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Teams &amp; Participants
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* SECTION: CLASSROOMS                                    */}
      {/* ═══════════════════════════════════════════════════════ */}
      {activeSection === 'classrooms' && (
        <div className="space-y-4">
          {/* Add classroom */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-violet-400" />
              <h3 className="text-sm font-semibold text-white">Add Classroom</h3>
            </div>
            <p className="text-xs text-zinc-400">
              Enter a room ID (e.g.{' '}
              <code className="text-violet-300 font-mono">409</code> or{' '}
              <code className="text-violet-300 font-mono">LAB1</code>). It will appear on the home
              screen and be available for team assignment.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={newRoomInput}
                onChange={(e) => setNewRoomInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddRoom()}
                placeholder="Room ID (e.g. 409)"
                className="flex-1 px-3 py-2 text-xs font-mono bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500"
              />
              <button
                onClick={handleAddRoom}
                disabled={!newRoomInput.trim()}
                className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-30 text-white text-xs font-semibold transition-colors inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Room
              </button>
            </div>
          </div>

          {/* Existing classrooms grid */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-5 space-y-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              Active Classrooms
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-violet-950 text-violet-400 border border-violet-800/50">
                {classrooms.length} rooms
              </span>
            </h3>

            {classrooms.length === 0 ? (
              <div className="py-8 text-center text-xs font-mono text-zinc-500">
                No classrooms configured
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {classrooms.map((roomId) => {
                  const count = teams.filter((t) => t.classroom_id === roomId).length;
                  const isConfirmingDelete = confirmDeleteRoom === roomId;
                  return (
                    <div
                      key={roomId}
                      className={`relative rounded-xl border p-3.5 flex flex-col gap-2 transition-all ${
                        isConfirmingDelete
                          ? 'border-red-500/60 bg-red-950/20'
                          : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-600'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center font-mono font-bold text-sm border ${
                            isConfirmingDelete
                              ? 'bg-red-950 text-red-400 border-red-700'
                              : 'bg-zinc-950 text-white border-zinc-700'
                          }`}
                        >
                          {roomId}
                        </div>
                        {isConfirmingDelete ? (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleRemoveRoom(roomId)}
                              className="p-1 rounded bg-red-600 hover:bg-red-500 text-white transition-colors"
                              title="Confirm delete"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => setConfirmDeleteRoom(null)}
                              className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                              title="Cancel"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteRoom(roomId)}
                            className="p-1 rounded hover:bg-red-950/40 text-zinc-500 hover:text-red-400 transition-colors"
                            title="Remove classroom"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white">Room {roomId}</div>
                        <div className="text-[10px] font-mono text-zinc-400 mt-0.5">
                          {count} team{count !== 1 ? 's' : ''}
                        </div>
                      </div>
                      {isConfirmingDelete && (
                        <div className="text-[10px] text-red-300 font-mono leading-relaxed">
                          Removes this classroom and its local participant data. Confirm?
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* SECTION: TEAMS & PARTICIPANTS                          */}
      {/* ═══════════════════════════════════════════════════════ */}
      {activeSection === 'teams' && (
        <div className="space-y-4">
          {/* Controls row */}
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex gap-2 flex-wrap items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search team or member..."
                className="px-3 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 w-52"
              />
              <div className="flex items-center gap-1 flex-wrap">
                {['ALL', ...classrooms].map((r) => (
                  <button
                    key={r}
                    onClick={() => setFilterRoom(r)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-colors ${
                      filterRoom === r
                        ? 'bg-violet-600 text-white font-bold'
                        : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                setAddTeamForm({ ...EMPTY_ADD_TEAM, classroom_id: classrooms[0] || '401' });
                setShowAddTeam(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-colors shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              Add New Team
            </button>
          </div>

          {/* Add Team form */}
          {showAddTeam && (
            <div className="rounded-xl border border-violet-700/50 bg-violet-950/20 p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-violet-400" />
                  Add New Team
                </h3>
                <button
                  onClick={() => setShowAddTeam(false)}
                  className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">
                    Team Name *
                  </label>
                  <input
                    type="text"
                    value={addTeamForm.team_name}
                    onChange={(e) => setAddTeamForm((p) => ({ ...p, team_name: e.target.value }))}
                    placeholder="e.g. TEAM PHOENIX"
                    className="w-full px-3 py-2 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">
                    Assign to Classroom
                  </label>
                  <select
                    value={addTeamForm.classroom_id}
                    onChange={(e) =>
                      setAddTeamForm((p) => ({ ...p, classroom_id: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-xs font-mono bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-violet-500"
                  >
                    {classrooms.map((r) => (
                      <option key={r} value={r}>
                        Room {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-[11px] font-mono uppercase text-zinc-400">
                  Team Members (up to 4)
                </div>
                {memberSlots.map((slot) => (
                  <div key={slot} className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={addTeamForm[`member_${slot}` as keyof AddTeamForm]}
                      onChange={(e) =>
                        setAddTeamForm((p) => ({ ...p, [`member_${slot}`]: e.target.value }))
                      }
                      placeholder={`Member ${slot}${slot === 1 ? ' (Team Lead) *' : ' name'}`}
                      className="px-3 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500"
                    />
                    <input
                      type="tel"
                      value={addTeamForm[`member_${slot}_phone` as keyof AddTeamForm]}
                      onChange={(e) =>
                        setAddTeamForm((p) => ({
                          ...p,
                          [`member_${slot}_phone`]: e.target.value,
                        }))
                      }
                      placeholder={`Phone ${slot}`}
                      className="px-3 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500"
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setShowAddTeam(false)}
                  className="flex-1 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddTeam}
                  className="flex-1 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-colors inline-flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Team
                </button>
              </div>
            </div>
          )}

          {/* Teams list — grouped by room */}
          {filteredTeams.length === 0 ? (
            <div className="py-16 text-center text-xs font-mono text-zinc-500">
              No teams match your filter
            </div>
          ) : (
            <div className="space-y-6">
              {[...classrooms, '__unassigned__'].map((roomId) => {
                const roomTeams =
                  roomId === '__unassigned__' ? unassignedTeams : teamsByRoom(roomId);
                if (roomTeams.length === 0) return null;
                return (
                  <div key={roomId} className="space-y-2">
                    {/* Room group header */}
                    <div className="flex items-center gap-2 py-1.5 border-b border-zinc-800/60">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs border ${
                          roomId === '__unassigned__'
                            ? 'bg-orange-950/60 text-orange-400 border-orange-800/50'
                            : 'bg-zinc-900 text-zinc-200 border-zinc-700'
                        }`}
                      >
                        {roomId === '__unassigned__' ? '?' : roomId}
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-white">
                          {roomId === '__unassigned__' ? 'Unassigned' : `Room ${roomId}`}
                        </span>
                        <span className="ml-2 text-[10px] font-mono text-zinc-400">
                          {roomTeams.length} team{roomTeams.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>

                    {/* Team cards */}
                    <div className="space-y-2">
                      {roomTeams.map((team) => {
                        const isExpanded = expandedTeams.has(team.id);
                        const isConfirmDelete = confirmDeleteTeam === team.id;
                        const isRenaming = renamingTeam === team.id;
                        const isReassigning = reassigningTeam === team.id;
                        const memberCount = memberSlots.filter((s) =>
                          getMemberName(team, s)
                        ).length;

                        return (
                          <div
                            key={team.id}
                            className={`rounded-xl border transition-all overflow-hidden ${
                              isConfirmDelete
                                ? 'border-red-500/50 bg-red-950/10'
                                : 'border-zinc-800 bg-zinc-950/70'
                            }`}
                          >
                            {/* Team header row */}
                            <div className="flex items-center gap-2 px-3 py-2.5">
                              <button
                                onClick={() =>
                                  setExpandedTeams((prev) => {
                                    const next = new Set(prev);
                                    isExpanded ? next.delete(team.id) : next.add(team.id);
                                    return next;
                                  })
                                }
                                className="text-zinc-500 hover:text-zinc-300 transition-colors shrink-0"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                              </button>

                              <span className="text-[10px] font-mono text-zinc-500 w-6 shrink-0">
                                #{team.sl_no}
                              </span>

                              {/* Rename input or team name */}
                              {isRenaming ? (
                                <div className="flex items-center gap-1.5 flex-1">
                                  <input
                                    autoFocus
                                    type="text"
                                    value={renameValue}
                                    onChange={(e) => setRenameValue(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleRenameTeam(team.id);
                                      if (e.key === 'Escape') setRenamingTeam(null);
                                    }}
                                    className="flex-1 px-2 py-0.5 text-xs bg-zinc-900 border border-violet-500 rounded text-white focus:outline-none"
                                  />
                                  <button
                                    onClick={() => handleRenameTeam(team.id)}
                                    className="p-1 rounded bg-violet-600 hover:bg-violet-500 text-white"
                                  >
                                    <Check className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => setRenamingTeam(null)}
                                    className="p-1 rounded bg-zinc-800 text-zinc-400"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-xs font-semibold text-white flex-1 truncate">
                                  {team.team_name}
                                </span>
                              )}

                              <span className="text-[10px] font-mono text-zinc-500 shrink-0">
                                {memberCount}/4
                              </span>

                              {!isRenaming && !isConfirmDelete && (
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    onClick={() => {
                                      setRenamingTeam(team.id);
                                      setRenameValue(team.team_name);
                                    }}
                                    className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-200 transition-colors"
                                    title="Rename team"
                                  >
                                    <PencilLine className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setReassigningTeam(team.id);
                                      setReassignTarget(team.classroom_id || classrooms[0] || '401');
                                      if (!isExpanded)
                                        setExpandedTeams((p) => {
                                          const n = new Set(p);
                                          n.add(team.id);
                                          return n;
                                        });
                                    }}
                                    className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-blue-400 transition-colors"
                                    title="Reassign room"
                                  >
                                    <ArrowRightLeft className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setConfirmDeleteTeam(team.id)}
                                    className="p-1 rounded hover:bg-red-950/40 text-zinc-500 hover:text-red-400 transition-colors"
                                    title="Remove team"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}

                              {isConfirmDelete && (
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className="text-[10px] text-red-400 font-mono">Delete?</span>
                                  <button
                                    onClick={() => handleRemoveTeam(team.id)}
                                    className="px-2 py-0.5 rounded bg-red-600 hover:bg-red-500 text-white text-[10px] font-mono"
                                  >
                                    Yes
                                  </button>
                                  <button
                                    onClick={() => setConfirmDeleteTeam(null)}
                                    className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px] font-mono"
                                  >
                                    No
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Expanded panel: Reassign + Participants */}
                            {isExpanded && (
                              <div className="border-t border-zinc-800/60 px-3 py-3 space-y-3">
                                {/* Reassign row */}
                                {isReassigning && (
                                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-blue-950/20 border border-blue-800/30">
                                    <ArrowRightLeft className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                    <span className="text-[11px] font-mono text-blue-300">
                                      Move to:
                                    </span>
                                    <select
                                      value={reassignTarget}
                                      onChange={(e) => setReassignTarget(e.target.value)}
                                      className="flex-1 px-2 py-1 text-xs font-mono bg-zinc-900 border border-blue-700/50 rounded text-white focus:outline-none"
                                    >
                                      {classrooms.map((r) => (
                                        <option key={r} value={r}>
                                          Room {r}
                                        </option>
                                      ))}
                                    </select>
                                    <button
                                      onClick={() => handleReassignTeam(team.id)}
                                      className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-mono inline-flex items-center gap-1"
                                    >
                                      <Check className="w-3 h-3" />
                                      Move
                                    </button>
                                    <button
                                      onClick={() => setReassigningTeam(null)}
                                      className="p-1 rounded bg-zinc-800 text-zinc-400"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                )}

                                {/* Participant slots */}
                                <div className="space-y-1.5">
                                  {memberSlots.map((slot) => {
                                    const name = getMemberName(team, slot);
                                    const phone = getMemberPhone(team, slot);
                                    const isEditingThis =
                                      editingParticipant?.teamId === team.id &&
                                      editingParticipant?.slot === slot;

                                    return (
                                      <div
                                        key={slot}
                                        className={`rounded-lg border px-3 py-2 flex items-center gap-2 text-xs transition-all ${
                                          isEditingThis
                                            ? 'border-violet-500/50 bg-violet-950/10'
                                            : name
                                            ? 'border-zinc-800 bg-zinc-900/40'
                                            : 'border-zinc-800/40 bg-zinc-900/20 border-dashed'
                                        }`}
                                      >
                                        {/* Slot badge */}
                                        <span
                                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                            slot === 1
                                              ? 'bg-amber-950 text-amber-400 border border-amber-800/60'
                                              : 'bg-zinc-800 text-zinc-400'
                                          }`}
                                        >
                                          {slot}
                                        </span>

                                        {isEditingThis ? (
                                          <div className="flex-1 flex flex-col sm:flex-row gap-1.5">
                                            <input
                                              autoFocus
                                              type="text"
                                              value={editingParticipant.name}
                                              onChange={(e) =>
                                                setEditingParticipant((p) =>
                                                  p ? { ...p, name: e.target.value } : null
                                                )
                                              }
                                              placeholder="Full name"
                                              className="flex-1 px-2 py-0.5 text-xs bg-zinc-900 border border-violet-500/50 rounded text-white focus:outline-none"
                                            />
                                            <input
                                              type="tel"
                                              value={editingParticipant.phone}
                                              onChange={(e) =>
                                                setEditingParticipant((p) =>
                                                  p ? { ...p, phone: e.target.value } : null
                                                )
                                              }
                                              placeholder="Phone"
                                              className="flex-1 sm:max-w-[160px] px-2 py-0.5 text-xs bg-zinc-900 border border-zinc-700 rounded text-white focus:outline-none"
                                            />
                                            <div className="flex gap-1 shrink-0">
                                              <button
                                                onClick={handleSaveParticipant}
                                                className="px-2.5 py-1 rounded bg-violet-600 hover:bg-violet-500 text-white text-[10px] font-mono inline-flex items-center gap-1"
                                              >
                                                <Check className="w-3 h-3" />
                                                Save
                                              </button>
                                              <button
                                                onClick={() => setEditingParticipant(null)}
                                                className="px-2 py-1 rounded bg-zinc-800 text-zinc-400 text-[10px]"
                                              >
                                                <X className="w-3 h-3" />
                                              </button>
                                            </div>
                                          </div>
                                        ) : name ? (
                                          <>
                                            <div className="flex-1 min-w-0">
                                              <div className="text-white font-medium truncate flex items-center gap-1.5">
                                                {name}
                                                {slot === 1 && (
                                                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-400 border border-amber-800/40">
                                                    LEAD
                                                  </span>
                                                )}
                                              </div>
                                              {phone && (
                                                <div className="flex items-center gap-1 text-[10px] text-zinc-400 mt-0.5">
                                                  <Phone className="w-2.5 h-2.5" />
                                                  {phone}
                                                </div>
                                              )}
                                            </div>
                                            <div className="flex gap-1 shrink-0">
                                              <button
                                                onClick={() =>
                                                  setEditingParticipant({
                                                    teamId: team.id,
                                                    slot,
                                                    name,
                                                    phone,
                                                  })
                                                }
                                                className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-200 transition-colors"
                                                title="Edit participant"
                                              >
                                                <PencilLine className="w-3.5 h-3.5" />
                                              </button>
                                              <button
                                                onClick={() =>
                                                  handleRemoveParticipant(team.id, slot)
                                                }
                                                className="p-1 rounded hover:bg-red-950/40 text-zinc-500 hover:text-red-400 transition-colors"
                                                title="Remove participant"
                                              >
                                                <UserMinus className="w-3.5 h-3.5" />
                                              </button>
                                            </div>
                                          </>
                                        ) : (
                                          <>
                                            <span className="flex-1 text-zinc-600 font-mono text-[11px]">
                                              {slot === 1 ? 'Empty (Team Lead slot)' : `Empty slot ${slot}`}
                                            </span>
                                            <button
                                              onClick={() =>
                                                setEditingParticipant({
                                                  teamId: team.id,
                                                  slot,
                                                  name: '',
                                                  phone: '',
                                                })
                                              }
                                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-dashed border-zinc-700 text-zinc-500 hover:text-violet-400 hover:border-violet-600 transition-colors text-[10px] font-mono shrink-0"
                                            >
                                              <UserPlus className="w-3 h-3" />
                                              Add
                                            </button>
                                          </>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
