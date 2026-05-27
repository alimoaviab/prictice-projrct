/**
 * PTB Inter Part-II تاریخِ اسلام (History of Islam) Syllabus
 * 17 chapters — Urdu text preserved exactly with RTL support
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

export const PTB_INTER2_TAREEKH_E_ISLAM: Unit[] = [
  {
    id: "chap-1",
    title: "Chapter 1: Abbasid Movement and Establishment of Abbasid Caliphate",
    titleUrdu: "باب نمبر 1: عباسی تحریک اور خلافت بنو عباس کا قیام",
    type: "unit",
    chapters: [
      { id: "1", code: "1", title: "Abbasid Movement and Establishment of Abbasid Caliphate", titleUrdu: "عباسی تحریک اور خلافت بنو عباس کا قیام", type: "chapter" },
    ],
  },
  {
    id: "chap-2",
    title: "Chapter 2: Abu al-Abbas Abdullah al-Saffah",
    titleUrdu: "باب نمبر 2: ابو العباس عبداللہ السفاح",
    type: "unit",
    chapters: [
      { id: "2", code: "2", title: "Abu al-Abbas Abdullah al-Saffah", titleUrdu: "ابو العباس عبداللہ السفاح", type: "chapter" },
    ],
  },
  {
    id: "chap-3",
    title: "Chapter 3: Abu Jafar Mansur",
    titleUrdu: "باب نمبر 3: ابو جعفر منصور",
    type: "unit",
    chapters: [
      { id: "3", code: "3", title: "Abu Jafar Mansur", titleUrdu: "ابو جعفر منصور", type: "chapter" },
    ],
  },
  {
    id: "chap-4",
    title: "Chapter 4: Muhammad al-Mahdi, Musa al-Hadi",
    titleUrdu: "باب نمبر 4: محمد المہدی ، موسی الہادی",
    type: "unit",
    chapters: [
      { id: "4", code: "4", title: "Muhammad al-Mahdi, Musa al-Hadi", titleUrdu: "محمد المہدی ، موسی الہادی", type: "chapter" },
    ],
  },
  {
    id: "chap-5",
    title: "Chapter 5: Harun al-Rashid",
    titleUrdu: "باب نمبر 5: ہارون الرشید",
    type: "unit",
    chapters: [
      { id: "5", code: "5", title: "Harun al-Rashid", titleUrdu: "ہارون الرشید", type: "chapter" },
    ],
  },
  {
    id: "chap-6",
    title: "Chapter 6: Amin al-Rashid",
    titleUrdu: "باب نمبر 6: امین الرشید",
    type: "unit",
    chapters: [
      { id: "6", code: "6", title: "Amin al-Rashid", titleUrdu: "امین الرشید", type: "chapter" },
    ],
  },
  {
    id: "chap-7",
    title: "Chapter 7: Ma'mun al-Rashid",
    titleUrdu: "باب نمبر 7: مامون الرشید",
    type: "unit",
    chapters: [
      { id: "7", code: "7", title: "Ma'mun al-Rashid", titleUrdu: "مامون الرشید", type: "chapter" },
    ],
  },
  {
    id: "chap-8",
    title: "Chapter 8: Mu'tasim Billah and Wathiq Billah",
    titleUrdu: "باب نمبر 8: معتصم باللہ اور واثق باللہ",
    type: "unit",
    chapters: [
      { id: "8", code: "8", title: "Mu'tasim Billah and Wathiq Billah", titleUrdu: "معتصم باللہ اور واثق باللہ", type: "chapter" },
    ],
  },
  {
    id: "chap-9",
    title: "Chapter 9: Ja'far Mutawakkil Alallah",
    titleUrdu: "باب نمبر 9: جعفر متوکل علی اللہ",
    type: "unit",
    chapters: [
      { id: "9", code: "9", title: "Ja'far Mutawakkil Alallah", titleUrdu: "جعفر متوکل علی اللہ", type: "chapter" },
    ],
  },
  {
    id: "chap-10",
    title: "Chapter 10: Era of Decline of Banu Abbas",
    titleUrdu: "باب نمبر 10: بنو عباس کا دورِ زوال",
    type: "unit",
    chapters: [
      { id: "10", code: "10", title: "Era of Decline of Banu Abbas", titleUrdu: "بنو عباس کا دورِ زوال", type: "chapter" },
    ],
  },
  {
    id: "chap-11",
    title: "Chapter 11: Autonomous Governments of the Abbasid Era",
    titleUrdu: "باب نمبر 11: عہدِ بنو عباس کی خودمختار حکومتیں",
    type: "unit",
    chapters: [
      { id: "11", code: "11", title: "Autonomous Governments of the Abbasid Era", titleUrdu: "عہدِ بنو عباس کی خودمختار حکومتیں", type: "chapter" },
    ],
  },
  {
    id: "chap-12",
    title: "Chapter 12: The Crusades",
    titleUrdu: "باب نمبر 12: صلیبی جنگیں",
    type: "unit",
    chapters: [
      { id: "12", code: "12", title: "The Crusades", titleUrdu: "صلیبی جنگیں", type: "chapter" },
    ],
  },
  {
    id: "chap-13",
    title: "Chapter 13: Mongol Menace and the Tragedy of Baghdad",
    titleUrdu: "باب نمبر 13: فتنہ تاتار اور سانحہ بغداد",
    type: "unit",
    chapters: [
      { id: "13", code: "13", title: "Mongol Menace and the Tragedy of Baghdad", titleUrdu: "فتنہ تاتار اور سانحہ بغداد", type: "chapter" },
    ],
  },
  {
    id: "chap-14",
    title: "Chapter 14: Reasons for the Decline of Banu Abbas",
    titleUrdu: "باب نمبر 14: بنو عباس کے زوال کے اسباب",
    type: "unit",
    chapters: [
      { id: "14", code: "14", title: "Reasons for the Decline of Banu Abbas", titleUrdu: "بنو عباس کے زوال کے اسباب", type: "chapter" },
    ],
  },
  {
    id: "chap-15",
    title: "Chapter 15: Abbasid Caliphate (Important Features, System of Government, Foreign Relations)",
    titleUrdu: "باب نمبر 15: خلافت عباسیہ (اہم خصوصیات، نظام حکومت، خارجہ تعلقات)",
    type: "unit",
    chapters: [
      { id: "15", code: "15", title: "Abbasid Caliphate (Important Features, System of Government, Foreign Relations)", titleUrdu: "خلافت عباسیہ (اہم خصوصیات، نظام حکومت، خارجہ تعلقات)", type: "chapter" },
    ],
  },
  {
    id: "chap-16",
    title: "Chapter 16: Social and Economic Conditions of the Abbasid Caliphate, Development of Sciences and Arts",
    titleUrdu: "باب نمبر 16: خلافت عباسیہ کے معاشرتی و معاشی حالات، علوم و فنون کی ترقی",
    type: "unit",
    chapters: [
      { id: "16", code: "16", title: "Social and Economic Conditions of the Abbasid Caliphate, Development of Sciences and Arts", titleUrdu: "خلافت عباسیہ کے معاشرتی و معاشی حالات، علوم و فنون کی ترقی", type: "chapter" },
    ],
  },
  {
    id: "chap-17",
    title: "Chapter 17: Political and Religious Thoughts and Important Personalities",
    titleUrdu: "باب نمبر 17: سیاسی و مذہبی افکار اور اہم شخصیات",
    type: "unit",
    chapters: [
      { id: "17", code: "17", title: "Political and Religious Thoughts and Important Personalities", titleUrdu: "سیاسی و مذہبی افکار اور اہم شخصیات", type: "chapter" },
    ],
  },
];

export function getAllChapters(): Chapter[] {
  return PTB_INTER2_TAREEKH_E_ISLAM.flatMap((u) => u.chapters);
}
export function getChaptersByUnit(unitId: string): Chapter[] {
  return PTB_INTER2_TAREEKH_E_ISLAM.find((u) => u.id === unitId)?.chapters || [];
}
export function getUnitByChapterId(chapterId: string): Unit | undefined {
  return PTB_INTER2_TAREEKH_E_ISLAM.find((u) => u.chapters.some((ch) => ch.id === chapterId));
}
