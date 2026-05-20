# EduPlex — QA Test Plan & Test Cases

> **Module**: Question Paper & Question Bank System  
> **Version**: 1.0  
> **Date**: May 2026  
> **Tester**: _______________  
> **Environment**: Staging / Production  

---

## How to Use This Document

- Each section has checkboxes `[ ]` — mark as `[x]` when test passes
- If a test fails, add a note below it with the issue
- Submit this file as your test report

---

## Module Overview & Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    QUESTION PAPER FLOW                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Admin creates CHAPTERS (per class + subject)             │
│                    ↓                                         │
│  2. Teacher creates QUESTIONS in Question Bank               │
│     (assigned to class → subject → chapter)                  │
│                    ↓                                         │
│  3. Super Admin APPROVES questions (moderation)              │
│     Approved = global, Rejected = private                    │
│                    ↓                                         │
│  4. Teacher creates QUESTION PAPER                           │
│     - Selects class, subject, chapters                       │
│     - Adds questions from bank OR creates new                │
│     - Live preview updates instantly                         │
│     - Auto-draft saves progress                              │
│                    ↓                                         │
│  5. Teacher PRINTS or SAVES paper                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. Chapters Management

**Route**: `/admin/chapters`

### Test Cases

- [ ] TC-1.1: Page loads without errors
- [ ] TC-1.2: Class dropdown shows all classes from database
- [ ] TC-1.3: Subject dropdown shows all subjects
- [ ] TC-1.4: Selecting a class loads chapters for that class
- [ ] TC-1.5: Selecting a subject filters chapters by subject
- [ ] TC-1.6: "Add Chapter" with valid title creates chapter successfully
- [ ] TC-1.7: New chapter appears in list instantly (no page reload)
- [ ] TC-1.8: Chapter number auto-increments correctly
- [ ] TC-1.9: "Archive" button hides chapter from active list
- [ ] TC-1.10: Archived chapter does NOT appear in question creation dropdowns
- [ ] TC-1.11: Empty state shows when no chapters exist for selected class
- [ ] TC-1.12: Cannot add chapter without selecting a class (validation)
- [ ] TC-1.13: Cannot add chapter with empty title (validation)
- [ ] TC-1.14: Page is responsive on mobile

**Notes**: _______________

---

## 2. Question Bank

**Route**: `/admin/question-bank`

### Test Cases — List & Filters

- [ ] TC-2.1: Page loads and shows questions
- [ ] TC-2.2: "All" tab shows active questions
- [ ] TC-2.3: "Starred" tab shows only starred questions
- [ ] TC-2.4: "Archived" tab shows only archived questions
- [ ] TC-2.5: Search filters questions by text instantly (no reload)
- [ ] TC-2.6: Board filter works correctly
- [ ] TC-2.7: Class filter works correctly
- [ ] TC-2.8: Subject filter works correctly
- [ ] TC-2.9: Chapter filter works correctly
- [ ] TC-2.10: Type filter (MCQ/Short/Long) works correctly
- [ ] TC-2.11: Difficulty filter (Easy/Medium/Hard) works correctly
- [ ] TC-2.12: "Clear filters" button resets all filters
- [ ] TC-2.13: Multiple filters can be combined
- [ ] TC-2.14: Empty state shows when no questions match filters

### Test Cases — Add Question (Drawer)

- [ ] TC-2.15: "Add Question" button opens side drawer (no page reload)
- [ ] TC-2.16: Drawer has tabs: "Create New" and "Question Bank"
- [ ] TC-2.17: Question Type buttons (MCQ/Short/Long) toggle correctly
- [ ] TC-2.18: Selecting MCQ shows options A/B/C/D fields
- [ ] TC-2.19: Selecting Short/Long hides MCQ options
- [ ] TC-2.20: Board field accepts text input
- [ ] TC-2.21: Class dropdown shows all classes
- [ ] TC-2.22: Subject field accepts text input
- [ ] TC-2.23: Chapter field accepts text input
- [ ] TC-2.24: Difficulty buttons (Easy/Medium/Hard) toggle correctly
- [ ] TC-2.25: Rich text editor accepts Urdu text
- [ ] TC-2.26: Rich text editor supports bold formatting (Ctrl+B)
- [ ] TC-2.27: "Save Question" with valid data creates question
- [ ] TC-2.28: New question appears in list instantly (no reload)
- [ ] TC-2.29: Success toast appears after save
- [ ] TC-2.30: Drawer stays open after save (for adding more)
- [ ] TC-2.31: Cannot save without question text (validation)
- [ ] TC-2.32: Cannot save without selecting class (validation)
- [ ] TC-2.33: MCQ correct answer selector works (green circle)

### Test Cases — Star/Archive Actions

