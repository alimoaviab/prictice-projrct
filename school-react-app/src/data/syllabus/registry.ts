/**
 * Syllabus Registry
 * Central map of all available PTB syllabus data.
 * Key format: "syllabus|CLASS|Subject"
 */

import type { BaseUnit } from "@/components/syllabus/ChapterSelector";

// ─── PTB Class 1 ───────────────────────────────────────────────────────────
import { PTB_CLASS1_ENGLISH } from "./ptb-class1-english";
import { PTB_CLASS1_GENERAL_KNOWLEDGE } from "./ptb-class1-general-knowledge";
import { PTB_CLASS1_MATHEMATICS } from "./ptb-class1-mathematics";
import { PTB_CLASS1_ISLAMIAT } from "./ptb-class1-islamiat";
import { PTB_CLASS1_GENERAL_KNOWLEDGE_URDU } from "./ptb-class1-general-knowledge-urdu";
import { PTB_CLASS1_ISLAMIAT_URDU } from "./ptb-class1-islamiat-urdu";
import { PTB_CLASS1_URDU } from "./ptb-class1-urdu";

// ─── PTB Class 2 ───────────────────────────────────────────────────────────
import { PTB_CLASS2_ENGLISH } from "./ptb-class2-english";
import { PTB_CLASS2_MATHEMATICS } from "./ptb-class2-mathematics";
import { PTB_CLASS2_GENERAL_KNOWLEDGE } from "./ptb-class2-general-knowledge";
import { PTB_CLASS2_ISLAMIAT } from "./ptb-class2-islamiat";
import { PTB_CLASS2_URDU } from "./ptb-class2-urdu";

// ─── PTB Class 3 ───────────────────────────────────────────────────────────
import { PTB_CLASS3_GENERAL_KNOWLEDGE } from "./ptb-class3-general-knowledge";
import { PTB_CLASS3_ISLAMIAT } from "./ptb-class3-islamiat";
import { PTB_CLASS3_URDU } from "./ptb-class3-urdu";
import { PTB_CLASS3_ENGLISH } from "./ptb-class3-english";
import { PTB_CLASS3_MATHEMATICS } from "./ptb-class3-mathematics";

// ─── PTB Class 4 ───────────────────────────────────────────────────────────
import { PTB_CLASS4_ENGLISH } from "./ptb-class4-english";
import { PTB_CLASS4_MATHEMATICS } from "./ptb-class4-mathematics";
import { PTB_CLASS4_GENERAL_SCIENCE } from "./ptb-class4-general-science";
import { PTB_CLASS4_SOCIAL_STUDIES } from "./ptb-class4-social-studies";
import { PTB_CLASS4_ISLAMIAT } from "./ptb-class4-islamiat";
import { PTB_CLASS4_URDU } from "./ptb-class4-urdu";

// ─── PTB Class 5 ───────────────────────────────────────────────────────────
import { PTB_CLASS5_ENGLISH } from "./ptb-class5-english";
import { PTB_CLASS5_MATHEMATICS } from "./ptb-class5-mathematics";
import { PTB_CLASS5_GENERAL_SCIENCE } from "./ptb-class5-general-science";
import { PTB_CLASS5_URDU } from "./ptb-class5-urdu";
import { PTB_CLASS5_SOCIAL_STUDIES } from "./ptb-class5-social-studies";
import { PTB_CLASS5_ISLAMIAT } from "./ptb-class5-islamiat";

// ─── PTB Class 6 ───────────────────────────────────────────────────────────
import { PTB_CLASS6_ENGLISH } from "./ptb-class6-english";
import { PTB_CLASS6_MATHEMATICS } from "./ptb-class6-mathematics";
import { PTB_CLASS6_COMPUTER } from "./ptb-class6-computer";
import { PTB_CLASS6_GEOGRAPHY } from "./ptb-class6-geography";
import { PTB_CLASS6_HISTORY } from "./ptb-class6-history";
import { PTB_CLASS6_HOME_ECONOMICS } from "./ptb-class6-home-economics";
import { PTB_CLASS6_PUNJABI } from "./ptb-class6-punjabi";
import { PTB_CLASS6_AGRICULTURE } from "./ptb-class6-agriculture";
import { PTB_CLASS6_TARJUMA_QURAN } from "./ptb-class6-tarjuma-quran";
import { PTB_CLASS6_ISLAMIAT_LAZMI } from "./ptb-class6-islamiat-lazmi";
import { PTB_CLASS6_URDU_LAZMI } from "./ptb-class6-urdu-lazmi";
import { PTB_CLASS6_AKHLAQIYAT } from "./ptb-class6-akhlaqiyat";
import { PTB_CLASS6_GENERAL_SCIENCE } from "./ptb-class6-general-science";

// ─── PTB Class 7 ───────────────────────────────────────────────────────────
import { PTB_CLASS7_ENGLISH } from "./ptb-class7-english";
import { PTB_CLASS7_MATHEMATICS } from "./ptb-class7-mathematics";
import { PTB_CLASS7_COMPUTER } from "./ptb-class7-computer";
import { PTB_CLASS7_GENERAL_SCIENCE } from "./ptb-class7-general-science";
import { PTB_CLASS7_GEOGRAPHY } from "./ptb-class7-geography";
import { PTB_CLASS7_HISTORY } from "./ptb-class7-history";
import { PTB_CLASS7_HOME_ECONOMICS } from "./ptb-class7-home-economics";
import { PTB_CLASS7_PUNJABI } from "./ptb-class7-punjabi";
import { PTB_CLASS7_AGRICULTURE } from "./ptb-class7-agriculture";
import { PTB_CLASS7_TARJUMA_QURAN } from "./ptb-class7-tarjuma-quran";
import { PTB_CLASS7_ISLAMIAT_LAZMI } from "./ptb-class7-islamiat-lazmi";
import { PTB_CLASS7_URDU_LAZMI } from "./ptb-class7-urdu-lazmi";
import { PTB_CLASS7_AKHLAQIYAT } from "./ptb-class7-akhlaqiyat";

// ─── PTB Class 8 ───────────────────────────────────────────────────────────
import { PTB_CLASS8_ENGLISH } from "./ptb-class8-english";
import { PTB_CLASS8_MATHEMATICS } from "./ptb-class8-mathematics";
import { PTB_CLASS8_COMPUTER } from "./ptb-class8-computer";
import { PTB_CLASS8_GENERAL_SCIENCE } from "./ptb-class8-general-science";
import { PTB_CLASS8_GEOGRAPHY } from "./ptb-class8-geography";
import { PTB_CLASS8_HISTORY } from "./ptb-class8-history";
import { PTB_CLASS8_HOME_ECONOMICS } from "./ptb-class8-home-economics";
import { PTB_CLASS8_AGRICULTURE } from "./ptb-class8-agriculture";
import { PTB_CLASS8_TARJUMA_QURAN } from "./ptb-class8-tarjuma-quran";
import { PTB_CLASS8_ISLAMIAT_LAZMI } from "./ptb-class8-islamiat-lazmi";
import { PTB_CLASS8_AKHLAQIYAT } from "./ptb-class8-akhlaqiyat";
import { PTB_CLASS8_PUNJABI } from "./ptb-class8-punjabi";
import { PTB_CLASS8_URDU_LAZMI } from "./ptb-class8-urdu-lazmi";

