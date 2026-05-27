/**
 * PTB Class 1 (ONE) - اُردو (Urdu) - Complete Syllabus
 * Source: Punjab Textbook Board
 */
export interface Chapter { id: string; code: string; title: string; type: "unit" | "review" | "section"; }
export interface Unit { id: string; title: string; type: "unit" | "review" | "section"; chapters: Chapter[]; }

export const PTB_CLASS1_URDU: Unit[] = [
  {
    id: "nasabi-asbaq",
    title: "نصابی اسباق",
    type: "section",
    chapters: [
      { id: "1", code: "1", title: "حمد", type: "section" },
      { id: "2", code: "2", title: "نعت", type: "section" },
      { id: "3", code: "3", title: "آخِری رَسُولﷺ", type: "section" },
      { id: "4", code: "4", title: "آؤ مِل کر کام کریں", type: "section" },
      { id: "r1", code: "جائزہ 1", title: "جائزہ ۔ 1", type: "review" },
      { id: "5", code: "5", title: "کِرَن کا گھرانا", type: "section" },
      { id: "6", code: "6", title: "میرا سکول", type: "section" },
      { id: "7", code: "7", title: "بات چِیت کے آداب", type: "section" },
      { id: "8", code: "8", title: "نَنّھے اِقبالؒ", type: "section" },
      { id: "r2", code: "جائزہ 2", title: "جائزہ ۔ 2", type: "review" },
      { id: "9", code: "9", title: "باغ کی سَیر", type: "section" },
      { id: "10", code: "10", title: "آج کیا پکائیں؟", type: "section" },
      { id: "11", code: "11", title: "دیس ہمارا پاکِستان", type: "section" },
      { id: "12", code: "12", title: "میں کیا پہنُوں؟", type: "section" },
      { id: "r3", code: "جائزہ 3", title: "جائزہ ۔ 3", type: "review" },
      { id: "13", code: "13", title: "چَوک میں لگی بَتِّیاں", type: "section" },
      { id: "14", code: "14", title: "دَھنَک", type: "section" },
      { id: "15", code: "15", title: "نیک بنو، نیکی پھیلاؤ", type: "section" },
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

export function getAllChapters(): Chapter[] { return PTB_CLASS1_URDU.flatMap(u => u.chapters); }
export function getChaptersByUnit(unitId: string): Chapter[] { const u = PTB_CLASS1_URDU.find(x => x.id === unitId); return u ? u.chapters : []; }
export function getChapterById(chapterId: string): Chapter | undefined { return getAllChapters().find(ch => ch.id === chapterId); }
export function getTotalChapterCount(): number { return getAllChapters().length; }
export const SYLLABUS_METADATA = { subject: "اُردو (Urdu)", class: "1st", board: "PTB", totalChapters: getTotalChapterCount(), language: "Urdu" };
