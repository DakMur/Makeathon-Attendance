import { Team, ClassroomPresence } from './types';

// Helper to determine classroom from sl_no (1-60 distributed over 401-408)
export function getClassroomIdForTeam(slNo: number): string {
  if (slNo <= 8) return '401';
  if (slNo <= 16) return '402';
  if (slNo <= 24) return '403';
  if (slNo <= 32) return '404';
  if (slNo <= 39) return '405';
  if (slNo <= 46) return '406';
  if (slNo <= 53) return '407';
  return '408';
}

const RAW_TEAMS = [
  { sl_no: 1, team_name: "SAKSHI", member_1: "Anagha BL", member_2: "Khushi Agarwal", member_3: "Subikshaa M", member_4: "Varshini Murthy" },
  { sl_no: 2, team_name: "APEX", member_1: "Harini Krishna", member_2: "Adhithya P", member_3: "Jagath Suman", member_4: "Darshan Darshan" },
  { sl_no: 3, team_name: "KRISHNA", member_1: "Mithil Sai", member_2: "NANDAN S", member_3: "Prerana S K", member_4: "Afnan Zain" },
  { sl_no: 4, team_name: "TETRAGRAM", member_1: "vineet teli", member_2: "Bhargavi HS", member_3: "Vaibhavi B", member_4: "Sai Samarth" },
  { sl_no: 5, team_name: "THE DREAMER'S", member_1: "M SURYAPRAKASH", member_2: "Suhail M", member_3: "Lakshmi sagar G", member_4: "CHIRANTHAN M" },
  { sl_no: 6, team_name: "ROBO GLADIATORS", member_1: "N Sanjan Kumar", member_2: "S R YASHWANTH", member_3: "Gagan S", member_4: "Karthik Gowda B C" },
  { sl_no: 7, team_name: "Tech sooriyas", member_1: "B SHARON ROSE", member_2: "AKSHAYA M", member_3: "JOSHITA S", member_4: "" },
  { sl_no: 8, team_name: "THE PIXELS", member_1: "Sneha M B", member_2: "Smruthi D J", member_3: "Suma M H", member_4: "Suraksha H J" },
  { sl_no: 9, team_name: "CYBER CREW", member_1: "Navaneeth M", member_2: "Lithesh B S", member_3: "Deepak H K", member_4: "Mohammed Rehaan C S" },
  { sl_no: 10, team_name: "TECH VISIONS", member_1: "P.MOHITHA SRIVALLI", member_2: "SUCHITHRA S", member_3: "VARSHITHA R S", member_4: "P SHASHANK" },
  { sl_no: 11, team_name: "Binary Bosses", member_1: "T J Jnanendra Prasad", member_2: "Tarun", member_3: "Anusha P H", member_4: "D B Chandan" },
  { sl_no: 12, team_name: "InnoVerse", member_1: "Siri S J", member_2: "Supriya M J", member_3: "Subhashini M A", member_4: "Sneha R S" },
  { sl_no: 13, team_name: "MAYA", member_1: "Sharath K T", member_2: "M S Shreyas Gowda", member_3: "Sumukh H S", member_4: "Vishal J R" },
  { sl_no: 14, team_name: "VIBE CREW", member_1: "Syed Aman", member_2: "K U Preetham Gowda", member_3: "B S Preetham", member_4: "Pramod M N" },
  { sl_no: 15, team_name: "SURA", member_1: "U V TEJAS", member_2: "V N MANU", member_3: "S SUHAS", member_4: "C S YASHWANTH" },
  { sl_no: 16, team_name: "PRAYAAS", member_1: "L M LIKITH GOWDA", member_2: "M S MOULYA", member_3: "PRATHAM B B", member_4: "M HARSHITHA" },
  { sl_no: 17, team_name: "AGNI", member_1: "P R RAKSHITH", member_2: "SHREENIVAS H M", member_3: "LAKSHITHA K R", member_4: "SAMRUDDHI C H" },
  { sl_no: 18, team_name: "SHIVAM", member_1: "Yashas M", member_2: "Sudeep S", member_3: "Thippesh T H", member_4: "Subramanya S" },
  { sl_no: 19, team_name: "SQUAD SHIELDS", member_1: "U N MANJU SWAROOP", member_2: "GAGAN P", member_3: "KEERTHI PRASAD D S", member_4: "M C MANOJ" },
  { sl_no: 20, team_name: "TECH MONKS", member_1: "Chandankumar C M", member_2: "Kushal gowda A G", member_3: "Deepak R", member_4: "Manoj L C" },
  { sl_no: 21, team_name: "CODECRAFT", member_1: "G Y SHASHANK GOWDA", member_2: "H R SHANKARA GOWDA", member_3: "G N SATHVIK", member_4: "G M BHARATH" },
  { sl_no: 22, team_name: "PRABHA", member_1: "A M YASHASWINI", member_2: "PRIYANKA B A", member_3: "P BHARGAVI", member_4: "N LIKHITHA" },
  { sl_no: 23, team_name: "CODE HEIST", member_1: "Y B Harshini", member_2: "H C Nisarga", member_3: "M Sinchana", member_4: "Anushree S D" },
  { sl_no: 24, team_name: "RUDRA", member_1: "Subhash Gowda A K", member_2: "Prarthan A", member_3: "T D Nithesh", member_4: "Charan P S" },
  { sl_no: 25, team_name: "SPARK NEXUS", member_1: "Spoorthi T", member_2: "Thilaka S M", member_3: "Tejaswini M V", member_4: "Yashaswini B N" },
  { sl_no: 26, team_name: "S T B", member_1: "A C Shashi Kumar", member_2: "G H Likith Kumar", member_3: "J H Manoj", member_4: "M Darshan" },
  { sl_no: 27, team_name: "Dynamic Developers", member_1: "Thanushree C R", member_2: "G S Sinchana", member_3: "Y S Spoorthi", member_4: "Tejaswini M S" },
  { sl_no: 28, team_name: "Dev Dynamics", member_1: "Pratham P G", member_2: "M Sukruth", member_3: "D R Prajwal", member_4: "Prajwal K M" },
  { sl_no: 29, team_name: "ASTRA", member_1: "B S Monisha", member_2: "N J Namratha", member_3: "M Sinchana", member_4: "P R Pragathi" },
  { sl_no: 30, team_name: "SPARK AI", member_1: "B S Manoj", member_2: "K M Pavan Gowda", member_3: "S K Mohith Gowda", member_4: "G Gagan" },
  { sl_no: 31, team_name: "BRAIN SPARK", member_1: "Subhash B E", member_2: "Vikas R", member_3: "S G Shreyas", member_4: "B V Yashavanth" },
  { sl_no: 32, team_name: "INNOVATORS", member_1: "Harshitha M J", member_2: "Nanditha S M", member_3: "Inchara N M", member_4: "B P Prarthana" },
  { sl_no: 33, team_name: "THE BUG CRUSHERS", member_1: "Tejas G S", member_2: "Vikhyath A N", member_3: "Varun H", member_4: "Vinay Kumar H N" },
  { sl_no: 34, team_name: "CODE BLOOM", member_1: "R G SAHANA", member_2: "SUCHIN S", member_3: "M C SUSHMA", member_4: "SUHAS H B" },
  { sl_no: 35, team_name: "CODE CRAFTERS", member_1: "SAHANA M S", member_2: "VARSHINI S A", member_3: "ROJA H N", member_4: "S CHANDANA" },
  { sl_no: 36, team_name: "NEXUS", member_1: "Shreya P B", member_2: "Thanusha Y M", member_3: "Sinchan N J", member_4: "Tanuja P S" },
  { sl_no: 37, team_name: "Byte Busters", member_1: "S S Bhuvan", member_2: "M Prajwal", member_3: "Syed Khaja Mohiuddin", member_4: "C L Pratham Gowda" },
  { sl_no: 38, team_name: "Innovate-X", member_1: "Preetham D C", member_2: "U T Tejas", member_3: "Rahul D R", member_4: "P B Puneeth" },
  { sl_no: 39, team_name: "ALPHA CODE", member_1: "Chandana S R", member_2: "Anuradha P A", member_3: "Bhoomika M R", member_4: "Archana S S" },
  { sl_no: 40, team_name: "TECH TROOPERS", member_1: "N R BHOOMIKA", member_2: "K N NAVYA", member_3: "S DEEPIKA", member_4: "C H SPOORTHI" },
  { sl_no: 41, team_name: "BYTE BRIDGE", member_1: "Preetham K N", member_2: "G N Manoj", member_3: "Prasiddhi N K", member_4: "L M Likhitha" },
  { sl_no: 42, team_name: "TECH WHIZ", member_1: "N P Chandan", member_2: "I A Yashas", member_3: "Monika S G", member_4: "Varshitha M D" },
  { sl_no: 43, team_name: "CYBER SAMURAI", member_1: "Syed Furqan", member_2: "Sharath K C", member_3: "Umar Farooq J S", member_4: "Sheelan D A" },
  { sl_no: 44, team_name: "SPARK CODERS", member_1: "Anupama G S", member_2: "Harshitha K", member_3: "Keerthana M S", member_4: "Amulya N V" },
  { sl_no: 45, team_name: "Dev dynamos", member_1: "H S Sharanya", member_2: "M S Sinchana", member_3: "Preethu M B", member_4: "Spandana L G" },
  { sl_no: 46, team_name: "TEAM SPARK", member_1: "M SHARATH GOWDA", member_2: "M HARSHITHA", member_3: "PRANATHI K A", member_4: "M S SUJAN" },
  { sl_no: 47, team_name: "DATA NINJAS", member_1: "B Monish", member_2: "S Chirag", member_3: "Gagan R", member_4: "M Punith Gowda" },
  { sl_no: 48, team_name: "S S M L", member_1: "S M Likitha", member_2: "Spoorthi M", member_3: "Subiksha R", member_4: "S P Meghana" },
  { sl_no: 49, team_name: "Team Alpha", member_1: "R R Gagana", member_2: "M O Gagana", member_3: "T N Sinchana", member_4: "Deepika C R" },
  { sl_no: 50, team_name: "Neural Nexus", member_1: "B S Sanjana", member_2: "Y L Thanmayi", member_3: "T N Varshitha", member_4: "B J Spoorthi" },
  { sl_no: 51, team_name: "Web Weaver", member_1: "R S Vinay Gowda", member_2: "B S Tejas", member_3: "Y S Tharun", member_4: "L V Yashas Gowda" },
  { sl_no: 52, team_name: "Algorithm Avengers", member_1: "VARUN D R", member_2: "M N YASHVANTH", member_3: "S SINCHANA", member_4: "D M SINCHANA" },
  { sl_no: 53, team_name: "VISIONARY TECH", member_1: "Y S YASHWANTH GOWDA", member_2: "U R CHETHAN", member_3: "S CHETHAN", member_4: "THIPPESH S C" },
  { sl_no: 54, team_name: "MAVERICKS", member_1: "U J Likitha", member_2: "Subash K C", member_3: "Subramanya B L", member_4: "" },
  { sl_no: 55, team_name: "SYNERGY", member_1: "V P Chandan Gowda", member_2: "B S Tharanath", member_3: "Chiranjeevi S M", member_4: "Chetan M R" },
  { sl_no: 56, team_name: "VYOMA", member_1: "Ruchitha Niradi", member_2: "Vanishree Umar Ji", member_3: "Sakshi Ramaka", member_4: "Sachi Hongal" },
  { sl_no: 57, team_name: "QuardraAI", member_1: "Meghana M", member_2: "BhanuPriya V", member_3: "Dheeraj R S", member_4: "Manoj M" },
  { sl_no: 58, team_name: "SUPREME", member_1: "Sandhya Reddy", member_2: "Syed Imadulla", member_3: "Thriveni S A", member_4: "Teja J" },
  { sl_no: 59, team_name: "TEAM VIKRANT", member_1: "Rishika Dollin", member_2: "Rishabh S K", member_3: "", member_4: "" },
  { sl_no: 60, team_name: "TICKET", member_1: "Saishree Anil", member_2: "Achutha Kaddi", member_3: "Kriishna H S", member_4: "Bhuvan" },
];

