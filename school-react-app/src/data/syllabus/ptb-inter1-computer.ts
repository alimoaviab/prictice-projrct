/**
 * PTB Inter Part-I Computer Syllabus
 * 9 chapters with topics — "(SMART)" preserved exactly
 */

export interface Chapter { id: string; code: string; title: string; type: "chapter"; }
export interface Unit { id: string; title: string; type: "unit"; chapters: Chapter[]; }

export const PTB_INTER1_COMPUTER: Unit[] = [
  {
    id: "chap-1",
    title: "CHAP 1: Introduction to Software Development",
    type: "unit",
    chapters: [
      { id: "1.1", code: "1.1", title: "SOFTWARE DEVELOPMENT (SMART)",                              type: "chapter" },
      { id: "1.2", code: "1.2", title: "INTRODUCTION TO SOFTWARE DEVELOPMENT LIFE CYCLE (SDLC) (SMART)", type: "chapter" },
      { id: "1.3", code: "1.3", title: "SOFTWARE DEVELOPMENT METHODOLOGIES (SMART)",               type: "chapter" },
      { id: "1.4", code: "1.4", title: "PROJECT PLANNING AND MANAGEMENT (SMART)",                   type: "chapter" },
      { id: "1.6", code: "1.6", title: "INTRODUCTION TO DESIGN PATTERNS (SMART)",                  type: "chapter" },
      { id: "1.7", code: "1.7", title: "Software Debugging and Testing",                            type: "chapter" },
      { id: "1.8", code: "1.8", title: "SOFTWARE DEVELOPMENT TOOLS (SMART)",                       type: "chapter" },
    ],
  },
  {
    id: "chap-2",
    title: "CHAP 2: Python Programming",
    type: "unit",
    chapters: [
      { id: "2.1", code: "2.1", title: "INTRODUCTION TO PYTHON PROGRAMMING (SMART)",       type: "chapter" },
      { id: "2.2", code: "2.2", title: "BASIC PYTHON SYNTAX AND STRUCTURE (SMART)",        type: "chapter" },
      { id: "2.3", code: "2.3", title: "OPERATORS AND EXPRESSIONS (SMART)",                type: "chapter" },
      { id: "2.4", code: "2.4", title: "CONTROL STRUCTURES (SMART)",                       type: "chapter" },
      { id: "2.5", code: "2.5", title: "PYTHON MODULES AND BUILT-IN DATA STRUCTURES (SMART)", type: "chapter" },
      { id: "2.6", code: "2.6", title: "BUILT-IN DATA STRUCTURES (SMART)",                 type: "chapter" },
      { id: "2.7", code: "2.7", title: "MODULAR PROGRAMMING IN PYTHON (SMART)",            type: "chapter" },
    ],
  },
  {
    id: "chap-3",
    title: "CHAP 3: Algorithms and Problem Solving",
    type: "unit",
    chapters: [
      { id: "3.1", code: "3.1", title: "UNDERSTANDING COMPUTATIONAL PROBLEMS (SMART)",  type: "chapter" },
      { id: "3.2", code: "3.2", title: "ALGORITHMS FOR PROBLEM SOLVING (SMART)",        type: "chapter" },
      { id: "3.3", code: "3.3", title: "PROBLEM SOLVABILITY AND COMPLEXITY (SMART)",   type: "chapter" },
      { id: "3.4", code: "3.4", title: "ALGORITHM ANALYSIS (SMART)",                   type: "chapter" },
      { id: "3.5", code: "3.5", title: "ALGORITHM DESIGN TECHNIQUES (SMART)",          type: "chapter" },
      { id: "3.6", code: "3.6", title: "COMMONLY USED ALGORITHMS (SMART)",             type: "chapter" },
    ],
  },
  {
    id: "chap-4",
    title: "CHAP 4: Computational Structures",
    type: "unit",
    chapters: [
      { id: "4.1", code: "4.1", title: "PRIMITIVE COMPUTATIONAL STRUCTURES (SMART)", type: "chapter" },
    ],
  },
  {
    id: "chap-5",
    title: "CHAP 5: Data Analytics",
    type: "unit",
    chapters: [
      { id: "5.1", code: "5.1", title: "BASIC STATISTICAL CONCEPTS (SMART)",          type: "chapter" },
      { id: "5.2", code: "5.2", title: "DATA COLLECTION AND PREPARATION (SMART)",     type: "chapter" },
      { id: "5.4", code: "5.4", title: "INTRODUCTION TO DATA VISUALIZATION (SMART)",  type: "chapter" },
      { id: "5.5", code: "5.5", title: "TOOLS FOR DATA VISUALIZATION (SMART)",        type: "chapter" },
    ],
  },
  {
    id: "chap-6",
    title: "CHAP 6: Emerging Technologies",
    type: "unit",
    chapters: [
      { id: "6.1", code: "6.1", title: "DEFINITION AND OVERVIEW OF EMERGING TECHNOLOGIES (SMART)", type: "chapter" },
      { id: "6.2", code: "6.2", title: "CLOUD COMPUTING (SMART)",                                  type: "chapter" },
      { id: "6.3", code: "6.3", title: "APPLICATIONS AND IMPLICATIONS OF CLOUD COMPUTING (SMART)", type: "chapter" },
      { id: "6.6", code: "6.6", title: "FUTURE TRENDS AND INNOVATIONS (SMART)",                    type: "chapter" },
    ],
  },
  {
    id: "chap-7",
    title: "CHAP 7: Legal and Ethical Aspects of Computing System",
    type: "unit",
    chapters: [
      { id: "7.1", code: "7.1", title: "UNDERSTANDING TERMS OF USE (SMART)",                      type: "chapter" },
      { id: "7.2", code: "7.2", title: "PRIVACY AND SECURITY THREATS (SMART)",                   type: "chapter" },
      { id: "7.4", code: "7.4", title: "COMPUTING'S IMPACT ON INDIVIDUALS AND SOCIETY (SMART)",  type: "chapter" },
      { id: "7.5", code: "7.5", title: "DIGITAL CITIZENSHIP AND ETHICAL CONSIDERATIONS (SMART)", type: "chapter" },
    ],
  },
  {
    id: "chap-8",
    title: "CHAP 8: Online Research and Digital Literacy",
    type: "unit",
    chapters: [
      { id: "8.1", code: "8.1", title: "ONLINE RESEARCH AND DIGITAL LITERACY (SMART)",  type: "chapter" },
      { id: "8.2", code: "8.2", title: "UTILIZING DIGITAL RESOURCES (SMART)",           type: "chapter" },
      { id: "8.3", code: "8.3", title: "RESEARCH ETHICS (SMART)",                       type: "chapter" },
      { id: "8.4", code: "8.4", title: "UNDERSTANDING INTELLECTUAL PROPERTY (SMART)",   type: "chapter" },
    ],
  },
  {
    id: "chap-9",
    title: "CHAP 9: Entrepreneurship in Digital Age",
    type: "unit",
    chapters: [
      { id: "9.1", code: "9.1", title: "DESIGN THINKING AND BUSINESS SOLUTIONS (SMART)",              type: "chapter" },
      { id: "9.2", code: "9.2", title: "CREATING A BUSINESS PLAN (SMART)",                            type: "chapter" },
      { id: "9.3", code: "9.3", title: "COLLECTING MARKET INSIGHTS (SMART)",                          type: "chapter" },
      { id: "9.4", code: "9.4", title: "DEVELOPING EFFECTIVE MARKETING AND SALES STRATEGIES (SMART)", type: "chapter" },
      { id: "9.6", code: "9.6", title: "COMMUNICATION AND STORYTELLING SKILLS (SMART)",               type: "chapter" },
      { id: "9.7", code: "9.7", title: "COLLABORATING AND ITERATION (SMART)",                         type: "chapter" },
      { id: "9.8", code: "9.8", title: "INNOVATION AND CREATIVITY (SMART)",                           type: "chapter" },
    ],
  },
];

export function getAllChapters(): Chapter[] { return PTB_INTER1_COMPUTER.flatMap((u) => u.chapters); }
export function getChaptersByUnit(unitId: string): Chapter[] { return PTB_INTER1_COMPUTER.find((u) => u.id === unitId)?.chapters || []; }
export function getUnitByChapterId(chapterId: string): Unit | undefined { return PTB_INTER1_COMPUTER.find((u) => u.chapters.some((ch) => ch.id === chapterId)); }
