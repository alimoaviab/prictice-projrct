/**
 * PTB Class 6 Computer Syllabus
 * 7 units with topics in uppercase as provided
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

export const PTB_CLASS6_COMPUTER: Unit[] = [
  {
    id: "unit-1",
    title: "UNIT 1: ICT Fundamentals",
    type: "unit",
    chapters: [
      { id: "1.1", code: "1.1", title: "INFORMATION AND COMMUNICATION TECHNOLOGY", type: "chapter" },
      { id: "1.2", code: "1.2", title: "COMPUTER",                                  type: "chapter" },
      { id: "1.3", code: "1.3", title: "SOFTWARE",                                  type: "chapter" },
      { id: "1.4", code: "1.4", title: "COMPUTER HARDWARE",                         type: "chapter" },
      { id: "1.5", code: "1.5", title: "HISTORY OF COMPUTER",                       type: "chapter" },
      { id: "1.6", code: "1.6", title: "ICT DEVICES",                               type: "chapter" },
      { id: "1.7", code: "1.7", title: "ADVANTAGES OF ICT DEVICES",                 type: "chapter" },
      { id: "1.8", code: "1.8", title: "DISADVANTAGES OF ICT DEVICES",              type: "chapter" },
    ],
  },
  {
    id: "unit-2",
    title: "UNIT 2: Components of Computer system",
    type: "unit",
    chapters: [
      { id: "2.1", code: "2.1", title: "BASIC COMPONENTS OF COMPUTER",   type: "chapter" },
      { id: "2.2", code: "2.2", title: "INPUT DEVICES",                   type: "chapter" },
      { id: "2.3", code: "2.3", title: "SENSORS",                         type: "chapter" },
      { id: "2.4", code: "2.4", title: "OUTPUT DEVICES",                  type: "chapter" },
      { id: "2.5", code: "2.5", title: "CENTRAL PROCESSING UNIT (CPU)",   type: "chapter" },
      { id: "2.6", code: "2.6", title: "WORKING OF COMPUTER SYSTEM",      type: "chapter" },
    ],
  },
  {
    id: "unit-3",
    title: "UNIT 3: Digital Skills",
    type: "unit",
    chapters: [
      { id: "3.1",  code: "3.1",  title: "SOFTWARE",                        type: "chapter" },
      { id: "3.2",  code: "3.2",  title: "OPERATING SYSTEM",                type: "chapter" },
      { id: "3.3",  code: "3.3",  title: "DEVICE DRIVERS",                  type: "chapter" },
      { id: "3.4",  code: "3.4",  title: "UTILITY PROGRAMS",                type: "chapter" },
      { id: "3.5",  code: "3.5",  title: "LANGUAGE TRANSLATOR",             type: "chapter" },
      { id: "3.6",  code: "3.6",  title: "STEPPING INTO WINDOWS",           type: "chapter" },
      { id: "3.7",  code: "3.7",  title: "MANAGING FILES AND FOLDERS",      type: "chapter" },
      { id: "3.8",  code: "3.8",  title: "APPLICATION SOFTWARE",            type: "chapter" },
      { id: "3.9",  code: "3.9",  title: "WORKING WITH PAINT 3D",           type: "chapter" },
      { id: "3.10", code: "3.10", title: "WORKING WITH 3D MODELS",          type: "chapter" },
      { id: "3.11", code: "3.11", title: "NAVIGATING THE INTERNET",         type: "chapter" },
      { id: "3.12", code: "3.12", title: "USING RAPID TYPING TUTOR",        type: "chapter" },
    ],
  },
  {
    id: "unit-4",
    title: "UNIT 4: Algorithmic Thinking",
    type: "unit",
    chapters: [
      { id: "4.1", code: "4.1", title: "PROBLEM SOLVING",           type: "chapter" },
      { id: "4.2", code: "4.2", title: "SIMPLE PROBLEMS",           type: "chapter" },
      { id: "4.3", code: "4.3", title: "COMPLEX PROBLEMS",          type: "chapter" },
      { id: "4.4", code: "4.4", title: "COMPUTATIONAL THINKING",    type: "chapter" },
      { id: "4.5", code: "4.5", title: "ALGORITHM",                 type: "chapter" },
    ],
  },
  {
    id: "unit-5",
    title: "UNIT 5: Programming",
    type: "unit",
    chapters: [
      { id: "5.1", code: "5.1", title: "WHAT IS A PROGRAM?",                              type: "chapter" },
      { id: "5.2", code: "5.2", title: "PROGRAMMING",                                     type: "chapter" },
      { id: "5.3", code: "5.3", title: "IMPORTANCE OF PROGRAMMING IN TODAY'S WORLD",      type: "chapter" },
      { id: "5.4", code: "5.4", title: "PROGRAMMING LANGUAGE",                            type: "chapter" },
      { id: "5.5", code: "5.5", title: "SCRATCH",                                         type: "chapter" },
      { id: "5.6", code: "5.6", title: "DEBUG A COMPUTER PROGRAM",                        type: "chapter" },
    ],
  },
  {
    id: "unit-6",
    title: "UNIT 6: Digital Citizenship",
    type: "unit",
    chapters: [
      { id: "6.1", code: "6.1", title: "CITIZEN AND CITIZENSHIP",                       type: "chapter" },
      { id: "6.2", code: "6.2", title: "DIGITAL CITIZEN",                               type: "chapter" },
      { id: "6.3", code: "6.3", title: "DIGITAL CITIZENSHIP",                           type: "chapter" },
      { id: "6.4", code: "6.4", title: "COPYRIGHT",                                     type: "chapter" },
      { id: "6.5", code: "6.5", title: "PLAGIARISM",                                    type: "chapter" },
      { id: "6.6", code: "6.6", title: "PIRACY",                                        type: "chapter" },
      { id: "6.7", code: "6.7", title: "ETHICAL STANDARDS OF SOURCING ONLINE INFORMATION", type: "chapter" },
      { id: "6.8", code: "6.8", title: "HEALTH-RELATED ISSUES OF USING ICT DEVICES",   type: "chapter" },
    ],
  },
  {
    id: "unit-7",
    title: "UNIT 7: Entrepreneurship In Digital Age",
    type: "unit",
    chapters: [
      { id: "7.1", code: "7.1", title: "WHAT IS AN ENTREPRENEUR?",    type: "chapter" },
      { id: "7.2", code: "7.2", title: "TYPES OF ENTREPRENEURSHIPS",  type: "chapter" },
    ],
  },
];

export function getAllChapters(): Chapter[] {
  return PTB_CLASS6_COMPUTER.flatMap((u) => u.chapters);
}
export function getChaptersByUnit(unitId: string): Chapter[] {
  return PTB_CLASS6_COMPUTER.find((u) => u.id === unitId)?.chapters || [];
}
export function getUnitByChapterId(chapterId: string): Unit | undefined {
  return PTB_CLASS6_COMPUTER.find((u) => u.chapters.some((ch) => ch.id === chapterId));
}
