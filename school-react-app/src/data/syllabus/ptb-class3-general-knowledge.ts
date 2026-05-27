/**
 * PTB Class 3 (THREE) - General Knowledge - Complete Syllabus
 * Source: Punjab Textbook Board
 */
export interface Chapter { id: string; code: string; title: string; type: "unit" | "review" | "section"; }
export interface Unit { id: string; title: string; type: "unit" | "review" | "section"; chapters: Chapter[]; }

export const PTB_CLASS3_GENERAL_KNOWLEDGE: Unit[] = [
  {
    id: "lessons",
    title: "اسباق (Lessons)",
    type: "section",
    chapters: [
      { id: "1", code: "1", title: "سورج", type: "section" },
      { id: "2", code: "2", title: "وسائل اور ان کی اقسام", type: "section" },
      { id: "3", code: "3", title: "قدرتی وسائل کا تحفظ", type: "section" },
      { id: "4", code: "4", title: "قائدِاعظم محمد علی جناحؒ", type: "section" },
      { id: "5", code: "5", title: "علامہ محمد اقبالؒ", type: "section" },
      { id: "6", code: "6", title: "جاندار اجسام میں تبدیلیاں", type: "section" },
      { id: "7", code: "7", title: "مسکن", type: "section" },
      { id: "8", code: "8", title: "خوراک", type: "section" },
      { id: "9", code: "9", title: "حکومت اور شہریوں کا کردار", type: "section" },
      { id: "10", code: "10", title: "اختلاف ختم کرنا", type: "section" },
      { id: "11", code: "11", title: "مادہ", type: "section" },
      { id: "12", code: "12", title: "توانائی اور اس کے ذرائع", type: "section" },
      { id: "13", code: "13", title: "بدلتی دنیا", type: "section" },
      { id: "14", code: "14", title: "ایجادات", type: "section" },
      { id: "15", code: "15", title: "قوت اور مشینیں", type: "section" },
      { id: "16", code: "16", title: "حفاظت", type: "section" }
    ]
  }
];

export function getAllChapters(): Chapter[] { return PTB_CLASS3_GENERAL_KNOWLEDGE.flatMap(u => u.chapters); }
export function getChaptersByUnit(unitId: string): Chapter[] { const u = PTB_CLASS3_GENERAL_KNOWLEDGE.find(x => x.id === unitId); return u ? u.chapters : []; }
export function getChapterById(chapterId: string): Chapter | undefined { return getAllChapters().find(ch => ch.id === chapterId); }
export function getTotalChapterCount(): number { return getAllChapters().length; }
export const SYLLABUS_METADATA = { subject: "General Knowledge", class: "3rd", board: "PTB", totalChapters: getTotalChapterCount(), language: "Urdu" };
