import { supabase, isSupabaseConfigured } from './supabaseClient';
import {
  Team,
  CardPassword,
  ClassroomPresence,
  ClassroomActionLog,
  Notice,
  CoordinatorPing,
  SystemSettings,
} from './types';
import {
  DEFAULT_PASSWORDS,
  DEFAULT_COORDINATORS,
  DEFAULT_QUICK_ACTIONS,
  INITIAL_TEAMS,
  getInitialClassroomPresence,
} from './defaultTeams';

// Storage keys for local fallback
const STORAGE_KEYS = {
  PASSWORDS: 'makeathon_card_passwords',
  SETTINGS: 'makeathon_system_settings',
  PRESENCE: 'makeathon_classroom_presence',
  ACTION_LOGS: 'makeathon_action_logs',
  NOTICES: 'makeathon_notices',
  PINGS: 'makeathon_coordinator_pings',
  TEAMS: 'makeathon_teams_data',
};

// Default system settings
export const DEFAULT_SETTINGS: SystemSettings = {
  current_day: 1,
  day_turnover_time: '00:00',
  quick_action_buttons: DEFAULT_QUICK_ACTIONS,
  classroom_coordinators: DEFAULT_COORDINATORS,
};

// Safe local storage helpers
function getLocalItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    console.warn(`Error reading localStorage key ${key}`, e);
    return defaultValue;
  }
}

function setLocalItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    // Trigger custom event for multi-tab sync when in mock mode
    window.dispatchEvent(new CustomEvent('makeathon_storage_sync', { detail: { key, value } }));
  } catch (e) {
    console.warn(`Error saving to localStorage key ${key}`, e);
  }
}

// -----------------------------------------------------------------------------
// 1. CARD PASSWORDS & ROUTE GUARD
// -----------------------------------------------------------------------------
export async function verifyCardPassword(cardId: string, inputPasscode: string): Promise<boolean> {
  const trimmed = inputPasscode.trim();

  // Try Supabase first
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('card_passwords')
        .select('password_hash')
        .eq('card_id', cardId)
        .maybeSingle();

      if (!error && data && data.password_hash) {
        return data.password_hash === trimmed;
      }
    } catch (e) {
      console.warn('Supabase password check fallback to local:', e);
    }
  }

  // Fallback to local storage or defaults
  const localPasswords = getLocalItem<Record<string, string>>(STORAGE_KEYS.PASSWORDS, DEFAULT_PASSWORDS);
  const expected = localPasswords[cardId] || DEFAULT_PASSWORDS[cardId];
  return expected === trimmed;
}

export async function updateCardPassword(cardId: string, newPasscode: string): Promise<boolean> {
  const trimmed = newPasscode.trim();

  // Update locally first
  const localPasswords = getLocalItem<Record<string, string>>(STORAGE_KEYS.PASSWORDS, DEFAULT_PASSWORDS);
  localPasswords[cardId] = trimmed;
  setLocalItem(STORAGE_KEYS.PASSWORDS, localPasswords);

  // Sync to Supabase
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('card_passwords').upsert(
        {
          card_id: cardId,
          password_hash: trimmed,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'card_id' }
      );
      if (error) console.warn('Supabase password upsert error:', error);
      return !error;
    } catch (e) {
      console.warn('Supabase password update failed:', e);
    }
  }

  return true;
}

export async function getAllCardPasswords(): Promise<Record<string, string>> {
  const localPasswords = getLocalItem<Record<string, string>>(STORAGE_KEYS.PASSWORDS, DEFAULT_PASSWORDS);

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from('card_passwords').select('card_id, password_hash');
      if (!error && data && data.length > 0) {
        const merged: Record<string, string> = { ...DEFAULT_PASSWORDS, ...localPasswords };
        data.forEach((row) => {
          if (row.card_id && row.password_hash) {
            merged[row.card_id] = row.password_hash;
          }
        });
        setLocalItem(STORAGE_KEYS.PASSWORDS, merged);
        return merged;
      }
    } catch (e) {
      console.warn('Supabase fetch passwords error:', e);
    }
  }

  return { ...DEFAULT_PASSWORDS, ...localPasswords };
}

