/**
 * PTB Class 9 (9TH) - Computer - Complete Syllabus
 * Source: Punjab Textbook Board
 */
export interface Chapter { id: string; code: string; title: string; type: "unit" | "review" | "section"; }
export interface Unit { id: string; title: string; type: "unit" | "review" | "section"; chapters: Chapter[]; }

export const PTB_CLASS9_COMPUTER: Unit[] = [
  {
    id: "chap-1",
    title: "CHAP 1: INTRODUCTION TO COMPUTATIONAL SYSTEMS",
    type: "unit",
    chapters: [
      { id: "1.1", code: "1.1", title: "THEORY OF SYSTEMS", type: "unit" },
      { id: "1.2", code: "1.2", title: "SOFTWARE", type: "unit" },
      { id: "1.3", code: "1.3", title: "THE ARCHITECTURE OF VON NEUMANN COMPUTERS", type: "unit" },
      { id: "1.4", code: "1.4", title: "NUMBER SYSTEMS", type: "unit" },
      { id: "1.5", code: "1.5", title: "DATA REPRESENTATION IN COMPUTING SYSTEMS", type: "unit" },
      { id: "1.6", code: "1.6", title: "BINARY ARITHMETIC OPERATIONS", type: "unit" },
      { id: "1.7", code: "1.7", title: "COMMON TEXT ENCODING SCHEMES", type: "unit" }
    ]
  },
  {
    id: "chap-2",
    title: "CHAP 2: SYSTEM DESIGN AND TROUBLESHOOTING",
    type: "unit",
    chapters: [
      { id: "2.1", code: "2.1", title: "BASIC CONCEPT OF DIGITAL SYSTEMS", type: "unit" },
      { id: "2.2", code: "2.2", title: "BOOLEAN ALGEBRA AND LOGIC GATES", type: "unit" },
      { id: "2.3", code: "2.3", title: "SIMPLIFICATION OF BOOLEAN FUNCTIONS", type: "unit" },
      { id: "2.4", code: "2.4", title: "CREATING LOGIC DIAGRAMS", type: "unit" },
      { id: "2.5", code: "2.5", title: "SYSTEM TROUBLESHOOTING", type: "unit" }
    ]
  },
  {
    id: "chap-3",
    title: "CHAP 3: COMPUTER NETWORKS",
    type: "unit",
    chapters: [
      { id: "3.1",  code: "3.1",  title: "NETWORK AS A SYSTEM", type: "unit" },
      { id: "3.2",  code: "3.2",  title: "FUNDAMENTAL CONCEPTS IN DATA COMMUNICATION", type: "unit" },
      { id: "3.3",  code: "3.3",  title: "NETWORKING DEVICES", type: "unit" },
      { id: "3.4",  code: "3.4",  title: "NETWORK TOPOLOGIES", type: "unit" },
      { id: "3.5",  code: "3.5",  title: "TRANSMISSION MODES", type: "unit" },
      { id: "3.6",  code: "3.6",  title: "THE OSI NETWORKING MODEL", type: "unit" },
      { id: "3.7",  code: "3.7",  title: "IPV4 AND IPV6", type: "unit" },
      { id: "3.8",  code: "3.8",  title: "NETWORK PROTOCOLS", type: "unit" },
      { id: "3.9",  code: "3.9",  title: "NETWORK SECURITY", type: "unit" },
      { id: "3.10", code: "3.10", title: "NETWORK SECURITY METHODS", type: "unit" },
      { id: "3.11", code: "3.11", title: "TYPES OF NETWORKS", type: "unit" },
      { id: "3.12", code: "3.12", title: "REAL-WORLD APPLICATIONS OF COMPUTER NETWORKS", type: "unit" }
    ]
  },
  {
    id: "chap-4",
    title: "CHAP 4: COMPUTATIONAL THINKING",
    type: "unit",
    chapters: [
      { id: "4.1", code: "4.1", title: "COMPUTATIONAL THINKING", type: "unit" },
      { id: "4.2", code: "4.2", title: "PRINCIPLES OF COMPUTATIONAL THINKING", type: "unit" },
      { id: "4.3", code: "4.3", title: "ALGORITHM DESIGN METHODS", type: "unit" },
      { id: "4.4", code: "4.4", title: "EVALUATION TECHNIQUES FOR AN ALGORITHM", type: "unit" },
      { id: "4.5", code: "4.5", title: "DRY RUN", type: "unit" },
      { id: "4.6", code: "4.6", title: "INTRODUCTION OF LARP (LOGIC OF ALGORITHMS FOR RESOLUTION OF PROBLEMS)", type: "unit" },
      { id: "4.7", code: "4.7", title: "ERROR IDENTIFICATION AND DEBUGGING", type: "unit" }
    ]
  },
  {
    id: "chap-5",
    title: "CHAP 5: WEB DEVELOPMENT WITH HTML, CSS AND JAVASCRIPT",
    type: "unit",
    chapters: [
      { id: "5.1", code: "5.1", title: "WEB DEVELOPMENT", type: "unit" },
      { id: "5.2", code: "5.2", title: "BASIC COMPONENTS OF WEB DEVELOPMENT", type: "unit" },
      { id: "5.3", code: "5.3", title: "GETTING STARTED WITH HTML", type: "unit" },
      { id: "5.4", code: "5.4", title: "HTML BASIC STRUCTURE", type: "unit" },
      { id: "5.5", code: "5.5", title: "CREATING CONTENT WITH HTML", type: "unit" },
      { id: "5.6", code: "5.6", title: "STYLING WITH CSS", type: "unit" },
      { id: "5.7", code: "5.7", title: "INTRODUCTION TO JAVASCRIPT", type: "unit" }
    ]
  },
  {
    id: "chap-6",
    title: "CHAP 6: DATA SCIENCE AND DATA GATHERING",
    type: "unit",
    chapters: [
      { id: "6.1", code: "6.1", title: "DATA", type: "unit" },
      { id: "6.2", code: "6.2", title: "DATA TYPES", type: "unit" },
      { id: "6.3", code: "6.3", title: "ORGANISING AND ANALYSING DATA", type: "unit" },
      { id: "6.4", code: "6.4", title: "DATA TYPES", type: "unit" },
      { id: "6.5", code: "6.5", title: "DATA VISUALIZATION", type: "unit" },
      { id: "6.6", code: "6.6", title: "DATA PRE-PROCESSING AND ANALYSIS", type: "unit" },
      { id: "6.7", code: "6.7", title: "CLOUD STORAGE AND DATA BACKUPS", type: "unit" },
      { id: "6.8", code: "6.8", title: "INTRODUCTION TO DATA SCIENCE", type: "unit" }
    ]
  },
  {
    id: "chap-7",
    title: "CHAP 7: EMERGING TECHNOLOGIES IN COMPUTER SCIENCE",
    type: "unit",
    chapters: [
      { id: "7.1", code: "7.1", title: "INTRODUCTION TO ARTIFICIAL INTELLIGENCE", type: "unit" },
      { id: "7.2", code: "7.2", title: "AI ALGORITHMS AND TECHNIQUES", type: "unit" },
      { id: "7.3", code: "7.3", title: "INTRODUCTION TO INTERNET OF THINGS (IOT)", type: "unit" }
    ]
  },
  {
    id: "chap-8",
    title: "CHAP 8: ETHICAL, SOCIAL, AND LEGAL CONCERNS IN COMPUTER USAGE",
    type: "unit",
    chapters: [
      { id: "8.1", code: "8.1", title: "SECURE COMPUTER USAGE", type: "unit" },
      { id: "8.2", code: "8.2", title: "RESPONSIBLE COMPUTER USAGE", type: "unit" },
      { id: "8.3", code: "8.3", title: "BEST PRACTICES IN ONLINE BEHAVIOR", type: "unit" },
      { id: "8.4", code: "8.4", title: "INTELLECTUAL PROPERTY RIGHTS", type: "unit" }
    ]
  },
  {
    id: "chap-9",
    title: "CHAP 9: ENTREPRENEURSHIP IN DIGITAL AGE",
    type: "unit",
    chapters: [
      { id: "9.1", code: "9", title: "ENTREPRENEURSHIP IN DIGITAL AGE", type: "unit" }
    ]
  }
];

export function getAllChapters(): Chapter[] { return PTB_CLASS9_COMPUTER.flatMap(u => u.chapters); }
export function getChaptersByUnit(unitId: string): Chapter[] { const u = PTB_CLASS9_COMPUTER.find(x => x.id === unitId); return u ? u.chapters : []; }
export function getChapterById(chapterId: string): Chapter | undefined { return getAllChapters().find(ch => ch.id === chapterId); }
export function getTotalChapterCount(): number { return getAllChapters().length; }
export const SYLLABUS_METADATA = { subject: "Computer", class: "9th", board: "PTB", totalUnits: 9, totalChapters: getTotalChapterCount(), language: "English" };
