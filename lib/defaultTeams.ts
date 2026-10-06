import { Team, ClassroomPresence } from './types';

// Map of Team Sl. No. -> Assigned Classroom (from official final allocation)
export const SL_TO_ROOM: Record<number, string> = {
  1: "402",
  2: "406",
  3: "408",
  4: "403",
  5: "407",
  6: "401",
  7: "404",
  8: "408",
  9: "406",
  10: "404",
  11: "404",
  12: "408",
  13: "401",
  14: "404",
  15: "407",
  16: "404",
  17: "406",
  18: "402",
  19: "407",
  20: "401",
  21: "407",
  22: "404",
  23: "403",
  24: "401",
  25: "406",
  26: "402",
  27: "406",
  28: "407",
  29: "401",
  30: "404",
  31: "402",
  32: "403",
  33: "406",
  34: "403",
  35: "401",
  36: "404",
  37: "406",
  38: "404",
  39: "407",
  40: "407",
  41: "402",
  42: "408",
  43: "408",
  44: "403",
  45: "408",
  46: "403",
  47: "406",
  48: "406",
  49: "407",
  50: "408",
  51: "408",
};

// Helper to determine classroom from sl_no
export function getClassroomIdForTeam(slNo: number): string {
  return SL_TO_ROOM[slNo] || '401';
}

interface RawTeamEntry {
  sl_no: number;
  team_name: string;
  classroom_id: string;
  carf_code: string;
  college: string;
  city: string;
  state: string;
  member_1: string;
  member_1_phone: string;
  member_2: string;
  member_3: string;
  member_4: string;
  comments: string;
}

