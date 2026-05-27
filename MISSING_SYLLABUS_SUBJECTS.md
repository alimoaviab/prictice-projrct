# Missing Syllabus Subjects - Complete List
## تمام missing subjects کی تفصیلی فہرست

**تاریخ:** 27 مئی 2026  
**کل Missing Subjects:** 35 out of 166 (21.1%)

---

## 📋 Class-wise Missing Subjects

### PTB > 10TH (5 Missing Subjects)

| # | Subject Name (English) | Subject Name (Urdu) | File Name to Create |
|---|------------------------|---------------------|---------------------|
| 1 | Biology | بائیولوجی | `ptb-class10-biology.ts` |
| 2 | Education | ایجوکیشن | Already exists as `ptb-class10-education.ts` ✅ |
| 3 | Civics | سوکس | Need to map to existing `ptb-class10-sawks.ts` |
| 4 | Physical Education | فزیکل ایجوکیشن | `ptb-class10-physical-education.ts` |
| 5 | Poultry Farming | مرغبانی | Already exists as `ptb-class10-murghbani.ts` ✅ |

**Note:** 2 files already exist, 1 needs mapping, 2 need to be created

---

### PTB > INTER-I (14 Missing Subjects)

| # | Subject Name (English) | Subject Name (Urdu) | File Name to Create |
|---|------------------------|---------------------|---------------------|
| 1 | Economics | معاشیات | `ptb-inter1-economics.ts` |
| 2 | Education | ایجوکیشن | Already exists as `ptb-inter1-education.ts` ✅ |
| 3 | Civics | سوکس | Already exists as `ptb-inter1-sawks.ts` ✅ |
| 4 | Physical Education | فزیکل ایجوکیشن | Already exists as `ptb-inter1-physical-education.ts` ✅ |
| 5 | Sociology | سوشیالوجی | Already exists as `ptb-inter1-sociology.ts` ✅ |
| 6 | Ethics | اخلاقیات | Already exists as `ptb-inter1-akhlaqiyat.ts` ✅ |
| 7 | Quran Translation | ترجمۃ القرآن مجید | Already exists as `ptb-inter1-tarjuma-quran.ts` ✅ |
| 8 | Psychology | نفسیات | Already exists as `ptb-inter1-psychology.ts` ✅ |
| 9 | Persian | فارسی | Already exists as `ptb-inter1-farsi.ts` ✅ |
| 10 | History of Islam | تاریخِ اسلام | Already exists as `ptb-inter1-tareekh-e-islam.ts` ✅ |
| 11 | Hadiqatul Adab | حَدِیقَۃُ الاَدَبِ | Already exists as `ptb-inter1-hadiqatul-adab.ts` ✅ |
| 12 | Physical Geography | طبعی جغرافیہ | Already exists as `ptb-inter1-tabii-geography.ts` ✅ |
| 13 | Library Science | لائبریری سائنس | Already exists as `ptb-inter1-library-science.ts` ✅ |
| 14 | History of Pakistan | تاریخ پاکستان | Already exists as `ptb-inter1-tareekh-e-pakistan.ts` ✅ |

**Note:** 13 files already exist! Only 1 needs to be created (Economics)

---

### PTB > INTER-II (16 Missing Subjects)

| # | Subject Name (English) | Subject Name (Urdu) | File Name to Create |
|---|------------------------|---------------------|---------------------|
| 1 | Physics | فزکس | Need to check - might exist |
| 2 | Computer | کمپیوٹر | Need to check - might exist |
| 3 | Economics | معاشیات | `ptb-inter2-economics.ts` |
| 4 | Education | ایجوکیشن | Already exists as `ptb-inter2-education.ts` ✅ |
| 5 | Civics | سوکس | Already exists as `ptb-inter2-sawks.ts` ✅ |
| 6 | Physical Education | فزیکل ایجوکیشن | Already exists as `ptb-inter2-physical-education.ts` ✅ |
| 7 | Sociology | سوشیالوجی | Already exists as `ptb-inter2-sociology.ts` ✅ |
| 8 | Ethics | اخلاقیات | Already exists as `ptb-inter2-akhlaqiyat.ts` ✅ |
| 9 | Quran Translation | ترجمۃ القرآن مجید | Already exists as `ptb-inter2-tarjuma-quran.ts` ✅ |
| 10 | Psychology | نفسیات | Already exists as `ptb-inter2-psychology.ts` ✅ |
| 11 | Persian | فارسی | Already exists as `ptb-inter2-farsi.ts` ✅ |
| 12 | History of Islam | تاریخِ اسلام | Already exists as `ptb-inter2-tareekh-e-islam.ts` ✅ |
| 13 | Hadiqatul Adab | حَدِیقَۃُ الاَدَبِ | Already exists as `ptb-inter2-hadiqatul-adab.ts` ✅ |
| 14 | Human Geography | اِنسانی جغرافیہ | Already exists as `ptb-inter2-insani-geography.ts` ✅ |
| 15 | Library Science | لائبریری سائنس | Already exists as `ptb-inter2-library-science.ts` ✅ |
| 16 | History of Pakistan | تاریخِ پاکستان | Already exists as `ptb-inter2-tareekh-e-pakistan.ts` ✅ |

