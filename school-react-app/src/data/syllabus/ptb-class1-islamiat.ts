/**
 * PTB Class 1 Islamiat Syllabus
 * Complete chapter structure with Urdu text
 */

export interface Chapter {
  id: string;
  code: string;
  title: string;
  titleUrdu: string;
  type: "chapter";
}

export interface Unit {
  id: string;
  title: string;
  titleUrdu: string;
  type: "unit";
  chapters: Chapter[];
}

export const PTB_CLASS1_ISLAMIAT: Unit[] = [
  {
    id: "chapter-2",
    title: "Chapter 2: Faith and Worship",
    titleUrdu: "باب نمبر 2: ایمانیات و عبادات",
    type: "unit",
    chapters: [
      { id: "2.1", code: "2.1", title: "Faith: Introduction to Tawheed", titleUrdu: "ایمانیات: توحید کا تعارف", type: "chapter" },
      { id: "2.2", code: "2.2", title: "Faith: Prophethood and Messengership", titleUrdu: "ایمانیات: نبوت و رسالت", type: "chapter" },
      { id: "2.3", code: "2.3", title: "Worship: Hajj", titleUrdu: "عبادات: حج", type: "chapter" },
      { id: "2.4", code: "2.4", title: "Worship: Adhan", titleUrdu: "عبادات: اذان", type: "chapter" },
      { id: "2.5", code: "2.5", title: "Worship: Prayer", titleUrdu: "عبادات: نماز", type: "chapter" },
    ],
  },
  {
    id: "chapter-3",
    title: "Chapter 3: Life of the Prophet ﷺ",
    titleUrdu: "باب نمبر 3: سیرتِ طیبہ ﷺ",
    type: "unit",
    chapters: [
      { id: "3.1", code: "3.1", title: "Our Beloved Prophet Muhammad ﷺ", titleUrdu: "ہمارے پیارے نبی حضرت محمد رسول اللہ خاتم النبیین ﷺ", type: "chapter" },
      { id: "3.2", code: "3.2", title: "Noble Character of Prophet Muhammad ﷺ", titleUrdu: "حضرت محمد مصطفیٰ خاتم النبیین ﷺ کے اخلاقِ حسنہ", type: "chapter" },
    ],
  },
  {
    id: "chapter-4",
    title: "Chapter 4: Morals and Etiquettes",
    titleUrdu: "باب نمبر 4: اخلاق و آداب",
    type: "unit",
    chapters: [
      { id: "4.1", code: "4.1", title: "Good Morals", titleUrdu: "اچھے اخلاق", type: "chapter" },
      { id: "4.2", code: "4.2", title: "Greeting with Salam", titleUrdu: "سلام کرنا", type: "chapter" },
    ],
  },
  {
    id: "chapter-5",
    title: "Chapter 5: Sources of Guidance and Islamic Personalities",
    titleUrdu: "باب نمبر 5: ہدایت کے سرچشمے اور مشاہیر اسلام",
    type: "unit",
    chapters: [
      { id: "5.1", code: "5.1", title: "Our Prophet ﷺ as Teacher of Islam", titleUrdu: "ہمارے نبی کریم ﷺ معلمِ اسلام کا تعارف", type: "chapter" },
    ],
  },
];

// Helper function to get all chapters as flat list
export function getAllChapters(): Chapter[] {
  return PTB_CLASS1_ISLAMIAT.flatMap((unit) => unit.chapters);
}

// Helper function to get chapters by unit
export function getChaptersByUnit(unitId: string): Chapter[] {
  const unit = PTB_CLASS1_ISLAMIAT.find((u) => u.id === unitId);
  return unit?.chapters || [];
}

// Helper function to get unit by chapter ID
export function getUnitByChapterId(chapterId: string): Unit | undefined {
  return PTB_CLASS1_ISLAMIAT.find((unit) =>
    unit.chapters.some((ch) => ch.id === chapterId)
  );
}
