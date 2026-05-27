/**
 * PTB Class 3 (THREE) - اُردو (Urdu) - Complete Syllabus
 * Source: Punjab Textbook Board
 */
export interface Chapter { id: string; code: string; title: string; type: "unit" | "review" | "section"; }
export interface Unit { id: string; title: string; type: "unit" | "review" | "section"; chapters: Chapter[]; }

export const PTB_CLASS3_URDU: Unit[] = [
  {
    id: "nasabi-asbaq",
    title: "نصابی اسباق",
    type: "section",
    chapters: [
      { id: "1", code: "1", title: "حمد (نظم)", type: "section" },
      { id: "2", code: "2", title: "نعت (نظم)", type: "section" },
      { id: "3", code: "3", title: "بے مِثل ہے ذات رسولِ کریمﷺ کی", type: "section" },
      { id: "4", code: "4", title: "اگر میں نہ ہُوں تو!", type: "section" },
      { id: "r1", code: "جائزہ 1", title: "جائزہ ۔ 1", type: "review" },
      { id: "5", code: "5", title: "سب ہیں خاص", type: "section" },
      { id: "6", code: "6", title: "چالاک لُومڑی اور چِنٹُو مُرغا (سُنانے کا سبق)", type: "section" },
      { id: "7", code: "7", title: "ہم کیوں بھول جاتے ہیں؟", type: "section" },
      { id: "8", code: "8", title: "شام (نظم)", type: "section" },
      { id: "9", code: "9", title: "اللہ تعالیٰ کا اِنعام", type: "section" },
      { id: "r2", code: "جائزہ 2", title: "جائزہ ۔ 2", type: "review" },
      { id: "10", code: "10", title: "جس کا خواب تھا دِل کش", type: "section" },
      { id: "11", code: "11", title: "چار انوکھے دوست", type: "section" },
      { id: "12", code: "12", title: "ہم ایک ہیں (سُنانے کا سبق)", type: "section" },
      { id: "13", code: "13", title: "پاک وطن ہے پاکستان (نظم)", type: "section" },
      { id: "r3", code: "جائزہ 3", title: "جائزہ ۔ 3", type: "review" },
      { id: "14", code: "14", title: "حضرت خدیجۃُ الکبریٰؓ", type: "section" },
      { id: "15", code: "15", title: "وہ کون تھا؟", type: "section" },
      { id: "16", code: "16", title: "اور صِلہ مِل گیا", type: "section" },
      { id: "17", code: "17", title: "ہم نے دیکھا ایک روبوٹ (نظم)", type: "section" },
      { id: "18", code: "18", title: "ملکۂ کوہ سار کی سیر", type: "section" },
      { id: "r4", code: "جائزہ 4", title: "جائزہ ۔ 4", type: "review" },
      { id: "19", code: "19", title: "دِل دِل پاکستان", type: "section" },
      { id: "20", code: "20", title: "قائدِ اعظمؒ (نظم)", type: "section" },
      { id: "21", code: "21", title: "قُدرتی آفات (سُنانے کا سبق)", type: "section" },
      { id: "22", code: "22", title: "بچے کی دُعا (نظم)", type: "section" },
      { id: "r5", code: "جائزہ 5", title: "جائزہ ۔ 5", type: "review" },
      { id: "dengue", code: "dengue", title: "حکومت پنجاب کی ڈینگی آگاہی مہم", type: "section" }
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

export function getAllChapters(): Chapter[] { return PTB_CLASS3_URDU.flatMap(u => u.chapters); }
export function getChaptersByUnit(unitId: string): Chapter[] { const u = PTB_CLASS3_URDU.find(x => x.id === unitId); return u ? u.chapters : []; }
export function getChapterById(chapterId: string): Chapter | undefined { return getAllChapters().find(ch => ch.id === chapterId); }
export function getTotalChapterCount(): number { return getAllChapters().length; }
export const SYLLABUS_METADATA = { subject: "اُردو (Urdu)", class: "3rd", board: "PTB", totalChapters: getTotalChapterCount(), language: "Urdu" };
