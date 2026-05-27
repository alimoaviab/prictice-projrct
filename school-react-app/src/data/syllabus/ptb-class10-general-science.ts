/**
 * PTB Class 10 General Science Syllabus (Urdu medium topics)
 * Chapters 7–11 — Urdu/mixed text preserved exactly
 * Note: Chapter 7 topic 7.7 is missing in source (jumps 7.6 → 7.8) — preserved as provided
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

export const PTB_CLASS10_GENERAL_SCIENCE: Unit[] = [
  {
    id: "chap-7",
    title: "Chapter 7: Energy",
    titleUrdu: "باب نمبر 7: انرجی",
    type: "unit",
    chapters: [
      { id: "7.1",  code: "7.1",  title: "Work and Energy",                                  titleUrdu: "ورک اور انرجی",                    type: "chapter" },
      { id: "7.2",  code: "7.2",  title: "Different Types of Energy",                        titleUrdu: "انرجی کی مختلف اقسام",             type: "chapter" },
      { id: "7.3",  code: "7.3",  title: "Interchange of Energy",                            titleUrdu: "انرجی کا باہم تبادلہ",             type: "chapter" },
      { id: "7.4",  code: "7.4",  title: "Demand for Energy",                                titleUrdu: "انرجی کی طلب",                     type: "chapter" },
      { id: "7.5",  code: "7.5",  title: "Obtaining Electrical Energy",                      titleUrdu: "الیکٹریکل انرجی کا حصول",         type: "chapter" },
      { id: "7.6",  code: "7.6",  title: "Energy Environment",                               titleUrdu: "انرجی کا ماحول",                   type: "chapter" },
      // 7.7 absent in source — preserved as provided
      { id: "7.8",  code: "7.8",  title: "Environmental Deterioration",                      titleUrdu: "ماحول کی ابتری",                   type: "chapter" },
      { id: "7.9",  code: "7.9",  title: "Dangers from Nuclear Fuel",                        titleUrdu: "نیو کلئیر فیول سے لاحق خطرات",   type: "chapter" },
      { id: "7.10", code: "7.10", title: "Energy Conservation",                              titleUrdu: "انرجی کا تحفظ",                    type: "chapter" },
    ],
  },
  {
    id: "chap-8",
    title: "Chapter 8: Current Electricity",
    titleUrdu: "باب نمبر 8: کرنٹ الیکٹریسٹی",
    type: "unit",
    chapters: [
      { id: "8.1",  code: "8.1",  title: "Electric Current",                                titleUrdu: "الیکٹرک کرنٹ",                     type: "chapter" },
      { id: "8.2",  code: "8.2",  title: "Conventional Current",                             titleUrdu: "کنوینشنل کرنٹ",                    type: "chapter" },
      { id: "8.3",  code: "8.3",  title: "Potential Difference",                             titleUrdu: "پوٹینشل ڈفرینس",                   type: "chapter" },
      { id: "8.4",  code: "8.4",  title: "Ohm's Law",                                        titleUrdu: "اوہم کا قانون",                     type: "chapter" },
      { id: "8.5",  code: "8.5",  title: "Resistance",                                       titleUrdu: "رزسٹنس",                            type: "chapter" },
      { id: "8.6",  code: "8.6",  title: "Components of Circuit",                           titleUrdu: "سرکٹ کے اجزا",                     type: "chapter" },
      { id: "8.7",  code: "8.7",  title: "Direct and Alternating Current",                  titleUrdu: "ڈائریکٹ اور آلٹرنینٹگ کرنٹ",     type: "chapter" },
      { id: "8.8",  code: "8.8",  title: "Use of DC and AC",                                titleUrdu: "ڈی۔سی اور اے۔سی کا استعمال",       type: "chapter" },
      { id: "8.9",  code: "8.9",  title: "Household Electric Supply",                       titleUrdu: "گھر یلو الیکٹرک سپلائی",           type: "chapter" },
      { id: "8.10", code: "8.10", title: "Measurement of Electricity Supply",               titleUrdu: "الیکٹریسٹی سپلائی کی پیمائش",     type: "chapter" },
      { id: "8.11", code: "8.11", title: "Dangers of Electricity and Precautionary Measures", titleUrdu: "الیکٹریسٹی کے خطرات اور احتیاطی تدابیر", type: "chapter" },
      { id: "8.12", code: "8.12", title: "Measuring Instruments",                           titleUrdu: "آلات پیمائش",                       type: "chapter" },
      { id: "8.13", code: "8.13", title: "Analog and Digital Meters",                       titleUrdu: "اینا لوگ اور ڈیجیٹل میٹرز",       type: "chapter" },
    ],
  },
  {
    id: "chap-9",
    title: "Chapter 9: Basic Electronics",
    titleUrdu: "باب نمبر 9: بنیادی الیکٹرونکس",
    type: "unit",
    chapters: [
      { id: "9.1", code: "9.1", title: "Semiconductors",                                    titleUrdu: "سیمی کنڈکٹرز",                     type: "chapter" },
      { id: "9.2", code: "9.2", title: "Uses of Semiconductor Diode",                       titleUrdu: "سیمی کنڈکٹر ڈائیوڈ کے استعمال",  type: "chapter" },
      { id: "9.3", code: "9.3", title: "Radio Waves",                                       titleUrdu: "ریڈیو ویوز",                        type: "chapter" },
      { id: "9.4", code: "9.4", title: "Computer",                                          titleUrdu: "کمپیوٹر",                           type: "chapter" },
      { id: "9.5", code: "9.5", title: "Analog/Digital Converters",                         titleUrdu: "اینالوگ/ڈیجیٹل کنورٹرز",          type: "chapter" },
      { id: "9.6", code: "9.6", title: "Information Technology",                            titleUrdu: "انفارمیشن ٹیکنالوجی",              type: "chapter" },
    ],
  },
  {
    id: "chap-10",
    title: "Chapter 10: Science and Technology",
    titleUrdu: "باب نمبر 10: سائنس اور ٹیکنالوجی",
    type: "unit",
    chapters: [
      { id: "10.1",  code: "10.1",  title: "Role of Science and Technology",               titleUrdu: "سائنس اور ٹیکنالوجی کا کردار",   type: "chapter" },
      { id: "10.2",  code: "10.2",  title: "Laser",                                         titleUrdu: "لیزر",                             type: "chapter" },
      { id: "10.3",  code: "10.3",  title: "Fiber Optics",                                  titleUrdu: "فائبر آپٹکس",                      type: "chapter" },
      { id: "10.4",  code: "10.4",  title: "Satellites and Radar",                          titleUrdu: "سٹیلائیٹس اور راڈار",              type: "chapter" },
      { id: "10.5",  code: "10.5",  title: "Radioactivity",                                 titleUrdu: "ریڈیو ایکٹیویٹی",                 type: "chapter" },
      { id: "10.6",  code: "10.6",  title: "X-Rays",                                        titleUrdu: "ایکس ریز",                          type: "chapter" },
      { id: "10.7",  code: "10.7",  title: "Ultrasound",                                    titleUrdu: "الٹرا ساؤنڈ",                      type: "chapter" },
      { id: "10.8",  code: "10.8",  title: "ECG",                                           titleUrdu: "ای۔سی۔جی",                          type: "chapter" },
      { id: "10.9",  code: "10.9",  title: "EEG",                                           titleUrdu: "ای۔ای۔جی",                          type: "chapter" },
      { id: "10.10", code: "10.10", title: "MRI",                                           titleUrdu: "ایم۔آر۔آئی",                        type: "chapter" },
      { id: "10.11", code: "10.11", title: "CT Scan",                                       titleUrdu: "سی۔ٹی سکین",                       type: "chapter" },
      { id: "10.12", code: "10.12", title: "Angiography",                                   titleUrdu: "انجیوگرافی",                        type: "chapter" },
      { id: "10.13", code: "10.13", title: "Pakistan's Important Industries",               titleUrdu: "پاکستان کی اہم انڈسٹریز",         type: "chapter" },
    ],
  },
  {
    id: "chap-11",
    title: "Chapter 11: Pakistan's Space and Nuclear Programme",
    titleUrdu: "باب نمبر 11: پاکستان کا سپیس اور نیو کلئیر پروگرام",
    type: "unit",
    chapters: [
      { id: "11.1", code: "11.1", title: "Importance of Space Programme",                  titleUrdu: "سپیس پروگرام کی اہمیت",           type: "chapter" },
      { id: "11.2", code: "11.2", title: "Pakistan's Space Programme",                     titleUrdu: "پاکستان کاسپیس پروگرام",           type: "chapter" },
      { id: "11.3", code: "11.3", title: "Pakistan's Nuclear Power Programme",             titleUrdu: "پاکستان کا نیوکلئیر پاور پروگرام", type: "chapter" },
    ],
  },
];

export function getAllChapters(): Chapter[] { return PTB_CLASS10_GENERAL_SCIENCE.flatMap((u) => u.chapters); }
export function getChaptersByUnit(unitId: string): Chapter[] { return PTB_CLASS10_GENERAL_SCIENCE.find((u) => u.id === unitId)?.chapters || []; }
export function getUnitByChapterId(chapterId: string): Unit | undefined { return PTB_CLASS10_GENERAL_SCIENCE.find((u) => u.chapters.some((ch) => ch.id === chapterId)); }
