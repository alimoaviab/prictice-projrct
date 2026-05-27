/**
 * PTB Class 7 (7TH) - اخلاقیات (Ethics) - Complete Syllabus
 * Source: Punjab Textbook Board
 */
export interface Chapter { id: string; code: string; title: string; type: "unit" | "review" | "section"; }
export interface Unit { id: string; title: string; type: "unit" | "review" | "section"; chapters: Chapter[]; }

export const PTB_CLASS7_AKHLAQIYAT: Unit[] = [
  {
    id: "bab-1",
    title: "سبق نمبر 1: مذاہب کا تعارف",
    type: "unit",
    chapters: [
      { id: "1.1", code: "1.1", title: "مذاہب کا تعارف", type: "unit" },
      { id: "1.2", code: "1.2", title: "انسانی ترقی میں مذہب کا کردار", type: "unit" }
    ]
  },
  {
    id: "bab-2",
    title: "سبق نمبر 2: مذہب زرتُشت",
    type: "unit",
    chapters: [
      { id: "2.1", code: "2.1", title: "مذہب زرتُشت", type: "unit" }
    ]
  },
  {
    id: "bab-3",
    title: "سبق نمبر 3: پاکستان میں مذہبی تہوار",
    type: "unit",
    chapters: [
      { id: "3.1", code: "3.1", title: "عید الضحیٰ، ایسٹر (عیدِ قیامتِ مسیح)", type: "unit" },
      { id: "3.2", code: "3.2", title: "ہولی", type: "unit" },
      { id: "3.3", code: "3.3", title: "نوروز", type: "unit" }
    ]
  },
  {
    id: "bab-4",
    title: "سبق نمبر 4: اخلاقی اقدار",
    type: "unit",
    chapters: [
      { id: "4.1",  code: "4.1",  title: "پابندیِ وقت دراصل تعمیرِ ملت ہے", type: "unit" },
      { id: "4.2",  code: "4.2",  title: "اخوت کی برکتیں", type: "unit" },
      { id: "4.3",  code: "4.3",  title: "آؤ مل کر کھیلیں", type: "unit" },
      { id: "4.4",  code: "4.4",  title: "میرے دوست", type: "unit" },
      { id: "4.5",  code: "4.5",  title: "ہم ایک ہیں", type: "unit" },
      { id: "4.6",  code: "4.6",  title: "خوشحالی", type: "unit" },
      { id: "4.7",  code: "4.7",  title: "ایمانداری کی اہمیت", type: "unit" },
      { id: "4.8",  code: "4.8",  title: "سکول میں ایمانداری", type: "unit" },
      { id: "4.9",  code: "4.9",  title: "ایمانداری", type: "unit" },
      { id: "4.10", code: "4.10", title: "سچائی", type: "unit" },
      { id: "4.11", code: "4.11", title: "غلطی کا اعتراف", type: "unit" },
      { id: "4.12", code: "4.12", title: "ایک گائے اور بکری", type: "unit" }
    ]
  },
  {
    id: "bab-5",
    title: "سبق نمبر 5: آداب",
    type: "unit",
    chapters: [
      { id: "5.1", code: "5.1", title: "گفتگو کے آداب", type: "unit" },
      { id: "5.2", code: "5.2", title: "اشاروں کی زبان", type: "unit" },
      { id: "5.3", code: "5.3", title: "ٹیلی کمیونیکیشن", type: "unit" }
    ]
  },
  {
    id: "bab-6",
    title: "سبق نمبر 6: شخصیات",
    type: "unit",
    chapters: [
      { id: "6.1", code: "6.1", title: "حضرت رابعہ بصریؒ", type: "unit" },
      { id: "6.2", code: "6.2", title: "زرتشت", type: "unit" },
      { id: "6.3", code: "6.3", title: "مقدس توما رسول", type: "unit" }
    ]
  }
];

export function getAllChapters(): Chapter[] { return PTB_CLASS7_AKHLAQIYAT.flatMap(u => u.chapters); }
export function getChaptersByUnit(unitId: string): Chapter[] { const u = PTB_CLASS7_AKHLAQIYAT.find(x => x.id === unitId); return u ? u.chapters : []; }
export function getChapterById(chapterId: string): Chapter | undefined { return getAllChapters().find(ch => ch.id === chapterId); }
export function getTotalChapterCount(): number { return getAllChapters().length; }
export const SYLLABUS_METADATA = { subject: "اخلاقیات (Ethics)", class: "7th", board: "PTB", totalUnits: 6, totalChapters: getTotalChapterCount(), language: "Urdu" };
