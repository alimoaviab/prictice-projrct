/**
 * PTB Class 6 - اسلامیات لازمی (Islamiyat Compulsory) - Complete Syllabus
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

export const PTB_CLASS6_ISLAMIAT_LAZMI: Unit[] = [
  {
    id: "bab-2",
    title: "باب دوم: ایمانیات و عبادات",
    type: "unit",
    chapters: [
      { id: "2.1", code: "2.1", title: "توحید کی اہمیت اور اثرات", type: "unit" },
      { id: "2.2", code: "2.2", title: "نبوت و رسالت", type: "unit" },
      { id: "2.3", code: "2.3", title: "اسلام میں عبادات کا جامع تصّور", type: "unit" },
      { id: "2.4", code: "2.4", title: "طہارت و پاکیزگی", type: "unit" },
      { id: "2.5", code: "2.5", title: "نماز کی فرضیّت واہمیت", type: "unit" }
    ]
  },
  {
    id: "bab-3",
    title: "باب سوم: سیرت طیبہ ﷺ",
    type: "unit",
    chapters: [
      { id: "3.1", code: "3.1", title: "نبی کریم خاتم النبین ﷺ اور مدنی معاشرے کا قیام", type: "unit" },
      { id: "3.2", code: "3.2", title: "ریاست مدینہ کا قیام", type: "unit" },
      { id: "3.3", code: "3.3", title: "ریاست مدینہ کا استحکام: جہاد، غزوہ بدر", type: "unit" },
      { id: "3.4", code: "3.4", title: "غزوہ اُحد", type: "unit" },
      { id: "3.5", code: "3.5", title: "نبی کریم خاتم النبین ﷺ سے محبّت و اطاعت", type: "unit" },
      { id: "3.6", code: "3.6", title: "حضرت محمد رسول اللہ خاتم النبین ﷺ کا بچوں کے ساتھ حسنِ سلوک", type: "unit" },
      { id: "3.7", code: "3.7", title: "حضرت محمد خاتم النبین ﷺ کا ایفائے عہد", type: "unit" }
    ]
  },
  {
    id: "bab-4",
    title: "باب چہارم: اخلاق و عبادات",
    type: "unit",
    chapters: [
      { id: "4.1", code: "4.1", title: "مشاورت کی اہمیت", type: "unit" },
      { id: "4.2", code: "4.2", title: "صبرو تحمل", type: "unit" },
      { id: "4.3", code: "4.3", title: "اسلامی آداب زندگی (راستے، سفر اور عوامی مقامات کے استعمال)", type: "unit" },
      { id: "4.4", code: "4.4", title: "بری عادات سے اجتناب", type: "unit" }
    ]
  },
  {
    id: "bab-5",
    title: "باب پنجم: حسن معاملات و معاشرت",
    type: "unit",
    chapters: [
      { id: "5.1", code: "5.1", title: "حقوق العباد (والدین، بہن بھائی، رشتہ دار)", type: "unit" },
      { id: "5.2", code: "5.2", title: "عدل واحسان", type: "unit" },
      { id: "5.3", code: "5.3", title: "اسلام میں رفاہِ عامہ کی اہمیت", type: "unit" }
    ]
  },
  {
    id: "bab-6",
    title: "باب ششم: ہدایت کے سرچشمے اور مشاہیرِ اسلام",
    type: "unit",
    chapters: [
      { id: "6.1", code: "6.1", title: "امہات المومنین رضی اللہ تعالیٰ عنھن", type: "unit" },
      { id: "6.2", code: "6.2", title: "نبی کریم ختم النبین ﷺ کی اولادِ مبارکہ", type: "unit" },
      { id: "6.3", code: "6.3", title: "خاتونِ جنت حضرت سیدہ فاطمۃ الزہرا رضی اللہ تعالیٰ عنھا", type: "unit" },
      { id: "6.4", code: "6.4", title: "صحابہ کرام رضی اللہ تعالیٰ عنھم", type: "unit" },
      { id: "6.5", code: "6.5", title: "صوفیہ کرام", type: "unit" },
      { id: "6.6", code: "6.6", title: "علماء و مفکرین", type: "unit" },
      { id: "6.7", code: "6.7", title: "فاتحین", type: "unit" }
    ]
  },
  {
    id: "bab-7",
    title: "باب ہفتم: اسلامی تعالیمات اور عصرِ حاضر کے تقاضے",
    type: "unit",
    chapters: [
      { id: "7.1", code: "7.1", title: "انسانی زندگی میں ماحول کی اہمیت", type: "unit" },
      { id: "7.2", code: "7.2", title: "جانوروں کی اہمیت اور ان کے حقوق", type: "unit" }
    ]
  }
];

export function getAllChapters(): Chapter[] {
  return PTB_CLASS6_ISLAMIAT_LAZMI.flatMap(unit => unit.chapters);
}
export function getChaptersByUnit(unitId: string): Chapter[] {
  const unit = PTB_CLASS6_ISLAMIAT_LAZMI.find(u => u.id === unitId);
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
  class: "6th",
  board: "PTB",
  totalUnits: 6,
  totalChapters: getTotalChapterCount(),
  language: "Urdu"
};
