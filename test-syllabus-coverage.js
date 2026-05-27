/**
 * Test Script: Check which subjects have syllabus data
 * Tests all 163 subjects across PTB classes ONE to INTER-II
 */

// All subjects by class (from subjects.tsx)
const subjectsByClass = {
  "ONE": ["English", "General Knowledge", "Mathematics", "اسلامیات", "اُردو"],
  "TWO": ["English", "General Knowledge", "Mathematics", "اسلامیات", "اُردو"],
  "THREE": ["English", "General Knowledge", "Mathematics", "اسلامیات", "اُردو"],
  "FOUR": ["English", "General Science", "Social Studies", "Mathematics", "اسلامیات", "اُردو"],
  "5TH": ["English", "General Science", "Social Studies", "Mathematics", "اسلامیات", "اُردو"],
  "6TH": ["ہوم اکنامکس", "پنجابی", "زرعی تعلیم", "ترجمۃ القرآن", "اسلامیات لازمی", "English", "Computer", "General Science", "Geography", "History", "Mathematics", "اُردو لازمی", "اخلاقیات"],
  "7TH": ["ہوم اکنامکس", "پنجابی", "زرعی تعلیم", "ترجمۃ القرآن", "اسلامیات لازمی", "English", "Computer", "General Science", "Geography", "History", "Mathematics", "اُردو لازمی", "اخلاقیات"],
  "8TH": ["ہوم اکنامکس", "پنجابی", "زرعی تعلیم", "ترجمۃ القرآن", "اسلامیات لازمی", "English", "Computer", "General Science", "Geography", "History", "Mathematics", "اُردو لازمی", "اخلاقیات"],
  "9TH": ["Biology", "Computer", "Chemistry", "Physics", "Mathematics", "English", "اُردو لازمی", "اسلامیات لازمی", "General Science", "ایجوکیشن", "پنجابی", "اسلامیات اختیاری", "ہوم اکنامکس", "سوکس", "معاشیات", "ترجمۃ القرآن المجید", "اخلاقیات", "فزیکل ایجوکیشن", "مرغبانی", "غذا اور غذائیت"],
  "10TH": ["Biology", "Computer", "Chemistry", "Physics", "Mathematics", "English", "اُردو لازمی", "اسلامیات لازمی", "General Science", "ایجوکیشن", "پنجابی", "اسلامیات اختیاری", "ہوم اکنامکس", "سوکس", "معاشیات", "ترجمۃ القرآن", "اخلاقیات", "فزیکل ایجوکیشن", "مرغبانی", "غذا اور غذائیت"],
  "INTER-I": ["Biology", "Chemistry", "Physics", "Mathematics", "Computer", "Statistics", "Economics", "English", "Principles of Accounting", "Principles of Economics", "Principles of Commerce", "Business Maths", "اسلامیات لازمی", "اُردو لازمی", "ایجوکیشن", "سوکس", "پنجابی", "اسلامیات اختیاری", "فزیکل ایجوکیشن", "سوشیالوجی", "اخلاقیات", "ترجمۃ القرآن مجید", "نفسیات", "فارسی", "تاریخِ اسلام", "حَدِیقَۃُ الاَدَبِ", "طبعی جغرافیہ", "لائبریری سائنس", "ہوم اکنامکس", "تاریخ پاکستان"],
  "INTER-II": ["Biology", "Chemistry", "Physics", "Mathematics", "Computer", "Statistics", "Economics", "English", "Principles of Accounting", "Principles of Banking", "Commercial Geography", "Business Statistics", "Pakistan Studies", "اُردو لازمی", "ایجوکیشن", "سوکس", "پنجابی", "اسلامیات اختیاری", "فزیکل ایجوکیشن", "سوشیالوجی", "اخلاقیات", "ترجمۃ القرآن مجید", "نفسیات", "فارسی", "تاریخِ اسلام", "حَدِیقَۃُ الاَدَبِ", "اِنسانی جغرافیہ", "لائبریری سائنس", "تاریخِ پاکستان", "ہوم اکنامکس"],
};

