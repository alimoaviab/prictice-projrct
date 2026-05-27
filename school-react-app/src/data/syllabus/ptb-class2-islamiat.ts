/**
 * PTB Class 2 (TWO) - اسلامیات (Islamiyat) - Complete Syllabus
 * Source: Punjab Textbook Board
 */
export interface Chapter { id: string; code: string; title: string; type: "unit" | "review" | "section"; }
export interface Unit { id: string; title: string; type: "unit" | "review" | "section"; chapters: Chapter[]; }

export const PTB_CLASS2_ISLAMIAT: Unit[] = [
  {
    id: "bab-2",
    title: "باب نمبر 2: ایمانیات و عبادات",
    type: "unit",
    chapters: [
      { id: "2.1", code: "2.1", title: "ایمانیات: آسمانی کتابوں پر ایمان", type: "unit" },
      { id: "2.2", code: "2.2", title: "ایمانیات: فرشتوں پر ایمان", type: "unit" },
      { id: "2.3", code: "2.3", title: "ایمانیات: آخرت", type: "unit" },
      { id: "2.4", code: "2.4", title: "عبادات: روزہ", type: "unit" },
      { id: "2.5", code: "2.5", title: "عبادات: عیدین و اسلامی تہوار", type: "unit" }
    ]
  },
  {
    id: "bab-3",
    title: "باب نمبر 3: سیرتِ طیّبہﷺ",
    type: "unit",
    chapters: [
      { id: "3.1", code: "3.1", title: "نبی کریم ﷺ کی محبت و اطاعت", type: "unit" },
      { id: "3.2", code: "3.2", title: "حضرت محمد رسول اللہ خاتم النبیین ﷺ کے اخلاق حسنہ", type: "unit" }
    ]
  },
  {
    id: "bab-4",
    title: "باب نمبر 4: اخلاق و آداب",
    type: "unit",
    chapters: [
      { id: "4.1", code: "4.1", title: "اسلامی آدابِ زندگی", type: "unit" },
      { id: "4.2", code: "4.2", title: "بڑوں کا ادب", type: "unit" },
      { id: "4.3", code: "4.3", title: "جانوروں سے اچھا سلوک", type: "unit" }
    ]
  },
  {
    id: "bab-5",
    title: "باب نمبر 5: ہدایت کے سر چشمے اور مشاہیرِ اسلام",
    type: "unit",
    chapters: [
      { id: "5.1", code: "5.1", title: "انبیائے کرام علیھم السّلام", type: "unit" }
    ]
  }
];

export function getAllChapters(): Chapter[] { return PTB_CLASS2_ISLAMIAT.flatMap(u => u.chapters); }
export function getChaptersByUnit(unitId: string): Chapter[] { const u = PTB_CLASS2_ISLAMIAT.find(x => x.id === unitId); return u ? u.chapters : []; }
export function getChapterById(chapterId: string): Chapter | undefined { return getAllChapters().find(ch => ch.id === chapterId); }
export function getTotalChapterCount(): number { return getAllChapters().length; }
export const SYLLABUS_METADATA = { subject: "اسلامیات (Islamiyat)", class: "2nd", board: "PTB", totalUnits: 4, totalChapters: getTotalChapterCount(), language: "Urdu" };