// -----------------------------------------------------------------------------
// 2. SYSTEM SETTINGS
// -----------------------------------------------------------------------------
export async function getSystemSettings(): Promise<SystemSettings> {
  const local = getLocalItem<SystemSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from('system_settings').select('key, value');
      if (!error && data && data.length > 0) {
        const settings: SystemSettings = { ...DEFAULT_SETTINGS, ...local };
        data.forEach((row) => {
          if (row.key === 'current_day') settings.current_day = Number(row.value);
          if (row.key === 'day_turnover_time') settings.day_turnover_time = String(row.value);
          if (row.key === 'quick_action_buttons') settings.quick_action_buttons = row.value;
          if (row.key === 'classroom_coordinators') settings.classroom_coordinators = row.value;
        });
        setLocalItem(STORAGE_KEYS.SETTINGS, settings);
        return settings;
      }
    } catch (e) {
      console.warn('Supabase getSystemSettings error:', e);
    }
  }

  return local;
}

export async function updateSystemSetting<K extends keyof SystemSettings>(
  key: K,
  value: SystemSettings[K]
): Promise<boolean> {
  const local = getLocalItem<SystemSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  local[key] = value;
  setLocalItem(STORAGE_KEYS.SETTINGS, local);

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('system_settings').upsert(
        {
          key,
          value,
        },
        { onConflict: 'key' }
      );
      if (error) console.warn(`Supabase setting update error for ${key}:`, error);
      return !error;
    } catch (e) {
      console.warn('Supabase updateSystemSetting failed:', e);
    }
  }

  return true;
}

// -----------------------------------------------------------------------------
// 3. CLASSROOM PRESENCE (IN/OUT TRACKER)
// -----------------------------------------------------------------------------
export async function getClassroomPresence(
  roomId: string,
  dayNumber: number
): Promise<ClassroomPresence[]> {
  const local = getLocalItem<ClassroomPresence[]>(STORAGE_KEYS.PRESENCE, []);

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('classroom_presence')
        .select('*')
        .eq('classroom_id', roomId)
        .eq('day_number', dayNumber);

      if (!error && data && data.length > 0) {
        return data as ClassroomPresence[];
      } else if (!error && (!data || data.length === 0)) {
        // Need to seed if empty for this room and day
        const seeded = getInitialClassroomPresence(dayNumber).filter(
          (p) => p.classroom_id === roomId
        );
        if (seeded.length > 0) {
          try {
            await supabase.from('classroom_presence').insert(seeded);
          } catch (insertErr) {
            console.warn('Could not insert seed presence to Supabase:', insertErr);
          }
        }
        return seeded;
      }
    } catch (e) {
      console.warn('Supabase getClassroomPresence error:', e);
    }
  }

  // Fallback to local
  const roomPresences = local.filter(
    (p) => p.classroom_id === roomId && p.day_number === dayNumber
  );
  if (roomPresences.length > 0) {
    return roomPresences;
  }

  // Generate initial presence for this room
  const initial = getInitialClassroomPresence(dayNumber).filter(
    (p) => p.classroom_id === roomId
  );
  const updatedAll = [...local, ...initial];
  setLocalItem(STORAGE_KEYS.PRESENCE, updatedAll);
  return initial;
}

export async function getAllClassroomPresence(dayNumber: number): Promise<ClassroomPresence[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('classroom_presence')
        .select('*')
        .eq('day_number', dayNumber);

      if (!error && data && data.length > 0) {
        return data as ClassroomPresence[];
      }
    } catch (e) {
      console.warn('Supabase getAllClassroomPresence error:', e);
    }
  }

  const local = getLocalItem<ClassroomPresence[]>(STORAGE_KEYS.PRESENCE, []);
  const matching = local.filter((p) => p.day_number === dayNumber);
  if (matching.length > 0) return matching;

  const initial = getInitialClassroomPresence(dayNumber);
  setLocalItem(STORAGE_KEYS.PRESENCE, initial);
  return initial;
}

