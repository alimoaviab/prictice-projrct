/**
 * PTB Class 1 (ONE) - اسلامیات (Islamiyat) - Complete Syllabus
 * Source: Punjab Textbook Board
 */
export interface Chapter { id: string; code: string; title: string; type: "unit" | "review" | "section"; }
export interface Unit { id: string; title: string; type: "unit" | "review" | "section"; chapters: Chapter[]; }

export const PTB_CLASS1_ISLAMIAT_URDU: Unit[] = [
  {
    id: "bab-2",
    title: "باب نمبر 2: ایمانیات و عبادات",
    type: "unit",
    chapters: [
      { id: "2.1", code: "2.1", title: "ایمانیات: توحید کا تعارف", type: "unit" },
      { id: "2.2", code: "2.2", title: "ایمانیات: نبوت و رِسالت", type: "unit" },
      { id: "2.3", code: "2.3", title: "عبادات: مسجد", type: "unit" },
      { id: "2.4", code: "2.4", title: "عبادات: اذان", type: "unit" },
      { id: "2.5", code: "2.5", title: "عبادات: نماز", type: "unit" }
    ]
  },
  {
    id: "bab-3",
    title: "باب نمبر 3: سیرتِ طیبہ ﷺ",
    type: "unit",
    chapters: [
      { id: "3.1", code: "3.1", title: "ہمارے پیارے نبی حضرت محمد رسول اللہ خاتم النبیین ﷺ", type: "unit" },
      { id: "3.2", code: "3.2", title: "حضرت محمد مصطفیٰ خاتم النبیین ﷺ کے اَخلاقِ حسنہ", type: "unit" }
    ]
  },
  {
    id: "bab-4",
    title: "باب نمبر 4: اَخلاق و آداب",
    type: "unit",
    chapters: [
      { id: "4.1", code: "4.1", title: "اچھے اَخلاق", type: "unit" },
      { id: "4.2", code: "4.2", title: "سلام کرنا", type: "unit" }
    ]
  },
  {
    id: "bab-5",
    title: "باب نمبر 5: ہدایت کے سر چشمے اور مشاہیرِ اسلام",
    type: "unit",
    chapters: [
      { id: "5.1", code: "5.1", title: "انبیائے کرام علیھم السّلام کا تعارف", type: "unit" }
    ]
  }
];

export function getAllChapters(): Chapter[] { return PTB_CLASS1_ISLAMIAT_URDU.flatMap(u => u.chapters); }
export function getChaptersByUnit(unitId: string): Chapter[] { const u = PTB_CLASS1_ISLAMIAT_URDU.find(x => x.id === unitId); return u ? u.chapters : []; }
export function getChapterById(chapterId: string): Chapter | undefined { return getAllChapters().find(ch => ch.id === chapterId); }
export function getTotalChapterCount(): number { return getAllChapters().length; }
export const SYLLABUS_METADATA = { subject: "اسلامیات (Islamiyat)", class: "1st", board: "PTB", totalUnits: 4, totalChapters: getTotalChapterCount(), language: "Urdu" };