**Note:** 14 files already exist! Only 3 need to be checked/created

---

## 🔍 Root Cause Analysis

### Issue: Registry Mapping Problem

زیادہ تر files **پہلے سے موجود ہیں** لیکن **registry.ts میں mapping نہیں ہے**!

### Example:
```typescript
// subjects.tsx میں نام:
"ایجوکیشن"

// Registry میں mapping:
"ptb|INTER-I|Education" ✅ (English name)
"ptb|INTER-I|ایجوکیشن" ❌ (Urdu name - MISSING!)
```

---

## ✅ Solution: Registry میں Urdu Aliases شامل کریں

### Class 10TH - Registry Additions Needed:

```typescript
// Add these to registry.ts
"ptb|10TH|Biology":           PTB_CLASS10_BIOLOGY as BaseUnit[],  // NEW FILE NEEDED
"ptb|10TH|ایجوکیشن":          PTB_CLASS10_EDUCATION as BaseUnit[],  // Already exists
"ptb|10TH|سوکس":              PTB_CLASS10_SAWKS as BaseUnit[],  // Already mapped as Sawks
"ptb|10TH|فزیکل ایجوکیشن":    PTB_CLASS10_PHYSICAL_EDUCATION as BaseUnit[],  // NEW FILE NEEDED
"ptb|10TH|مرغبانی":           PTB_CLASS10_MURGHBANI as BaseUnit[],  // Already exists
```

### INTER-I - Registry Additions Needed:

```typescript
// Add these to registry.ts
"ptb|INTER-I|Economics":      PTB_INTER1_ECONOMICS as BaseUnit[],  // NEW FILE NEEDED
"ptb|INTER-I|ایجوکیشن":       PTB_INTER1_EDUCATION as BaseUnit[],  // Already exists
"ptb|INTER-I|سوکس":           PTB_INTER1_SAWKS as BaseUnit[],  // Already exists
"ptb|INTER-I|فزیکل ایجوکیشن": PTB_INTER1_PHYSICAL_EDUCATION as BaseUnit[],  // Already exists
"ptb|INTER-I|سوشیالوجی":      PTB_INTER1_SOCIOLOGY as BaseUnit[],  // Already exists
"ptb|INTER-I|اخلاقیات":       PTB_INTER1_AKHLAQIYAT as BaseUnit[],  // Already exists
"ptb|INTER-I|ترجمۃ القرآن مجید": PTB_INTER1_TARJUMA_QURAN as BaseUnit[],  // Already exists
"ptb|INTER-I|نفسیات":         PTB_INTER1_PSYCHOLOGY as BaseUnit[],  // Already exists
"ptb|INTER-I|فارسی":          PTB_INTER1_FARSI as BaseUnit[],  // Already exists
"ptb|INTER-I|تاریخِ اسلام":   PTB_INTER1_TAREEKH_E_ISLAM as BaseUnit[],  // Already exists
"ptb|INTER-I|حَدِیقَۃُ الاَدَبِ": PTB_INTER1_HADIQATUL_ADAB as BaseUnit[],  // Already exists
"ptb|INTER-I|طبعی جغرافیہ":   PTB_INTER1_TABII_GEOGRAPHY as BaseUnit[],  // Already exists
"ptb|INTER-I|لائبریری سائنس": PTB_INTER1_LIBRARY_SCIENCE as BaseUnit[],  // Already exists
"ptb|INTER-I|تاریخ پاکستان": PTB_INTER1_TAREEKH_E_PAKISTAN as BaseUnit[],  // Already exists
```