export const RAW_TEAMS: RawTeamEntry[] = [
  { sl_no: 1, team_name: "SAKSHI", classroom_id: "402", carf_code: "CARF-43", college: "Bangalore Institute of Technology", city: "Bengaluru", state: "Karnataka", member_1: "Anagha BL", member_1_phone: "+91 70229 32179", member_2: "Khushi Agarwal", member_3: "Subikshaa M", member_4: "Varshini Murthy", comments: "CARF-43 \u2022 Bangalore Institute of Technology" },
  { sl_no: 2, team_name: "Advaitha", classroom_id: "406", carf_code: "CARF-02", college: "JIT / Jyothy Institute of Technology", city: "Bengaluru", state: "Karnataka", member_1: "Kamakshi Shreya B S", member_1_phone: "+91 78929 12718", member_2: "Shravanthi A", member_3: "Priya R", member_4: "Anusha NK", comments: "CARF-02 \u2022 JIT / Jyothy Institute of Technology" },
  { sl_no: 3, team_name: "Team Chandra", classroom_id: "408", carf_code: "CARF-13", college: "Jyothy Institute of Technology", city: "Bengaluru", state: "Karnataka", member_1: "Karthk Krishna", member_1_phone: "+91 91102 75236", member_2: "Abhinav Tejas", member_3: "Adarsh Kumar R", member_4: "Rakesh", comments: "CARF-13 \u2022 Jyothy Institute of Technology" },
  { sl_no: 4, team_name: "Team SRTC", classroom_id: "403", carf_code: "CARF-50", college: "Jyothy Institute of Technology", city: "Bengaluru", state: "Karnataka", member_1: "Tejas J", member_1_phone: "+91 97409 28661", member_2: "Rahul B", member_3: "Skanda Gargeshwari", member_4: "M K Chethan", comments: "CARF-50 \u2022 Jyothy Institute of Technology" },
  { sl_no: 5, team_name: "Coffee to code", classroom_id: "407", carf_code: "CARF-14", college: "JIT / Jyothy Institute of Technology", city: "Bengaluru", state: "Karnataka", member_1: "Rithvik Raghu", member_1_phone: "+91 91488 60082", member_2: "Rohan N", member_3: "SHAMITH S", member_4: "Sachin V", comments: "CARF-14 \u2022 JIT / Jyothy Institute of Technology" },
  { sl_no: 6, team_name: "MythoVerse", classroom_id: "401", carf_code: "CARF-29", college: "RV Institute of Technology & Management (RVITM)", city: "Bengaluru", state: "Karnataka", member_1: "Anagha G Rao", member_1_phone: "+91 90368 60022", member_2: "S Tarun Reddy", member_3: "Varsha A", member_4: "AMRUTHA M", comments: "CARF-29 \u2022 RV Institute of Technology & Management (RVITM)" },
  { sl_no: 7, team_name: "Team Vision", classroom_id: "404", carf_code: "CARF-52", college: "Dayananda Sagar College of Engineering", city: "Bengaluru", state: "Karnataka", member_1: "Ullagaddi Arpitha", member_1_phone: "+91 81474 86152", member_2: "Shreya Mathad", member_3: "Sukanya Patil", member_4: "Renuka Mehtre", comments: "CARF-52 \u2022 Dayananda Sagar College of Engineering" },
  { sl_no: 8, team_name: "THE DREAMER'S", classroom_id: "408", carf_code: "CARF-56", college: "Jyothy Institute of Technology", city: "Bengaluru", state: "Karnataka", member_1: "M SURYAPRAKASH", member_1_phone: "+91 63815 01023", member_2: "Suhail M", member_3: "Lakshmi sagar G", member_4: "CHIRANTHAN M", comments: "CARF-56 \u2022 Jyothy Institute of Technology" },
  { sl_no: 9, team_name: "Yes", classroom_id: "406", carf_code: "CARF-60", college: "Dayananda Sagar Academy of Technology & Management", city: "Bengaluru", state: "Karnataka", member_1: "Rohan D Sorab", member_1_phone: "+91 63628 62503", member_2: "Sudhanvaa VK", member_3: "Prakruthi Prashanth", member_4: "", comments: "CARF-60 \u2022 Dayananda Sagar Academy of Technology & Management" },
  { sl_no: 10, team_name: "Advaita Labs", classroom_id: "404", carf_code: "CARF-03", college: "S-VYASA Deemed-to-be University", city: "Bengaluru", state: "Karnataka", member_1: "Amogh R", member_1_phone: "+91 99164 43206", member_2: "Vikas Krishna T L", member_3: "Sanjith srikrishna sastry", member_4: "", comments: "CARF-03 \u2022 S-VYASA Deemed-to-be University" },
  { sl_no: 11, team_name: "Technova", classroom_id: "404", carf_code: "CARF-54", college: "SJC Institute of Technology", city: "Chikkaballapur", state: "Karnataka", member_1: "Sanchitha S", member_1_phone: "+91 82965 45766", member_2: "Sanika R", member_3: "Sharanya K G", member_4: "Inchara K S", comments: "CARF-54 \u2022 SJC Institute of Technology" },
  { sl_no: 12, team_name: "QuadraAI", classroom_id: "408", carf_code: "CARF-40", college: "Jyothy Institute of Technology", city: "Bengaluru", state: "Karnataka", member_1: "Meghana M", member_1_phone: "+91 76192 69549", member_2: "BhanuPriya V", member_3: "Dheeraj R S", member_4: "Manoj M", comments: "CARF-40 \u2022 Jyothy Institute of Technology" },
  { sl_no: 13, team_name: "NOVACORE", classroom_id: "401", carf_code: "CARF-35", college: "Jyothy Institute of Technology", city: "Bengaluru", state: "Karnataka", member_1: "KAASHVI GOWDA B", member_1_phone: "+91 95356 94679", member_2: "PRAJWAL S", member_3: "Inchara S", member_4: "Spoorthi S Rao", comments: "CARF-35 \u2022 Jyothy Institute of Technology" },
  { sl_no: 14, team_name: "Innovexa", classroom_id: "404", carf_code: "CARF-21", college: "SJC Institute of Technology", city: "Chikkaballapur", state: "Karnataka", member_1: "Madhu PG", member_1_phone: "+91 81562 00183", member_2: "Namitha A", member_3: "Kusuma B M", member_4: "", comments: "CARF-21 \u2022 SJC Institute of Technology" },
  { sl_no: 15, team_name: "JnanaX", classroom_id: "407", carf_code: "CARF-23", college: "Dayananda Sagar College of Engineering", city: "Bengaluru", state: "Karnataka", member_1: "Bhakti priya", member_1_phone: "+91 97402 63599", member_2: "Rishika M.A", member_3: "Chaithanya KA", member_4: "", comments: "CARF-23 \u2022 Dayananda Sagar College of Engineering" },
  { sl_no: 16, team_name: "Syntax Sorcerers", classroom_id: "404", carf_code: "CARF-47", college: "Jyothy Institute of Technology", city: "Bengaluru", state: "Karnataka", member_1: "SHREESH KULKARNI", member_1_phone: "+91 82960 06511", member_2: "Vishnuvardhana S", member_3: "Vikas. S", member_4: "Samarth Satoddi", comments: "CARF-47 \u2022 Jyothy Institute of Technology" },
  { sl_no: 17, team_name: "Kela", classroom_id: "406", carf_code: "CARF-24", college: "Vellore Institute of Technology", city: "Vellore", state: "Tamil Nadu", member_1: "Vaibhav Jangid", member_1_phone: "+91 70905 62108", member_2: "Bhavya Dhoot", member_3: "Garv Bansal", member_4: "", comments: "CARF-24 \u2022 Vellore Institute of Technology" },
  { sl_no: 18, team_name: "Ctrl Alt Defeat", classroom_id: "402", carf_code: "CARF-17", college: "East West Institute of Technology", city: "Bengaluru", state: "Karnataka", member_1: "Kiran L", member_1_phone: "+91 97399 31621", member_2: "DHANUSH S", member_3: "Manoj B R", member_4: "THEJAS R", comments: "CARF-17 \u2022 East West Institute of Technology" },
  { sl_no: 19, team_name: "Ekagra", classroom_id: "407", carf_code: "CARF-26", college: "JSS Academy of Technical Education", city: "Bengaluru", state: "Karnataka", member_1: "Madhura Pattar", member_1_phone: "+91 74838 21166", member_2: "Sakshi G Gowda", member_3: "Sahana G", member_4: "Sanvi S Kote", comments: "CARF-26 \u2022 JSS Academy of Technical Education" },
  { sl_no: 20, team_name: "AETHERIX", classroom_id: "401", carf_code: "CARF-04", college: "Jyothy Institute of Technology", city: "Bengaluru", state: "Karnataka", member_1: "Vishant Kannan", member_1_phone: "+91 96062 48761", member_2: "Prasenjit Das", member_3: "Deergh Sai Singh", member_4: "pranav ramesh", comments: "CARF-04 \u2022 Jyothy Institute of Technology" },
  { sl_no: 21, team_name: "Nexovate", classroom_id: "407", carf_code: "CARF-32", college: "Banglore Institute of Technology", city: "Bengaluru", state: "Karnataka", member_1: "Manas Kabbur", member_1_phone: "+91 74833 48058", member_2: "Rajeev C", member_3: "Rishabh", member_4: "NIRANJAN PATWARDHAN", comments: "CARF-32 \u2022 Banglore Institute of Technology" },
  { sl_no: 22, team_name: "Supreme", classroom_id: "404", carf_code: "CARF-46", college: "SJCIT / SJC Institute of Technology", city: "Chikkaballapur", state: "Karnataka", member_1: "Sandhya Reddy", member_1_phone: "+91 97428 03280", member_2: "Syed Imadulla", member_3: "Thriveni S A", member_4: "Teja J", comments: "CARF-46 \u2022 SJCIT / SJC Institute of Technology" },
  { sl_no: 23, team_name: "ANANTA", classroom_id: "403", carf_code: "CARF-06", college: "Jyothy Institute of Technology", city: "Bengaluru", state: "Karnataka", member_1: "YOGITHA N", member_1_phone: "+91 93535 62959", member_2: "Amrutha Prasad", member_3: "", member_4: "", comments: "CARF-06 \u2022 Jyothy Institute of Technology" },
  { sl_no: 24, team_name: "Impact", classroom_id: "401", carf_code: "CARF-20", college: "Jyothy Institute of Technology", city: "Bengaluru", state: "Karnataka", member_1: "Sowmya Shashi", member_1_phone: "+91 94811 72415", member_2: "Madhushree K N", member_3: "Sthuthi S Rao", member_4: "Sai Skanda G K", comments: "CARF-20 \u2022 Jyothy Institute of Technology" },
  { sl_no: 25, team_name: "GITA BYTE L : ( V R Mahesh )", classroom_id: "406", carf_code: "CARF-18", college: "Jyothy Institute of Technology", city: "Bengaluru", state: "Karnataka", member_1: "V R Mahesh", member_1_phone: "+91 80883 54770", member_2: "Shripad Kantambatlu", member_3: "Shreyas Dikshit", member_4: "Rohith S M", comments: "CARF-18 \u2022 Jyothy Institute of Technology" },
  { sl_no: 26, team_name: "Quantum Coders", classroom_id: "402", carf_code: "CARF-39", college: "Jyothy Institute of Technology", city: "Bengaluru", state: "Karnataka", member_1: "Balmukund Shinde", member_1_phone: "+91 90361 58707", member_2: "Rakshaa Sinchana", member_3: "Jeevanth M", member_4: "Keerthana Naveen", comments: "CARF-39 \u2022 Jyothy Institute of Technology" },
  { sl_no: 27, team_name: "Tetragram", classroom_id: "406", carf_code: "CARF-55", college: "Jyothy Institute of Technology", city: "Bengaluru", state: "Karnataka", member_1: "vineet teli", member_1_phone: "+91 90366 42383", member_2: "Bhargavi HS", member_3: "Vaibhavi B", member_4: "Sai Samarth", comments: "CARF-55 \u2022 Jyothy Institute of Technology" },
  { sl_no: 28, team_name: "Ideators l", classroom_id: "407", carf_code: "CARF-19", college: "Jyothy Institute of Technology", city: "Bengaluru", state: "Karnataka", member_1: "Aditya Bhat", member_1_phone: "+91 78922 13845", member_2: "Amogh Ravishankar", member_3: "harsha v", member_4: "Inchara B S", comments: "CARF-19 \u2022 Jyothy Institute of Technology" },
  { sl_no: 29, team_name: "TEAM GODLIKE", classroom_id: "401", carf_code: "CARF-48", college: "Jyothy Institute of Technology", city: "Bengaluru", state: "Karnataka", member_1: "Preetham HM", member_1_phone: "+91 70196 26167", member_2: "Roshan KP", member_3: "Smruthi barve", member_4: "Surabhi SD", comments: "CARF-48 \u2022 Jyothy Institute of Technology" },
  { sl_no: 30, team_name: "Quad", classroom_id: "404", carf_code: "CARF-37", college: "Jyothy Institute of Technology", city: "Bengaluru", state: "Karnataka", member_1: "Jeevitha Reddy M", member_1_phone: "+91 82170 20416", member_2: "N ARYA", member_3: "Jeevika Reddy M", member_4: "PRANATHI RAO", comments: "CARF-37 \u2022 Jyothy Institute of Technology" },
  { sl_no: 31, team_name: "RAYARI", classroom_id: "402", carf_code: "CARF-41", college: "APS College of Engineering (APSCE)", city: "Bengaluru", state: "Karnataka", member_1: "Bhumika Gowda", member_1_phone: "+91 82172 82425", member_2: "Harshitha C R", member_3: "", member_4: "", comments: "CARF-41 \u2022 APS College of Engineering (APSCE)" },
  { sl_no: 32, team_name: "JNANA SETHU", classroom_id: "403", carf_code: "CARF-22", college: "SJC Institute of Technology", city: "Chikkaballapur", state: "Karnataka", member_1: "Pavan Sai", member_1_phone: "+91 99807 74701", member_2: "Punith", member_3: "Lahari Manjunath", member_4: "Chandana G H", comments: "CARF-22 \u2022 SJC Institute of Technology" },
  { sl_no: 33, team_name: "Mehta Bionics", classroom_id: "406", carf_code: "CARF-28", college: "Rajarajeshwari college of engineering", city: "Bengaluru", state: "Karnataka", member_1: "Nikhil Mehta", member_1_phone: "+91 96326 20018", member_2: "Krithik Mehta", member_3: "Abhishek Mehta", member_4: "Chaurasiya Ayoush Raghavendra", comments: "CARF-28 \u2022 Rajarajeshwari college of engineering" },
  { sl_no: 34, team_name: "EKATHVA", classroom_id: "403", carf_code: "CARF-01", college: "JIT / Jyothy Institute of Technology", city: "Bengaluru", state: "Karnataka", member_1: "Shukthija Siri G", member_1_phone: "+91 82176 17465", member_2: "Nidhi ural M.S.", member_3: "Vasudevan G S", member_4: "Vishal T H", comments: "CARF-01 \u2022 JIT / Jyothy Institute of Technology" },
  { sl_no: 35, team_name: "maya darpana", classroom_id: "401", carf_code: "CARF-27", college: "Jyothy Institute of Technology", city: "Bengaluru", state: "Karnataka", member_1: "Shripriya Kashyap", member_1_phone: "+91 84510 77473", member_2: "Bhuvan Rupesh Kumar", member_3: "Dheemanth", member_4: "", comments: "CARF-27 \u2022 Jyothy Institute of Technology" },
  { sl_no: 36, team_name: "Astitva Unbound", classroom_id: "404", carf_code: "CARF-59", college: "K S School of Engineering and Management", city: "Bengaluru", state: "Karnataka", member_1: "Avanija Mantena", member_1_phone: "+91 81237 60712", member_2: "Hitesh. B. V.", member_3: "", member_4: "", comments: "CARF-59 \u2022 K S School of Engineering and Management" },
  { sl_no: 37, team_name: "Cortex.exe", classroom_id: "406", carf_code: "CARF-15", college: "Jyothy Institute of Technology", city: "Bengaluru", state: "Karnataka", member_1: "Shria Shashidhar", member_1_phone: "+91 82177 25010", member_2: "Vaishnavi -", member_3: "Vibha Srinivasa", member_4: "Prajna .s", comments: "CARF-15 \u2022 Jyothy Institute of Technology" },
  { sl_no: 38, team_name: "Brahmasrastarah", classroom_id: "404", carf_code: "CARF-09", college: "Sri Sairam College of Engineering", city: "Bengaluru/Anekal", state: "Karnataka", member_1: "V Bhavana", member_1_phone: "+91 83101 02851", member_2: "Praveen K M", member_3: "Nithyasri J", member_4: "", comments: "CARF-09 \u2022 Sri Sairam College of Engineering" },
  { sl_no: 39, team_name: "Team Krishna", classroom_id: "407", carf_code: "CARF-25", college: "Jyothy Institute of Technology", city: "Bengaluru", state: "Karnataka", member_1: "Mithil Sai", member_1_phone: "+91 96062 08922", member_2: "NANDAN S", member_3: "Prerana S K", member_4: "Afnan Zain", comments: "CARF-25 \u2022 Jyothy Institute of Technology" },
  { sl_no: 40, team_name: "Team Vyom", classroom_id: "407", carf_code: "CARF-58", college: "Jyothy Institute of Technology", city: "Bengaluru", state: "Karnataka", member_1: "Tarun M", member_1_phone: "+91 83107 09906", member_2: "Somesh M", member_3: "Varun", member_4: "VARUN GOWDA M S", comments: "CARF-58 \u2022 Jyothy Institute of Technology" },
  { sl_no: 41, team_name: "Alpha beda gamma", classroom_id: "402", carf_code: "CARF-05", college: "Kalpataru Institute of Technology", city: "Tiptur", state: "Karnataka", member_1: "Gagandeep. C", member_1_phone: "+91 83103 35452", member_2: "Ramsagar. V", member_3: "Akshay. G", member_4: "Druva kumar. V", comments: "CARF-05 \u2022 Kalpataru Institute of Technology" },
  { sl_no: 42, team_name: "SentinalX", classroom_id: "408", carf_code: "CARF-44", college: "Sri Sairam College of Engineering", city: "Bengaluru/Anekal", state: "Karnataka", member_1: "Rajasekar V", member_1_phone: "+91 93534 96766", member_2: "Sonu J", member_3: "K Omkarreddy", member_4: "", comments: "CARF-44 \u2022 Sri Sairam College of Engineering" },
  { sl_no: 43, team_name: "RTX6090", classroom_id: "408", carf_code: "CARF-42", college: "AMC Engineering College", city: "Bengaluru", state: "Karnataka", member_1: "Shufwath Raqeeb S", member_1_phone: "+91 99649 07635", member_2: "Shiva ganeshSR", member_3: "Kaushal K", member_4: "Anurag Mishra", comments: "CARF-42 \u2022 AMC Engineering College" },
  { sl_no: 44, team_name: "CosmicIntellect", classroom_id: "403", carf_code: "CARF-16", college: "Jyothy Institute of Technology", city: "Bengaluru", state: "Karnataka", member_1: "Shreya Sanagaram", member_1_phone: "+91 88844 04196", member_2: "Abja DH", member_3: "ABHISHA A VAIDYA", member_4: "Amogha", comments: "CARF-16 \u2022 Jyothy Institute of Technology" },
  { sl_no: 45, team_name: "Nirvikara", classroom_id: "408", carf_code: "CARF-33", college: "Brindavan College of Engineering", city: "Bengaluru", state: "Karnataka", member_1: "Sree Sahithi", member_1_phone: "+91 70228 99530", member_2: "Yashaswini B", member_3: "", member_4: "", comments: "CARF-33 \u2022 Brindavan College of Engineering" },
  { sl_no: 46, team_name: "BrainBytes", classroom_id: "403", carf_code: "CARF-61", college: "Jyothy Institute of Technology", city: "Bengaluru", state: "Karnataka", member_1: "Saishree Anil", member_1_phone: "+91 96207 71565", member_2: "", member_3: "", member_4: "", comments: "CARF-61 \u2022 Jyothy Institute of Technology" },
  { sl_no: 47, team_name: "QuadraNova", classroom_id: "406", carf_code: "CARF-38", college: "Jyothy Institute of Technology", city: "Bengaluru", state: "Karnataka", member_1: "Anushree N", member_1_phone: "+91 88616 39412", member_2: "usharani cp", member_3: "Chaithra yadav", member_4: "Deeksha K.L", comments: "CARF-38 \u2022 Jyothy Institute of Technology" },
  { sl_no: 48, team_name: "Spicy bok", classroom_id: "406", carf_code: "CARF-45", college: "Dayananda Sagar Academy of Technology & Management", city: "Bengaluru", state: "Karnataka", member_1: "Monish Kumar r", member_1_phone: "+91 83104 79967", member_2: "Sanhith Huskur", member_3: "", member_4: "", comments: "CARF-45 \u2022 Dayananda Sagar Academy of Technology & Management" },
  { sl_no: 49, team_name: "Brainy bunch", classroom_id: "407", carf_code: "CARF-11", college: "Jyothy Institute of Technology", city: "Bengaluru", state: "Karnataka", member_1: "Pannagajp", member_1_phone: "+91 63640 42919", member_2: "Samhitha Kalaskar B", member_3: "PRIYANKA BHASKAR", member_4: "OREKANTI TANYA REDDY", comments: "CARF-11 \u2022 Jyothy Institute of Technology" },
  { sl_no: 50, team_name: "Bit by Bit", classroom_id: "408", carf_code: "CARF-10", college: "Jyothy Institute of Technology", city: "Bengaluru", state: "Karnataka", member_1: "Manjunath L", member_1_phone: "+91 90711 17475", member_2: "Pradeep Narasenavar", member_3: "MANOJ R", member_4: "Abhishek K C", comments: "CARF-10 \u2022 Jyothy Institute of Technology" },
  { sl_no: 51, team_name: "TICKET", classroom_id: "408", carf_code: "CARF-57", college: "Jyothy Institute of Technology", city: "Bengaluru", state: "Karnataka", member_1: "Saishree Anil", member_1_phone: "+91 88616 69460", member_2: "Achutha Kaddi", member_3: "Kriishna H S", member_4: "Bhuvan", comments: "CARF-57 \u2022 Jyothy Institute of Technology" },
 ];

export const INITIAL_TEAMS: Team[] = RAW_TEAMS.map((item, index) => {
  return {
    id: index + 1,
    sl_no: item.sl_no,
    team_name: item.team_name,
    classroom_id: item.classroom_id,
    carf_code: item.carf_code,
    college: item.college,
    city: item.city,
    state: item.state,
    member_1: item.member_1,
    member_1_phone: item.member_1_phone,
    member_1_oct7: false,
    member_1_oct8: false,
    member_1_oct9: false,
    member_2: item.member_2,
    member_2_phone: '',
    member_2_oct7: false,
    member_2_oct8: false,
    member_2_oct9: false,
    member_3: item.member_3,
    member_3_phone: '',
    member_3_oct7: false,
    member_3_oct8: false,
    member_3_oct9: false,
    member_4: item.member_4,
    member_4_phone: '',
    member_4_oct7: false,
    member_4_oct8: false,
    member_4_oct9: false,
    comments: item.comments,
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
          is_in_room: false,          // Default: OUT / NOT ENTERED
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
