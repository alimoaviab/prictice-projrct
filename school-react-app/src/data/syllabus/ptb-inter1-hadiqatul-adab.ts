/**
 * PTB Inter Part-I حَدِیقَۃُ الاَدَبِ Syllabus
 * Lessons 1–25 — Arabic text preserved exactly with RTL support
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

export const PTB_INTER1_HADIQATUL_ADAB: Unit[] = [
  { id: "s1",  title: "Lesson 1: From the Guidance of the Holy Quran",                              titleUrdu: "سبق نمبر 1: مِنْ ھَدْیِ الْقُرْآنِ الْکَرِیْمِ",          type: "unit", chapters: [{ id: "1",  code: "1",  title: "From the Guidance of the Holy Quran",                              titleUrdu: "مِنْ ھَدْیِ الْقُرْآنِ الْکَرِیْمِ",          type: "chapter" }] },
  { id: "s2",  title: "Lesson 2: From the Guidance of the Ahadith",                                  titleUrdu: "سبق نمبر 2: مِنْ ھَدْیِ الْاَحَادِیْث",                     type: "unit", chapters: [{ id: "2",  code: "2",  title: "From the Guidance of the Ahadith",                                  titleUrdu: "مِنْ ھَدْیِ الْاَحَادِیْث",                     type: "chapter" }] },
  { id: "s3",  title: "Lesson 3: Idea of the Creation of Pakistan",                                  titleUrdu: "سبق نمبر 3: فِکْرَۃُ انْشَاءٍ بَاکِسْتَان",                 type: "unit", chapters: [{ id: "3",  code: "3",  title: "Idea of the Creation of Pakistan",                                  titleUrdu: "فِکْرَۃُ انْشَاءٍ بَاکِسْتَان",                 type: "chapter" }] },
  { id: "s4",  title: "Lesson 4: Book of One Thousand and One Nights",                               titleUrdu: "سبق نمبر 4: کِتَابُ اَلْفُ لَیْلَۃٍ وَّ لَیْلَۃٌ",          type: "unit", chapters: [{ id: "4",  code: "4",  title: "Book of One Thousand and One Nights",                               titleUrdu: "کِتَابُ اَلْفُ لَیْلَۃٍ وَّ لَیْلَۃٌ",          type: "chapter" }] },
  { id: "s5",  title: "Lesson 5: In Praising and Glorifying Allah",                                  titleUrdu: "سبق نمبر 5: فِیْ الْحَمْدِ لِلّٰہِ وَالثَۤنَاءِ عَلَیْہِ",   type: "unit", chapters: [{ id: "5",  code: "5",  title: "In Praising and Glorifying Allah",                                   titleUrdu: "فِیْ الْحَمْدِ لِلّٰہِ وَالثَۤنَاءِ عَلَیْہِ",   type: "chapter" }] },
  { id: "s6",  title: "Lesson 6: From the Guidance of the Holy Quran",                              titleUrdu: "سبق نمبر 6: مِنْ ھَدْیِ الْقُرْآنِ الْکَرِیْمِ",          type: "unit", chapters: [{ id: "6",  code: "6",  title: "From the Guidance of the Holy Quran",                              titleUrdu: "مِنْ ھَدْیِ الْقُرْآنِ الْکَرِیْمِ",          type: "chapter" }] },
  { id: "s7",  title: "Lesson 7: From the Beautiful Example",                                        titleUrdu: "سبق نمبر 7: مِنَ الْاُ سْوَۃِ الْحَسَنَۃِ",                 type: "unit", chapters: [{ id: "7",  code: "7",  title: "From the Beautiful Example",                                        titleUrdu: "مِنَ الْاُ سْوَۃِ الْحَسَنَۃِ",                 type: "chapter" }] },
  { id: "s8",  title: "Lesson 8: Modern Inventions and Discoveries",                                 titleUrdu: "سبق نمبر 8: اَلْمُخْتَرَعَاتُ وَالْمُکْتَشَفَاتُ الْحَدِیْثَۃُ", type: "unit", chapters: [{ id: "8",  code: "8",  title: "Modern Inventions and Discoveries",                                 titleUrdu: "اَلْمُخْتَرَعَاتُ وَالْمُکْتَشَفَاتُ الْحَدِیْثَۃُ", type: "chapter" }] },
  { id: "s9",  title: "Lesson 9: The Lion, the Jackal and the Donkey",                              titleUrdu: "سبق نمبر 9: اَلْاَسَدُوَابْنُ آَوَی وَالْحِمَارُ",          type: "unit", chapters: [{ id: "9",  code: "9",  title: "The Lion, the Jackal and the Donkey",                              titleUrdu: "اَلْاَسَدُوَابْنُ آَوَی وَالْحِمَارُ",          type: "chapter" }] },
  { id: "s10", title: "Lesson 10: In Praise of the Prophet",                                         titleUrdu: "سبق نمبر 10: فِی الْمَدَائِحِ النَّبَوِیَّۃِ",               type: "unit", chapters: [{ id: "10", code: "10", title: "In Praise of the Prophet",                                         titleUrdu: "فِی الْمَدَائِحِ النَّبَوِیَّۃِ",               type: "chapter" }] },
  { id: "s11", title: "Lesson 11: Letters",                                                          titleUrdu: "سبق نمبر 11: اَلرَّسَائِلُ",                                 type: "unit", chapters: [{ id: "11", code: "11", title: "Letters",                                                          titleUrdu: "اَلرَّسَائِلُ",                                 type: "chapter" }] },
  { id: "s12", title: "Lesson 12: The Islamic States",                                               titleUrdu: "سبق نمبر 12: اَلدُّوَلُ الْاِسْلَامِیَّۃُ",                 type: "unit", chapters: [{ id: "12", code: "12", title: "The Islamic States",                                               titleUrdu: "اَلدُّوَلُ الْاِسْلَامِیَّۃُ",                 type: "chapter" }] },
  { id: "s13", title: "Lesson 13: At the Post Office",                                               titleUrdu: "سبق نمبر 13: فِیْ مَکْتَبِ الْبَرِیْدِ",                    type: "unit", chapters: [{ id: "13", code: "13", title: "At the Post Office",                                               titleUrdu: "فِیْ مَکْتَبِ الْبَرِیْدِ",                    type: "chapter" }] },
  { id: "s14", title: "Lesson 14: Etiquettes",                                                       titleUrdu: "سبق نمبر 14: اَلْآدَابُ",                                    type: "unit", chapters: [{ id: "14", code: "14", title: "Etiquettes",                                                       titleUrdu: "اَلْآدَابُ",                                    type: "chapter" }] },
  { id: "s15", title: "Lesson 15: In Brotherhood and Unity",                                         titleUrdu: "سبق نمبر 15: فِی الْاُخٗوَّۃِ وَالْاِتِّحَادِ",             type: "unit", chapters: [{ id: "15", code: "15", title: "In Brotherhood and Unity",                                         titleUrdu: "فِی الْاُخٗوَّۃِ وَالْاِتِّحَادِ",             type: "chapter" }] },
  { id: "s16", title: "Lesson 16: Caliph Umar ibn Abd al-Aziz",                                     titleUrdu: "سبق نمبر 16: اَلْخَلِیْفَۃُ عُمَرُبْنُ عَبْدِالْعَزِیْزِ", type: "unit", chapters: [{ id: "16", code: "16", title: "Caliph Umar ibn Abd al-Aziz",                                     titleUrdu: "اَلْخَلِیْفَۃُ عُمَرُبْنُ عَبْدِالْعَزِیْزِ", type: "chapter" }] },
  { id: "s17", title: "Lesson 17: Anarkali Market",                                                  titleUrdu: "سبق نمبر 17: سُوْقُ اَنَارْکَلِیْ",                         type: "unit", chapters: [{ id: "17", code: "17", title: "Anarkali Market",                                                  titleUrdu: "سُوْقُ اَنَارْکَلِیْ",                         type: "chapter" }] },
  { id: "s18", title: "Lesson 18: Justice of the Trustworthy",                                       titleUrdu: "سبق نمبر 18: قَضَاءُ الْاَمِیْن",                           type: "unit", chapters: [{ id: "18", code: "18", title: "Justice of the Trustworthy",                                       titleUrdu: "قَضَاءُ الْاَمِیْن",                           type: "chapter" }] },
  { id: "s19", title: "Lesson 19: Sermons",                                                          titleUrdu: "سبق نمبر 19: اَلْخُطُبُ",                                    type: "unit", chapters: [{ id: "19", code: "19", title: "Sermons",                                                          titleUrdu: "اَلْخُطُبُ",                                    type: "chapter" }] },
  { id: "s20", title: "Lesson 20: In Courage",                                                       titleUrdu: "سبق نمبر 20: فِی الشَّجَاعَۃِ",                             type: "unit", chapters: [{ id: "20", code: "20", title: "In Courage",                                                       titleUrdu: "فِی الشَّجَاعَۃِ",                             type: "chapter" }] },
  { id: "s21", title: "Lesson 21: Visit to the Two Holy Mosques",                                    titleUrdu: "سبق نمبر 21: زِیَارَۃُ الْحَرَمَیْنِ الشَّرِیْفَیْنِ",     type: "unit", chapters: [{ id: "21", code: "21", title: "Visit to the Two Holy Mosques",                                    titleUrdu: "زِیَارَۃُ الْحَرَمَیْنِ الشَّرِیْفَیْنِ",     type: "chapter" }] },
  { id: "s22", title: "Lesson 22: From the Guidance of the Holy Quran",                             titleUrdu: "سبق نمبر 22: مِنْ ھَدْیِ الْقُرْآنِ الْکَرِیْمِ",          type: "unit", chapters: [{ id: "22", code: "22", title: "From the Guidance of the Holy Quran",                             titleUrdu: "مِنْ ھَدْیِ الْقُرْآنِ الْکَرِیْمِ",          type: "chapter" }] },
  { id: "s23", title: "Lesson 23: Jokes and Anecdotes",                                              titleUrdu: "سبق نمبر 23: فُکَاھَاتٌ",                                    type: "unit", chapters: [{ id: "23", code: "23", title: "Jokes and Anecdotes",                                              titleUrdu: "فُکَاھَاتٌ",                                    type: "chapter" }] },
  { id: "s24", title: "Lesson 24: At the Perfumer's",                                                titleUrdu: "سبق نمبر 24: فِی الْعَطَارِ",                                type: "unit", chapters: [{ id: "24", code: "24", title: "At the Perfumer's",                                                titleUrdu: "فِی الْعَطَارِ",                                type: "chapter" }] },
  { id: "s25", title: "Lesson 25: In Wisdom",                                                        titleUrdu: "سبق نمبر 25: فِی الْحِکَمِ",                                 type: "unit", chapters: [{ id: "25", code: "25", title: "In Wisdom",                                                        titleUrdu: "فِی الْحِکَمِ",                                 type: "chapter" }] },
];

export function getAllChapters(): Chapter[] { return PTB_INTER1_HADIQATUL_ADAB.flatMap((u) => u.chapters); }
export function getChaptersByUnit(unitId: string): Chapter[] { return PTB_INTER1_HADIQATUL_ADAB.find((u) => u.id === unitId)?.chapters || []; }
export function getUnitByChapterId(chapterId: string): Unit | undefined { return PTB_INTER1_HADIQATUL_ADAB.find((u) => u.chapters.some((ch) => ch.id === chapterId)); }