// ─── PTB Class 9 ───────────────────────────────────────────────────────────
import { PTB_CLASS9_ENGLISH } from "./ptb-class9-english";
import { PTB_CLASS9_MATHEMATICS } from "./ptb-class9-mathematics";
import { PTB_CLASS9_PHYSICS } from "./ptb-class9-physics";
import { PTB_CLASS9_CHEMISTRY } from "./ptb-class9-chemistry";
import { PTB_CLASS9_BIOLOGY } from "./ptb-class9-biology";
import { PTB_CLASS9_ISLAMIAT_LAZMI } from "./ptb-class9-islamiat-lazmi";
import { PTB_CLASS9_URDU_LAZMI } from "./ptb-class9-urdu-lazmi";
import { PTB_CLASS9_GENERAL_SCIENCE } from "./ptb-class9-general-science";
import { PTB_CLASS9_EDUCATION_URDU } from "./ptb-class9-education-urdu";
import { PTB_CLASS9_PUNJABI } from "./ptb-class9-punjabi";
import { PTB_CLASS9_ISLAMIYAT_ELECTIVE } from "./ptb-class9-islamiyat-elective";
import { PTB_CLASS9_HOME_ECONOMICS } from "./ptb-class9-home-economics";
import { PTB_CLASS9_CIVICS } from "./ptb-class9-civics";
import { PTB_CLASS9_ECONOMICS } from "./ptb-class9-economics";
import { PTB_CLASS9_TARJUMA_QURAN } from "./ptb-class9-tarjuma-quran";
import { PTB_CLASS9_AKHLAQIYAT } from "./ptb-class9-akhlaqiyat";
import { PTB_CLASS9_PHYSICAL_EDUCATION } from "./ptb-class9-physical-education";
import { PTB_CLASS9_MURGHBANI } from "./ptb-class9-murghbani";
import { PTB_CLASS9_FOOD_NUTRITION } from "./ptb-class9-food-nutrition";
import { PTB_CLASS9_COMPUTER } from "./ptb-class9-computer";

// ─── PTB Class 10 ──────────────────────────────────────────────────────────
import { PTB_CLASS10_ENGLISH } from "./ptb-class10-english";
import { PTB_CLASS10_MATHEMATICS } from "./ptb-class10-mathematics";
import { PTB_CLASS10_PHYSICS } from "./ptb-class10-physics";
import { PTB_CLASS10_CHEMISTRY } from "./ptb-class10-chemistry";
import { PTB_CLASS10_COMPUTER } from "./ptb-class10-computer";
import { PTB_CLASS10_PAKISTAN_STUDIES } from "./ptb-class10-pakistan-studies";
import { PTB_CLASS10_URDU_LAZMI } from "./ptb-class10-urdu-lazmi";
import { PTB_CLASS10_ISLAMIAT_LAZMI } from "./ptb-class10-islamiat-lazmi";
import { PTB_CLASS10_GENERAL_SCIENCE } from "./ptb-class10-general-science";
import { PTB_CLASS10_EDUCATION } from "./ptb-class10-education";
import { PTB_CLASS10_ISLAMIAT_IKHTYARI } from "./ptb-class10-islamiat-ikhtyari";
import { PTB_CLASS10_PUNJABI } from "./ptb-class10-punjabi";
import { PTB_CLASS10_GENERAL_MATH } from "./ptb-class10-general-math";
import { PTB_CLASS10_TARJUMA_QURAN } from "./ptb-class10-tarjuma-quran";
import { PTB_CLASS10_SAWKS } from "./ptb-class10-sawks";
import { PTB_CLASS10_HOME_ECONOMICS } from "./ptb-class10-home-economics";
import { PTB_CLASS10_ECONOMICS } from "./ptb-class10-economics";
import { PTB_CLASS10_FOOD_NUTRITION } from "./ptb-class10-food-nutrition";
import { PTB_CLASS10_MURGHBANI } from "./ptb-class10-murghbani";
import { PTB_CLASS10_AKHLAQIYAT } from "./ptb-class10-akhlaqiyat";
import { PTB_CLASS10_PHYSICAL_EDUCATION } from "./ptb-class10-physical-education";
import { PTB_CLASS10_BIOLOGY } from "./ptb-class10-biology";

// ─── PTB Inter Part-I ──────────────────────────────────────────────────────
import { PTB_INTER1_BIOLOGY } from "./ptb-inter1-biology";
import { PTB_INTER1_CHEMISTRY } from "./ptb-inter1-chemistry";
import { PTB_INTER1_PHYSICS } from "./ptb-inter1-physics";
import { PTB_INTER1_MATHEMATICS } from "./ptb-inter1-mathematics";
import { PTB_INTER1_COMPUTER } from "./ptb-inter1-computer";
import { PTB_INTER1_STATISTICS } from "./ptb-inter1-statistics";
import { PTB_INTER1_ENGLISH } from "./ptb-inter1-english";
import { PTB_INTER1_PRINCIPLES_OF_ACCOUNTING } from "./ptb-inter1-principles-of-accounting";
import { PTB_INTER1_PRINCIPLES_OF_ECONOMICS } from "./ptb-inter1-principles-of-economics";
import { PTB_INTER1_PRINCIPLES_OF_COMMERCE } from "./ptb-inter1-principles-of-commerce";
import { PTB_INTER1_BUSINESS_MATHS } from "./ptb-inter1-business-maths";
import { PTB_INTER1_ECONOMICS } from "./ptb-inter1-economics";

