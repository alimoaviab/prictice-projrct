# Syllabus Management System

## Overview
Complete chapter/syllabus management system for EduPlexo Question Paper Module.

## Features Implemented

### 1. **PTB Class 1 English Syllabus Data**
Location: `/school-react-app/src/data/syllabus/ptb-class1-english.ts`

Complete syllabus structure with:
- ✅ All 11 main units (UNIT 1 through UNIT 11)
- ✅ 4 Review sections (REVIEW 1-4) kept separate
- ✅ English B section with 7 topics (Singular/Plural, Gender, Form of Verbs, Applications, Letters, Stories, Essays)
- ✅ Exact spellings and numbering maintained
- ✅ Arabic text preserved (Blessings of Allah سبحان تعالیٰ)

### 2. **Chapter Selector Component**
Location: `/school-react-app/src/components/syllabus/ChapterSelector.tsx`

Features:
- ✅ Unit-wise grouping with expand/collapse
- ✅ Individual chapter checkboxes
- ✅ "Select All" / "Clear All" functionality
- ✅ Unit-level selection (select all chapters in a unit)
- ✅ Search/filter chapters
- ✅ Visual indicators for unit types (Unit, Review, Section)
- ✅ Selection counter (X of Y chapters selected)
- ✅ Indeterminate checkbox state for partial unit selection
- ✅ Clean white EduPlexo design

### 3. **Demo Page**
Location: `/school-react-app/src/pages/role/admin/question-papers/syllabus-demo.tsx`

Access: `/admin/question-papers/syllabus-demo`

Shows:
- ✅ Full chapter selector with PTB Class 1 English
- ✅ Selected chapters summary panel
- ✅ Statistics (coverage %, total chapters, etc.)
- ✅ Generate Paper / Save Selection actions

## Data Structure

```typescript
interface Chapter {
  id: string;          // Unique ID (e.g., "1.1", "review-1", "eb-1")
  code: string;        // Display code (e.g., "1.1", "R1", "EB1")
  title: string;       // Chapter title
  type: "unit" | "review" | "section";
}

interface Unit {
  id: string;          // Unit ID (e.g., "unit-1", "review-1", "english-b")
  title: string;       // Unit title (e.g., "UNIT 1: Time to Recall")
  type: "unit" | "review" | "section";
  chapters: Chapter[]; // Array of chapters in this unit
}
```

## Usage Examples

### 1. Import Syllabus Data
```typescript
import { PTB_CLASS1_ENGLISH, getAllChapters } from "@/data/syllabus/ptb-class1-english";

// Get all chapters as flat list
const allChapters = getAllChapters();

// Get chapters by unit
const unit1Chapters = getChaptersByUnit("unit-1");
```

### 2. Use Chapter Selector Component
```typescript
import { ChapterSelector } from "@/components/syllabus/ChapterSelector";
import { PTB_CLASS1_ENGLISH } from "@/data/syllabus/ptb-class1-english";

function MyComponent() {
  const [selectedChapters, setSelectedChapters] = useState<string[]>([]);

  return (
    <ChapterSelector
      units={PTB_CLASS1_ENGLISH}
      selectedChapters={selectedChapters}
      onSelectionChange={setSelectedChapters}
      title="Select Chapters"
      subtitle="Choose chapters for paper generation"
    />
  );
}
```

### 3. Generate Paper with Selected Chapters
```typescript
// After user selects chapters
const selectedChapterIds = ["1.1", "2.1", "3.1", "review-1"];

// Pass to paper generator
navigate(`/admin/question-papers?tab=generator&chapters=${selectedChapterIds.join(",")}`);
```

## System Capabilities

### ✅ Paper Generation
- Select specific chapters for question paper
- Include/exclude review sections
- Include/exclude English B topics
- Generate papers from selected chapters only

### ✅ Syllabus Tracking
- Track which chapters have been covered
- Monitor syllabus completion percentage
- View chapter-wise progress

### ✅ Teacher Planning
- Plan lessons by selecting chapters
- Create chapter-wise tests
- Organize monthly/term papers

### ✅ Student Progress
- Track student progress per chapter
- Identify weak chapters
- Generate chapter-wise reports

### ✅ Admin Management
- View syllabus completion across classes
- Monitor teacher progress
- Generate syllabus reports

## Future Enhancements

### Phase 2
- [ ] Add more syllabuses (Class 2-12, all subjects)
- [ ] Backend API for syllabus CRUD
- [ ] Save/load chapter selections
- [ ] Chapter-wise question bank filtering
- [ ] Syllabus completion tracking in database

### Phase 3
- [ ] Teacher syllabus planner
- [ ] Student chapter-wise performance
- [ ] Admin syllabus analytics dashboard
- [ ] Bulk syllabus import/export
- [ ] Custom syllabus creation

## File Structure

```
school-react-app/src/
├── data/
│   └── syllabus/
│       └── ptb-class1-english.ts          # PTB Class 1 English syllabus data
├── components/
│   └── syllabus/
│       └── ChapterSelector.tsx            # Chapter selection component
└── pages/role/admin/question-papers/
    └── syllabus-demo.tsx                  # Demo page showing chapter selector
```

## Routes

| Route | Description |
|-------|-------------|
| `/admin/question-papers/syllabus-demo` | Demo page with chapter selector |

## Testing

1. Navigate to `/admin/question-papers/syllabus-demo`
2. Expand/collapse units
3. Select individual chapters
4. Use "Select All" / "Clear All"
5. Search for chapters
6. View selection summary
7. Check statistics panel

## Notes

- All spellings are exact as per PTB syllabus
- Arabic text is preserved
- Review sections are separate from main units
- English B is a distinct section
- Unit numbering is maintained (1.1, 2.1, etc.)
- Component is reusable for any syllabus structure