- [ ] TC-2.34: Star button toggles star on/off instantly
- [ ] TC-2.35: Starred question appears in "Starred" tab
- [ ] TC-2.36: Unstarring removes from "Starred" tab
- [ ] TC-2.37: Star is personal (per teacher, not global)
- [ ] TC-2.38: Archive button moves question to "Archived" tab
- [ ] TC-2.39: Archived question disappears from "All" tab
- [ ] TC-2.40: "Restore" button in Archived tab restores question
- [ ] TC-2.41: No page reload on any star/archive action

### Test Cases — Approval Status

- [ ] TC-2.42: New question shows "Pending" status badge
- [ ] TC-2.43: Teacher can see their own pending questions
- [ ] TC-2.44: Teacher CANNOT see other teachers' pending questions
- [ ] TC-2.45: Approved questions are visible to all teachers
- [ ] TC-2.46: Rejected questions visible only to creator

**Notes**: _______________

---

## 3. Community Moderation (Super Admin)

**Route**: `/moderation` (Super Admin Portal)

### Test Cases

- [ ] TC-3.1: Moderation page loads in Super Admin portal
- [ ] TC-3.2: "Pending" tab shows all pending questions from all schools
- [ ] TC-3.3: Each question card shows: text, type, difficulty, class, subject, chapter, teacher name, school name
- [ ] TC-3.4: MCQ questions show options with correct answer highlighted
- [ ] TC-3.5: "Approve" button changes question to approved + global
- [ ] TC-3.6: Approved question disappears from pending list (no reload)
- [ ] TC-3.7: "Reject" button changes question to rejected + private
- [ ] TC-3.8: Rejected question disappears from pending list (no reload)
- [ ] TC-3.9: "Approved" tab shows all approved questions
- [ ] TC-3.10: "Rejected" tab shows all rejected questions
- [ ] TC-3.11: Approved questions show "Global" badge
- [ ] TC-3.12: Rejected questions show "Private" badge
- [ ] TC-3.13: After approval, question visible to other schools' teachers
- [ ] TC-3.14: After rejection, question visible ONLY to creator teacher

**Notes**: _______________

---

## 4. Question Papers — List Page

**Route**: `/admin/question-papers`

### Test Cases

- [ ] TC-4.1: Page loads and shows list of papers
- [ ] TC-4.2: Table shows columns: Title, Class, Teacher, Date, Created, Actions
- [ ] TC-4.3: "Create New Paper" button navigates to create page
- [ ] TC-4.4: View button opens paper detail
- [ ] TC-4.5: Delete button shows confirmation modal
- [ ] TC-4.6: Confirming delete removes paper from list (no reload)
- [ ] TC-4.7: Empty state shows when no papers exist
- [ ] TC-4.8: Page is responsive on mobile

**Notes**: _______________

---

## 5. Question Papers — Create Page

**Route**: `/admin/question-papers/create`

### Test Cases — Form

- [ ] TC-5.1: Page loads without errors
- [ ] TC-5.2: Paper Title input works
- [ ] TC-5.3: Class dropdown shows all classes from database
- [ ] TC-5.4: Teacher dropdown shows all teachers (optional)
- [ ] TC-5.5: Date picker works
- [ ] TC-5.6: "Save Paper" disabled when title or class empty
- [ ] TC-5.7: "Save Paper" creates paper and navigates to list

### Test Cases — Add Questions (Drawer)

- [ ] TC-5.8: "Add Question" button opens side drawer (NO page reload)
- [ ] TC-5.9: "Create New" tab shows question form
- [ ] TC-5.10: Question Type toggle (MCQ/Short/Long) works
- [ ] TC-5.11: Question text textarea accepts input
- [ ] TC-5.12: MCQ options appear when MCQ selected
- [ ] TC-5.13: Marks input accepts numbers
- [ ] TC-5.14: Difficulty selector works
- [ ] TC-5.15: "Add to Paper" adds question to paper instantly (no reload)
- [ ] TC-5.16: Added question appears in "Questions" section on left
- [ ] TC-5.17: Added question appears in Live Preview on right
- [ ] TC-5.18: Multiple questions can be added without closing drawer
- [ ] TC-5.19: Success toast shows after each question added

### Test Cases — Questions List

- [ ] TC-5.20: Questions show number (Q1, Q2, Q3...)
- [ ] TC-5.21: Questions show text, type badge, marks, difficulty
- [ ] TC-5.22: Up/Down arrows reorder questions
- [ ] TC-5.23: Remove (X) button removes question from paper
- [ ] TC-5.24: Removing question updates preview instantly
- [ ] TC-5.25: Total marks counter updates correctly

### Test Cases — Live Preview

- [ ] TC-5.26: Preview shows school name at top
- [ ] TC-5.27: Preview shows paper title
- [ ] TC-5.28: Preview shows class name when selected
- [ ] TC-5.29: Preview shows teacher name when selected
- [ ] TC-5.30: Preview shows date when selected
- [ ] TC-5.31: Preview shows total marks and question count
- [ ] TC-5.32: MCQ questions show options (a), (b), (c), (d) in preview
- [ ] TC-5.33: Short questions show answer line in preview
- [ ] TC-5.34: Long questions show multiple answer lines in preview
- [ ] TC-5.35: Preview updates INSTANTLY on any change (no reload)
- [ ] TC-5.36: If teacher/date empty, they don't show in preview