// ─── PTB Inter Part-I (additional) ────────────────────────────────────────
import { PTB_INTER1_ISLAMIAT_LAZMI } from "./ptb-inter1-islamiat-lazmi";
import { PTB_INTER1_URDU_LAZMI } from "./ptb-inter1-urdu-lazmi";
import { PTB_INTER1_EDUCATION } from "./ptb-inter1-education";
import { PTB_INTER1_SAWKS } from "./ptb-inter1-sawks";
import { PTB_INTER1_PUNJABI } from "./ptb-inter1-punjabi";
import { PTB_INTER1_ISLAMIAT_IKHTYARI } from "./ptb-inter1-islamiat-ikhtyari";
import { PTB_INTER1_PHYSICAL_EDUCATION } from "./ptb-inter1-physical-education";
import { PTB_INTER1_SOCIOLOGY } from "./ptb-inter1-sociology";
import { PTB_INTER1_AKHLAQIYAT } from "./ptb-inter1-akhlaqiyat";
import { PTB_INTER1_TARJUMA_QURAN } from "./ptb-inter1-tarjuma-quran";
import { PTB_INTER1_PSYCHOLOGY } from "./ptb-inter1-psychology";
import { PTB_INTER1_FARSI } from "./ptb-inter1-farsi";
import { PTB_INTER1_TAREEKH_E_ISLAM } from "./ptb-inter1-tareekh-e-islam";
import { PTB_INTER1_HADIQATUL_ADAB } from "./ptb-inter1-hadiqatul-adab";
import { PTB_INTER1_TABII_GEOGRAPHY } from "./ptb-inter1-tabii-geography";
import { PTB_INTER1_HOME_ECONOMICS } from "./ptb-inter1-home-economics";
import { PTB_INTER1_LIBRARY_SCIENCE } from "./ptb-inter1-library-science";
import { PTB_INTER1_TAREEKH_E_PAKISTAN } from "./ptb-inter1-tareekh-e-pakistan";

// ─── PTB Inter Part-II ─────────────────────────────────────────────────────
import { PTB_INTER2_BIOLOGY } from "./ptb-inter2-biology";
import { PTB_INTER2_CHEMISTRY } from "./ptb-inter2-chemistry";
import { PTB_INTER2_MATHEMATICS } from "./ptb-inter2-mathematics";
import { PTB_INTER2_STATISTICS } from "./ptb-inter2-statistics";
import { PTB_INTER2_ENGLISH } from "./ptb-inter2-english";
import { PTB_INTER2_PRINCIPLES_OF_ACCOUNTING } from "./ptb-inter2-principles-of-accounting";
import { PTB_INTER2_PRINCIPLES_OF_BANKING } from "./ptb-inter2-principles-of-banking";
import { PTB_INTER2_COMMERCIAL_GEOGRAPHY } from "./ptb-inter2-commercial-geography";
import { PTB_INTER2_BUSINESS_STATISTICS } from "./ptb-inter2-business-statistics";
import { PTB_INTER2_PAKISTAN_STUDIES } from "./ptb-inter2-pakistan-studies";
import { PTB_INTER2_HOME_ECONOMICS } from "./ptb-inter2-home-economics";
import { PTB_INTER2_TAREEKH_E_PAKISTAN } from "./ptb-inter2-tareekh-e-pakistan";
import { PTB_INTER2_LIBRARY_SCIENCE } from "./ptb-inter2-library-science";
import { PTB_INTER2_INSANI_GEOGRAPHY } from "./ptb-inter2-insani-geography";
import { PTB_INTER2_HADIQATUL_ADAB } from "./ptb-inter2-hadiqatul-adab";
import { PTB_INTER2_FARSI } from "./ptb-inter2-farsi";
import { PTB_INTER2_PSYCHOLOGY } from "./ptb-inter2-psychology";
import { PTB_INTER2_TAREEKH_E_ISLAM } from "./ptb-inter2-tareekh-e-islam";
import { PTB_INTER2_SOCIOLOGY } from "./ptb-inter2-sociology";
import { PTB_INTER2_AKHLAQIYAT } from "./ptb-inter2-akhlaqiyat";
import { PTB_INTER2_TARJUMA_QURAN } from "./ptb-inter2-tarjuma-quran";
import { PTB_INTER2_PHYSICAL_EDUCATION } from "./ptb-inter2-physical-education";
import { PTB_INTER2_ISLAMIAT_IKHTYARI } from "./ptb-inter2-islamiat-ikhtyari";
import { PTB_INTER2_PUNJABI } from "./ptb-inter2-punjabi";
import { PTB_INTER2_EDUCATION } from "./ptb-inter2-education";
import { PTB_INTER2_SAWKS } from "./ptb-inter2-sawks";
import { PTB_INTER2_URDU_LAZMI } from "./ptb-inter2-urdu-lazmi";
import { PTB_INTER2_ECONOMICS } from "./ptb-inter2-economics";