export async function toggleParticipantPresence(
  roomId: string,
  dayNumber: number,
  participantName: string,
  newIsInRoom: boolean,
  updatedBy: string = 'coordinator'
): Promise<boolean> {
  const timestamp = new Date().toISOString();

  // Update local
  const local = getLocalItem<ClassroomPresence[]>(STORAGE_KEYS.PRESENCE, []);
  let found = false;
  const updated = local.map((p) => {
    if (
      p.classroom_id === roomId &&
      p.day_number === dayNumber &&
      p.participant_name.toLowerCase() === participantName.toLowerCase()
    ) {
      found = true;
      return { ...p, is_in_room: newIsInRoom, last_toggle_time: timestamp, updated_by: updatedBy };
    }
    return p;
  });

  if (!found) {
    updated.push({
      day_number: dayNumber,
      classroom_id: roomId,
      team_name: 'Unknown',
      participant_name: participantName,
      is_team_lead: false,
      is_in_room: newIsInRoom,
      last_toggle_time: timestamp,
      updated_by: updatedBy,
    });
  }
  setLocalItem(STORAGE_KEYS.PRESENCE, updated);

  // Sync to Supabase
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase
        .from('classroom_presence')
        .update({
          is_in_room: newIsInRoom,
          last_toggle_time: timestamp,
          updated_by: updatedBy,
        })
        .match({
          classroom_id: roomId,
          day_number: dayNumber,
          participant_name: participantName,
        });

      if (error) console.warn('Supabase toggle presence error:', error);
      return !error;
    } catch (e) {
      console.warn('Supabase toggleParticipantPresence failed:', e);
    }
  }

  return true;
}

export async function bulkSetRoomPresence(
  roomId: string,
  dayNumber: number,
  isInRoom: boolean,
  actionType: string,
  executedBy: string = 'coordinator'
): Promise<{ affectedCount: number }> {
  const timestamp = new Date().toISOString();
  let affected = 0;

  // Local update
  const local = getLocalItem<ClassroomPresence[]>(STORAGE_KEYS.PRESENCE, []);
  const updated = local.map((p) => {
    if (p.classroom_id === roomId && p.day_number === dayNumber) {
      affected++;
      return { ...p, is_in_room: isInRoom, last_toggle_time: timestamp, updated_by: executedBy };
    }
    return p;
  });
  setLocalItem(STORAGE_KEYS.PRESENCE, updated);

  // Log action
  await logClassroomAction({
    day_number: dayNumber,
    classroom_id: roomId,
    action_type: actionType,
    executed_by: executedBy,
    affected_count: affected,
    created_at: timestamp,
  });

  // Supabase update
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase
        .from('classroom_presence')
        .update({
          is_in_room: isInRoom,
          last_toggle_time: timestamp,
          updated_by: executedBy,
        })
        .match({
          classroom_id: roomId,
          day_number: dayNumber,
        });
    } catch (e) {
      console.warn('Supabase bulkSetRoomPresence failed:', e);
    }
  }

  return { affectedCount: affected };
}

// -----------------------------------------------------------------------------
// 4. ACTION LOGS & TIMELINE
// -----------------------------------------------------------------------------
export async function logClassroomAction(
  actionLog: Omit<ClassroomActionLog, 'id'>
): Promise<ClassroomActionLog> {
  const localLogs = getLocalItem<ClassroomActionLog[]>(STORAGE_KEYS.ACTION_LOGS, []);
  const newLog: ClassroomActionLog = {
    id: Date.now(),
    ...actionLog,
    created_at: actionLog.created_at || new Date().toISOString(),
  };
  const updatedLogs = [newLog, ...localLogs];
  setLocalItem(STORAGE_KEYS.ACTION_LOGS, updatedLogs);

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('classroom_action_logs')
        .insert({
          day_number: actionLog.day_number,
          classroom_id: actionLog.classroom_id,
          action_type: actionLog.action_type,
          executed_by: actionLog.executed_by,
          affected_count: actionLog.affected_count,
        })
        .select()
        .single();

      if (!error && data) return data as ClassroomActionLog;
    } catch (e) {
      console.warn('Supabase logClassroomAction error:', e);
    }
  }

  return newLog;
}

export async function getActionLogs(limit: number = 100): Promise<ClassroomActionLog[]> {
  const localLogs = getLocalItem<ClassroomActionLog[]>(STORAGE_KEYS.ACTION_LOGS, []);

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('classroom_action_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!error && data && data.length > 0) {
        return data as ClassroomActionLog[];
      }
    } catch (e) {
      console.warn('Supabase getActionLogs error:', e);
    }
  }

  return localLogs.slice(0, limit);
}

// -----------------------------------------------------------------------------
// 5. NOTICES & BROADCASTS
// -----------------------------------------------------------------------------
export async function getNotices(roomId?: string): Promise<Notice[]> {
  const localNotices = getLocalItem<Notice[]>(STORAGE_KEYS.NOTICES, []);

  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase.from('notices').select('*').order('created_at', { ascending: false });
      if (roomId && roomId !== 'ALL') {
        query = query.or(`target_room.eq.ALL,target_room.eq.${roomId}`);
      }
      const { data, error } = await query;
      if (!error && data) {
        return data as Notice[];
      }
    } catch (e) {
      console.warn('Supabase getNotices error:', e);
    }
  }

  if (roomId && roomId !== 'ALL') {
    return localNotices.filter((n) => n.target_room === 'ALL' || n.target_room === roomId);
  }
  return localNotices;
}