function generatePhone(slNo: number, memberIdx: number): string {
  const seed = (slNo * 997 + memberIdx * 1337) % 90000;
  return `+91 98${(40000 + seed).toString().padStart(5, '0')} ${String(100 + (slNo * 7 + memberIdx)).slice(-3)}`;
}

export const INITIAL_TEAMS: Team[] = RAW_TEAMS.map((item, index) => {
  const classroom_id = getClassroomIdForTeam(item.sl_no);
  return {
    id: index + 1,
    sl_no: item.sl_no,
    team_name: item.team_name,
    classroom_id,
    member_1: item.member_1,
    member_1_phone: item.member_1 ? generatePhone(item.sl_no, 1) : '',
    member_1_oct7: false,
    member_1_oct8: false,
    member_1_oct9: false,
    member_2: item.member_2,
    member_2_phone: item.member_2 ? generatePhone(item.sl_no, 2) : '',
    member_2_oct7: false,
    member_2_oct8: false,
    member_2_oct9: false,
    member_3: item.member_3,
    member_3_phone: item.member_3 ? generatePhone(item.sl_no, 3) : '',
    member_3_oct7: false,
    member_3_oct8: false,
    member_3_oct9: false,
    member_4: item.member_4,
    member_4_phone: item.member_4 ? generatePhone(item.sl_no, 4) : '',
    member_4_oct7: false,
    member_4_oct8: false,
    member_4_oct9: false,
    comments: '',
  };
});

