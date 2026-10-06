export interface Team {
  id: number;
  sl_no: number;
  team_name: string;
  classroom_id?: string;
  member_1: string;
  member_1_phone?: string;
  member_1_oct7: boolean;
  member_1_oct8: boolean;
  member_1_oct9: boolean;
  member_2: string;
  member_2_phone?: string;
  member_2_oct7: boolean;
  member_2_oct8: boolean;
  member_2_oct9: boolean;
  member_3: string;
  member_3_phone?: string;
  member_3_oct7: boolean;
  member_3_oct8: boolean;
  member_3_oct9: boolean;
  member_4: string;
  member_4_phone?: string;
  member_4_oct7: boolean;
  member_4_oct8: boolean;
  member_4_oct9: boolean;
  comments: string;
  updated_at?: string;
}

export type AttendanceField = 
  | 'member_1_oct7' | 'member_1_oct8' | 'member_1_oct9'
  | 'member_2_oct7' | 'member_2_oct8' | 'member_2_oct9'
  | 'member_3_oct7' | 'member_3_oct8' | 'member_3_oct9'
  | 'member_4_oct7' | 'member_4_oct8' | 'member_4_oct9';

export interface GridCellCoordinate {
  teamIndex: number;
  colIndex: number;
}

export interface AdminPresence {
  id: string;
  adminSlot: 'admin_1' | 'admin_2' | 'admin_3' | 'admin_4';
  adminName: string;
  focusedSlNo: number | null;
  focusedField?: string | null;
  lastActive: number;
}

export interface CardPassword {
  card_id: string;
  password_hash: string;
  updated_at?: string;
}

export interface ClassroomPresence {
  id?: number;
  day_number: number;
  classroom_id: string;
  team_name: string;
  participant_name: string;
  phone_number?: string;
  is_team_lead: boolean;
  is_in_room: boolean;
  last_toggle_time: string;
  updated_by?: string;
}

export interface ClassroomActionLog {
  id?: number;
  day_number: number;
  classroom_id: string;
  action_type: string;
  executed_by: string;
  affected_count: number;
  created_at: string;
}

export interface Notice {
  id?: number;
  target_room: string;
  message: string;
  is_active: boolean;
  created_at: string;
}

export interface CoordinatorPing {
  id?: number;
  classroom_id: string;
  coordinator_name: string;
  message: string;
  is_resolved: boolean;
  created_at: string;
}

export interface SystemSettings {
  current_day: number;
  day_turnover_time: string;
  quick_action_buttons: string[];
  classroom_coordinators: Record<string, string[]>;
  is_system_locked?: boolean;
}

export interface ChatMessage {
  id?: number;
  channel_id: string; // 'admin_global' | 'room_401' .. 'room_408'
  sender_name: string;
  sender_role: 'admin' | 'coordinator';
  message: string;
  created_at: string;
}
