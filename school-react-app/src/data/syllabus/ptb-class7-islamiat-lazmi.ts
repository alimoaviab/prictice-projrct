/**
 * PTB Class 7 - اسلامیات لازمی (Islamiyat Compulsory) - Complete Syllabus
 * Source: Punjab Textbook Board
 * 
 * Subject: اسلامیات لازمی (Islamiyat Compulsory)
 * Class: 7th
 * Board: PTB (Punjab Textbook Board)
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

export const PTB_CLASS7_ISLAMIAT_LAZMI: Unit[] = [
  {
    id: "bab-2",
    title: "باب دوم: ایمانیات و عبادات",
    type: "unit",
    chapters: [
      { id: "2.1", code: "2.1", title: "عقیدہ ختم نبوت", type: "unit" },
      { id: "2.2", code: "2.2", title: "فرشتوں پر ایمان", type: "unit" },
      { id: "2.3", code: "2.3", title: "آسمانی کتابوں پر ایمان", type: "unit" },
      { id: "2.4", code: "2.4", title: "روزہ اور اس کی فضیلت", type: "unit" },
      { id: "2.5", code: "2.5", title: "نماز جنازہ اور دیگر نمازیں", type: "unit" },
      { id: "2.6", code: "2.6", title: "دعا کی اہمیت و فضیلت", type: "unit" }
    ]
  },
  {
    id: "bab-3",
    title: "باب سوم: سیرتِ طیبہ ﷺ",
    type: "unit",
    chapters: [
      { id: "3.1", code: "3.1", title: "نبی کریم خاتم النبین ﷺ اور مدنی معاشرے کا استحکام", type: "unit" },
      { id: "3.2", code: "3.2", title: "غزوہ خندق", type: "unit" },
      { id: "3.3", code: "3.3", title: "غزوہ بنوقُرَیظہ", type: "unit" },
      { id: "3.4", code: "3.4", title: "صلح حدیبیہ", type: "unit" },
      { id: "3.5", code: "3.5", title: "رسول اللہ خاتم النبین ﷺ کی تعلیمی سرگرمیاں", type: "unit" },
      { id: "3.5b", code: "3.5", title: "نبی کریم خاتم النبین ﷺ بطورِ داعی امن", type: "unit" },
      { id: "3.6", code: "3.6", title: "حضرت محمد رسول اللہ ﷺ کا صبر و شکر", type: "unit" },
      { id: "3.7", code: "3.7", title: "حضرت محمد رسول اللہ ﷺ کا سادہ طرز زندگی اور قناعت", type: "unit" },
      { id: "3.8", code: "3.8", title: "حضرت محمد رسول اللہ ﷺ کا انداز گفتگو", type: "unit" }
    ]
  },
  {
    id: "bab-4",
    title: "باب چہارم: اخلاق و آداب",
    type: "unit",
    chapters: [
      { id: "4.1", code: "4.1", title: "میانہ روی", type: "unit" },
      { id: "4.2", code: "4.2", title: "سخاوت وایثار", type: "unit" },
      { id: "4.3", code: "4.3", title: "تعلیم اور تعلیم کے آداب", type: "unit" },
      { id: "4.4", code: "4.4", title: "بُری عادات سے اجتناب", type: "unit" }
    ]
  },
  {
    id: "bab-5",
    title: "باب پنجم: حسنِ معاملات و معاشرت",
    type: "unit",
    chapters: [
      { id: "5.1", code: "5.1", title: "حقوق العباد", type: "unit" },
      { id: "5.2", code: "5.2", title: "نظم و ضبط اور قانون کا احترام", type: "unit" },
      { id: "5.3", code: "5.3", title: "کسب حلال", type: "unit" },
      { id: "5.4", code: "5.4", title: "قومی املاک و وسائل کے استعمال کے آداب", type: "unit" }
    ]
  },
  {
    id: "bab-6",
    title: "باب ششم: ہدایت کے سر چشمے اور مشاہیر اسلام",
    type: "unit",
    chapters: [
      { id: "6.1", code: "6.1", title: "امہات المومنین", type: "unit" },
      { id: "6.2", code: "6.2", title: "حضرت امام حسن مجتبی رضی اللہ تعالیٰ عنہ", type: "unit" },
      { id: "6.3", code: "6.3", title: "حضرت سیدہ زینب رضی اللہ تعالی عنھا", type: "unit" },
      { id: "6.4", code: "6.4", title: "صحابہ کرام", type: "unit" },
      { id: "6.5", code: "6.5", title: "صوفیہ کرام", type: "unit" },
      { id: "6.6", code: "6.6", title: "علما و مفکرین", type: "unit" },
      { id: "6.7", code: "6.7", title: "فاتحین", type: "unit" }
    ]
  },
  {
    id: "bab-7",
    title: "باب ہفتم: اسلامی تعلیمات اور عصرِ حاضر کے تقاضے",
    type: "unit",
    chapters: [
      { id: "7.1", code: "7.1", title: "اسلام میں علم کی اہمیت", type: "unit" },
      { id: "7.2", code: "7.2", title: "اسلام اور امنِ عامہ", type: "unit" }
    ]
  }
];

export function getAllChapters(): Chapter[] {
  return PTB_CLASS7_ISLAMIAT_LAZMI.flatMap(unit => unit.chapters);
}

export function getChaptersByUnit(unitId: string): Chapter[] {
  const unit = PTB_CLASS7_ISLAMIAT_LAZMI.find(u => u.id === unitId);
  return unit ? unit.chapters : [];
}

export function getChapterById(chapterId: string): Chapter | undefined {
  return getAllChapters().find(ch => ch.id === chapterId);
}

export function getTotalChapterCount(): number {
  return getAllChapters().length;
}

export const SYLLABUS_METADATA = {
  subject: "اسلامیات لازمی (Islamiyat Compulsory)",
  class: "7th",
  board: "PTB",
  totalUnits: 6,
  totalChapters: getTotalChapterCount(),
  language: "Urdu"
};
