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

-- Unique constraint required for idempotent upsert (prevents duplicate seeding)
-- Run this to deduplicate any existing rows FIRST, then create the constraint:
DO $$
BEGIN
    -- Remove duplicate rows, keeping the one with the lowest id
    DELETE FROM public.classroom_presence a
    USING public.classroom_presence b
    WHERE a.id > b.id
      AND a.classroom_id = b.classroom_id
      AND a.day_number   = b.day_number
      AND a.participant_name = b.participant_name;

    -- Now add the unique constraint if it doesn't already exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'uq_classroom_presence_identity'
    ) THEN
        ALTER TABLE public.classroom_presence
        ADD CONSTRAINT uq_classroom_presence_identity
        UNIQUE (classroom_id, day_number, participant_name);
    END IF;
END $$;

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

-- ==============================================================================
-- NEW: Default Status & Automated Attendance Sync (Incremental Migration)
-- ==============================================================================

-- 1. Change default classroom status to FALSE (OUT / NOT ENTERED)
ALTER TABLE public.classroom_presence
ALTER COLUMN is_in_room SET DEFAULT FALSE;

-- 2. Automated Sync Function: Teams attendance checkbox → classroom_presence
--    Fires after INSERT or UPDATE of any oct7 attendance column on public.teams
CREATE OR REPLACE FUNCTION sync_attendance_to_classroom_presence()
RETURNS TRIGGER AS $$
BEGIN
    -- Member 1 — Day 1 (Oct 7)
    IF NEW.member_1 IS NOT NULL AND NEW.member_1 != '' THEN
        INSERT INTO public.classroom_presence
            (day_number, classroom_id, team_name, participant_name, phone_number, is_team_lead, is_in_room)
        VALUES
            (1, COALESCE(NEW.classroom_id, '401'), NEW.team_name, NEW.member_1, NEW.member_1_phone, TRUE, NEW.member_1_oct7)
        ON CONFLICT (classroom_id, day_number, participant_name) DO NOTHING;

        UPDATE public.classroom_presence
        SET is_in_room = NEW.member_1_oct7, last_toggle_time = NOW(), updated_by = 'checkin_sync'
        WHERE team_name = NEW.team_name
          AND participant_name = NEW.member_1
          AND day_number = 1;
    END IF;

    -- Member 2 — Day 1
    IF NEW.member_2 IS NOT NULL AND NEW.member_2 != '' THEN
        INSERT INTO public.classroom_presence
            (day_number, classroom_id, team_name, participant_name, phone_number, is_team_lead, is_in_room)
        VALUES
            (1, COALESCE(NEW.classroom_id, '401'), NEW.team_name, NEW.member_2, NEW.member_2_phone, FALSE, NEW.member_2_oct7)
        ON CONFLICT (classroom_id, day_number, participant_name) DO NOTHING;

        UPDATE public.classroom_presence
        SET is_in_room = NEW.member_2_oct7, last_toggle_time = NOW(), updated_by = 'checkin_sync'
        WHERE team_name = NEW.team_name
          AND participant_name = NEW.member_2
          AND day_number = 1;
    END IF;

    -- Member 3 — Day 1
    IF NEW.member_3 IS NOT NULL AND NEW.member_3 != '' THEN
        INSERT INTO public.classroom_presence
            (day_number, classroom_id, team_name, participant_name, phone_number, is_team_lead, is_in_room)
        VALUES
            (1, COALESCE(NEW.classroom_id, '401'), NEW.team_name, NEW.member_3, NEW.member_3_phone, FALSE, NEW.member_3_oct7)
        ON CONFLICT (classroom_id, day_number, participant_name) DO NOTHING;

        UPDATE public.classroom_presence
        SET is_in_room = NEW.member_3_oct7, last_toggle_time = NOW(), updated_by = 'checkin_sync'
        WHERE team_name = NEW.team_name
          AND participant_name = NEW.member_3
          AND day_number = 1;
    END IF;

    -- Member 4 — Day 1
    IF NEW.member_4 IS NOT NULL AND NEW.member_4 != '' THEN
        INSERT INTO public.classroom_presence
            (day_number, classroom_id, team_name, participant_name, phone_number, is_team_lead, is_in_room)
        VALUES
            (1, COALESCE(NEW.classroom_id, '401'), NEW.team_name, NEW.member_4, NEW.member_4_phone, FALSE, NEW.member_4_oct7)
        ON CONFLICT (classroom_id, day_number, participant_name) DO NOTHING;

        UPDATE public.classroom_presence
        SET is_in_room = NEW.member_4_oct7, last_toggle_time = NOW(), updated_by = 'checkin_sync'
        WHERE team_name = NEW.team_name
          AND participant_name = NEW.member_4
          AND day_number = 1;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Attach trigger to teams table (idempotent)
