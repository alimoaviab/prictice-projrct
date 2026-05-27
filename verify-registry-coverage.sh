#!/bin/bash

# Quick verification script to check registry coverage
# Counts how many subjects from subjects.tsx have registry entries

echo "=================================="
echo "Registry Coverage Verification"
echo "=================================="
echo ""

REGISTRY_FILE="school-react-app/src/data/syllabus/registry.ts"

# Test Class 10TH subjects
echo "Testing PTB > 10TH subjects:"
echo "----------------------------"

subjects_10th=(
  "Biology"
  "Computer"
  "Chemistry"
  "Physics"
  "Mathematics"
  "English"
  "اُردو لازمی"
  "اسلامیات لازمی"
  "General Science"
  "ایجوکیشن"
  "پنجابی"
  "اسلامیات اختیاری"
  "ہوم اکنامکس"
  "سوکس"
  "معاشیات"
  "ترجمۃ القرآن"
  "اخلاقیات"
  "فزیکل ایجوکیشن"
  "مرغبانی"
  "غذا اور غذائیت"
)

found_10th=0
missing_10th=0

for subject in "${subjects_10th[@]}"; do
  if grep -q "ptb|10TH|${subject}" "$REGISTRY_FILE"; then
    echo "  ✅ $subject"
    ((found_10th++))
  else
    echo "  ❌ $subject - MISSING"
    ((missing_10th++))
  fi
done

echo ""
echo "10TH Summary: $found_10th found, $missing_10th missing"
echo ""

# Test INTER-I key subjects
echo "Testing PTB > INTER-I (sample):"
echo "-------------------------------"

subjects_inter1=(
  "ایجوکیشن"
  "سوکس"
  "فزیکل ایجوکیشن"
  "سوشیالوجی"
  "اخلاقیات"
  "ترجمۃ القرآن مجید"
  "نفسیات"
  "فارسی"
  "تاریخِ اسلام"
  "حَدِیقَۃُ الاَدَبِ"
  "طبعی جغرافیہ"
  "لائبریری سائنس"
  "تاریخ پاکستان"
)

found_inter1=0
missing_inter1=0

for subject in "${subjects_inter1[@]}"; do
  if grep -q "ptb|INTER-I|${subject}" "$REGISTRY_FILE"; then
    echo "  ✅ $subject"
    ((found_inter1++))
  else
    echo "  ❌ $subject - MISSING"
    ((missing_inter1++))
  fi
done

echo ""
echo "INTER-I Summary: $found_inter1 found, $missing_inter1 missing"
echo ""

# Test INTER-II key subjects
echo "Testing PTB > INTER-II (sample):"
echo "--------------------------------"

subjects_inter2=(
  "ایجوکیشن"
  "سوکس"
  "فزیکل ایجوکیشن"
  "سوشیالوجی"
  "اخلاقیات"
  "ترجمۃ القرآن مجید"
  "نفسیات"
  "فارسی"
  "تاریخِ اسلام"
  "حَدِیقَۃُ الاَدَبِ"
  "اِنسانی جغرافیہ"
  "لائبریری سائنس"
  "تاریخِ پاکستان"
)

found_inter2=0
missing_inter2=0

for subject in "${subjects_inter2[@]}"; do
  if grep -q "ptb|INTER-II|${subject}" "$REGISTRY_FILE"; then
    echo "  ✅ $subject"
    ((found_inter2++))
  else
    echo "  ❌ $subject - MISSING"
    ((missing_inter2++))
  fi
done

echo ""
echo "INTER-II Summary: $found_inter2 found, $missing_inter2 missing"
echo ""

# Final summary
total_found=$((found_10th + found_inter1 + found_inter2))
total_missing=$((missing_10th + missing_inter1 + missing_inter2))
total=$((total_found + total_missing))

echo "=================================="
echo "OVERALL SUMMARY"
echo "=================================="
echo "Total Tested: $total"
echo "Found: $total_found"
echo "Missing: $total_missing"
echo "Coverage: $(( total_found * 100 / total ))%"
echo ""
