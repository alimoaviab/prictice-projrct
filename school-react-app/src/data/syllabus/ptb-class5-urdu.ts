/**
 * PTB Class 5 - اُردو (Urdu) - Complete Syllabus
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

export const PTB_CLASS5_URDU: Unit[] = [
  {
    id: "nasabi-asbaq",
    title: "نصابی اسباق",
    type: "section",
    chapters: [
      { id: "1", code: "1", title: "حمد (نظم)", type: "section" },
      { id: "2", code: "2", title: "نعت (نظم)", type: "section" },
      { id: "3", code: "3", title: "رحمتِ عالم ﷺ", type: "section" },
      { id: "4", code: "4", title: "اے وطن! تُو سلامت رہے", type: "section" },
      { id: "5", code: "5", title: "جو وعدہ کرو سو پُورا کرو", type: "section" },
      { id: "6", code: "6", title: "قومی تہوار (برائے مطالعہ)", type: "section" },
      { id: "7", code: "7", title: "ہوا چلی (نظم)", type: "section" },
      { id: "8", code: "8", title: "میری پہچان ہے تُو", type: "section" },
      { id: "9", code: "9", title: "ہمارے پیشے", type: "section" },
      { id: "10", code: "10", title: "ایک گائے اور بکری (نظم)", type: "section" },
      { id: "11", code: "11", title: "حضرت عثمان غنیؓ", type: "section" },
      { id: "12", code: "12", title: "دُنیا آپ کی مٹھّی میں", type: "section" },
      { id: "13", code: "13", title: "ہم پھُول اِک چمن کے (نظم)", type: "section" },
      { id: "14", code: "14", title: "آؤ بچو! سنو کہانی (برائے مطالعہ)", type: "section" },
      { id: "15", code: "15", title: "آئیں! مدد کریں", type: "section" },
      { id: "16", code: "16", title: "رکھیں میرا خیال", type: "section" },
      { id: "17", code: "17", title: "نیک بنو، نیکی پھیلاؤ (نظم)", type: "section" },
      { id: "18", code: "18", title: "ایک قدیم شہر", type: "section" },
      { id: "19", code: "19", title: "حُسنِ سُلوک", type: "section" },
      { id: "20", code: "20", title: "کہا اقبال رحمۃ اللہ علیہ نے (نظم)", type: "section" },
      { id: "21", code: "21", title: "بے مِثل ہے نِظام تیرا", type: "section" },
      { id: "22", code: "22", title: "اقوالِ زرّیں (برائے مطالعہ)", type: "section" },
      { id: "23", code: "23", title: "ٹوٹ بٹوٹ کے مُرغے (نظم)", type: "section" }
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
  return PTB_CLASS5_URDU.flatMap(unit => unit.chapters);
}
export function getChaptersByUnit(unitId: string): Chapter[] {
  const unit = PTB_CLASS5_URDU.find(u => u.id === unitId);
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
  class: "5th",
  board: "PTB",
  totalChapters: getTotalChapterCount(),
  language: "Urdu"
};