DROP TRIGGER IF EXISTS trigger_sync_attendance ON public.teams;
CREATE TRIGGER trigger_sync_attendance
AFTER INSERT OR UPDATE OF
    member_1_oct7, member_2_oct7, member_3_oct7, member_4_oct7
ON public.teams
FOR EACH ROW
EXECUTE FUNCTION sync_attendance_to_classroom_presence();

-- ==============================================================================
-- 9. MASTER ROSTER SEED: Official Final Allocation (51 Teams, 7 Classrooms)
-- ==============================================================================

-- Remove any outdated dummy teams beyond sl_no 51
DELETE FROM public.teams WHERE sl_no > 51;

INSERT INTO public.teams (
    sl_no, team_name, classroom_id,
    member_1, member_1_phone, member_1_oct7, member_1_oct8, member_1_oct9,
    member_2, member_2_phone, member_2_oct7, member_2_oct8, member_2_oct9,
    member_3, member_3_phone, member_3_oct7, member_3_oct8, member_3_oct9,
    member_4, member_4_phone, member_4_oct7, member_4_oct8, member_4_oct9,
    comments
) VALUES
(1, 'SAKSHI', '402', 'Anagha BL', '+91 70229 32179', FALSE, FALSE, FALSE, 'Khushi Agarwal', '', FALSE, FALSE, FALSE, 'Subikshaa M', '', FALSE, FALSE, FALSE, 'Varshini Murthy', '', FALSE, FALSE, FALSE, 'CARF-43 • Bangalore Institute of Technology'),
(2, 'Advaitha', '406', 'Kamakshi Shreya B S', '+91 78929 12718', FALSE, FALSE, FALSE, 'Shravanthi A', '', FALSE, FALSE, FALSE, 'Priya R', '', FALSE, FALSE, FALSE, 'Anusha NK', '', FALSE, FALSE, FALSE, 'CARF-02 • JIT / Jyothy Institute of Technology'),
(3, 'Team Chandra', '408', 'Karthk Krishna', '+91 91102 75236', FALSE, FALSE, FALSE, 'Abhinav Tejas', '', FALSE, FALSE, FALSE, 'Adarsh Kumar R', '', FALSE, FALSE, FALSE, 'Rakesh', '', FALSE, FALSE, FALSE, 'CARF-13 • Jyothy Institute of Technology'),
(4, 'Team SRTC', '403', 'Tejas J', '+91 97409 28661', FALSE, FALSE, FALSE, 'Rahul B', '', FALSE, FALSE, FALSE, 'Skanda Gargeshwari', '', FALSE, FALSE, FALSE, 'M K Chethan', '', FALSE, FALSE, FALSE, 'CARF-50 • Jyothy Institute of Technology'),
(5, 'Coffee to code', '407', 'Rithvik Raghu', '+91 91488 60082', FALSE, FALSE, FALSE, 'Rohan N', '', FALSE, FALSE, FALSE, 'SHAMITH S', '', FALSE, FALSE, FALSE, 'Sachin V', '', FALSE, FALSE, FALSE, 'CARF-14 • JIT / Jyothy Institute of Technology'),
(6, 'MythoVerse', '401', 'Anagha G Rao', '+91 90368 60022', FALSE, FALSE, FALSE, 'S Tarun Reddy', '', FALSE, FALSE, FALSE, 'Varsha A', '', FALSE, FALSE, FALSE, 'AMRUTHA M', '', FALSE, FALSE, FALSE, 'CARF-29 • RV Institute of Technology & Management (RVITM)'),
(7, 'Team Vision', '404', 'Ullagaddi Arpitha', '+91 81474 86152', FALSE, FALSE, FALSE, 'Shreya Mathad', '', FALSE, FALSE, FALSE, 'Sukanya Patil', '', FALSE, FALSE, FALSE, 'Renuka Mehtre', '', FALSE, FALSE, FALSE, 'CARF-52 • Dayananda Sagar College of Engineering'),
(8, 'THE DREAMER''S', '408', 'M SURYAPRAKASH', '+91 63815 01023', FALSE, FALSE, FALSE, 'Suhail M', '', FALSE, FALSE, FALSE, 'Lakshmi sagar G', '', FALSE, FALSE, FALSE, 'CHIRANTHAN M', '', FALSE, FALSE, FALSE, 'CARF-56 • Jyothy Institute of Technology'),
(9, 'Yes', '406', 'Rohan D Sorab', '+91 63628 62503', FALSE, FALSE, FALSE, 'Sudhanvaa VK', '', FALSE, FALSE, FALSE, 'Prakruthi Prashanth', '', FALSE, FALSE, FALSE, '', '', FALSE, FALSE, FALSE, 'CARF-60 • Dayananda Sagar Academy of Technology & Management'),
(10, 'Advaita Labs', '404', 'Amogh R', '+91 99164 43206', FALSE, FALSE, FALSE, 'Vikas Krishna T L', '', FALSE, FALSE, FALSE, 'Sanjith srikrishna sastry', '', FALSE, FALSE, FALSE, '', '', FALSE, FALSE, FALSE, 'CARF-03 • S-VYASA Deemed-to-be University'),
(11, 'Technova', '404', 'Sanchitha S', '+91 82965 45766', FALSE, FALSE, FALSE, 'Sanika R', '', FALSE, FALSE, FALSE, 'Sharanya K G', '', FALSE, FALSE, FALSE, 'Inchara K S', '', FALSE, FALSE, FALSE, 'CARF-54 • SJC Institute of Technology'),
(12, 'QuadraAI', '408', 'Meghana M', '+91 76192 69549', FALSE, FALSE, FALSE, 'BhanuPriya V', '', FALSE, FALSE, FALSE, 'Dheeraj R S', '', FALSE, FALSE, FALSE, 'Manoj M', '', FALSE, FALSE, FALSE, 'CARF-40 • Jyothy Institute of Technology'),
(13, 'NOVACORE', '401', 'KAASHVI GOWDA B', '+91 95356 94679', FALSE, FALSE, FALSE, 'PRAJWAL S', '', FALSE, FALSE, FALSE, 'Inchara S', '', FALSE, FALSE, FALSE, 'Spoorthi S Rao', '', FALSE, FALSE, FALSE, 'CARF-35 • Jyothy Institute of Technology'),
(14, 'Innovexa', '404', 'Madhu PG', '+91 81562 00183', FALSE, FALSE, FALSE, 'Namitha A', '', FALSE, FALSE, FALSE, 'Kusuma B M', '', FALSE, FALSE, FALSE, '', '', FALSE, FALSE, FALSE, 'CARF-21 • SJC Institute of Technology'),
(15, 'JnanaX', '407', 'Bhakti priya', '+91 97402 63599', FALSE, FALSE, FALSE, 'Rishika M.A', '', FALSE, FALSE, FALSE, 'Chaithanya KA', '', FALSE, FALSE, FALSE, '', '', FALSE, FALSE, FALSE, 'CARF-23 • Dayananda Sagar College of Engineering'),
(16, 'Syntax Sorcerers', '404', 'SHREESH KULKARNI', '+91 82960 06511', FALSE, FALSE, FALSE, 'Vishnuvardhana S', '', FALSE, FALSE, FALSE, 'Vikas. S', '', FALSE, FALSE, FALSE, 'Samarth Satoddi', '', FALSE, FALSE, FALSE, 'CARF-47 • Jyothy Institute of Technology'),
(17, 'Kela', '406', 'Vaibhav Jangid', '+91 70905 62108', FALSE, FALSE, FALSE, 'Bhavya Dhoot', '', FALSE, FALSE, FALSE, 'Garv Bansal', '', FALSE, FALSE, FALSE, '', '', FALSE, FALSE, FALSE, 'CARF-24 • Vellore Institute of Technology'),
(18, 'Ctrl Alt Defeat', '402', 'Kiran L', '+91 97399 31621', FALSE, FALSE, FALSE, 'DHANUSH S', '', FALSE, FALSE, FALSE, 'Manoj B R', '', FALSE, FALSE, FALSE, 'THEJAS R', '', FALSE, FALSE, FALSE, 'CARF-17 • East West Institute of Technology'),
(19, 'Ekagra', '407', 'Madhura Pattar', '+91 74838 21166', FALSE, FALSE, FALSE, 'Sakshi G Gowda', '', FALSE, FALSE, FALSE, 'Sahana G', '', FALSE, FALSE, FALSE, 'Sanvi S Kote', '', FALSE, FALSE, FALSE, 'CARF-26 • JSS Academy of Technical Education'),
(20, 'AETHERIX', '401', 'Vishant Kannan', '+91 96062 48761', FALSE, FALSE, FALSE, 'Prasenjit Das', '', FALSE, FALSE, FALSE, 'Deergh Sai Singh', '', FALSE, FALSE, FALSE, 'pranav ramesh', '', FALSE, FALSE, FALSE, 'CARF-04 • Jyothy Institute of Technology'),
(21, 'Nexovate', '407', 'Manas Kabbur', '+91 74833 48058', FALSE, FALSE, FALSE, 'Rajeev C', '', FALSE, FALSE, FALSE, 'Rishabh', '', FALSE, FALSE, FALSE, 'NIRANJAN PATWARDHAN', '', FALSE, FALSE, FALSE, 'CARF-32 • Banglore Institute of Technology'),
(22, 'Supreme', '404', 'Sandhya Reddy', '+91 97428 03280', FALSE, FALSE, FALSE, 'Syed Imadulla', '', FALSE, FALSE, FALSE, 'Thriveni S A', '', FALSE, FALSE, FALSE, 'Teja J', '', FALSE, FALSE, FALSE, 'CARF-46 • SJCIT / SJC Institute of Technology'),
(23, 'ANANTA', '403', 'YOGITHA N', '+91 93535 62959', FALSE, FALSE, FALSE, 'Amrutha Prasad', '', FALSE, FALSE, FALSE, '', '', FALSE, FALSE, FALSE, '', '', FALSE, FALSE, FALSE, 'CARF-06 • Jyothy Institute of Technology'),
(24, 'Impact', '401', 'Sowmya Shashi', '+91 94811 72415', FALSE, FALSE, FALSE, 'Madhushree K N', '', FALSE, FALSE, FALSE, 'Sthuthi S Rao', '', FALSE, FALSE, FALSE, 'Sai Skanda G K', '', FALSE, FALSE, FALSE, 'CARF-20 • Jyothy Institute of Technology'),
(25, 'GITA BYTE L : ( V R Mahesh )', '406', 'V R Mahesh', '+91 80883 54770', FALSE, FALSE, FALSE, 'Shripad Kantambatlu', '', FALSE, FALSE, FALSE, 'Shreyas Dikshit', '', FALSE, FALSE, FALSE, 'Rohith S M', '', FALSE, FALSE, FALSE, 'CARF-18 • Jyothy Institute of Technology'),
(26, 'Quantum Coders', '402', 'Balmukund Shinde', '+91 90361 58707', FALSE, FALSE, FALSE, 'Rakshaa Sinchana', '', FALSE, FALSE, FALSE, 'Jeevanth M', '', FALSE, FALSE, FALSE, 'Keerthana Naveen', '', FALSE, FALSE, FALSE, 'CARF-39 • Jyothy Institute of Technology'),
(27, 'Tetragram', '406', 'vineet teli', '+91 90366 42383', FALSE, FALSE, FALSE, 'Bhargavi HS', '', FALSE, FALSE, FALSE, 'Vaibhavi B', '', FALSE, FALSE, FALSE, 'Sai Samarth', '', FALSE, FALSE, FALSE, 'CARF-55 • Jyothy Institute of Technology'),
(28, 'Ideators l', '407', 'Aditya Bhat', '+91 78922 13845', FALSE, FALSE, FALSE, 'Amogh Ravishankar', '', FALSE, FALSE, FALSE, 'harsha v', '', FALSE, FALSE, FALSE, 'Inchara B S', '', FALSE, FALSE, FALSE, 'CARF-19 • Jyothy Institute of Technology'),
(29, 'TEAM GODLIKE', '401', 'Preetham HM', '+91 70196 26167', FALSE, FALSE, FALSE, 'Roshan KP', '', FALSE, FALSE, FALSE, 'Smruthi barve', '', FALSE, FALSE, FALSE, 'Surabhi SD', '', FALSE, FALSE, FALSE, 'CARF-48 • Jyothy Institute of Technology'),
(30, 'Quad', '404', 'Jeevitha Reddy M', '+91 82170 20416', FALSE, FALSE, FALSE, 'N ARYA', '', FALSE, FALSE, FALSE, 'Jeevika Reddy M', '', FALSE, FALSE, FALSE, 'PRANATHI RAO', '', FALSE, FALSE, FALSE, 'CARF-37 • Jyothy Institute of Technology'),
(31, 'RAYARI', '402', 'Bhumika Gowda', '+91 82172 82425', FALSE, FALSE, FALSE, 'Harshitha C R', '', FALSE, FALSE, FALSE, '', '', FALSE, FALSE, FALSE, '', '', FALSE, FALSE, FALSE, 'CARF-41 • APS College of Engineering (APSCE)'),
(32, 'JNANA SETHU', '403', 'Pavan Sai', '+91 99807 74701', FALSE, FALSE, FALSE, 'Punith', '', FALSE, FALSE, FALSE, 'Lahari Manjunath', '', FALSE, FALSE, FALSE, 'Chandana G H', '', FALSE, FALSE, FALSE, 'CARF-22 • SJC Institute of Technology'),
(33, 'Mehta Bionics', '406', 'Nikhil Mehta', '+91 96326 20018', FALSE, FALSE, FALSE, 'Krithik Mehta', '', FALSE, FALSE, FALSE, 'Abhishek Mehta', '', FALSE, FALSE, FALSE, 'Chaurasiya Ayoush Raghavendra', '', FALSE, FALSE, FALSE, 'CARF-28 • Rajarajeshwari college of engineering'),
(34, 'EKATHVA', '403', 'Shukthija Siri G', '+91 82176 17465', FALSE, FALSE, FALSE, 'Nidhi ural M.S.', '', FALSE, FALSE, FALSE, 'Vasudevan G S', '', FALSE, FALSE, FALSE, 'Vishal T H', '', FALSE, FALSE, FALSE, 'CARF-01 • JIT / Jyothy Institute of Technology'),
(35, 'maya darpana', '401', 'Shripriya Kashyap', '+91 84510 77473', FALSE, FALSE, FALSE, 'Bhuvan Rupesh Kumar', '', FALSE, FALSE, FALSE, 'Dheemanth', '', FALSE, FALSE, FALSE, '', '', FALSE, FALSE, FALSE, 'CARF-27 • Jyothy Institute of Technology'),
(36, 'Astitva Unbound', '404', 'Avanija Mantena', '+91 81237 60712', FALSE, FALSE, FALSE, 'Hitesh. B. V.', '', FALSE, FALSE, FALSE, '', '', FALSE, FALSE, FALSE, '', '', FALSE, FALSE, FALSE, 'CARF-59 • K S School of Engineering and Management'),
(37, 'Cortex.exe', '406', 'Shria Shashidhar', '+91 82177 25010', FALSE, FALSE, FALSE, 'Vaishnavi -', '', FALSE, FALSE, FALSE, 'Vibha Srinivasa', '', FALSE, FALSE, FALSE, 'Prajna .s', '', FALSE, FALSE, FALSE, 'CARF-15 • Jyothy Institute of Technology'),
(38, 'Brahmasrastarah', '404', 'V Bhavana', '+91 83101 02851', FALSE, FALSE, FALSE, 'Praveen K M', '', FALSE, FALSE, FALSE, 'Nithyasri J', '', FALSE, FALSE, FALSE, '', '', FALSE, FALSE, FALSE, 'CARF-09 • Sri Sairam College of Engineering'),
(39, 'Team Krishna', '407', 'Mithil Sai', '+91 96062 08922', FALSE, FALSE, FALSE, 'NANDAN S', '', FALSE, FALSE, FALSE, 'Prerana S K', '', FALSE, FALSE, FALSE, 'Afnan Zain', '', FALSE, FALSE, FALSE, 'CARF-25 • Jyothy Institute of Technology'),
(40, 'Team Vyom', '407', 'Tarun M', '+91 83107 09906', FALSE, FALSE, FALSE, 'Somesh M', '', FALSE, FALSE, FALSE, 'Varun', '', FALSE, FALSE, FALSE, 'VARUN GOWDA M S', '', FALSE, FALSE, FALSE, 'CARF-58 • Jyothy Institute of Technology'),
(41, 'Alpha beda gamma', '402', 'Gagandeep. C', '+91 83103 35452', FALSE, FALSE, FALSE, 'Ramsagar. V', '', FALSE, FALSE, FALSE, 'Akshay. G', '', FALSE, FALSE, FALSE, 'Druva kumar. V', '', FALSE, FALSE, FALSE, 'CARF-05 • Kalpataru Institute of Technology'),
(42, 'SentinalX', '408', 'Rajasekar V', '+91 93534 96766', FALSE, FALSE, FALSE, 'Sonu J', '', FALSE, FALSE, FALSE, 'K Omkarreddy', '', FALSE, FALSE, FALSE, '', '', FALSE, FALSE, FALSE, 'CARF-44 • Sri Sairam College of Engineering'),
(43, 'RTX6090', '408', 'Shufwath Raqeeb S', '+91 99649 07635', FALSE, FALSE, FALSE, 'Shiva ganeshSR', '', FALSE, FALSE, FALSE, 'Kaushal K', '', FALSE, FALSE, FALSE, 'Anurag Mishra', '', FALSE, FALSE, FALSE, 'CARF-42 • AMC Engineering College'),
(44, 'CosmicIntellect', '403', 'Shreya Sanagaram', '+91 88844 04196', FALSE, FALSE, FALSE, 'Abja DH', '', FALSE, FALSE, FALSE, 'ABHISHA A VAIDYA', '', FALSE, FALSE, FALSE, 'Amogha', '', FALSE, FALSE, FALSE, 'CARF-16 • Jyothy Institute of Technology'),
(45, 'Nirvikara', '408', 'Sree Sahithi', '+91 70228 99530', FALSE, FALSE, FALSE, 'Yashaswini B', '', FALSE, FALSE, FALSE, '', '', FALSE, FALSE, FALSE, '', '', FALSE, FALSE, FALSE, 'CARF-33 • Brindavan College of Engineering'),
(46, 'BrainBytes', '403', 'Saishree Anil', '+91 96207 71565', FALSE, FALSE, FALSE, '', '', FALSE, FALSE, FALSE, '', '', FALSE, FALSE, FALSE, '', '', FALSE, FALSE, FALSE, 'CARF-61 • Jyothy Institute of Technology'),
(47, 'QuadraNova', '406', 'Anushree N', '+91 88616 39412', FALSE, FALSE, FALSE, 'usharani cp', '', FALSE, FALSE, FALSE, 'Chaithra yadav', '', FALSE, FALSE, FALSE, 'Deeksha K.L', '', FALSE, FALSE, FALSE, 'CARF-38 • Jyothy Institute of Technology'),
(48, 'Spicy bok', '406', 'Monish Kumar r', '+91 83104 79967', FALSE, FALSE, FALSE, 'Sanhith Huskur', '', FALSE, FALSE, FALSE, '', '', FALSE, FALSE, FALSE, '', '', FALSE, FALSE, FALSE, 'CARF-45 • Dayananda Sagar Academy of Technology & Management'),
(49, 'Brainy bunch', '407', 'Pannagajp', '+91 63640 42919', FALSE, FALSE, FALSE, 'Samhitha Kalaskar B', '', FALSE, FALSE, FALSE, 'PRIYANKA BHASKAR', '', FALSE, FALSE, FALSE, 'OREKANTI TANYA REDDY', '', FALSE, FALSE, FALSE, 'CARF-11 • Jyothy Institute of Technology'),
(50, 'Bit by Bit', '408', 'Manjunath L', '+91 90711 17475', FALSE, FALSE, FALSE, 'Pradeep Narasenavar', '', FALSE, FALSE, FALSE, 'MANOJ R', '', FALSE, FALSE, FALSE, 'Abhishek K C', '', FALSE, FALSE, FALSE, 'CARF-10 • Jyothy Institute of Technology'),
(51, 'TICKET', '408', 'Saishree Anil', '+91 88616 69460', FALSE, FALSE, FALSE, 'Achutha Kaddi', '', FALSE, FALSE, FALSE, 'Kriishna H S', '', FALSE, FALSE, FALSE, 'Bhuvan', '', FALSE, FALSE, FALSE, 'CARF-57 • Jyothy Institute of Technology')
ON CONFLICT (sl_no) DO UPDATE SET
    team_name = EXCLUDED.team_name,
    classroom_id = EXCLUDED.classroom_id,
    member_1 = EXCLUDED.member_1,
    member_1_phone = EXCLUDED.member_1_phone,
    member_2 = EXCLUDED.member_2,
    member_3 = EXCLUDED.member_3,
    member_4 = EXCLUDED.member_4,
    comments = EXCLUDED.comments;