### INTER-II - Registry Additions Needed:

```typescript
// Add these to registry.ts
"ptb|INTER-II|Physics":       PTB_INTER2_PHYSICS as BaseUnit[],  // Check if exists
"ptb|INTER-II|Computer":      PTB_INTER2_COMPUTER as BaseUnit[],  // Check if exists
"ptb|INTER-II|Economics":     PTB_INTER2_ECONOMICS as BaseUnit[],  // NEW FILE NEEDED
"ptb|INTER-II|ایجوکیشن":      PTB_INTER2_EDUCATION as BaseUnit[],  // Already exists
"ptb|INTER-II|سوکس":          PTB_INTER2_SAWKS as BaseUnit[],  // Already exists
"ptb|INTER-II|فزیکل ایجوکیشن": PTB_INTER2_PHYSICAL_EDUCATION as BaseUnit[],  // Already exists
"ptb|INTER-II|سوشیالوجی":     PTB_INTER2_SOCIOLOGY as BaseUnit[],  // Already exists
"ptb|INTER-II|اخلاقیات":      PTB_INTER2_AKHLAQIYAT as BaseUnit[],  // Already exists
"ptb|INTER-II|ترجمۃ القرآن مجید": PTB_INTER2_TARJUMA_QURAN as BaseUnit[],  // Already exists
"ptb|INTER-II|نفسیات":        PTB_INTER2_PSYCHOLOGY as BaseUnit[],  // Already exists
"ptb|INTER-II|فارسی":         PTB_INTER2_FARSI as BaseUnit[],  // Already exists
"ptb|INTER-II|تاریخِ اسلام":  PTB_INTER2_TAREEKH_E_ISLAM as BaseUnit[],  // Already exists
"ptb|INTER-II|حَدِیقَۃُ الاَدَبِ": PTB_INTER2_HADIQATUL_ADAB as BaseUnit[],  // Already exists
"ptb|INTER-II|اِنسانی جغرافیہ": PTB_INTER2_INSANI_GEOGRAPHY as BaseUnit[],  // Already exists
"ptb|INTER-II|لائبریری سائنس": PTB_INTER2_LIBRARY_SCIENCE as BaseUnit[],  // Already exists
"ptb|INTER-II|تاریخِ پاکستان": PTB_INTER2_TAREEKH_E_PAKISTAN as BaseUnit[],  // Already exists
```

---

## 📝 Summary: Files to Create

### Actually Missing Files (Need to Create):

1. **Class 10TH:**
   - `ptb-class10-biology.ts`
   - `ptb-class10-physical-education.ts`

2. **INTER-I:**
   - `ptb-inter1-economics.ts`

3. **INTER-II:**
   - `ptb-inter2-physics.ts` (check first)
   - `ptb-inter2-computer.ts` (check first)
   - `ptb-inter2-economics.ts`

**Total New Files Needed:** 4-6 files (depending on INTER-II Physics/Computer)

---

## 🎯 Action Plan

### Step 1: Update Registry (High Priority)
Add all Urdu name aliases to `registry.ts` for existing files

### Step 2: Create Missing Files (Medium Priority)
1. Class 10 Biology
2. Class 10 Physical Education
3. INTER-I Economics
4. INTER-II Economics

### Step 3: Verify INTER-II (Low Priority)
Check if Physics and Computer files exist for INTER-II

---

## 📊 Impact After Fix

| Class | Current Coverage | After Registry Fix | After New Files |
|-------|------------------|-------------------|-----------------|
| 10TH | 75% (15/20) | 85% (17/20) | 100% (20/20) ✅ |
| INTER-I | 53.3% (16/30) | 96.7% (29/30) | 100% (30/30) ✅ |
| INTER-II | 46.7% (14/30) | 93.3% (28/30) | 100% (30/30) ✅ |

**Overall:** 78.9% → 95%+ → 100% ✅

---

**تیار کردہ:** Kiro AI Assistant  
**تاریخ:** 27 مئی 2026
