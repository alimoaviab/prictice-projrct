/**
 * PTB Inter Part-II حَدِیقَۃُ الاَدَبِ Syllabus
 * Lessons 26–50 — Arabic text preserved exactly with RTL support
 * ﷺ symbol preserved exactly in lesson 34
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

export const PTB_INTER2_HADIQATUL_ADAB: Unit[] = [
  {
    id: "sabaq-26",
    title: "Lesson 26: Al-Sayyid Jamal al-Din al-Afghani",
    titleUrdu: "سبق نمبر 26: السَّیّدُ جَمَالُ الدِّیْنِ الْافْغَانِیُّ",
    type: "unit",
    chapters: [
      { id: "26", code: "26", title: "Al-Sayyid Jamal al-Din al-Afghani", titleUrdu: "السَّیّدُ جَمَالُ الدِّیْنِ الْافْغَانِیُّ", type: "chapter" },
    ],
  },
  {
    id: "sabaq-27",
    title: "Lesson 27: Between Arab and Pakistani Witticisms",
    titleUrdu: "سبق نمبر 27: بَیْنَ النُّکتِ الْعَرَبیّۃِ وَالبَاکِسْتَانِیّۃِ",
    type: "unit",
    chapters: [
      { id: "27", code: "27", title: "Between Arab and Pakistani Witticisms", titleUrdu: "بَیْنَ النُّکتِ الْعَرَبیّۃِ وَالبَاکِسْتَانِیّۃِ", type: "chapter" },
    ],
  },
  {
    id: "sabaq-28",
    title: "Lesson 28: Al-Rasa'il — Letter of Abu Bakr to Khalid ibn al-Walid",
    titleUrdu: "سبق نمبر 28: الرَّسَائِلُ کتابُ ابِی بکرٍ الٰی خَالِدِ بْنِ اِلوَلیْد",
    type: "unit",
    chapters: [
      { id: "28", code: "28", title: "Al-Rasa'il — Letter of Abu Bakr to Khalid ibn al-Walid", titleUrdu: "الرَّسَائِلُ کتابُ ابِی بکرٍ الٰی خَالِدِ بْنِ اِلوَلیْد", type: "chapter" },
    ],
  },
  {
    id: "sabaq-29",
    title: "Lesson 29: Television",
    titleUrdu: "سبق نمبر 29: التِّلْفِزْیُوْنُ",
    type: "unit",
    chapters: [
      { id: "29", code: "29", title: "Television", titleUrdu: "التِّلْفِزْیُوْنُ", type: "chapter" },
    ],
  },
  {
    id: "sabaq-30",
    title: "Lesson 30: In Love of the Homeland",
    titleUrdu: "سبق نمبر 30: فِیْ حُبِّ الْوَطَنِ",
    type: "unit",
    chapters: [
      { id: "30", code: "30", title: "In Love of the Homeland", titleUrdu: "فِیْ حُبِّ الْوَطَنِ", type: "chapter" },
    ],
  },
  {
    id: "sabaq-31",
    title: "Lesson 31: Rights of the People",
    titleUrdu: "سبق نمبر 31: حُقُوْقُ الْعِبَادَ",
    type: "unit",
    chapters: [
      { id: "31", code: "31", title: "Rights of the People", titleUrdu: "حُقُوْقُ الْعِبَادَ", type: "chapter" },
    ],
  },
  {
    id: "sabaq-32",
    title: "Lesson 32: Pakistan — The Pure Land",
    titleUrdu: "سبق نمبر 32: بَاکِسْتَانُ اَلْارْضُ الطَّاھِرَۃُ",
    type: "unit",
    chapters: [
      { id: "32", code: "32", title: "Pakistan — The Pure Land", titleUrdu: "بَاکِسْتَانُ اَلْارْضُ الطَّاھِرَۃُ", type: "chapter" },
    ],
  },
  {
    id: "sabaq-33",
    title: "Lesson 33: At the Bank",
    titleUrdu: "سبق نمبر 33: فِی الْمَصْرِف",
    type: "unit",
    chapters: [
      { id: "33", code: "33", title: "At the Bank", titleUrdu: "فِی الْمَصْرِف", type: "chapter" },
    ],
  },
  {
    id: "sabaq-34",
    title: "Lesson 34: Muhammad ﷺ",
    titleUrdu: "سبق نمبر 34: مُحَمّد ﷺ",
    type: "unit",
    chapters: [
      { id: "34", code: "34", title: "Muhammad ﷺ", titleUrdu: "مُحَمّد ﷺ", type: "chapter" },
    ],
  },
  {
    id: "sabaq-35",
    title: "Lesson 35: In Determination and High Ambition",
    titleUrdu: "سبق نمبر 35: فِی الْعَزْم وَالْھِمَّۃِ اِلرَّفِیْعَۃِ",
    type: "unit",
    chapters: [
      { id: "35", code: "35", title: "In Determination and High Ambition", titleUrdu: "فِی الْعَزْم وَالْھِمَّۃِ اِلرَّفِیْعَۃِ", type: "chapter" },
    ],
  },
  {
    id: "sabaq-36",
    title: "Lesson 36: At the Hospital",
    titleUrdu: "سبق نمبر 36: فِی الْمُسْتَشْفٰی",
    type: "unit",
    chapters: [
      { id: "36", code: "36", title: "At the Hospital", titleUrdu: "فِی الْمُسْتَشْفٰی", type: "chapter" },
    ],
  },
  {
    id: "sabaq-37",
    title: "Lesson 37: From the Guidance of the Holy Quran",
    titleUrdu: "سبق نمبر 37: مِنْ ھَدْیِ الْقُرانِ الْکَرِیْمِ",
    type: "unit",
    chapters: [
      { id: "37", code: "37", title: "From the Guidance of the Holy Quran", titleUrdu: "مِنْ ھَدْیِ الْقُرانِ الْکَرِیْمِ", type: "chapter" },
    ],
  },
  {
    id: "sabaq-38",
    title: "Lesson 38: The Arab States",
    titleUrdu: "سبق نمبر 38: اَلدُّوَلَ الْعَرَبیَّۃُ",
    type: "unit",
    chapters: [
      { id: "38", code: "38", title: "The Arab States", titleUrdu: "اَلدُّوَلَ الْعَرَبیَّۃُ", type: "chapter" },
    ],
  },
  {
    id: "sabaq-39",
    title: "Lesson 39: His Majesty King Faisal the Great",
    titleUrdu: "سبق نمبر 39: جَلَالَۃُ الْمَلِکِ فَیْصَل الْمُعَظَّم",
    type: "unit",
    chapters: [
      { id: "39", code: "39", title: "His Majesty King Faisal the Great", titleUrdu: "جَلَالَۃُ الْمَلِکِ فَیْصَل الْمُعَظَّم", type: "chapter" },
    ],
  },
  {
    id: "sabaq-40",
    title: "Lesson 40: In Description of Nature",
    titleUrdu: "سبق نمبر 40: فِی وَصْفِ الطّبِیْعَۃِ",
    type: "unit",
    chapters: [
      { id: "40", code: "40", title: "In Description of Nature", titleUrdu: "فِی وَصْفِ الطّبِیْعَۃِ", type: "chapter" },
    ],
  },
  {
    id: "sabaq-41",
    title: "Lesson 41: At the Railway Station",
    titleUrdu: "سبق نمبر 41: فِیْ مَحَطَّۃِ الْقِطَارِ",
    type: "unit",
    chapters: [
      { id: "41", code: "41", title: "At the Railway Station", titleUrdu: "فِیْ مَحَطَّۃِ الْقِطَارِ", type: "chapter" },
    ],
  },
  {
    id: "sabaq-42",
    title: "Lesson 42: Comprehensive Words",
    titleUrdu: "سبق نمبر 42: جَوَامِعُ الْکَلِم",
    type: "unit",
    chapters: [
      { id: "42", code: "42", title: "Comprehensive Words", titleUrdu: "جَوَامِعُ الْکَلِم", type: "chapter" },
    ],
  },
  {
    id: "sabaq-43",
    title: "Lesson 43: Sermon of Umar ibn Abd al-Aziz",
    titleUrdu: "سبق نمبر 43: خُطْبَۃُ عُمَرُ بْنِ عَبْدِ الْعَزِیْزِ",
    type: "unit",
    chapters: [
      { id: "43", code: "43", title: "Sermon of Umar ibn Abd al-Aziz", titleUrdu: "خُطْبَۃُ عُمَرُ بْنِ عَبْدِ الْعَزِیْزِ", type: "chapter" },
    ],
  },
  {
    id: "sabaq-44",
    title: "Lesson 44: Cricket Match",
    titleUrdu: "سبق نمبر 44: مُبَارَاۃُ الکریْکَت",
    type: "unit",
    chapters: [
      { id: "44", code: "44", title: "Cricket Match", titleUrdu: "مُبَارَاۃُ الکریْکَت", type: "chapter" },
    ],
  },
  {
    id: "sabaq-45",
    title: "Lesson 45: In Virtue of Truthfulness and Earnest Work",
    titleUrdu: "سبق نمبر 45: فِی فَضْلِ الصِّدْقِ وَالعَمَلِ الْجَادِّ",
    type: "unit",
    chapters: [
      { id: "45", code: "45", title: "In Virtue of Truthfulness and Earnest Work", titleUrdu: "فِی فَضْلِ الصِّدْقِ وَالعَمَلِ الْجَادِّ", type: "chapter" },
    ],
  },
  {
    id: "sabaq-46",
    title: "Lesson 46: From the Guidance of the Holy Quran",
    titleUrdu: "سبق نمبر 46: مِنْ ھَدْیِ الْقُرٰانِ الْکَرِیْمِ",
    type: "unit",
    chapters: [
      { id: "46", code: "46", title: "From the Guidance of the Holy Quran", titleUrdu: "مِنْ ھَدْیِ الْقُرٰانِ الْکَرِیْمِ", type: "chapter" },
    ],
  },
  {
    id: "sabaq-47",
    title: "Lesson 47: Bride of the Mountains — Murree Hill Station",
    titleUrdu: "سبق نمبر 47: عُرُوْسُ الْجبَال۔ مَصْیِفُ مَری",
    type: "unit",
    chapters: [
      { id: "47", code: "47", title: "Bride of the Mountains — Murree Hill Station", titleUrdu: "عُرُوْسُ الْجبَال۔ مَصْیِفُ مَری", type: "chapter" },
    ],
  },
  {
    id: "sabaq-48",
    title: "Lesson 48: Virtue of Knowledge, Justice and Eating Halal",
    titleUrdu: "سبق نمبر 48: فَضِیْلَۃُ الْعِلْمِ وَالْعَدْلِ وَاکْل الحَلَال",
    type: "unit",
    chapters: [
      { id: "48", code: "48", title: "Virtue of Knowledge, Justice and Eating Halal", titleUrdu: "فَضِیْلَۃُ الْعِلْمِ وَالْعَدْلِ وَاکْل الحَلَال", type: "chapter" },
    ],
  },
  {
    id: "sabaq-49",
    title: "Lesson 49: At the Car Park",
    titleUrdu: "سبق نمبر 49: فِیْ مَوْقفِ السَّیَّارَات",
    type: "unit",
    chapters: [
      { id: "49", code: "49", title: "At the Car Park", titleUrdu: "فِیْ مَوْقفِ السَّیَّارَات", type: "chapter" },
    ],
  },
  {
    id: "sabaq-50",
    title: "Lesson 50: In Helping the Destitute",
    titleUrdu: "سبق نمبر 50: فِیْ مُسَاعَدَۃِ الْبَائِسِیْنَ",
    type: "unit",
    chapters: [
      { id: "50", code: "50", title: "In Helping the Destitute", titleUrdu: "فِیْ مُسَاعَدَۃِ الْبَائِسِیْنَ", type: "chapter" },
    ],
  },
];

export function getAllChapters(): Chapter[] {
  return PTB_INTER2_HADIQATUL_ADAB.flatMap((u) => u.chapters);
}
export function getChaptersByUnit(unitId: string): Chapter[] {
  return PTB_INTER2_HADIQATUL_ADAB.find((u) => u.id === unitId)?.chapters || [];
}
export function getUnitByChapterId(chapterId: string): Unit | undefined {
  return PTB_INTER2_HADIQATUL_ADAB.find((u) => u.chapters.some((ch) => ch.id === chapterId));
}
