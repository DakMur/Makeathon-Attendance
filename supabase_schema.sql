-- ==============================================================================
-- MAKEATHON OPS: Multi-Room Attendance & Event Operations Platform Schema
-- ==============================================================================

-- 1. Card Access Passwords Table
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.card_passwords (
    card_id TEXT PRIMARY KEY, -- 'admin', 'checkin', '401'..'408'
    password_hash TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Secure RPC function: validates input against stored hash/passcode and returns boolean only
CREATE OR REPLACE FUNCTION public.verify_card_passcode(p_card_id TEXT, p_passcode TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_stored TEXT;
BEGIN
    SELECT password_hash INTO v_stored FROM public.card_passwords WHERE card_id = p_card_id;
    IF v_stored IS NULL THEN
        RETURN FALSE;
    END IF;
    -- Matches either direct passcode or SHA-256 hash
    RETURN (v_stored = p_passcode OR v_stored = encode(digest(p_passcode, 'sha256'), 'hex'));
END;
$$;

-- Seed Default Passwords
INSERT INTO public.card_passwords (card_id, password_hash) VALUES
('admin', 'mibomba'),
('checkin', 'jit@123'),
('401', 'jit@123'),
('402', 'jit@123'),
('403', 'jit@123'),
('404', 'jit@123'),
('405', 'jit@123'),
('406', 'jit@123'),
('407', 'jit@123'),
('408', 'jit@123')
ON CONFLICT (card_id) DO NOTHING;

-- 2. Master Teams & Main Attendance Table
CREATE TABLE IF NOT EXISTS public.teams (
    id SERIAL PRIMARY KEY,
    sl_no INT UNIQUE NOT NULL,
    team_name TEXT NOT NULL,
    classroom_id TEXT DEFAULT '401',
    member_1 TEXT DEFAULT '',
    member_1_phone TEXT DEFAULT '',
    member_1_oct7 BOOLEAN DEFAULT FALSE,
    member_1_oct8 BOOLEAN DEFAULT FALSE,
    member_1_oct9 BOOLEAN DEFAULT FALSE,
    member_2 TEXT DEFAULT '',
    member_2_phone TEXT DEFAULT '',
    member_2_oct7 BOOLEAN DEFAULT FALSE,
    member_2_oct8 BOOLEAN DEFAULT FALSE,
    member_2_oct9 BOOLEAN DEFAULT FALSE,
    member_3 TEXT DEFAULT '',
    member_3_phone TEXT DEFAULT '',
    member_3_oct7 BOOLEAN DEFAULT FALSE,
    member_3_oct8 BOOLEAN DEFAULT FALSE,
    member_3_oct9 BOOLEAN DEFAULT FALSE,
    member_4 TEXT DEFAULT '',
    member_4_phone TEXT DEFAULT '',
    member_4_oct7 BOOLEAN DEFAULT FALSE,
    member_4_oct8 BOOLEAN DEFAULT FALSE,
    member_4_oct9 BOOLEAN DEFAULT FALSE,
    comments TEXT DEFAULT '',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- If table already exists from previous runs, ensure phone & classroom_id columns exist:
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teams' AND column_name = 'classroom_id') THEN
        ALTER TABLE public.teams ADD COLUMN classroom_id TEXT DEFAULT '401';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teams' AND column_name = 'member_1_phone') THEN
        ALTER TABLE public.teams ADD COLUMN member_1_phone TEXT DEFAULT '';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teams' AND column_name = 'member_2_phone') THEN
        ALTER TABLE public.teams ADD COLUMN member_2_phone TEXT DEFAULT '';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teams' AND column_name = 'member_3_phone') THEN
        ALTER TABLE public.teams ADD COLUMN member_3_phone TEXT DEFAULT '';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teams' AND column_name = 'member_4_phone') THEN
        ALTER TABLE public.teams ADD COLUMN member_4_phone TEXT DEFAULT '';
    END IF;
END $$;

-- 3. Live Classroom Participant Status Table (Day-partitioned)
CREATE TABLE IF NOT EXISTS public.classroom_presence (
    id SERIAL PRIMARY KEY,
    day_number INT NOT NULL DEFAULT 1, -- 1, 2, or 3
    classroom_id TEXT NOT NULL,        -- '401' to '408'
    team_name TEXT NOT NULL,
    participant_name TEXT NOT NULL,
    phone_number TEXT DEFAULT '',
    is_team_lead BOOLEAN DEFAULT FALSE,
    is_in_room BOOLEAN DEFAULT TRUE,   -- TRUE = IN (Green), FALSE = OUT (Red)
    last_toggle_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by TEXT DEFAULT 'coordinator'
);

-- Index for fast lookup by room and day
CREATE INDEX IF NOT EXISTS idx_classroom_presence_room_day 
ON public.classroom_presence (classroom_id, day_number);

-- 4. Classroom Bulk Action Logs & Timestamp Timeline
CREATE TABLE IF NOT EXISTS public.classroom_action_logs (
    id SERIAL PRIMARY KEY,
    day_number INT NOT NULL DEFAULT 1,
    classroom_id TEXT NOT NULL,
    action_type TEXT NOT NULL,          -- 'Breakfast', 'Lunch', 'Dinner', 'Snack Break', 'Event', or custom
    executed_by TEXT DEFAULT 'coordinator',
    affected_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Broadcast Notices & Announcements
CREATE TABLE IF NOT EXISTS public.notices (
    id SERIAL PRIMARY KEY,
    target_room TEXT NOT NULL,          -- 'ALL' or specific room ('401', '402', etc.)
    message TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Coordinator Emergency Pings (SOS System)
CREATE TABLE IF NOT EXISTS public.coordinator_pings (
    id SERIAL PRIMARY KEY,
    classroom_id TEXT NOT NULL,
    coordinator_name TEXT DEFAULT 'Room Coordinator',
    message TEXT NOT NULL,
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Global No-Code System Settings
CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL
);

-- Seed Initial System Settings
INSERT INTO public.system_settings (key, value) VALUES
('current_day', '1'::jsonb),
('day_turnover_time', '"00:00"'::jsonb),
('quick_action_buttons', '["Breakfast", "Lunch", "Dinner", "Snack Break", "Event"]'::jsonb),
('classroom_coordinators', '{"401": ["Alex Kumar", "Samarth V"], "402": ["John D", "Priya S"], "403": ["Kiran Rao", "Deepa M"], "404": ["Rohit Sharma", "Ananya K"], "405": ["Varun Reddy", "Sneha P"], "406": ["Tanvi Shah", "Nikhil G"], "407": ["Gautam N", "Meera R"], "408": ["Harish B", "Divya C"]}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- ==============================================================================
-- Row Level Security (RLS) & Public Policies for Attendance Operations
-- ==============================================================================
ALTER TABLE public.card_passwords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_action_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coordinator_pings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to prevent conflicts when re-running
DO $$
BEGIN
    DROP POLICY IF EXISTS "Allow public read/write on card_passwords" ON public.card_passwords;
    DROP POLICY IF EXISTS "Allow public read/write on teams" ON public.teams;
    DROP POLICY IF EXISTS "Allow public read/write on classroom_presence" ON public.classroom_presence;
    DROP POLICY IF EXISTS "Allow public read/write on classroom_action_logs" ON public.classroom_action_logs;
    DROP POLICY IF EXISTS "Allow public read/write on notices" ON public.notices;
    DROP POLICY IF EXISTS "Allow public read/write on coordinator_pings" ON public.coordinator_pings;
    DROP POLICY IF EXISTS "Allow public read/write on system_settings" ON public.system_settings;
END $$;

CREATE POLICY "Allow public read/write on card_passwords" ON public.card_passwords FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write on teams" ON public.teams FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write on classroom_presence" ON public.classroom_presence FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write on classroom_action_logs" ON public.classroom_action_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write on notices" ON public.notices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write on coordinator_pings" ON public.coordinator_pings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write on system_settings" ON public.system_settings FOR ALL USING (true) WITH CHECK (true);

-- Enable Realtime for All Essential Tables (Idempotent Exception Handling)
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.teams;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.classroom_presence;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notices;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.coordinator_pings;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.system_settings;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
END $$;

-- ==============================================================================
-- NEW: Chat & Lockdown Features (Incremental Migration)
-- ==============================================================================

-- 8. Scoped Group Chat Messages Table
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id SERIAL PRIMARY KEY,
    channel_id TEXT NOT NULL,          -- 'admin_global' OR 'room_401' through 'room_408'
    sender_name TEXT NOT NULL,
    sender_role TEXT NOT NULL,          -- 'admin' OR 'coordinator'
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_channel
ON public.chat_messages (channel_id, created_at DESC);

-- 9. System Lockdown Flag
INSERT INTO public.system_settings (key, value) VALUES
('is_system_locked', 'false'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- RLS for chat_messages
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Allow public read/write on chat_messages" ON public.chat_messages;
END $$;

CREATE POLICY "Allow public read/write on chat_messages" ON public.chat_messages FOR ALL USING (true) WITH CHECK (true);

-- Enable Realtime for chat_messages
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
END $$;