-- 10. Automatic Day 1 Presence Sync from public.teams
DELETE FROM public.classroom_presence WHERE day_number = 1;

INSERT INTO public.classroom_presence (day_number, classroom_id, team_name, participant_name, phone_number, is_team_lead, is_in_room)
SELECT 1, t.classroom_id, t.team_name, t.member_1, t.member_1_phone, TRUE, t.member_1_oct7
FROM public.teams t WHERE t.member_1 IS NOT NULL AND t.member_1 != ''
ON CONFLICT (classroom_id, day_number, participant_name) DO UPDATE 
SET team_name = EXCLUDED.team_name, phone_number = EXCLUDED.phone_number, is_team_lead = TRUE;

INSERT INTO public.classroom_presence (day_number, classroom_id, team_name, participant_name, phone_number, is_team_lead, is_in_room)
SELECT 1, t.classroom_id, t.team_name, t.member_2, t.member_2_phone, FALSE, t.member_2_oct7
FROM public.teams t WHERE t.member_2 IS NOT NULL AND t.member_2 != ''
ON CONFLICT (classroom_id, day_number, participant_name) DO UPDATE 
SET team_name = EXCLUDED.team_name, phone_number = EXCLUDED.phone_number, is_team_lead = FALSE;

INSERT INTO public.classroom_presence (day_number, classroom_id, team_name, participant_name, phone_number, is_team_lead, is_in_room)
SELECT 1, t.classroom_id, t.team_name, t.member_3, t.member_3_phone, FALSE, t.member_3_oct7
FROM public.teams t WHERE t.member_3 IS NOT NULL AND t.member_3 != ''
ON CONFLICT (classroom_id, day_number, participant_name) DO UPDATE 
SET team_name = EXCLUDED.team_name, phone_number = EXCLUDED.phone_number, is_team_lead = FALSE;

INSERT INTO public.classroom_presence (day_number, classroom_id, team_name, participant_name, phone_number, is_team_lead, is_in_room)
SELECT 1, t.classroom_id, t.team_name, t.member_4, t.member_4_phone, FALSE, t.member_4_oct7
FROM public.teams t WHERE t.member_4 IS NOT NULL AND t.member_4 != ''
ON CONFLICT (classroom_id, day_number, participant_name) DO UPDATE 
SET team_name = EXCLUDED.team_name, phone_number = EXCLUDED.phone_number, is_team_lead = FALSE;

