/**
 * PTB Class 4 (FOUR) - اسلامیات (Islamiyat) - Complete Syllabus
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

export const PTB_CLASS4_ISLAMIAT: Unit[] = [
  {
    id: "bab-2",
    title: "باب دوم: ایمانیات و عبادات",
    type: "unit",
    chapters: [
      { id: "2.1", code: "2.1", title: "ایمانیات: فرشتوں پر ایمان", type: "unit" },
      { id: "2.2", code: "2.2", title: "ایمانیات: آسمانی کتابوں پر ایمان", type: "unit" },
      { id: "2.3", code: "2.3", title: "عبادات: روزہ (صوم)", type: "unit" },
      { id: "2.4", code: "2.4", title: "عبادات: حقوق اللہ", type: "unit" },
      { id: "2.5", code: "2.5", title: "عبادات: تلاوتِ قرآنِ مجید", type: "unit" }
    ]
  },
  {
    id: "bab-3",
    title: "باب سوم: سیرتِ طیبہ ﷺ",
    type: "unit",
    chapters: [
      { id: "3.1", code: "3.1", title: "نزولِ وحی کا واقعہ", type: "unit" },
      { id: "3.2", code: "3.2", title: "دعوت و تبلیغ", type: "unit" },
      { id: "3.3", code: "3.3", title: "ہجرتِ حبشہ (اولیٰ و ثانیہ)", type: "unit" },
      { id: "3.4", code: "3.4", title: "شعب ابی طالب", type: "unit" },
      { id: "3.5", code: "3.5", title: "عامُ الحزن", type: "unit" },
      { id: "3.6", code: "3.6", title: "سفرِ طائف", type: "unit" }
    ]
  },
  {
    id: "bab-4",
    title: "باب چہارم: اخلاق و آداب",
    type: "unit",
    chapters: [
      { id: "4.1", code: "4.1", title: "سادگی", type: "unit" },
      { id: "4.2", code: "4.2", title: "آدابِ مجلس", type: "unit" },
      { id: "4.3", code: "4.3", title: "وقت کی پابندی", type: "unit" }
    ]
  },
  {
    id: "bab-5",
    title: "باب پنجم: حسن معاملات و معاشرت",
    type: "unit",
    chapters: [
      { id: "5.1", code: "5.1", title: "دیانت داری", type: "unit" },
      { id: "5.2", code: "5.2", title: "حقوق العباد (خدمتِ خلق)", type: "unit" },
      { id: "5.3", code: "5.3", title: "وطن سے محبت (ذمہ دار شہری)", type: "unit" }
    ]
  },
  {
    id: "bab-6",
    title: "باب ششم: ہدایت کے سر چشمے اور مشاہیرِ اسلام",
    type: "unit",
    chapters: [
      { id: "6.1", code: "6.1", title: "حضرت ابراہیمؑ", type: "unit" },
      { id: "6.2", code: "6.2", title: "حضرت موسیٰؑ", type: "unit" },
      { id: "6.3", code: "6.3", title: "حضرت عمرِ فاروقؓ", type: "unit" },
      { id: "6.4", code: "6.4", title: "حضرت عثمان غنیؓ", type: "unit" }
    ]
  },
  {
    id: "bab-7",
    title: "باب ہفتم: اسلامی تعلیمات اور عصرِ حاضر کے تقاضے",
    type: "unit",
    chapters: [
      { id: "7.1", code: "7.1", title: "صفائی کی ضرورت و اہمیت", type: "unit" },
      { id: "7.2", code: "7.2", title: "پانی کی اہمیت", type: "unit" }
    ]
  }
];

export function getAllChapters(): Chapter[] {
  return PTB_CLASS4_ISLAMIAT.flatMap(unit => unit.chapters);
}
export function getChaptersByUnit(unitId: string): Chapter[] {
  const unit = PTB_CLASS4_ISLAMIAT.find(u => u.id === unitId);
  return unit ? unit.chapters : [];
}
export function getChapterById(chapterId: string): Chapter | undefined {
  return getAllChapters().find(ch => ch.id === chapterId);
}
export function getTotalChapterCount(): number {
  return getAllChapters().length;
}
export const SYLLABUS_METADATA = {
  subject: "اسلامیات (Islamiyat)",
  class: "4th",
  board: "PTB",
  totalUnits: 6,
  totalChapters: getTotalChapterCount(),
  language: "Urdu"
};