// Registry keys from registry.ts (known mappings)
const knownRegistryKeys = [
  // Class ONE
  "ptb|ONE|English",
  "ptb|ONE|General Knowledge",
  "ptb|ONE|Mathematics",
  "ptb|ONE|Islamiat",
  "ptb|ONE|اسلامیات",
  "ptb|ONE|Urdu",
  "ptb|ONE|اُردو",

  // Class TWO
  "ptb|TWO|English",
  "ptb|TWO|Mathematics",
  "ptb|TWO|General Knowledge",
  "ptb|TWO|Islamiat",
  "ptb|TWO|اسلامیات",
  "ptb|TWO|Urdu",
  "ptb|TWO|اُردو",

  // Class THREE
  "ptb|THREE|General Knowledge",
  "ptb|THREE|Islamiat",
  "ptb|THREE|اسلامیات",
  "ptb|THREE|Urdu",
  "ptb|THREE|اُردو",
  "ptb|THREE|English",
  "ptb|THREE|Mathematics",

  // Class FOUR
  "ptb|FOUR|English",
  "ptb|FOUR|Mathematics",
  "ptb|FOUR|General Science",
  "ptb|FOUR|Social Studies",
  "ptb|FOUR|Islamiat",
  "ptb|FOUR|اسلامیات",
  "ptb|FOUR|Urdu",
  "ptb|FOUR|اُردو",

  // Class 5TH
  "ptb|5TH|English",
  "ptb|5TH|Mathematics",
  "ptb|5TH|General Science",
  "ptb|5TH|Urdu",
  "ptb|5TH|اُردو",
  "ptb|5TH|Social Studies",
  "ptb|5TH|Islamiat",
  "ptb|5TH|اسلامیات",

  // Class 6TH
  "ptb|6TH|English",
  "ptb|6TH|Mathematics",
  "ptb|6TH|Computer",
  "ptb|6TH|Geography",
  "ptb|6TH|History",
  "ptb|6TH|Home Economics",
  "ptb|6TH|ہوم اکنامکس",
  "ptb|6TH|Punjabi",
  "ptb|6TH|پنجابی",
  "ptb|6TH|Agriculture",
  "ptb|6TH|Tarjuma Tul Quran",
  "ptb|6TH|ترجمۃ القرآن",
  "ptb|6TH|Islamiat Lazmi",
  "ptb|6TH|اسلامیات لازمی",
  "ptb|6TH|Urdu Lazmi",
  "ptb|6TH|اُردو لازمی",
  "ptb|6TH|Akhlaqiyat",
  "ptb|6TH|اخلاقیات",
  "ptb|6TH|General Science",
  "ptb|6TH|زرعی تعلیم",

  // Class 7TH
  "ptb|7TH|English",
  "ptb|7TH|Mathematics",
  "ptb|7TH|Computer",
  "ptb|7TH|General Science",
  "ptb|7TH|Geography",
  "ptb|7TH|History",
  "ptb|7TH|Home Economics",
  "ptb|7TH|ہوم اکنامکس",
  "ptb|7TH|Punjabi",
  "ptb|7TH|پنجابی",
  "ptb|7TH|Agriculture",
  "ptb|7TH|زرعی تعلیم",
  "ptb|7TH|Tarjuma Tul Quran",
  "ptb|7TH|ترجمۃ القرآن",
  "ptb|7TH|Islamiat Lazmi",
  "ptb|7TH|اسلامیات لازمی",
  "ptb|7TH|Urdu Lazmi",
  "ptb|7TH|اُردو لازمی",
  "ptb|7TH|Akhlaqiyat",
  "ptb|7TH|اخلاقیات",

  // Class 8TH
  "ptb|8TH|English",
  "ptb|8TH|Mathematics",
  "ptb|8TH|Computer",
  "ptb|8TH|General Science",
  "ptb|8TH|Geography",
  "ptb|8TH|History",
  "ptb|8TH|Home Economics",
  "ptb|8TH|ہوم اکنامکس",
  "ptb|8TH|Agriculture",
  "ptb|8TH|زرعی تعلیم",
  "ptb|8TH|Tarjuma Tul Quran",
  "ptb|8TH|ترجمۃ القرآن",
  "ptb|8TH|Islamiat Lazmi",
  "ptb|8TH|اسلامیات لازمی",
  "ptb|8TH|Akhlaqiyat",
  "ptb|8TH|اخلاقیات",
  "ptb|8TH|Punjabi",
  "ptb|8TH|پنجابی",
  "ptb|8TH|Urdu Lazmi",
  "ptb|8TH|اُردو لازمی",

  // Class 9TH
  "ptb|9TH|English",
  "ptb|9TH|Mathematics",
  "ptb|9TH|Physics",
  "ptb|9TH|Chemistry",
  "ptb|9TH|Biology",
  "ptb|9TH|Computer",
  "ptb|9TH|Islamiat Lazmi",
  "ptb|9TH|اسلامیات لازمی",
  "ptb|9TH|Urdu Lazmi",
  "ptb|9TH|اُردو لازمی",
  "ptb|9TH|General Science",
  "ptb|9TH|Education",
  "ptb|9TH|ایجوکیشن",
  "ptb|9TH|Punjabi",
  "ptb|9TH|پنجابی",
  "ptb|9TH|Islamiat Ikhtyari",
  "ptb|9TH|اسلامیات اختیاری",
  "ptb|9TH|Home Economics",
  "ptb|9TH|ہوم اکنامکس",
  "ptb|9TH|Civics",
  "ptb|9TH|Sawks",
  "ptb|9TH|سوکس",
  "ptb|9TH|Economics",
  "ptb|9TH|معاشیات",
  "ptb|9TH|Tarjuma Tul Quran",
  "ptb|9TH|ترجمۃ القرآن",
  "ptb|9TH|ترجمۃ القرآن المجید",
  "ptb|9TH|Akhlaqiyat",
  "ptb|9TH|اخلاقیات",
  "ptb|9TH|Physical Education",
  "ptb|9TH|فزیکل ایجوکیشن",
  "ptb|9TH|Murghbani",
  "ptb|9TH|مرغبانی",
  "ptb|9TH|Food & Nutrition",
  "ptb|9TH|غذا اور غذائیت",

  // Class 10TH
  "ptb|10TH|English",
  "ptb|10TH|Mathematics",
  "ptb|10TH|Physics",
  "ptb|10TH|Chemistry",
  "ptb|10TH|Computer",
  "ptb|10TH|Pakistan Studies",
  "ptb|10TH|Urdu Lazmi",
  "ptb|10TH|اُردو لازمی",
  "ptb|10TH|Islamiat Lazmi",
  "ptb|10TH|اسلامیات لازمی",
  "ptb|10TH|General Science",
  "ptb|10TH|Education",
  "ptb|10TH|Islamiat Ikhtyari",
  "ptb|10TH|اسلامیات اختیاری",
  "ptb|10TH|Punjabi",
  "ptb|10TH|پنجابی",
  "ptb|10TH|General Math",
  "ptb|10TH|Tarjuma Tul Quran",
  "ptb|10TH|ترجمۃ القرآن",
  "ptb|10TH|Civics",
  "ptb|10TH|Sawks",
  "ptb|10TH|Home Economics",
  "ptb|10TH|ہوم اکنامکس",
  "ptb|10TH|Economics",
  "ptb|10TH|معاشیات",
  "ptb|10TH|Food & Nutrition",
  "ptb|10TH|غذا اور غذائیت",
  "ptb|10TH|Murghbani",
  "ptb|10TH|Akhlaqiyat",
  "ptb|10TH|اخلاقیات",

  // Inter Part-I
  "ptb|INTER-I|Biology",
  "ptb|INTER-I|Chemistry",
  "ptb|INTER-I|Physics",
  "ptb|INTER-I|Mathematics",
  "ptb|INTER-I|Computer",
  "ptb|INTER-I|Statistics",
  "ptb|INTER-I|English",
  "ptb|INTER-I|Principles of Accounting",
  "ptb|INTER-I|Principles of Economics",
  "ptb|INTER-I|Principles of Commerce",
  "ptb|INTER-I|Business Maths",
  "ptb|INTER-I|Islamiat Lazmi",
  "ptb|INTER-I|اسلامیات لازمی",
  "ptb|INTER-I|Urdu Lazmi",
  "ptb|INTER-I|اُردو لازمی",
  "ptb|INTER-I|Education",
  "ptb|INTER-I|Sawks",
  "ptb|INTER-I|Punjabi",
  "ptb|INTER-I|پنجابی",
  "ptb|INTER-I|Islamiat Ikhtyari",
  "ptb|INTER-I|اسلامیات اختیاری",
  "ptb|INTER-I|Physical Education",
  "ptb|INTER-I|Sociology",
  "ptb|INTER-I|Akhlaqiyat",
  "ptb|INTER-I|Tarjuma-ul-Quran",
  "ptb|INTER-I|Psychology",
  "ptb|INTER-I|Farsi",
  "ptb|INTER-I|Tareekh-e-Islam",
  "ptb|INTER-I|Hadiqatul Adab",
  "ptb|INTER-I|Tabii Geography",
  "ptb|INTER-I|Home Economics",
  "ptb|INTER-I|ہوم اکنامکس",
  "ptb|INTER-I|Library Science",
  "ptb|INTER-I|Tareekh-e-Pakistan",

  // Inter Part-II
  "ptb|INTER-II|Biology",
  "ptb|INTER-II|Chemistry",
  "ptb|INTER-II|Mathematics",
  "ptb|INTER-II|Statistics",
  "ptb|INTER-II|English",
  "ptb|INTER-II|Principles of Accounting",
  "ptb|INTER-II|Principles of Banking",
  "ptb|INTER-II|Commercial Geography",
  "ptb|INTER-II|Business Statistics",
  "ptb|INTER-II|Pakistan Studies",
  "ptb|INTER-II|Home Economics",
  "ptb|INTER-II|ہوم اکنامکس",
  "ptb|INTER-II|Tareekh-e-Pakistan",
  "ptb|INTER-II|Library Science",
  "ptb|INTER-II|Insani Geography",
  "ptb|INTER-II|Hadiqatul Adab",
  "ptb|INTER-II|Farsi",
  "ptb|INTER-II|Psychology",
  "ptb|INTER-II|Tareekh-e-Islam",
  "ptb|INTER-II|Sociology",
  "ptb|INTER-II|Akhlaqiyat",
  "ptb|INTER-II|Tarjuma-ul-Quran",
  "ptb|INTER-II|Physical Education",
  "ptb|INTER-II|Islamiat Ikhtyari",
  "ptb|INTER-II|اسلامیات اختیاری",
  "ptb|INTER-II|Punjabi",
  "ptb|INTER-II|پنجابی",
  "ptb|INTER-II|Education",
  "ptb|INTER-II|Sawks",
  "ptb|INTER-II|Urdu Lazmi",
  "ptb|INTER-II|اُردو لازمی",
];

