/**
 * PTB Class 4 (FOUR) - اُردو (Urdu) - Complete Syllabus
 * Source: Punjab Textbook Board
 */

export interface Chapter {
  id: string;
  code: string;
  title: string;
  type: "unit" | "review" | "section";
}

export interface Unit {
  id: string;
  title: string;
  type: "unit" | "review" | "section";
  chapters: Chapter[];
}

export const PTB_CLASS4_URDU: Unit[] = [
  {
    id: "nasabi-asbaq",
    title: "نصابی اسباق",
    type: "section",
    chapters: [
      { id: "1", code: "1", title: "حمد (نظم)", type: "section" },
      { id: "2", code: "2", title: "نَعت (نظم)", type: "section" },
      { id: "3", code: "3", title: "مثالی مُعلِم", type: "section" },
      { id: "4", code: "4", title: "ہم بنیں گے اچھے شہری", type: "section" },
      { id: "r1", code: "جائزہ 1", title: "جائزہ ۔ 1", type: "review" },
      { id: "5", code: "5", title: "نَنھا ہاتھی (برائے مطالعہ)", type: "section" },
      { id: "6", code: "6", title: "صحت و صفائی", type: "section" },
      { id: "7", code: "7", title: "ہم پاکستانی بچے ہیں (نظم)", type: "section" },
      { id: "8", code: "8", title: "گُل دستہ (برائے مطالعہ)", type: "section" },
      { id: "9", code: "9", title: "آتے ہیں جو کام دوسروں کے", type: "section" },
      { id: "10", code: "10", title: "پہاڑ اور گلہری (نظم)", type: "section" },
      { id: "r2", code: "جائزہ 2", title: "جائزہ ۔ 2", type: "review" },
      { id: "11", code: "11", title: "نیا کمپیوٹر", type: "section" },
      { id: "12", code: "12", title: "میں کیا بنوں گا (نظم)", type: "section" },
      { id: "13", code: "13", title: "زیبا کے پڑوسی", type: "section" },
      { id: "14", code: "14", title: "جب ہر چیز سونے کی بن گئی", type: "section" },
      { id: "r3", code: "جائزہ 3", title: "جائزہ ۔ 3", type: "review" },
      { id: "15", code: "15", title: "صبح کی آمد (نظم)", type: "section" },
      { id: "16", code: "16", title: "حضرت سیدہ فاطمۃ الزھراؓ", type: "section" },
      { id: "17", code: "17", title: "گرمی (نظم)", type: "section" },
      { id: "18", code: "18", title: "باتیں دانائی کی", type: "section" },
      { id: "r4", code: "جائزہ 4", title: "جائزہ ۔ 4", type: "review" },
      { id: "19", code: "19", title: "رائے کا احترام", type: "section" },
      { id: "20", code: "20", title: "دیانت داری", type: "section" },
      { id: "21", code: "21", title: "یہ بات سمجھ میں آئی نہیں (مزاحیہ نظم)", type: "section" },
      { id: "22", code: "22", title: "شان دار فیصلے (برائے مطالعہ)", type: "section" },
      { id: "23", code: "23", title: "تاریخی عمارتیں", type: "section" },
      { id: "r5", code: "جائزہ 5", title: "جائزہ ۔ 5", type: "review" }
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

export function getAllChapters(): Chapter[] {
  return PTB_CLASS4_URDU.flatMap(unit => unit.chapters);
}
export function getChaptersByUnit(unitId: string): Chapter[] {
  const unit = PTB_CLASS4_URDU.find(u => u.id === unitId);
  return unit ? unit.chapters : [];
}
export function getChapterById(chapterId: string): Chapter | undefined {
  return getAllChapters().find(ch => ch.id === chapterId);
}
export function getTotalChapterCount(): number {
  return getAllChapters().length;
}
export const SYLLABUS_METADATA = {
  subject: "اُردو (Urdu)",
  class: "4th",
  board: "PTB",
  totalChapters: getTotalChapterCount(),
  language: "Urdu"
};
