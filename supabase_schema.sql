-- ==============================================================================
-- Supabase Schema & Seed Data for Makeathon Attendance Spreadsheet
-- ==============================================================================

-- 1. Create Teams & Attendance Table
CREATE TABLE IF NOT EXISTS public.teams (
    id SERIAL PRIMARY KEY,
    sl_no INT UNIQUE NOT NULL,
    team_name TEXT NOT NULL,
    member_1 TEXT DEFAULT '',
    member_1_oct7 BOOLEAN DEFAULT FALSE,
    member_1_oct8 BOOLEAN DEFAULT FALSE,
    member_1_oct9 BOOLEAN DEFAULT FALSE,
    member_2 TEXT DEFAULT '',
    member_2_oct7 BOOLEAN DEFAULT FALSE,
    member_2_oct8 BOOLEAN DEFAULT FALSE,
    member_2_oct9 BOOLEAN DEFAULT FALSE,
    member_3 TEXT DEFAULT '',
    member_3_oct7 BOOLEAN DEFAULT FALSE,
    member_3_oct8 BOOLEAN DEFAULT FALSE,
    member_3_oct9 BOOLEAN DEFAULT FALSE,
    member_4 TEXT DEFAULT '',
    member_4_oct7 BOOLEAN DEFAULT FALSE,
    member_4_oct8 BOOLEAN DEFAULT FALSE,
    member_4_oct9 BOOLEAN DEFAULT FALSE,
    comments TEXT DEFAULT '',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (Row Level Security) and allow public read/write for attendance admins
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on teams" 
ON public.teams FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert on teams" 
ON public.teams FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update on teams" 
ON public.teams FOR UPDATE 
USING (true);

-- 2. Enable Supabase Realtime Replication
ALTER PUBLICATION supabase_realtime ADD TABLE public.teams;

-- 3. Seed Data (All 60 Teams from Shortlisted Candidates.xlsx)
INSERT INTO public.teams (sl_no, team_name, member_1, member_2, member_3, member_4) VALUES
(1, 'SAKSHI', 'Anagha BL', 'Khushi Agarwal', 'Subikshaa M', 'Varshini Murthy'),
(2, 'APEX', 'Harini Krishna', 'Adhithya P', 'Jagath Suman', 'Darshan Darshan'),
(3, 'KRISHNA', 'Mithil Sai', 'NANDAN S', 'Prerana S K', 'Afnan Zain'),
(4, 'TETRAGRAM', 'vineet teli', 'Bhargavi HS', 'Vaibhavi B', 'Sai Samarth'),
(5, 'THE DREAMER''S', 'M SURYAPRAKASH', 'Suhail M', 'Lakshmi sagar G', 'CHIRANTHAN M'),
(6, 'ROBO GLADIATORS', 'N Sanjan Kumar', 'S R YASHWANTH', 'Gagan S', 'Karthik Gowda B C'),
(7, 'Tech sooriyas', 'B SHARON ROSE', 'AKSHAYA M', 'JOSHITA S', ''),
(8, 'THE PIXELS', 'Sneha M B', 'Smruthi D J', 'Suma M H', 'Suraksha H J'),
(9, 'CYBER CREW', 'Navaneeth M', 'Lithesh B S', 'Deepak H K', 'Mohammed Rehaan C S'),
(10, 'TECH VISIONS', 'P.MOHITHA SRIVALLI', 'SUCHITHRA S', 'VARSHITHA R S', 'P SHASHANK'),
(11, 'Binary Bosses', 'T J Jnanendra Prasad', 'Tarun', 'Anusha P H', 'D B Chandan'),
(12, 'InnoVerse', 'Siri S J', 'Supriya M J', 'Subhashini M A', 'Sneha R S'),
(13, 'MAYA', 'Sharath K T', 'M S Shreyas Gowda', 'Sumukh H S', 'Vishal J R'),
(14, 'VIBE CREW', 'Syed Aman', 'K U Preetham Gowda', 'B S Preetham', 'Pramod M N'),
(15, 'SURA', 'U V TEJAS', 'V N MANU', 'S SUHAS', 'C S YASHWANTH'),
(16, 'PRAYAAS', 'L M LIKITH GOWDA', 'M S MOULYA', 'PRATHAM B B', 'M HARSHITHA'),
(17, 'AGNI', 'P R RAKSHITH', 'SHREENIVAS H M', 'LAKSHITHA K R', 'SAMRUDDHI C H'),
(18, 'SHIVAM', 'Yashas M', 'Sudeep S', 'Thippesh T H', 'Subramanya S'),
(19, 'SQUAD SHIELDS', 'U N MANJU SWAROOP', 'GAGAN P', 'KEERTHI PRASAD D S', 'M C MANOJ'),
(20, 'TECH MONKS', 'Chandankumar C M', 'Kushal gowda A G', 'Deepak R', 'Manoj L C'),
(21, 'CODECRAFT', 'G Y SHASHANK GOWDA', 'H R SHANKARA GOWDA', 'G N SATHVIK', 'G M BHARATH'),
(22, 'PRABHA', 'A M YASHASWINI', 'PRIYANKA B A', 'P BHARGAVI', 'N LIKHITHA'),
(23, 'CODE HEIST', 'Y B Harshini', 'H C Nisarga', 'M Sinchana', 'Anushree S D'),
(24, 'RUDRA', 'Subhash Gowda A K', 'Prarthan A', 'T D Nithesh', 'Charan P S'),
(25, 'SPARK NEXUS', 'Spoorthi T', 'Thilaka S M', 'Tejaswini M V', 'Yashaswini B N'),
(26, 'S T B', 'A C Shashi Kumar', 'G H Likith Kumar', 'J H Manoj', 'M Darshan'),
(27, 'Dynamic Developers', 'Thanushree C R', 'G S Sinchana', 'Y S Spoorthi', 'Tejaswini M S'),
(28, 'Dev Dynamics', 'Pratham P G', 'M Sukruth', 'D R Prajwal', 'Prajwal K M'),
(29, 'ASTRA', 'B S Monisha', 'N J Namratha', 'M Sinchana', 'P R Pragathi'),
(30, 'SPARK AI', 'B S Manoj', 'K M Pavan Gowda', 'S K Mohith Gowda', 'G Gagan'),
(31, 'BRAIN SPARK', 'Subhash B E', 'Vikas R', 'S G Shreyas', 'B V Yashavanth'),
(32, 'INNOVATORS', 'Harshitha M J', 'Nanditha S M', 'Inchara N M', 'B P Prarthana'),
(33, 'THE BUG CRUSHERS', 'Tejas G S', 'Vikhyath A N', 'Varun H', 'Vinay Kumar H N'),
(34, 'CODE BLOOM', 'R G SAHANA', 'SUCHIN S', 'M C SUSHMA', 'SUHAS H B'),
(35, 'CODE CRAFTERS', 'SAHANA M S', 'VARSHINI S A', 'ROJA H N', 'S CHANDANA'),
(36, 'NEXUS', 'Shreya P B', 'Thanusha Y M', 'Sinchan N J', 'Tanuja P S'),
(37, 'Byte Busters', 'S S Bhuvan', 'M Prajwal', 'Syed Khaja Mohiuddin', 'C L Pratham Gowda'),
(38, 'Innovate-X', 'Preetham D C', 'U T Tejas', 'Rahul D R', 'P B Puneeth'),
(39, 'ALPHA CODE', 'Chandana S R', 'Anuradha P A', 'Bhoomika M R', 'Archana S S'),
(40, 'TECH TROOPERS', 'N R BHOOMIKA', 'K N NAVYA', 'S DEEPIKA', 'C H SPOORTHI'),
(41, 'BYTE BRIDGE', 'Preetham K N', 'G N Manoj', 'Prasiddhi N K', 'L M Likhitha'),
(42, 'TECH WHIZ', 'N P Chandan', 'I A Yashas', 'Monika S G', 'Varshitha M D'),
(43, 'CYBER SAMURAI', 'Syed Furqan', 'Sharath K C', 'Umar Farooq J S', 'Sheelan D A'),
(44, 'SPARK CODERS', 'Anupama G S', 'Harshitha K', 'Keerthana M S', 'Amulya N V'),
(45, 'Dev dynamos', 'H S Sharanya', 'M S Sinchana', 'Preethu M B', 'Spandana L G'),
(46, 'TEAM SPARK', 'M SHARATH GOWDA', 'M HARSHITHA', 'PRANATHI K A', 'M S SUJAN'),
(47, 'DATA NINJAS', 'B Monish', 'S Chirag', 'Gagan R', 'M Punith Gowda'),
(48, 'S S M L', 'S M Likitha', 'Spoorthi M', 'Subiksha R', 'S P Meghana'),
(49, 'Team Alpha', 'R R Gagana', 'M O Gagana', 'T N Sinchana', 'Deepika C R'),
(50, 'Neural Nexus', 'B S Sanjana', 'Y L Thanmayi', 'T N Varshitha', 'B J Spoorthi'),
(51, 'Web Weaver', 'R S Vinay Gowda', 'B S Tejas', 'Y S Tharun', 'L V Yashas Gowda'),
(52, 'Algorithm Avengers', 'VARUN D R', 'M N YASHVANTH', 'S SINCHANA', 'D M SINCHANA'),
(53, 'VISIONARY TECH', 'Y S YASHWANTH GOWDA', 'U R CHETHAN', 'S CHETHAN', 'THIPPESH S C'),
(54, 'MAVERICKS', 'U J Likitha', 'Subash K C', 'Subramanya B L', ''),
(55, 'SYNERGY', 'V P Chandan Gowda', 'B S Tharanath', 'Chiranjeevi S M', 'Chetan M R'),
(56, 'VYOMA', 'Ruchitha Niradi', 'Vanishree Umar Ji', 'Sakshi Ramaka', 'Sachi Hongal'),
(57, 'QuardraAI', 'Meghana M', 'BhanuPriya V', 'Dheeraj R S', 'Manoj M'),
(58, 'SUPREME', 'Sandhya Reddy', 'Syed Imadulla', 'Thriveni S A', 'Teja J'),
(59, 'TEAM VIKRANT', 'Rishika Dollin', 'Rishabh S K', '', ''),
(60, 'TICKET', 'Saishree Anil', 'Achutha Kaddi', 'Kriishna H S', 'Bhuvan')
ON CONFLICT (sl_no) DO UPDATE SET 
  team_name = EXCLUDED.team_name, 
  member_1 = EXCLUDED.member_1, 
  member_2 = EXCLUDED.member_2, 
  member_3 = EXCLUDED.member_3, 
  member_4 = EXCLUDED.member_4;
