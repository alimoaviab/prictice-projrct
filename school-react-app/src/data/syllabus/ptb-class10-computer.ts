/**
 * PTB Class 10 Computer Syllabus
 * 8 units with topics in uppercase as provided
 */

export interface Chapter {
  id: string;
  code: string;
  title: string;
  type: "chapter";
}

export interface Unit {
  id: string;
  title: string;
  type: "unit";
  chapters: Chapter[];
}

export const PTB_CLASS10_COMPUTER: Unit[] = [
  {
    id: "unit-01",
    title: "UNIT 01: OPERATING SYSTEMS: STRUCTURE AND SERVICES",
    type: "unit",
    chapters: [
      { id: "1.1", code: "1.1", title: "INTRODUCTION TO OPERATING SYSTEM (OS)",       type: "chapter" },
      { id: "1.2", code: "1.2", title: "ARCHITECTURE OF AN OPERATING SYSTEM",         type: "chapter" },
      { id: "1.3", code: "1.3", title: "PROCESS MANAGEMENT IN OPERATING SYSTEM (OS)", type: "chapter" },
      { id: "1.4", code: "1.4", title: "MEMORY",                                      type: "chapter" },
      { id: "1.5", code: "1.5", title: "PROCESSES VS THREADS",                        type: "chapter" },
      { id: "1.6", code: "1.6", title: "SYSTEM CALLS",                                type: "chapter" },
      { id: "1.7", code: "1.7", title: "FILE SYSTEM STRUCTURE AND MANAGEMENT",        type: "chapter" },
      { id: "1.8", code: "1.8", title: "TYPES OF OPERATING SYSTEMS",                  type: "chapter" },
    ],
  },
  {
    id: "unit-02",
    title: "UNIT 02: SYSTEM RECOVERY AND ADVANCED MAINTENANCE",
    type: "unit",
    chapters: [
      { id: "2.1", code: "2.1", title: "INTRODUCTION TO POST-TROUBLESHOOTING",         type: "chapter" },
      { id: "2.2", code: "2.2", title: "USING BUILT-IN DIAGNOSTIC TOOLS",              type: "chapter" },
      { id: "2.3", code: "2.3", title: "SYSTEM RECOVERY OPTIONS",                      type: "chapter" },
      { id: "2.4", code: "2.4", title: "BIOS/UEFI AND BOOT PROCESS AWARENESS",         type: "chapter" },
      { id: "2.5", code: "2.5", title: "DATA RECOVERY TECHNIQUES",                     type: "chapter" },
      { id: "2.6", code: "2.6", title: "BEST PRACTICES FOR PREVENTIVE MAINTENANCE",    type: "chapter" },
      { id: "2.7", code: "2.7", title: "SYSTEM DOCUMENTATION AND LOGS",                type: "chapter" },
    ],
  },
  {
    id: "unit-03",
    title: "UNIT 03: INTRODUCTION TO PYTHON PROGRAMMING",
    type: "unit",
    chapters: [
      { id: "3.1", code: "3.1", title: "INTRODUCTION TO PYTHON PROGRAMMING",   type: "chapter" },
      { id: "3.2", code: "3.2", title: "BASIC PYTHON SYNTAX AND STRUCTURE",    type: "chapter" },
      { id: "3.3", code: "3.3", title: "OPERATORS AND EXPRESSIONS",            type: "chapter" },
    ],
  },
  {
    id: "unit-04",
    title: "UNIT 04: CONTROL STRUCTURES IN PYTHON",
    type: "unit",
    chapters: [
      { id: "4.1", code: "4.1", title: "DECISION MAKING",               type: "chapter" },
      { id: "4.2", code: "4.2", title: "LOOPING CONSTRUCTS",            type: "chapter" },
      { id: "4.3", code: "4.3", title: "LIBRARIES IN PYTHON",           type: "chapter" },
      { id: "4.4", code: "4.4", title: "LISTS IN PYTHON",               type: "chapter" },
      { id: "4.5", code: "4.5", title: "TESTING AND DEBUGGING IN PYTHON", type: "chapter" },
    ],
  },
  {
    id: "unit-05",
    title: "UNIT 05: INTRODUCTION TO DATA SCIENCE",
    type: "unit",
    chapters: [
      { id: "5.1", code: "5.1", title: "INTRODUCTION TO DATA SCIENCE",              type: "chapter" },
      { id: "5.2", code: "5.2", title: "OVERVIEW OF THE DATA SCIENCE LIFE CYCLE",   type: "chapter" },
      { id: "5.3", code: "5.3", title: "TOOLS FOR VISUALIZATION",                   type: "chapter" },
      { id: "5.4", code: "5.4", title: "DATABASES AND STORING DATA",                type: "chapter" },
    ],
  },
  {
    id: "unit-06",
    title: "UNIT 06: INTRODUCTION ARTIFICIAL INTELLIGENCE (AI), AND MACHINE LEARNING (ML)",
    type: "unit",
    chapters: [
      { id: "6.1", code: "6.1", title: "AI, ML AND OVERVIEW",                        type: "chapter" },
      { id: "6.2", code: "6.2", title: "MACHINE LEARNING TYPES",                     type: "chapter" },
      { id: "6.3", code: "6.3", title: "PRACTICAL APPLICATIONS OF AI/ML",            type: "chapter" },
      { id: "6.4", code: "6.4", title: "SUPERVISED AND UNSUPERVISED ALGORITHMS",     type: "chapter" },
      { id: "6.5", code: "6.5", title: "EVALUATING MODEL PERFORMANCE",               type: "chapter" },
    ],
  },
  {
    id: "unit-07",
    title: "UNIT 07: APPLICATIONS OF AI",
    type: "unit",
    chapters: [
      { id: "7.1", code: "7.1", title: "INTRODUCTION TO ARTIFICIAL INTELLIGENCE (AI)", type: "chapter" },
      { id: "7.2", code: "7.2", title: "DATA AND AI",                                  type: "chapter" },
      { id: "7.3", code: "7.3", title: "REAL-WORLD APPLICATIONS OF AI",               type: "chapter" },
      { id: "7.4", code: "7.4", title: "BENEFITS AND CHALLENGES OF AI APPLICATIONS",  type: "chapter" },
      { id: "7.5", code: "7.5", title: "ETHICS, FAIRNESS, AND SOCIAL IMPACT OF AI",   type: "chapter" },
      { id: "7.6", code: "7.6", title: "RESPONSIBILITY OF AI DESIGNERS",              type: "chapter" },
    ],
  },
  {
    id: "unit-08",
    title: "UNIT 08: DIGITAL ENTREPRENEURSHIP",
    type: "unit",
    chapters: [
      { id: "8.1", code: "8.1", title: "FROM BASICS TO ADVANCED ENTREPRENEURSHIP",    type: "chapter" },
      { id: "8.2", code: "8.2", title: "PROBLEM-SOLVING & ADAPTABILITY",              type: "chapter" },
      { id: "8.3", code: "8.3", title: "ETHICAL BUSINESS PRACTICES & DIGITAL ETHICS", type: "chapter" },
      { id: "8.4", code: "8.4", title: "LEGAL FRAMEWORK & COMPLIANCE",                type: "chapter" },
      { id: "8.5", code: "8.5", title: "STRATEGIC MARKETING & BRANDING",              type: "chapter" },
    ],
  },
];

export function getAllChapters(): Chapter[] {
  return PTB_CLASS10_COMPUTER.flatMap((u) => u.chapters);
}
export function getChaptersByUnit(unitId: string): Chapter[] {
  return PTB_CLASS10_COMPUTER.find((u) => u.id === unitId)?.chapters || [];
}
export function getUnitByChapterId(chapterId: string): Unit | undefined {
  return PTB_CLASS10_COMPUTER.find((u) => u.chapters.some((ch) => ch.id === chapterId));
}