// ─── Registry map ──────────────────────────────────────────────────────────
const REGISTRY: Record<string, BaseUnit[]> = {
  // Class ONE
  "ptb|ONE|English":            PTB_CLASS1_ENGLISH as BaseUnit[],
  "ptb|ONE|General Knowledge":  PTB_CLASS1_GENERAL_KNOWLEDGE as BaseUnit[],
  "ptb|ONE|Mathematics":        PTB_CLASS1_MATHEMATICS as BaseUnit[],
  "ptb|ONE|Islamiat":           PTB_CLASS1_ISLAMIAT as BaseUnit[],
  "ptb|ONE|اسلامیات":           PTB_CLASS1_ISLAMIAT_URDU as BaseUnit[],
  "ptb|ONE|General Knowledge Urdu": PTB_CLASS1_GENERAL_KNOWLEDGE_URDU as BaseUnit[],
  "ptb|ONE|Islamiat Urdu":      PTB_CLASS1_ISLAMIAT_URDU as BaseUnit[],
  "ptb|ONE|Urdu":               PTB_CLASS1_URDU as BaseUnit[],
  "ptb|ONE|اُردو":              PTB_CLASS1_URDU as BaseUnit[],

  // Class TWO
  "ptb|TWO|English":            PTB_CLASS2_ENGLISH as BaseUnit[],
  "ptb|TWO|Mathematics":        PTB_CLASS2_MATHEMATICS as BaseUnit[],
  "ptb|TWO|General Knowledge":  PTB_CLASS2_GENERAL_KNOWLEDGE as BaseUnit[],
  "ptb|TWO|Islamiat":           PTB_CLASS2_ISLAMIAT as BaseUnit[],
  "ptb|TWO|اسلامیات":           PTB_CLASS2_ISLAMIAT as BaseUnit[],
  "ptb|TWO|Urdu":               PTB_CLASS2_URDU as BaseUnit[],
  "ptb|TWO|اُردو":              PTB_CLASS2_URDU as BaseUnit[],

  // Class THREE
  "ptb|THREE|General Knowledge": PTB_CLASS3_GENERAL_KNOWLEDGE as BaseUnit[],
  "ptb|THREE|Islamiat":          PTB_CLASS3_ISLAMIAT as BaseUnit[],
  "ptb|THREE|اسلامیات":          PTB_CLASS3_ISLAMIAT as BaseUnit[],
  "ptb|THREE|Urdu":              PTB_CLASS3_URDU as BaseUnit[],
  "ptb|THREE|اُردو":             PTB_CLASS3_URDU as BaseUnit[],
  "ptb|THREE|English":           PTB_CLASS3_ENGLISH as BaseUnit[],
  "ptb|THREE|Mathematics":       PTB_CLASS3_MATHEMATICS as BaseUnit[],

  // Class FOUR
  "ptb|FOUR|English":           PTB_CLASS4_ENGLISH as BaseUnit[],
  "ptb|FOUR|Mathematics":       PTB_CLASS4_MATHEMATICS as BaseUnit[],
  "ptb|FOUR|General Science":   PTB_CLASS4_GENERAL_SCIENCE as BaseUnit[],
  "ptb|FOUR|Social Studies":    PTB_CLASS4_SOCIAL_STUDIES as BaseUnit[],
  "ptb|FOUR|Islamiat":          PTB_CLASS4_ISLAMIAT as BaseUnit[],
  "ptb|FOUR|اسلامیات":          PTB_CLASS4_ISLAMIAT as BaseUnit[],
  "ptb|FOUR|Urdu":              PTB_CLASS4_URDU as BaseUnit[],
  "ptb|FOUR|اُردو":             PTB_CLASS4_URDU as BaseUnit[],

  // Class 5TH
  "ptb|5TH|English":            PTB_CLASS5_ENGLISH as BaseUnit[],
  "ptb|5TH|Mathematics":        PTB_CLASS5_MATHEMATICS as BaseUnit[],
  "ptb|5TH|General Science":    PTB_CLASS5_GENERAL_SCIENCE as BaseUnit[],
  "ptb|5TH|Urdu":               PTB_CLASS5_URDU as BaseUnit[],
  "ptb|5TH|اُردو":              PTB_CLASS5_URDU as BaseUnit[],
  "ptb|5TH|Social Studies":     PTB_CLASS5_SOCIAL_STUDIES as BaseUnit[],
  "ptb|5TH|Islamiat":           PTB_CLASS5_ISLAMIAT as BaseUnit[],
  "ptb|5TH|اسلامیات":           PTB_CLASS5_ISLAMIAT as BaseUnit[],

  // Class 6TH
  "ptb|6TH|English":            PTB_CLASS6_ENGLISH as BaseUnit[],
  "ptb|6TH|Mathematics":        PTB_CLASS6_MATHEMATICS as BaseUnit[],
  "ptb|6TH|Computer":           PTB_CLASS6_COMPUTER as BaseUnit[],
  "ptb|6TH|Geography":          PTB_CLASS6_GEOGRAPHY as BaseUnit[],
  "ptb|6TH|History":            PTB_CLASS6_HISTORY as BaseUnit[],
  "ptb|6TH|Home Economics":     PTB_CLASS6_HOME_ECONOMICS as BaseUnit[],
  "ptb|6TH|ہوم اکنامکس":        PTB_CLASS6_HOME_ECONOMICS as BaseUnit[],
  "ptb|6TH|Punjabi":            PTB_CLASS6_PUNJABI as BaseUnit[],
  "ptb|6TH|پنجابی":             PTB_CLASS6_PUNJABI as BaseUnit[],
  "ptb|6TH|Agriculture":        PTB_CLASS6_AGRICULTURE as BaseUnit[],
  "ptb|6TH|Tarjuma Tul Quran":  PTB_CLASS6_TARJUMA_QURAN as BaseUnit[],
  "ptb|6TH|ترجمۃ القرآن":       PTB_CLASS6_TARJUMA_QURAN as BaseUnit[],
  "ptb|6TH|Islamiat Lazmi":     PTB_CLASS6_ISLAMIAT_LAZMI as BaseUnit[],
  "ptb|6TH|اسلامیات لازمی":     PTB_CLASS6_ISLAMIAT_LAZMI as BaseUnit[],
  "ptb|6TH|Urdu Lazmi":         PTB_CLASS6_URDU_LAZMI as BaseUnit[],
  "ptb|6TH|اُردو لازمی":        PTB_CLASS6_URDU_LAZMI as BaseUnit[],
  "ptb|6TH|Akhlaqiyat":         PTB_CLASS6_AKHLAQIYAT as BaseUnit[],
  "ptb|6TH|Akhlaqiat":          PTB_CLASS6_AKHLAQIYAT as BaseUnit[],
  "ptb|6TH|اخلاقیات":           PTB_CLASS6_AKHLAQIYAT as BaseUnit[],
  "ptb|6TH|General Science":    PTB_CLASS6_GENERAL_SCIENCE as BaseUnit[],
  "ptb|6TH|Zri Taleem":         PTB_CLASS6_AGRICULTURE as BaseUnit[],
  "ptb|6TH|زرعی تعلیم":         PTB_CLASS6_AGRICULTURE as BaseUnit[],

  // Class 7TH
  "ptb|7TH|English":            PTB_CLASS7_ENGLISH as BaseUnit[],
  "ptb|7TH|Mathematics":        PTB_CLASS7_MATHEMATICS as BaseUnit[],
  "ptb|7TH|Computer":           PTB_CLASS7_COMPUTER as BaseUnit[],
  "ptb|7TH|General Science":    PTB_CLASS7_GENERAL_SCIENCE as BaseUnit[],
  "ptb|7TH|Geography":          PTB_CLASS7_GEOGRAPHY as BaseUnit[],
  "ptb|7TH|History":            PTB_CLASS7_HISTORY as BaseUnit[],
  "ptb|7TH|Home Economics":     PTB_CLASS7_HOME_ECONOMICS as BaseUnit[],
  "ptb|7TH|ہوم اکنامکس":        PTB_CLASS7_HOME_ECONOMICS as BaseUnit[],
  "ptb|7TH|Punjabi":            PTB_CLASS7_PUNJABI as BaseUnit[],
  "ptb|7TH|پنجابی":             PTB_CLASS7_PUNJABI as BaseUnit[],
  "ptb|7TH|Agriculture":        PTB_CLASS7_AGRICULTURE as BaseUnit[],
  "ptb|7TH|Zri Taleem":         PTB_CLASS7_AGRICULTURE as BaseUnit[],
  "ptb|7TH|زرعی تعلیم":         PTB_CLASS7_AGRICULTURE as BaseUnit[],
  "ptb|7TH|Tarjuma Tul Quran":  PTB_CLASS7_TARJUMA_QURAN as BaseUnit[],
  "ptb|7TH|ترجمۃ القرآن":       PTB_CLASS7_TARJUMA_QURAN as BaseUnit[],
  "ptb|7TH|Islamiat Lazmi":     PTB_CLASS7_ISLAMIAT_LAZMI as BaseUnit[],
  "ptb|7TH|اسلامیات لازمی":     PTB_CLASS7_ISLAMIAT_LAZMI as BaseUnit[],
  "ptb|7TH|Urdu Lazmi":         PTB_CLASS7_URDU_LAZMI as BaseUnit[],
  "ptb|7TH|اُردو لازمی":        PTB_CLASS7_URDU_LAZMI as BaseUnit[],
  "ptb|7TH|Akhlaqiyat":         PTB_CLASS7_AKHLAQIYAT as BaseUnit[],
  "ptb|7TH|Akhlaqiat":          PTB_CLASS7_AKHLAQIYAT as BaseUnit[],
  "ptb|7TH|اخلاقیات":           PTB_CLASS7_AKHLAQIYAT as BaseUnit[],

  // Class 8TH
  "ptb|8TH|English":            PTB_CLASS8_ENGLISH as BaseUnit[],
  "ptb|8TH|Mathematics":        PTB_CLASS8_MATHEMATICS as BaseUnit[],
  "ptb|8TH|Computer":           PTB_CLASS8_COMPUTER as BaseUnit[],
  "ptb|8TH|General Science":    PTB_CLASS8_GENERAL_SCIENCE as BaseUnit[],
  "ptb|8TH|Geography":          PTB_CLASS8_GEOGRAPHY as BaseUnit[],
  "ptb|8TH|History":            PTB_CLASS8_HISTORY as BaseUnit[],
  "ptb|8TH|Home Economics":     PTB_CLASS8_HOME_ECONOMICS as BaseUnit[],
  "ptb|8TH|ہوم اکنامکس":        PTB_CLASS8_HOME_ECONOMICS as BaseUnit[],
  "ptb|8TH|Agriculture":        PTB_CLASS8_AGRICULTURE as BaseUnit[],
  "ptb|8TH|Zri Taleem":         PTB_CLASS8_AGRICULTURE as BaseUnit[],
  "ptb|8TH|زرعی تعلیم":         PTB_CLASS8_AGRICULTURE as BaseUnit[],
  "ptb|8TH|Tarjuma Tul Quran":  PTB_CLASS8_TARJUMA_QURAN as BaseUnit[],
  "ptb|8TH|ترجمۃ القرآن":       PTB_CLASS8_TARJUMA_QURAN as BaseUnit[],
  "ptb|8TH|Islamiat Lazmi":     PTB_CLASS8_ISLAMIAT_LAZMI as BaseUnit[],
  "ptb|8TH|اسلامیات لازمی":     PTB_CLASS8_ISLAMIAT_LAZMI as BaseUnit[],
  "ptb|8TH|Akhlaqiyat":         PTB_CLASS8_AKHLAQIYAT as BaseUnit[],
  "ptb|8TH|Akhlaqiat":          PTB_CLASS8_AKHLAQIYAT as BaseUnit[],
  "ptb|8TH|اخلاقیات":           PTB_CLASS8_AKHLAQIYAT as BaseUnit[],
  "ptb|8TH|Punjabi":            PTB_CLASS8_PUNJABI as BaseUnit[],
  "ptb|8TH|پنجابی":             PTB_CLASS8_PUNJABI as BaseUnit[],
  "ptb|8TH|Urdu Lazmi":         PTB_CLASS8_URDU_LAZMI as BaseUnit[],
  "ptb|8TH|اُردو لازمی":        PTB_CLASS8_URDU_LAZMI as BaseUnit[],

  // Class 9TH
  "ptb|9TH|English":            PTB_CLASS9_ENGLISH as BaseUnit[],
  "ptb|9TH|Mathematics":        PTB_CLASS9_MATHEMATICS as BaseUnit[],
  "ptb|9TH|Physics":            PTB_CLASS9_PHYSICS as BaseUnit[],
  "ptb|9TH|Chemistry":          PTB_CLASS9_CHEMISTRY as BaseUnit[],
  "ptb|9TH|Biology":            PTB_CLASS9_BIOLOGY as BaseUnit[],
  "ptb|9TH|Computer":           PTB_CLASS9_COMPUTER as BaseUnit[],
  "ptb|9TH|Islamiat Lazmi":     PTB_CLASS9_ISLAMIAT_LAZMI as BaseUnit[],
  "ptb|9TH|اسلامیات لازمی":     PTB_CLASS9_ISLAMIAT_LAZMI as BaseUnit[],
  "ptb|9TH|Urdu Lazmi":         PTB_CLASS9_URDU_LAZMI as BaseUnit[],
  "ptb|9TH|اُردو لازمی":        PTB_CLASS9_URDU_LAZMI as BaseUnit[],
  "ptb|9TH|General Science":    PTB_CLASS9_GENERAL_SCIENCE as BaseUnit[],
  "ptb|9TH|Education":          PTB_CLASS9_EDUCATION_URDU as BaseUnit[],
  "ptb|9TH|ایجوکیشن":           PTB_CLASS9_EDUCATION_URDU as BaseUnit[],
  "ptb|9TH|Punjabi":            PTB_CLASS9_PUNJABI as BaseUnit[],
  "ptb|9TH|پنجابی":             PTB_CLASS9_PUNJABI as BaseUnit[],
  "ptb|9TH|Islamiat Ikhtyari":  PTB_CLASS9_ISLAMIYAT_ELECTIVE as BaseUnit[],
  "ptb|9TH|اسلامیات اختیاری":   PTB_CLASS9_ISLAMIYAT_ELECTIVE as BaseUnit[],
  "ptb|9TH|Home Economics":     PTB_CLASS9_HOME_ECONOMICS as BaseUnit[],
  "ptb|9TH|ہوم اکنامکس":        PTB_CLASS9_HOME_ECONOMICS as BaseUnit[],
  "ptb|9TH|Civics":             PTB_CLASS9_CIVICS as BaseUnit[],
  "ptb|9TH|Sawks":              PTB_CLASS9_CIVICS as BaseUnit[],
  "ptb|9TH|سوکس":               PTB_CLASS9_CIVICS as BaseUnit[],
  "ptb|9TH|Economics":          PTB_CLASS9_ECONOMICS as BaseUnit[],
  "ptb|9TH|معاشیات":            PTB_CLASS9_ECONOMICS as BaseUnit[],
  "ptb|9TH|Tarjuma Tul Quran":  PTB_CLASS9_TARJUMA_QURAN as BaseUnit[],
  "ptb|9TH|ترجمۃ القرآن":       PTB_CLASS9_TARJUMA_QURAN as BaseUnit[],
  "ptb|9TH|ترجمۃ القرآن المجید": PTB_CLASS9_TARJUMA_QURAN as BaseUnit[],
  "ptb|9TH|Akhlaqiyat":         PTB_CLASS9_AKHLAQIYAT as BaseUnit[],
  "ptb|9TH|Akhlaqiat":          PTB_CLASS9_AKHLAQIYAT as BaseUnit[],
  "ptb|9TH|اخلاقیات":           PTB_CLASS9_AKHLAQIYAT as BaseUnit[],
  "ptb|9TH|Physical Education": PTB_CLASS9_PHYSICAL_EDUCATION as BaseUnit[],
  "ptb|9TH|فزیکل ایجوکیشن":     PTB_CLASS9_PHYSICAL_EDUCATION as BaseUnit[],
  "ptb|9TH|Murghbani":          PTB_CLASS9_MURGHBANI as BaseUnit[],
  "ptb|9TH|مرغبانی":            PTB_CLASS9_MURGHBANI as BaseUnit[],
  "ptb|9TH|Food & Nutrition":   PTB_CLASS9_FOOD_NUTRITION as BaseUnit[],
  "ptb|9TH|غذا اور غذائیت":      PTB_CLASS9_FOOD_NUTRITION as BaseUnit[],

  // Class 10TH
  "ptb|10TH|Biology":           PTB_CLASS10_BIOLOGY as BaseUnit[],
  "ptb|10TH|English":           PTB_CLASS10_ENGLISH as BaseUnit[],
  "ptb|10TH|Mathematics":       PTB_CLASS10_MATHEMATICS as BaseUnit[],
  "ptb|10TH|Physics":           PTB_CLASS10_PHYSICS as BaseUnit[],
  "ptb|10TH|Chemistry":         PTB_CLASS10_CHEMISTRY as BaseUnit[],
  "ptb|10TH|Computer":          PTB_CLASS10_COMPUTER as BaseUnit[],
  "ptb|10TH|Pakistan Studies":  PTB_CLASS10_PAKISTAN_STUDIES as BaseUnit[],
  "ptb|10TH|Urdu Lazmi":        PTB_CLASS10_URDU_LAZMI as BaseUnit[],
  "ptb|10TH|اُردو لازمی":       PTB_CLASS10_URDU_LAZMI as BaseUnit[],
  "ptb|10TH|Islamiat Lazmi":    PTB_CLASS10_ISLAMIAT_LAZMI as BaseUnit[],
  "ptb|10TH|اسلامیات لازمی":    PTB_CLASS10_ISLAMIAT_LAZMI as BaseUnit[],
  "ptb|10TH|General Science":   PTB_CLASS10_GENERAL_SCIENCE as BaseUnit[],
  "ptb|10TH|Education":         PTB_CLASS10_EDUCATION as BaseUnit[],
  "ptb|10TH|ایجوکیشن":          PTB_CLASS10_EDUCATION as BaseUnit[],
  "ptb|10TH|Islamiat Ikhtyari": PTB_CLASS10_ISLAMIAT_IKHTYARI as BaseUnit[],
  "ptb|10TH|اسلامیات اختیاری":  PTB_CLASS10_ISLAMIAT_IKHTYARI as BaseUnit[],
  "ptb|10TH|Punjabi":           PTB_CLASS10_PUNJABI as BaseUnit[],
  "ptb|10TH|پنجابی":            PTB_CLASS10_PUNJABI as BaseUnit[],
  "ptb|10TH|General Math":      PTB_CLASS10_GENERAL_MATH as BaseUnit[],
  "ptb|10TH|Tarjuma Tul Quran": PTB_CLASS10_TARJUMA_QURAN as BaseUnit[],
  "ptb|10TH|ترجمۃ القرآن":      PTB_CLASS10_TARJUMA_QURAN as BaseUnit[],
  "ptb|10TH|Civics":            PTB_CLASS10_SAWKS as BaseUnit[],
  "ptb|10TH|سوکس":              PTB_CLASS10_SAWKS as BaseUnit[],
  "ptb|10TH|Sawks":             PTB_CLASS10_SAWKS as BaseUnit[],
  "ptb|10TH|Home Economics":    PTB_CLASS10_HOME_ECONOMICS as BaseUnit[],
  "ptb|10TH|ہوم اکنامکس":       PTB_CLASS10_HOME_ECONOMICS as BaseUnit[],
  "ptb|10TH|Economics":         PTB_CLASS10_ECONOMICS as BaseUnit[],
  "ptb|10TH|معاشیات":           PTB_CLASS10_ECONOMICS as BaseUnit[],
  "ptb|10TH|Food & Nutrition":  PTB_CLASS10_FOOD_NUTRITION as BaseUnit[],
  "ptb|10TH|غذا اور غذائیت":     PTB_CLASS10_FOOD_NUTRITION as BaseUnit[],
  "ptb|10TH|Murghbani":         PTB_CLASS10_MURGHBANI as BaseUnit[],
  "ptb|10TH|مرغبانی":           PTB_CLASS10_MURGHBANI as BaseUnit[],
  "ptb|10TH|Akhlaqiyat":        PTB_CLASS10_AKHLAQIYAT as BaseUnit[],
  "ptb|10TH|Akhlaqiat":         PTB_CLASS10_AKHLAQIYAT as BaseUnit[],
  "ptb|10TH|اخلاقیات":          PTB_CLASS10_AKHLAQIYAT as BaseUnit[],
  "ptb|10TH|Physical Education": PTB_CLASS10_PHYSICAL_EDUCATION as BaseUnit[],
  "ptb|10TH|فزیکل ایجوکیشن":    PTB_CLASS10_PHYSICAL_EDUCATION as BaseUnit[],

  // Inter Part-I
  "ptb|INTER-I|Biology":                    PTB_INTER1_BIOLOGY as BaseUnit[],
  "ptb|INTER-I|Chemistry":                  PTB_INTER1_CHEMISTRY as BaseUnit[],
  "ptb|INTER-I|Physics":                    PTB_INTER1_PHYSICS as BaseUnit[],
  "ptb|INTER-I|Mathematics":                PTB_INTER1_MATHEMATICS as BaseUnit[],
  "ptb|INTER-I|Computer":                   PTB_INTER1_COMPUTER as BaseUnit[],
  "ptb|INTER-I|Statistics":                 PTB_INTER1_STATISTICS as BaseUnit[],
  "ptb|INTER-I|English":                    PTB_INTER1_ENGLISH as BaseUnit[],
  "ptb|INTER-I|Principles of Accounting":   PTB_INTER1_PRINCIPLES_OF_ACCOUNTING as BaseUnit[],
  "ptb|INTER-I|Principles of Economics":    PTB_INTER1_PRINCIPLES_OF_ECONOMICS as BaseUnit[],
  "ptb|INTER-I|Principles of Commerce":     PTB_INTER1_PRINCIPLES_OF_COMMERCE as BaseUnit[],
  "ptb|INTER-I|Business Maths":             PTB_INTER1_BUSINESS_MATHS as BaseUnit[],
  "ptb|INTER-I|Islamiat Lazmi":             PTB_INTER1_ISLAMIAT_LAZMI as BaseUnit[],
  "ptb|INTER-I|اسلامیات لازمی":             PTB_INTER1_ISLAMIAT_LAZMI as BaseUnit[],
  "ptb|INTER-I|Urdu Lazmi":                 PTB_INTER1_URDU_LAZMI as BaseUnit[],
  "ptb|INTER-I|اُردو لازمی":                PTB_INTER1_URDU_LAZMI as BaseUnit[],
  "ptb|INTER-I|Education":                  PTB_INTER1_EDUCATION as BaseUnit[],
  "ptb|INTER-I|ایجوکیشن":                   PTB_INTER1_EDUCATION as BaseUnit[],
  "ptb|INTER-I|Sawks":                      PTB_INTER1_SAWKS as BaseUnit[],
  "ptb|INTER-I|سوکس":                       PTB_INTER1_SAWKS as BaseUnit[],
  "ptb|INTER-I|Punjabi":                    PTB_INTER1_PUNJABI as BaseUnit[],
  "ptb|INTER-I|پنجابی":                     PTB_INTER1_PUNJABI as BaseUnit[],
  "ptb|INTER-I|Islamiat Ikhtyari":          PTB_INTER1_ISLAMIAT_IKHTYARI as BaseUnit[],
  "ptb|INTER-I|اسلامیات اختیاری":           PTB_INTER1_ISLAMIAT_IKHTYARI as BaseUnit[],
  "ptb|INTER-I|Physical Education":         PTB_INTER1_PHYSICAL_EDUCATION as BaseUnit[],
  "ptb|INTER-I|فزیکل ایجوکیشن":             PTB_INTER1_PHYSICAL_EDUCATION as BaseUnit[],
  "ptb|INTER-I|Sociology":                  PTB_INTER1_SOCIOLOGY as BaseUnit[],
  "ptb|INTER-I|سوشیالوجی":                  PTB_INTER1_SOCIOLOGY as BaseUnit[],
  "ptb|INTER-I|Akhlaqiyat":                 PTB_INTER1_AKHLAQIYAT as BaseUnit[],
  "ptb|INTER-I|اخلاقیات":                   PTB_INTER1_AKHLAQIYAT as BaseUnit[],
  "ptb|INTER-I|Tarjuma-ul-Quran":           PTB_INTER1_TARJUMA_QURAN as BaseUnit[],
  "ptb|INTER-I|ترجمۃ القرآن مجید":          PTB_INTER1_TARJUMA_QURAN as BaseUnit[],
  "ptb|INTER-I|Psychology":                 PTB_INTER1_PSYCHOLOGY as BaseUnit[],
  "ptb|INTER-I|نفسیات":                     PTB_INTER1_PSYCHOLOGY as BaseUnit[],
  "ptb|INTER-I|Farsi":                      PTB_INTER1_FARSI as BaseUnit[],
  "ptb|INTER-I|فارسی":                      PTB_INTER1_FARSI as BaseUnit[],
  "ptb|INTER-I|Tareekh-e-Islam":            PTB_INTER1_TAREEKH_E_ISLAM as BaseUnit[],
  "ptb|INTER-I|تاریخِ اسلام":               PTB_INTER1_TAREEKH_E_ISLAM as BaseUnit[],
  "ptb|INTER-I|Hadiqatul Adab":             PTB_INTER1_HADIQATUL_ADAB as BaseUnit[],
  "ptb|INTER-I|حَدِیقَۃُ الاَدَبِ":         PTB_INTER1_HADIQATUL_ADAB as BaseUnit[],
  "ptb|INTER-I|Tabii Geography":            PTB_INTER1_TABII_GEOGRAPHY as BaseUnit[],
  "ptb|INTER-I|طبعی جغرافیہ":               PTB_INTER1_TABII_GEOGRAPHY as BaseUnit[],
  "ptb|INTER-I|Home Economics":             PTB_INTER1_HOME_ECONOMICS as BaseUnit[],
  "ptb|INTER-I|ہوم اکنامکس":                PTB_INTER1_HOME_ECONOMICS as BaseUnit[],
  "ptb|INTER-I|Library Science":            PTB_INTER1_LIBRARY_SCIENCE as BaseUnit[],
  "ptb|INTER-I|لائبریری سائنس":             PTB_INTER1_LIBRARY_SCIENCE as BaseUnit[],
  "ptb|INTER-I|Tareekh-e-Pakistan":         PTB_INTER1_TAREEKH_E_PAKISTAN as BaseUnit[],
  "ptb|INTER-I|تاریخ پاکستان":              PTB_INTER1_TAREEKH_E_PAKISTAN as BaseUnit[],

  // Inter Part-I — aliases matching subjects.tsx display names
  "ptb|INTER-I|Tarjuma Tul Quran":       PTB_INTER1_TARJUMA_QURAN as BaseUnit[],
  "ptb|INTER-I|ترجمۃ القرآن":            PTB_INTER1_TARJUMA_QURAN as BaseUnit[],
  "ptb|INTER-I|Persian":                 PTB_INTER1_FARSI as BaseUnit[],
  "ptb|INTER-I|History of Islam":        PTB_INTER1_TAREEKH_E_ISLAM as BaseUnit[],
  "ptb|INTER-I|Geography":               PTB_INTER1_TABII_GEOGRAPHY as BaseUnit[],
  "ptb|INTER-I|Pakistan Studies":        PTB_INTER1_TAREEKH_E_PAKISTAN as BaseUnit[],
  "ptb|INTER-I|Civics":                  PTB_INTER1_SAWKS as BaseUnit[],
  "ptb|INTER-I|Economics":               PTB_INTER1_ECONOMICS as BaseUnit[],
  "ptb|INTER-I|معاشیات":                 PTB_INTER1_ECONOMICS as BaseUnit[],

  // Inter Part-II
  "ptb|INTER-II|Biology":                   PTB_INTER2_BIOLOGY as BaseUnit[],
  "ptb|INTER-II|Chemistry":                 PTB_INTER2_CHEMISTRY as BaseUnit[],
  "ptb|INTER-II|Mathematics":               PTB_INTER2_MATHEMATICS as BaseUnit[],
  "ptb|INTER-II|Statistics":                PTB_INTER2_STATISTICS as BaseUnit[],
  "ptb|INTER-II|English":                   PTB_INTER2_ENGLISH as BaseUnit[],
  "ptb|INTER-II|Principles of Accounting":  PTB_INTER2_PRINCIPLES_OF_ACCOUNTING as BaseUnit[],
  "ptb|INTER-II|Principles of Banking":     PTB_INTER2_PRINCIPLES_OF_BANKING as BaseUnit[],
  "ptb|INTER-II|Commercial Geography":      PTB_INTER2_COMMERCIAL_GEOGRAPHY as BaseUnit[],
  "ptb|INTER-II|Business Statistics":       PTB_INTER2_BUSINESS_STATISTICS as BaseUnit[],
  "ptb|INTER-II|Pakistan Studies":          PTB_INTER2_PAKISTAN_STUDIES as BaseUnit[],
  "ptb|INTER-II|Home Economics":            PTB_INTER2_HOME_ECONOMICS as BaseUnit[],
  "ptb|INTER-II|ہوم اکنامکس":               PTB_INTER2_HOME_ECONOMICS as BaseUnit[],
  "ptb|INTER-II|Tareekh-e-Pakistan":        PTB_INTER2_TAREEKH_E_PAKISTAN as BaseUnit[],
  "ptb|INTER-II|تاریخِ پاکستان":            PTB_INTER2_TAREEKH_E_PAKISTAN as BaseUnit[],
  "ptb|INTER-II|Library Science":           PTB_INTER2_LIBRARY_SCIENCE as BaseUnit[],
  "ptb|INTER-II|لائبریری سائنس":            PTB_INTER2_LIBRARY_SCIENCE as BaseUnit[],
  "ptb|INTER-II|Insani Geography":          PTB_INTER2_INSANI_GEOGRAPHY as BaseUnit[],
  "ptb|INTER-II|اِنسانی جغرافیہ":           PTB_INTER2_INSANI_GEOGRAPHY as BaseUnit[],
  "ptb|INTER-II|Hadiqatul Adab":            PTB_INTER2_HADIQATUL_ADAB as BaseUnit[],
  "ptb|INTER-II|حَدِیقَۃُ الاَدَبِ":        PTB_INTER2_HADIQATUL_ADAB as BaseUnit[],
  "ptb|INTER-II|Farsi":                     PTB_INTER2_FARSI as BaseUnit[],
  "ptb|INTER-II|فارسی":                     PTB_INTER2_FARSI as BaseUnit[],
  "ptb|INTER-II|Psychology":                PTB_INTER2_PSYCHOLOGY as BaseUnit[],
  "ptb|INTER-II|نفسیات":                    PTB_INTER2_PSYCHOLOGY as BaseUnit[],
  "ptb|INTER-II|Tareekh-e-Islam":           PTB_INTER2_TAREEKH_E_ISLAM as BaseUnit[],
  "ptb|INTER-II|تاریخِ اسلام":              PTB_INTER2_TAREEKH_E_ISLAM as BaseUnit[],
  "ptb|INTER-II|Sociology":                 PTB_INTER2_SOCIOLOGY as BaseUnit[],
  "ptb|INTER-II|سوشیالوجی":                 PTB_INTER2_SOCIOLOGY as BaseUnit[],
  "ptb|INTER-II|Akhlaqiyat":                PTB_INTER2_AKHLAQIYAT as BaseUnit[],
  "ptb|INTER-II|اخلاقیات":                  PTB_INTER2_AKHLAQIYAT as BaseUnit[],
  "ptb|INTER-II|Tarjuma-ul-Quran":          PTB_INTER2_TARJUMA_QURAN as BaseUnit[],
  "ptb|INTER-II|ترجمۃ القرآن مجید":         PTB_INTER2_TARJUMA_QURAN as BaseUnit[],
  "ptb|INTER-II|Physical Education":        PTB_INTER2_PHYSICAL_EDUCATION as BaseUnit[],
  "ptb|INTER-II|فزیکل ایجوکیشن":            PTB_INTER2_PHYSICAL_EDUCATION as BaseUnit[],
  "ptb|INTER-II|Islamiat Ikhtyari":         PTB_INTER2_ISLAMIAT_IKHTYARI as BaseUnit[],
  "ptb|INTER-II|اسلامیات اختیاری":          PTB_INTER2_ISLAMIAT_IKHTYARI as BaseUnit[],
  "ptb|INTER-II|Punjabi":                   PTB_INTER2_PUNJABI as BaseUnit[],
  "ptb|INTER-II|پنجابی":                    PTB_INTER2_PUNJABI as BaseUnit[],
  "ptb|INTER-II|Education":                 PTB_INTER2_EDUCATION as BaseUnit[],
  "ptb|INTER-II|ایجوکیشن":                  PTB_INTER2_EDUCATION as BaseUnit[],
  "ptb|INTER-II|Sawks":                     PTB_INTER2_SAWKS as BaseUnit[],
  "ptb|INTER-II|سوکس":                      PTB_INTER2_SAWKS as BaseUnit[],
  "ptb|INTER-II|Urdu Lazmi":                PTB_INTER2_URDU_LAZMI as BaseUnit[],
  "ptb|INTER-II|اُردو لازمی":               PTB_INTER2_URDU_LAZMI as BaseUnit[],

  // Inter Part-II — aliases matching subjects.tsx display names
  "ptb|INTER-II|Tarjuma Tul Quran":      PTB_INTER2_TARJUMA_QURAN as BaseUnit[],
  "ptb|INTER-II|ترجمۃ القرآن":           PTB_INTER2_TARJUMA_QURAN as BaseUnit[],
  "ptb|INTER-II|Persian":                PTB_INTER2_FARSI as BaseUnit[],
  "ptb|INTER-II|Geography":              PTB_INTER2_INSANI_GEOGRAPHY as BaseUnit[],
  "ptb|INTER-II|Civics":                 PTB_INTER2_SAWKS as BaseUnit[],
  "ptb|INTER-II|Economics":              PTB_INTER2_ECONOMICS as BaseUnit[],
  "ptb|INTER-II|معاشیات":                PTB_INTER2_ECONOMICS as BaseUnit[],
};

/**
 * Look up syllabus data by syllabus board, class name, and subject name.
 * Returns null if no data is available yet (shows Coming Soon in UI).
 */
export function getSyllabusData(
  syllabus: string,
  className: string,
  subject: string
): BaseUnit[] | null {
  const key = `${syllabus.toLowerCase()}|${className}|${subject}`;
  return REGISTRY[key] ?? null;
}

/** Returns true if syllabus data exists for the given combination */
export function hasSyllabusData(
  syllabus: string,
  className: string,
  subject: string
): boolean {
  return getSyllabusData(syllabus, className, subject) !== null;
}
