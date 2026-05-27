/**
 * PTB Class 2 (TWO) - General Knowledge - Complete Syllabus
 * Source: Punjab Textbook Board
 */
export interface Chapter { id: string; code: string; title: string; type: "unit" | "review" | "section"; }
export interface Unit { id: string; title: string; type: "unit" | "review" | "section"; chapters: Chapter[]; }

export const PTB_CLASS2_GENERAL_KNOWLEDGE: Unit[] = [
  {
    id: "lessons",
    title: "اسباق (Lessons)",
    type: "section",
    chapters: [
      { id: "1", code: "1", title: "ہمارا وطن پاکستان", type: "section" },
      { id: "2", code: "2", title: "دیہات اور شہر", type: "section" },
      { id: "3", code: "3", title: "حقوق و فرائض", type: "section" },
      { id: "4", code: "4", title: "مذہبی تہوار", type: "section" },
      { id: "5", code: "5", title: "قدرتی ماحول اور وسائل", type: "section" },
      { id: "6", code: "6", title: "پانی", type: "section" },
      { id: "7", code: "7", title: "پودے", type: "section" },
      { id: "8", code: "8", title: "جانور", type: "section" },
      { id: "9", code: "9", title: "زراعت اور مویشی", type: "section" },
      { id: "10", code: "10", title: "زمینی وسائل کی حفاظت", type: "section" },
      { id: "11", code: "11", title: "حرارت اور روشنی", type: "section" },
      { id: "12", code: "12", title: "دوسروں کی مدد کرنا", type: "section" },
      { id: "13", code: "13", title: "پیشے", type: "section" },
      { id: "14", code: "14", title: "دوسروں کا احترام", type: "section" },
      { id: "15", code: "15", title: "عفو و درگزر", type: "section" },
      { id: "16", code: "16", title: "غیر جانب داری", type: "section" }
    ]
  }
];

export function getAllChapters(): Chapter[] { return PTB_CLASS2_GENERAL_KNOWLEDGE.flatMap(u => u.chapters); }
export function getChaptersByUnit(unitId: string): Chapter[] { const u = PTB_CLASS2_GENERAL_KNOWLEDGE.find(x => x.id === unitId); return u ? u.chapters : []; }
export function getChapterById(chapterId: string): Chapter | undefined { return getAllChapters().find(ch => ch.id === chapterId); }
export function getTotalChapterCount(): number { return getAllChapters().length; }
export const SYLLABUS_METADATA = { subject: "General Knowledge", class: "2nd", board: "PTB", totalChapters: getTotalChapterCount(), language: "Urdu" };