// Create a Set for faster lookup
const registrySet = new Set(knownRegistryKeys);

// Function to check if subject has data
function hasChapterData(className, subject) {
  const key = `ptb|${className}|${subject}`;
  return registrySet.has(key);
}

// Test all subjects
console.log("=".repeat(80));
console.log("PTB SYLLABUS COVERAGE REPORT");
console.log("Testing all 163 subjects from ONE to INTER-II");
console.log("=".repeat(80));
console.log("");

let totalSubjects = 0;
let withData = 0;
let withoutData = 0;

const missingByClass = {};

for (const [className, subjects] of Object.entries(subjectsByClass)) {
  console.log(`\n${"─".repeat(80)}`);
  console.log(`PTB > ${className} (${subjects.length} subjects)`);
  console.log("─".repeat(80));
  
  const missing = [];
  const available = [];
  
  subjects.forEach(subject => {
    totalSubjects++;
    if (hasChapterData(className, subject)) {
      withData++;
      available.push(subject);
      console.log(`  ✅ ${subject}`);
    } else {
      withoutData++;
      missing.push(subject);
      console.log(`  ❌ ${subject} - NO CHAPTER DATA`);
    }
  });
  
  if (missing.length > 0) {
    missingByClass[className] = missing;
  }
  
  console.log(`\nSummary: ${available.length} available, ${missing.length} missing`);
}

// Final Summary
console.log("\n" + "=".repeat(80));
console.log("FINAL SUMMARY");
console.log("=".repeat(80));
console.log(`Total Subjects: ${totalSubjects}`);
console.log(`With Chapter Data: ${withData} (${((withData/totalSubjects)*100).toFixed(1)}%)`);
console.log(`Without Chapter Data: ${withoutData} (${((withoutData/totalSubjects)*100).toFixed(1)}%)`);

console.log("\n" + "─".repeat(80));
console.log("MISSING SUBJECTS BY CLASS");
console.log("─".repeat(80));

for (const [className, subjects] of Object.entries(missingByClass)) {
  console.log(`\n${className} (${subjects.length} missing):`);
  subjects.forEach(subject => {
    console.log(`  - ${subject}`);
  });
}

console.log("\n" + "=".repeat(80));
console.log("END OF REPORT");
console.log("=".repeat(80));