// Seed classroom presence entries for initial day (Day 1)
export function getInitialClassroomPresence(dayNumber: number = 1): ClassroomPresence[] {
  const presences: ClassroomPresence[] = [];
  INITIAL_TEAMS.forEach((team) => {
    const classroom_id = team.classroom_id || getClassroomIdForTeam(team.sl_no);
    const members = [
      { name: team.member_1, phone: team.member_1_phone, isLead: true },
      { name: team.member_2, phone: team.member_2_phone, isLead: false },
      { name: team.member_3, phone: team.member_3_phone, isLead: false },
      { name: team.member_4, phone: team.member_4_phone, isLead: false },
    ];

    members.forEach((m) => {
      if (m.name && m.name.trim() !== '') {
        presences.push({
          day_number: dayNumber,
          classroom_id,
          team_name: team.team_name,
          participant_name: m.name.trim(),
          phone_number: m.phone || '',
          is_team_lead: m.isLead,
          is_in_room: true,
          last_toggle_time: new Date().toISOString(),
          updated_by: 'system',
        });
      }
    });
  });
  return presences;
}

export const DEFAULT_COORDINATORS: Record<string, string[]> = {
  '401': ['Alex Kumar', 'Samarth V'],
  '402': ['John D', 'Priya S'],
  '403': ['Kiran Rao', 'Deepa M'],
  '404': ['Rohit Sharma', 'Ananya K'],
  '405': ['Varun Reddy', 'Sneha P'],
  '406': ['Tanvi Shah', 'Nikhil G'],
  '407': ['Gautam N', 'Meera R'],
  '408': ['Harish B', 'Divya C'],
};

export const DEFAULT_QUICK_ACTIONS = [
  'Breakfast',
  'Lunch',
  'Dinner',
  'Snack Break',
  'Event',
];