### Test Cases — Print

- [ ] TC-5.37: Print button opens browser print dialog
- [ ] TC-5.38: Print layout is clean (no UI chrome)
- [ ] TC-5.39: Print shows school name, title, questions correctly

### Test Cases — Auto Draft Save

- [ ] TC-5.40: Draft saves automatically when changes are made
- [ ] TC-5.41: "Saving..." indicator appears during save
- [ ] TC-5.42: "Saved" indicator appears after successful save
- [ ] TC-5.43: If teacher navigates away and returns, draft is recovered
- [ ] TC-5.44: "Continue Draft?" popup appears when draft exists
- [ ] TC-5.45: "Continue" loads the saved draft data
- [ ] TC-5.46: "Discard" removes draft and shows empty form
- [ ] TC-5.47: No data loss if browser accidentally closes

**Notes**: _______________

---

## 6. Certificates Module

**Route**: `/admin/certificates`

### Test Cases

- [ ] TC-6.1: Certificates page loads
- [ ] TC-6.2: "Templates" tab shows certificate templates
- [ ] TC-6.3: "Generated" tab shows issued certificates
- [ ] TC-6.4: Stats cards show correct counts
- [ ] TC-6.5: "New Template" button navigates to create page
- [ ] TC-6.6: Template cards show name, type, orientation
- [ ] TC-6.7: "Duplicate" action creates a copy
- [ ] TC-6.8: "Delete" action removes template after confirmation
- [ ] TC-6.9: "Generate" action navigates to student selection page
- [ ] TC-6.10: Certificate generation selects students and creates certificates
- [ ] TC-6.11: Generated certificates show student name, class, cert number
- [ ] TC-6.12: "Revoke" action changes certificate status
- [ ] TC-6.13: Verification code is unique per certificate

### Certificate Create Page (`/admin/certificates/create`)

- [ ] TC-6.14: Template Name input works
- [ ] TC-6.15: Certificate Title input works (free text, no dropdown)
- [ ] TC-6.16: Certificate Body textarea is empty by default
- [ ] TC-6.17: No `{{variable}}` tags shown anywhere
- [ ] TC-6.18: Live preview shows school name (fetched from settings)
- [ ] TC-6.19: Live preview shows certificate title
- [ ] TC-6.20: Live preview watermark shows school name (not "EDUPLEXO")
- [ ] TC-6.21: No hardcoded address in preview
- [ ] TC-6.22: "Create Template" saves and navigates back

**Notes**: _______________

---

## 7. Cross-Module Integration

### Test Cases

- [ ] TC-7.1: Question created in Question Bank can be used in Question Paper
- [ ] TC-7.2: Chapter created in Chapters page appears in Question Bank filters
- [ ] TC-7.3: Class data is consistent across all modules (same classes everywhere)
- [ ] TC-7.4: Teacher data is consistent across all modules
- [ ] TC-7.5: No page reload on ANY action across all modules
- [ ] TC-7.6: All pages are responsive on mobile (320px - 768px)
- [ ] TC-7.7: All pages work on tablet (768px - 1024px)
- [ ] TC-7.8: All pages work on desktop (1024px+)
- [ ] TC-7.9: Error messages are user-friendly (not technical)
- [ ] TC-7.10: Loading states show skeletons (not blank screens)

**Notes**: _______________

---

## 8. Performance & Security

### Test Cases

- [ ] TC-8.1: Pages load within 3 seconds
- [ ] TC-8.2: API calls complete within 2 seconds
- [ ] TC-8.3: No console errors in browser
- [ ] TC-8.4: No 500 errors from backend
- [ ] TC-8.5: Unauthorized users cannot access admin pages
- [ ] TC-8.6: Teacher cannot see other teachers' private questions
- [ ] TC-8.7: Student cannot access question bank or paper builder
- [ ] TC-8.8: All forms have proper validation
- [ ] TC-8.9: XSS prevention (HTML in question text doesn't execute scripts)
- [ ] TC-8.10: CSRF protection on all POST/PATCH/DELETE endpoints

**Notes**: _______________

---

## Test Summary

| Section | Total Tests | Passed | Failed | Blocked |
|---------|------------|--------|--------|---------|
| 1. Chapters | 14 | | | |
| 2. Question Bank | 46 | | | |
| 3. Moderation | 14 | | | |
| 4. Papers List | 8 | | | |
| 5. Papers Create | 47 | | | |
| 6. Certificates | 22 | | | |
| 7. Integration | 10 | | | |
| 8. Performance | 10 | | | |
| **TOTAL** | **171** | | | |

---

## Defects Found

| # | Test Case | Severity | Description | Status |
|---|-----------|----------|-------------|--------|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |

---

## Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| QA Tester | | | |
| Developer | | | |
| Project Lead | | | |

---

*End of QA Test Plan*
