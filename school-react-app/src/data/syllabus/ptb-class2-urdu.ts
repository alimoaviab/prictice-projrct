/**
 * PTB Class 2 (TWO) - اُردو (Urdu) - Complete Syllabus
 * Source: Punjab Textbook Board
 */
export interface Chapter { id: string; code: string; title: string; type: "unit" | "review" | "section"; }
export interface Unit { id: string; title: string; type: "unit" | "review" | "section"; chapters: Chapter[]; }

export const PTB_CLASS2_URDU: Unit[] = [
  {
    id: "nasab",
    title: "نصاب کے اسباق",
    type: "section",
    chapters: [
      { id: "1", code: "1", title: "حمد (نظم)", type: "section" },
      { id: "2", code: "2", title: "نعت (نظم)", type: "section" },
      { id: "3", code: "3", title: "پیارے رسول خاتم النبیینﷺ", type: "section" },
      { id: "4", code: "4", title: "بانو کا طوطا", type: "section" },
      { id: "5", code: "5", title: "سمجھ دار بَچَّہ (سنانے کا سبق)", type: "section" },
      { id: "r1", code: "جائزہ 1", title: "جائزہ ۔ 1", type: "review" },
      { id: "6", code: "6", title: "چڑیا اور چُوہا", type: "section" },
      { id: "7", code: "7", title: "تارے (نظم)", type: "section" },
      { id: "8", code: "8", title: "قائدِ اعظمؒ", type: "section" },
      { id: "9", code: "9", title: "سیر ایک شہر کی (سُنانے کی کہانی)", type: "section" },
      { id: "10", code: "10", title: "محنت کرنے والے", type: "section" },
      { id: "r2", code: "جائزہ 2", title: "جائزہ ۔ 2", type: "review" },
      { id: "11", code: "11", title: "آؤ بجلی بچائیں (سُنانے کا سبق)", type: "section" },
      { id: "12", code: "12", title: "میرا پیارا وطن (نظم)", type: "section" },
      { id: "13", code: "13", title: "آؤ مل کے درخت لگائیں", type: "section" },
      { id: "14", code: "14", title: "صفائی کا رکھیں خیال", type: "section" },
      { id: "15", code: "15", title: "ساری دُنیا اپنا گھر ہے (نظم)", type: "section" },
      { id: "r3", code: "جائزہ 3", title: "جائزہ ۔ 3", type: "review" },
      { id: "16", code: "16", title: "علامہ محمد اقبالؒ (سنانے کی کہانی)", type: "section" },
      { id: "17", code: "17", title: "کھیلیں آنکھ مچولی", type: "section" },
      { id: "18", code: "18", title: "دوستی ہو تو ایسی", type: "section" },
      { id: "19", code: "19", title: "صبح کی سیر (نظم)", type: "section" },
      { id: "20", code: "20", title: "ایک سواری بڑی پیاری", type: "section" },
      { id: "21", code: "21", title: "چلو میلا دیکھیں (سنانے کی کہانی)", type: "section" },
      { id: "22", code: "22", title: "ٹوٹ بٹوٹ کی موٹر کار (نظم)", type: "section" },
      { id: "r4", code: "جائزہ 4", title: "جائزہ ۔ 4", type: "review" }
    ]
  },
  {
    id: "urdu-b",
    title: "اُردو (ب) / قواعد",
    type: "section",
    chapters: [
      { id: "b-1", code: "1", title: "مذکر مونث", type: "section" },
      { id: "b-2", code: "2", title: "واحد جمع", type: "section" },
      { id: "b-3", code: "3", title: "الفاظ متضاد", type: "section" },
      { id: "b-4", code: "4", title: "اعراب لگائیں", type: "section" },
      { id: "b-5", code: "5", title: "الفاظ مترادف", type: "section" },
      { id: "b-6", code: "6", title: "جملوں کی درستگی", type: "section" },
      { id: "b-7", code: "7", title: "درخواستیں", type: "section" },
      { id: "b-8", code: "8", title: "خطوط", type: "section" },
      { id: "b-9", code: "9", title: "کہانیاں", type: "section" },
      { id: "b-10", code: "10", title: "مضامین", type: "section" }
    ]
  }
];

export function getAllChapters(): Chapter[] { return PTB_CLASS2_URDU.flatMap(u => u.chapters); }
export function getChaptersByUnit(unitId: string): Chapter[] { const u = PTB_CLASS2_URDU.find(x => x.id === unitId); return u ? u.chapters : []; }
export function getChapterById(chapterId: string): Chapter | undefined { return getAllChapters().find(ch => ch.id === chapterId); }
export function getTotalChapterCount(): number { return getAllChapters().length; }
export const SYLLABUS_METADATA = { subject: "اُردو (Urdu)", class: "2nd", board: "PTB", totalChapters: getTotalChapterCount(), language: "Urdu" };
