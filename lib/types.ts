export interface Team {
  id: number;
  sl_no: number;
  team_name: string;
  member_1: string;
  member_1_oct7: boolean;
  member_1_oct8: boolean;
  member_1_oct9: boolean;
  member_2: string;
  member_2_oct7: boolean;
  member_2_oct8: boolean;
  member_2_oct9: boolean;
  member_3: string;
  member_3_oct7: boolean;
  member_3_oct8: boolean;
  member_3_oct9: boolean;
  member_4: string;
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
  teamIndex: number; // 0 to teams.length - 1
  colIndex: number;  // 0: TeamName, 1..3: M1 dates, 4..6: M2 dates, 7..9: M3 dates, 10..12: M4 dates, 13: Comments
}

export interface AdminPresence {
  id: string;            // unique session or admin id
  adminSlot: 'admin_1' | 'admin_2' | 'admin_3' | 'admin_4';
  adminName: string;     // e.g. "Admin 1"
  focusedSlNo: number | null; // active team sl_no
  focusedField?: string | null;
  lastActive: number;
}
