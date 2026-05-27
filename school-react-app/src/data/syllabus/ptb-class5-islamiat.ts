/**
 * PTB Class 5 (5TH) - اسلامیات (Islamiyat) - Complete Syllabus
 * Source: Punjab Textbook Board
 */
export interface Chapter { id: string; code: string; title: string; type: "unit" | "review" | "section"; }
export interface Unit { id: string; title: string; type: "unit" | "review" | "section"; chapters: Chapter[]; }

export const PTB_CLASS5_ISLAMIAT: Unit[] = [
  {
    id: "bab-2",
    title: "باب دوم : ایمانیات و عبادات",
    type: "unit",
    chapters: [
      { id: "2.1", code: "2.1", title: "آخرت", type: "unit" },
      { id: "2.2", code: "2.2", title: "ختم نبوت اور اطاعتِ رسول ﷺ", type: "unit" },
      { id: "2.3", code: "2.3", title: "زکوٰۃ", type: "unit" },
      { id: "2.4", code: "2.4", title: "جمعۃ المبارک کی فضیلت", type: "unit" },
      { id: "2.5", code: "2.5", title: "عیدین", type: "unit" }
    ]
  },
  {
    id: "bab-3",
    title: "باب سوم : سیرتِ طیبہ ﷺ",
    type: "unit",
    chapters: [
      { id: "3.1", code: "3.1", title: "معراج النبی ﷺ", type: "unit" },
      { id: "3.2", code: "3.2", title: "بیعتِ عقبہ اُولی و ثانیہ", type: "unit" },
      { id: "3.3", code: "3.3", title: "ہجرتِ مدینہ", type: "unit" },
      { id: "3.4", code: "3.4", title: "مواخاتِ مدینہ", type: "unit" },
      { id: "3.5", code: "3.5", title: "مسجدِ نبوی ﷺ", type: "unit" },
      { id: "3.6", code: "3.6", title: "میثاقِ مدینہ", type: "unit" },
      { id: "3.7", code: "3.7", title: "غزواتِ نبوی ﷺ", type: "unit" }
    ]
  },
  {
    id: "bab-4",
    title: "باب چہارم : اخلاق و آداب",
    type: "unit",
    chapters: [
      { id: "4.1", code: "4.1", title: "رواداری", type: "unit" },
      { id: "4.2", code: "4.2", title: "عفوودرگزر اور رحم دلی", type: "unit" },
      { id: "4.3", code: "4.3", title: "کفایت شعاری", type: "unit" }
    ]
  },
  {
    id: "bab-5",
    title: "باب پنجم : حسنِ معاملات و معاشرت",
    type: "unit",
    chapters: [
      { id: "5.1", code: "5.1", title: "ایفائے عہد", type: "unit" },
      { id: "5.2", code: "5.2", title: "اسلامی اخوت", type: "unit" },
      { id: "5.3", code: "5.3", title: "چغل خوری", type: "unit" }
    ]
  },
  {
    id: "bab-6",
    title: "باب ششم : ہدایت کے سر چشمے اور مشاہیرِ اسلام",
    type: "unit",
    chapters: [
      { id: "6.1", code: "6.1", title: "حضرت داؤد علیہ السلام", type: "unit" },
      { id: "6.2", code: "6.2", title: "حضرت عیسٰی ابن مریم علیہ السلام", type: "unit" },
      { id: "6.3", code: "6.3", title: "حضرت علی المرتضٰی رضی اللہ تعالیٰ عنہہ", type: "unit" },
      { id: "6.4", code: "6.4", title: "صوفیہ کرام رحمتہ اللہ علیھم", type: "unit" }
    ]
  },
  {
    id: "bab-7",
    title: "باب ہفتم : اسلامی تعلیمات اور عصرِ حاضر کے تقاضے",
    type: "unit",
    chapters: [
      { id: "7.1", code: "7.1", title: "حادثات سے بچنے کی تدابیر", type: "unit" },
      { id: "7.2", code: "7.2", title: "پودوں اور درختوں کی اہمیت", type: "unit" }
    ]
  }
];

export function getAllChapters(): Chapter[] { return PTB_CLASS5_ISLAMIAT.flatMap(u => u.chapters); }
export function getChaptersByUnit(unitId: string): Chapter[] { const u = PTB_CLASS5_ISLAMIAT.find(x => x.id === unitId); return u ? u.chapters : []; }
export function getChapterById(chapterId: string): Chapter | undefined { return getAllChapters().find(ch => ch.id === chapterId); }
export function getTotalChapterCount(): number { return getAllChapters().length; }
export const SYLLABUS_METADATA = { subject: "اسلامیات (Islamiyat)", class: "5th", board: "PTB", totalUnits: 6, totalChapters: getTotalChapterCount(), language: "Urdu" };