export async function createNotice(targetRoom: string, message: string): Promise<Notice> {
  const newNotice: Notice = {
    id: Date.now(),
    target_room: targetRoom,
    message: message.trim(),
    is_active: true,
    created_at: new Date().toISOString(),
  };

  const local = getLocalItem<Notice[]>(STORAGE_KEYS.NOTICES, []);
  setLocalItem(STORAGE_KEYS.NOTICES, [newNotice, ...local]);

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('notices')
        .insert({
          target_room: targetRoom,
          message: message.trim(),
          is_active: true,
        })
        .select()
        .single();

      if (!error && data) return data as Notice;
    } catch (e) {
      console.warn('Supabase createNotice error:', e);
    }
  }

  return newNotice;
}

export async function toggleNoticeActive(id: number, isActive: boolean): Promise<boolean> {
  const local = getLocalItem<Notice[]>(STORAGE_KEYS.NOTICES, []);
  const updated = local.map((n) => (n.id === id ? { ...n, is_active: isActive } : n));
  setLocalItem(STORAGE_KEYS.NOTICES, updated);

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('notices').update({ is_active: isActive }).eq('id', id);
      return !error;
    } catch (e) {
      console.warn('Supabase toggleNoticeActive error:', e);
    }
  }
  return true;
}

export async function deleteNotice(id: number): Promise<boolean> {
  const local = getLocalItem<Notice[]>(STORAGE_KEYS.NOTICES, []);
  setLocalItem(STORAGE_KEYS.NOTICES, local.filter((n) => n.id !== id));

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('notices').delete().eq('id', id);
      return !error;
    } catch (e) {
      console.warn('Supabase deleteNotice error:', e);
    }
  }
  return true;
}

// -----------------------------------------------------------------------------
// 6. COORDINATOR SOS PINGS
// -----------------------------------------------------------------------------
export async function getCoordinatorPings(unresolvedOnly: boolean = false): Promise<CoordinatorPing[]> {
  const localPings = getLocalItem<CoordinatorPing[]>(STORAGE_KEYS.PINGS, []);

  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase.from('coordinator_pings').select('*').order('created_at', { ascending: false });
      if (unresolvedOnly) {
        query = query.eq('is_resolved', false);
      }
      const { data, error } = await query;
      if (!error && data) {
        return data as CoordinatorPing[];
      }
    } catch (e) {
      console.warn('Supabase getCoordinatorPings error:', e);
    }
  }

  if (unresolvedOnly) {
    return localPings.filter((p) => !p.is_resolved);
  }
  return localPings;
}

export async function sendCoordinatorPing(
  roomId: string,
  coordinatorName: string,
  message: string
): Promise<CoordinatorPing> {
  const newPing: CoordinatorPing = {
    id: Date.now(),
    classroom_id: roomId,
    coordinator_name: coordinatorName || 'Room Coordinator',
    message: message.trim(),
    is_resolved: false,
    created_at: new Date().toISOString(),
  };

  const local = getLocalItem<CoordinatorPing[]>(STORAGE_KEYS.PINGS, []);
  setLocalItem(STORAGE_KEYS.PINGS, [newPing, ...local]);

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('coordinator_pings')
        .insert({
          classroom_id: roomId,
          coordinator_name: coordinatorName || 'Room Coordinator',
          message: message.trim(),
          is_resolved: false,
        })
        .select()
        .single();

      if (!error && data) return data as CoordinatorPing;
    } catch (e) {
      console.warn('Supabase sendCoordinatorPing error:', e);
    }
  }

  return newPing;
}

export async function resolveCoordinatorPing(id: number): Promise<boolean> {
  const local = getLocalItem<CoordinatorPing[]>(STORAGE_KEYS.PINGS, []);
  const updated = local.map((p) => (p.id === id ? { ...p, is_resolved: true } : p));
  setLocalItem(STORAGE_KEYS.PINGS, updated);

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase
        .from('coordinator_pings')
        .update({ is_resolved: true })
        .eq('id', id);
      return !error;
    } catch (e) {
      console.warn('Supabase resolveCoordinatorPing error:', e);
    }
  }
  return true;
}
