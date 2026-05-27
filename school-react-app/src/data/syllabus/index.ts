/**
 * Syllabus Data Index
 * 
 * Central export point for all syllabus data files
 */

// Note: We don't use export * to avoid naming conflicts
// Import specific syllabi directly from their files when needed

/**
 * Available Syllabi Registry
 * 
 * Use this to dynamically load syllabi based on class and subject
 */
export const AVAILABLE_SYLLABI = {
  'class-1': {
    'english': () => import('./ptb-class1-english')
  },
  'class-8': {
    'home-economics': () => import('./ptb-class8-home-economics'),
    'agriculture': () => import('./ptb-class8-agriculture'),
    'tarjuma-quran': () => import('./ptb-class8-tarjuma-quran'),
    'islamiat-lazmi': () => import('./ptb-class8-islamiat-lazmi'),
    'akhlaqiyat': () => import('./ptb-class8-akhlaqiyat')
  },
  'class-9': {
    'education-urdu': () => import('./ptb-class9-education-urdu'),
    'punjabi': () => import('./ptb-class9-punjabi'),
    'islamiyat-elective': () => import('./ptb-class9-islamiyat-elective'),
    'home-economics': () => import('./ptb-class9-home-economics'),
    'civics': () => import('./ptb-class9-civics'),
    'economics': () => import('./ptb-class9-economics'),
    'tarjuma-quran': () => import('./ptb-class9-tarjuma-quran'),
    'akhlaqiyat': () => import('./ptb-class9-akhlaqiyat'),
    'physical-education': () => import('./ptb-class9-physical-education'),
    'murghbani': () => import('./ptb-class9-murghbani'),
    'food-nutrition': () => import('./ptb-class9-food-nutrition')
  }
} as const;

/**
 * Syllabus metadata for all available syllabi
 */
export const SYLLABUS_CATALOG = [
  {
    id: 'ptb-class1-english',
    class: '1',
    subject: 'English',
    board: 'PTB',
    language: 'English',
    displayName: 'PTB Class 1 - English'
  },
  // Class 8
  {
    id: 'ptb-class8-home-economics',
    class: '8',
    subject: 'Home Economics',
    board: 'PTB',
    language: 'Urdu',
    displayName: 'PTB Class 8 - ہوم اکنامکس (Home Economics)'
  },
  {
    id: 'ptb-class8-agriculture',
    class: '8',
    subject: 'Agriculture',
    board: 'PTB',
    language: 'Urdu',
    displayName: 'PTB Class 8 - زرعی تعلیم (Agriculture)'
  },
  {
    id: 'ptb-class8-tarjuma-quran',
    class: '8',
    subject: 'Tarjuma Quran',
    board: 'PTB',
    language: 'Arabic/Urdu',
    displayName: 'PTB Class 8 - ترجمۃ القرآن (Translation of Quran)'
  },
  {
    id: 'ptb-class8-islamiat-lazmi',
    class: '8',
    subject: 'Islamiat Lazmi',
    board: 'PTB',
    language: 'Urdu',
    displayName: 'PTB Class 8 - اسلامیات لازمی (Islamiyat Compulsory)'
  },
  {
    id: 'ptb-class8-akhlaqiyat',
    class: '8',
    subject: 'Akhlaqiyat',
    board: 'PTB',
    language: 'Urdu',
    displayName: 'PTB Class 8 - اخلاقیات (Ethics)'
  },
  // Class 9
  {
    id: 'ptb-class9-education-urdu',
    class: '9',
    subject: 'Education',
    board: 'PTB',
    language: 'Urdu',
    displayName: 'PTB Class 9 - ایجوکیشن (Education)'
  },
  {
    id: 'ptb-class9-punjabi',
    class: '9',
    subject: 'Punjabi',
    board: 'PTB',
    language: 'Punjabi/Urdu',
    displayName: 'PTB Class 9 - پنجابی (Punjabi)'
  },
  {
    id: 'ptb-class9-islamiyat-elective',
    class: '9',
    subject: 'Islamiyat Elective',
    board: 'PTB',
    language: 'Urdu/Arabic',
    displayName: 'PTB Class 9 - اسلامیات اختیاری (Islamiyat Elective)'
  },
  {
    id: 'ptb-class9-home-economics',
    class: '9',
    subject: 'Home Economics',
    board: 'PTB',
    language: 'Urdu',
    displayName: 'PTB Class 9 - ہوم اکنامکس (Home Economics)'
  },
  {
    id: 'ptb-class9-civics',
    class: '9',
    subject: 'Civics',
    board: 'PTB',
    language: 'Urdu',
    displayName: 'PTB Class 9 - سوکس (Civics)'
  },
  {
    id: 'ptb-class9-economics',
    class: '9',
    subject: 'Economics',
    board: 'PTB',
    language: 'Urdu',
    displayName: 'PTB Class 9 - معاشیات (Economics)'
  },
  {
    id: 'ptb-class9-tarjuma-quran',
    class: '9',
    subject: 'Tarjuma Quran',
    board: 'PTB',
    language: 'Arabic/Urdu',
    displayName: 'PTB Class 9 - ترجمۃ القرآن المجید (Translation of Quran)'
  },
  {
    id: 'ptb-class9-akhlaqiyat',
    class: '9',
    subject: 'Akhlaqiyat',
    board: 'PTB',
    language: 'Urdu',
    displayName: 'PTB Class 9 - اخلاقیات (Ethics)'
  },
  {
    id: 'ptb-class9-physical-education',
    class: '9',
    subject: 'Physical Education',
    board: 'PTB',
    language: 'Urdu',
    displayName: 'PTB Class 9 - فزیکل ایجوکیشن (Physical Education)'
  },
  {
    id: 'ptb-class9-murghbani',
    class: '9',
    subject: 'Murghbani',
    board: 'PTB',
    language: 'Urdu',
    displayName: 'PTB Class 9 - مرغبانی (Poultry Farming)'
  },
  {
    id: 'ptb-class9-food-nutrition',
    class: '9',
    subject: 'Food & Nutrition',
    board: 'PTB',
    language: 'Urdu',
    displayName: 'PTB Class 9 - غذا اور غذائیت (Food and Nutrition)'
  }
] as const;

/**
 * Get syllabus by ID
 */
export async function getSyllabusById(syllabusId: string): Promise<any> {
  const syllabus = SYLLABUS_CATALOG.find(s => s.id === syllabusId);
  if (!syllabus) {
    throw new Error(`Syllabus not found: ${syllabusId}`);
  }

  const [, classNum, ...subjectParts] = syllabusId.split('-');
  const subject = subjectParts.join('-');
  const classKey = `class-${classNum}`;
  
  // Dynamic module loading
  const availableSyllabi: any = AVAILABLE_SYLLABI;
  if (availableSyllabi[classKey] && availableSyllabi[classKey][subject]) {
    return await availableSyllabi[classKey][subject]();
  }

  throw new Error(`Syllabus module not found: ${syllabusId}`);
}

/**
 * Get syllabi by class
 */
export function getSyllabiByClass(classNum: string) {
  return SYLLABUS_CATALOG.filter(s => s.class === classNum);
}

/**
 * Get syllabi by board
 */
export function getSyllabiByBoard(board: string) {
  return SYLLABUS_CATALOG.filter(s => s.board === board);
}
