/**
 * PTB Class 3 (THREE) - اسلامیات (Islamiyat) - Complete Syllabus
 * Source: Punjab Textbook Board
 */
export interface Chapter { id: string; code: string; title: string; type: "unit" | "review" | "section"; }
export interface Unit { id: string; title: string; type: "unit" | "review" | "section"; chapters: Chapter[]; }

export const PTB_CLASS3_ISLAMIAT: Unit[] = [
  {
    id: "bab-2",
    title: "باب نمبر 2: ایمانیات و عبادات",
    type: "unit",
    chapters: [
      { id: "2.1", code: "2.1", title: "ایمانیات: توحید کا تعارف", type: "unit" },
      { id: "2.2", code: "2.2", title: "ایمانیات: نبوّت و رسالت", type: "unit" },
      { id: "2.3", code: "2.3", title: "عبادات: کلمہ شہادت", type: "unit" },
      { id: "2.4", code: "2.4", title: "عبادات: اذان", type: "unit" },
      { id: "2.5", code: "2.5", title: "عبادات: وضو", type: "unit" },
      { id: "2.6", code: "2.6", title: "عبادات: نماز", type: "unit" },
      { id: "2.7", code: "2.7", title: "عبادات: قبلہ و مسجد", type: "unit" }
    ]
  },
  {
    id: "bab-3",
    title: "باب نمبر 3: سیرتِ طیبہ ﷺ",
    type: "unit",
    chapters: [
      { id: "3.1", code: "3.1", title: "حضرت محمد رسول اللہ خاتم النبیین ﷺ کی حیات طیبہ (قبل از بعثت)", type: "unit" },
      { id: "3.2", code: "3.2", title: "حضرت محمد رسول اللہ خاتم النبیین ﷺ کی صداقت و امانت اور حسنِ معاملات", type: "unit" },
      { id: "3.3", code: "3.3", title: "حضرت محمد رسول اللہ خاتم النبیین ﷺ کی رواداری اور صبر تحمل", type: "unit" }
    ]
  },
  {
    id: "bab-4",
    title: "باب نمبر 4: اخلاق و آداب",
    type: "unit",
    chapters: [
      { id: "4.1", code: "4.1", title: "سچ کی اہمیت", type: "unit" },
      { id: "4.2", code: "4.2", title: "گُفت گُو کے آداب", type: "unit" }
    ]
  },
  {
    id: "bab-5",
    title: "باب نمبر 5: حُسنِ معاملات اور معاشیات",
    type: "unit",
    chapters: [
      { id: "5.1", code: "5.1", title: "باہمی تعلقات", type: "unit" }
    ]
  },
  {
    id: "bab-6",
    title: "باب نمبر 6: ہدایت کے سر چشمے اور مشاہیرِ اسلام",
    type: "unit",
    chapters: [
      { id: "6.1", code: "6.1", title: "حضرت آدم ؑ", type: "unit" },
      { id: "6.2", code: "6.2", title: "حضرت نوح ؑ", type: "unit" },
      { id: "6.3", code: "6.3", title: "خلیفہ اوّل حضرت ابوبکر صدیق ؓ", type: "unit" }
    ]
  },
  {
    id: "bab-7",
    title: "باب نمبر 7: اسلامی تعلیمات اور عصرِ حاضر کے تقاضے",
    type: "unit",
    chapters: [
      { id: "7.1", code: "7.1", title: "صحت و تن درستی", type: "unit" }
    ]
  }
];

export function getAllChapters(): Chapter[] { return PTB_CLASS3_ISLAMIAT.flatMap(u => u.chapters); }
export function getChaptersByUnit(unitId: string): Chapter[] { const u = PTB_CLASS3_ISLAMIAT.find(x => x.id === unitId); return u ? u.chapters : []; }
export function getChapterById(chapterId: string): Chapter | undefined { return getAllChapters().find(ch => ch.id === chapterId); }
export function getTotalChapterCount(): number { return getAllChapters().length; }
export const SYLLABUS_METADATA = { subject: "اسلامیات (Islamiyat)", class: "3rd", board: "PTB", totalUnits: 6, totalChapters: getTotalChapterCount(), language: "Urdu" };
