/**
 * PTB Class 10 Pakistan Studies Syllabus
 * 8 chapters with detailed topics
 */

export interface Chapter {
  id: string;
  code: string;
  title: string;
  type: "chapter";
}

export interface Unit {
  id: string;
  title: string;
  type: "unit";
  chapters: Chapter[];
}

export const PTB_CLASS10_PAKISTAN_STUDIES: Unit[] = [
  {
    id: "chap-1",
    title: "CHAP 1: Ideological Basis of Pakistan",
    type: "unit",
    chapters: [
      { id: "1.1", code: "1.1", title: "Definition, Sources and Significance of Ideology",     type: "chapter" },
      { id: "1.2", code: "1.2", title: "Meaning of Ideology of Pakistan",                      type: "chapter" },
      { id: "1.3", code: "1.3", title: "Elements of Ideology of Pakistan",                     type: "chapter" },
      { id: "1.4", code: "1.4", title: "Two-Nation Theory: Origin and Evolution",              type: "chapter" },
      { id: "1.5", code: "1.5", title: "Allama Iqbal, Quaid-e-Azam and Ideology of Pakistan", type: "chapter" },
    ],
  },
  {
    id: "chap-2",
    title: "CHAP 2: The Pakistan Movement & Emergence of Pakistan",
    type: "unit",
    chapters: [
      { id: "2.1",  code: "2.1",  title: "Background of Pakistan Movement",                                   type: "chapter" },
      { id: "2.2",  code: "2.2",  title: "Consolidation of the State and making of Constitution, 1947-56)",   type: "chapter" },
      { id: "2.3",  code: "2.3",  title: "Quaid-e-Azam & Liaqat Ali Khan Role and Achievements",             type: "chapter" },
      { id: "2.4",  code: "2.4",  title: "Objectives Resolution",                                            type: "chapter" },
      { id: "2.5",  code: "2.5",  title: "Constitutional Stages in Pakistan",                                 type: "chapter" },
      { id: "2.6",  code: "2.6",  title: "Accession of States and Tribal Areas to Pakistan",                 type: "chapter" },
      { id: "2.7",  code: "2.7",  title: "Ayub Khan Era, 1958-1969",                                         type: "chapter" },
      { id: "2.8",  code: "2.8",  title: "Economic Development",                                             type: "chapter" },
      { id: "2.9",  code: "2.9",  title: "Five Year Development Plans of Ayub Khan's Era",                   type: "chapter" },
      { id: "2.10", code: "2.10", title: "Yahya Khan Regime, 1969-71",                                       type: "chapter" },
      { id: "2.11", code: "2.11", title: "Seperation of East Pakistan and Emergence of Bangladesh",          type: "chapter" },
    ],
  },
  {
    id: "chap-3",
    title: "CHAP 3: History of Pakistan-II (1971 Till Todate)",
    type: "unit",
    chapters: [
      { id: "3.1", code: "3.1", title: "Zulfiqar Ali Bhutto Era 1971-1977",                      type: "chapter" },
      { id: "3.2", code: "3.2", title: "General Muhammad Zia-ul-Haq Era 1977-88",               type: "chapter" },
      { id: "3.3", code: "3.3", title: "Benazir Bhutto's First & Second Term 1988-96",          type: "chapter" },
      { id: "3.4", code: "3.4", title: "Muhammad Nawaz Sharif's First, Second & Third Term 1988-2017", type: "chapter" },
      { id: "3.5", code: "3.5", title: "General Pervez Musharraf's Era 1999-2008",              type: "chapter" },
      { id: "3.6", code: "3.6", title: "Syed Yousaf Raza Gillani's Era 2008-12",                type: "chapter" },
      { id: "3.7", code: "3.7", title: "General Elections of Pakistan 2018",                    type: "chapter" },
      { id: "3.8", code: "3.8", title: "Constitution of Pakistan 1973",                         type: "chapter" },
    ],
  },
  {
    id: "chap-4",
    title: "CHAP 4: Pakistan and World Affairs",
    type: "unit",
    chapters: [
      { id: "4.1", code: "4.1", title: "Geo-Political Significance of Pakistan",              type: "chapter" },
      { id: "4.2", code: "4.2", title: "Objectives of Pakistan's Foreign Policy",            type: "chapter" },
      { id: "4.3", code: "4.3", title: "Pakistan's Relations with Neighbouring States",      type: "chapter" },
      { id: "4.4", code: "4.4", title: "Kashmir Issue",                                       type: "chapter" },
      { id: "4.5", code: "4.5", title: "Pakistan's Relations with Central Asian Countries",  type: "chapter" },
      { id: "4.6", code: "4.6", title: "Pakistan's Relations with SAARC Countries",         type: "chapter" },
      { id: "4.7", code: "4.7", title: "Pakistan's Relations with major world powers",       type: "chapter" },
      { id: "4.8", code: "4.8", title: "China Pakistan Economic Corridor-CPEC - till end",  type: "chapter" },
    ],
  },
  {
    id: "chap-5",
    title: "CHAP 5: Land and Environment",
    type: "unit",
    chapters: [
      { id: "5.1", code: "5.1", title: "Location of Pakistan",                           type: "chapter" },
      { id: "5.2", code: "5.2", title: "Physical Features of Pakistan",                  type: "chapter" },
      { id: "5.3", code: "5.3", title: "Climate of Pakistan",                            type: "chapter" },
      { id: "5.4", code: "5.4", title: "Major Glaciers and Rivers of Pakistan",          type: "chapter" },
      { id: "5.5", code: "5.5", title: "Forests and Wildlife in Pakistan",               type: "chapter" },
      { id: "5.6", code: "5.6", title: "Natural Regions of Pakistan",                    type: "chapter" },
      { id: "5.7", code: "5.7", title: "Major Environmental Hazards and their Remedies", type: "chapter" },
    ],
  },
  {
    id: "chap-6",
    title: "CHAP 6: Population, Society and Culture of Pakistan",
    type: "unit",
    chapters: [
      { id: "6.1", code: "6.1", title: "Growth and Distribution of Population in Pakistan",                                 type: "chapter" },
      { id: "6.2", code: "6.2", title: "Salient Features of Pakistani Society and Culture",                                 type: "chapter" },
      { id: "6.3", code: "6.3", title: "Educational Condition in Pakistan",                                                 type: "chapter" },
      { id: "6.4", code: "6.4", title: "Health Conditions in Pakistan",                                                     type: "chapter" },
      { id: "6.5", code: "6.5", title: "Importance of Tourism and Natural and Cultural attraction for Tourism in Pakistan", type: "chapter" },
      { id: "6.6", code: "6.6", title: "Need and Importance of Inter-faith Harmony, Tolerance and Resillience against Terrorism", type: "chapter" },
      { id: "6.7", code: "6.7", title: "Origin and Evolution of National and Regional Languages",                           type: "chapter" },
      { id: "6.8", code: "6.8", title: "Causes, Consequences and Remedies for Poverty Alleviation in Pakistan - till end", type: "chapter" },
    ],
  },
  {
    id: "chap-7",
    title: "CHAP 7: Economic Development of Pakistan",
    type: "unit",
    chapters: [
      { id: "7.1", code: "7.1", title: "Economic Development of Pakistan",                                                                      type: "chapter" },
      { id: "7.2", code: "7.2", title: "Major Metallic and Non-metallic Mineral Resources, their Economic Importance and Distribution in Pakistan", type: "chapter" },
      { id: "7.3", code: "7.3", title: "Importance of Agriculture, Problems and Efforts to Modernize Agriculture",                              type: "chapter" },
      { id: "7.4", code: "7.4", title: "Water Resources of Pakistan and Existing Irrigation System",                                           type: "chapter" },
      { id: "7.5", code: "7.5", title: "Production, Distribution of Major Crops, Livestock and Fisheries in Pakistan",                         type: "chapter" },
      { id: "7.6", code: "7.6", title: "Importance of Industries, their Location and Production of Cottage, Small and Large-scale Industries", type: "chapter" },
      { id: "7.7", code: "7.7", title: "Importance, Production and Consumption of different Sources of Energy in Pakistan",                    type: "chapter" },
      { id: "7.8", code: "7.8", title: "International Trade of Pakistan (Imports and Exports) and its Impact on the Economy",                  type: "chapter" },
      { id: "7.9", code: "7.9", title: "Importance of Sea Ports and Dry Ports of Pakistan",                                                    type: "chapter" },
    ],
  },
  {
    id: "chap-8",
    title: "CHAP 8: Women's Empowerment",
    type: "unit",
    chapters: [
      { id: "8.1", code: "8.1", title: "Women's Rights in Islam in the Light of Quran and Sunnah",                                               type: "chapter" },
      { id: "8.2", code: "8.2", title: "Women's Role in Pakistan Movement",                                                                       type: "chapter" },
      { id: "8.3", code: "8.3", title: "Women's Contribution in National Development from 1947 Till Now",                                        type: "chapter" },
      { id: "8.4", code: "8.4", title: "Definition of Violence and Violence Against Women",                                                       type: "chapter" },
      { id: "8.5", code: "8.5", title: "Violence Impacts upon Pakistan's Society with Reference to Constitutional Provisions",                    type: "chapter" },
      { id: "8.6", code: "8.6", title: "Government's efforts to Address the Issue of Violence Against Women in Pakistan",                        type: "chapter" },
      { id: "8.7", code: "8.7", title: "Government's Efforts to Address Regarding Women's Protection and Women's Empowerment",                   type: "chapter" },
    ],
  },
];

export function getAllChapters(): Chapter[] {
  return PTB_CLASS10_PAKISTAN_STUDIES.flatMap((u) => u.chapters);
}
export function getChaptersByUnit(unitId: string): Chapter[] {
  return PTB_CLASS10_PAKISTAN_STUDIES.find((u) => u.id === unitId)?.chapters || [];
}
export function getUnitByChapterId(chapterId: string): Unit | undefined {
  return PTB_CLASS10_PAKISTAN_STUDIES.find((u) => u.chapters.some((ch) => ch.id === chapterId));
}
