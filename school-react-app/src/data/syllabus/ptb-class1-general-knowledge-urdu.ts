/**
 * PTB Class 1 (ONE) - General Knowledge (Urdu Medium) - Complete Syllabus
 * Source: Punjab Textbook Board
 */
export interface Chapter { id: string; code: string; title: string; type: "unit" | "review" | "section"; }
export interface Unit { id: string; title: string; type: "unit" | "review" | "section"; chapters: Chapter[]; }

export const PTB_CLASS1_GENERAL_KNOWLEDGE_URDU: Unit[] = [
  {
    id: "lessons",
    title: "اسباق (Lessons)",
    type: "section",
    chapters: [
      { id: "1", code: "1", title: "میرا تعارف", type: "section" },
      { id: "2", code: "2", title: "میرا جسم", type: "section" },
      { id: "3", code: "3", title: "صحت و صفائی", type: "section" },
      { id: "4", code: "4", title: "میرا خاندان اور میرے دوست", type: "section" },
      { id: "5", code: "5", title: "کھیل اور قوانین", type: "section" },
      { id: "6", code: "6", title: "ہمارا علاقہ", type: "section" },
      { id: "7", code: "7", title: "عبادت گاہیں", type: "section" },
      { id: "8", code: "8", title: "ہمارا پیارا وطن پاکستان", type: "section" },
      { id: "9", code: "9", title: "میرا سکول", type: "section" },
      { id: "10", code: "10", title: "ذرائع آمدرفت", type: "section" },
      { id: "11", code: "11", title: "ٹریفک قوانین", type: "section" },
      { id: "12", code: "12", title: "اچھے اخلاق و عادات", type: "section" },
      { id: "13", code: "13", title: "پودے اور جانور", type: "section" },
      { id: "14", code: "14", title: "زمین اور آسمان", type: "section" }
    ]
  }
];

export function getAllChapters(): Chapter[] { return PTB_CLASS1_GENERAL_KNOWLEDGE_URDU.flatMap(u => u.chapters); }
export function getChaptersByUnit(unitId: string): Chapter[] { const u = PTB_CLASS1_GENERAL_KNOWLEDGE_URDU.find(x => x.id === unitId); return u ? u.chapters : []; }
export function getChapterById(chapterId: string): Chapter | undefined { return getAllChapters().find(ch => ch.id === chapterId); }
export function getTotalChapterCount(): number { return getAllChapters().length; }
export const SYLLABUS_METADATA = { subject: "General Knowledge (Urdu)", class: "1st", board: "PTB", totalChapters: getTotalChapterCount(), language: "Urdu" };
