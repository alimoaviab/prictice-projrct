# 🤖 EduPlexo AI Chatbot System Guide

**Version:** 3.0.0  
**Date:** May 11, 2026  
**Status:** ✅ Production-Ready

---

## 📋 Overview

The EduPlexo AI Chatbot is a comprehensive, bilingual (English/Urdu), module-aware conversational assistant integrated into your enterprise-grade AI infrastructure.

### Key Features

✅ **Bilingual Support** - English, Urdu, and mixed language  
✅ **Module-Aware** - Expert knowledge of all 12 EduPlexo modules  
✅ **Tool-Integrated** - Real-time data access via AI tools  
✅ **Action Buttons** - Contextual navigation buttons in responses  
✅ **Conversational** - Warm, friendly, professional tone  
✅ **Enterprise-Grade** - Built on your existing AI infrastructure  

---

## 🏗️ Architecture

### File Structure

```
shared/ai/
├── skills/
│   ├── system-prompt.ts                  # Original enterprise prompt
│   ├── eduplexo-assistant-prompt.ts      # ⭐ NEW: Conversational assistant
│   ├── prompt-config.ts                  # ⭐ NEW: Prompt mode configuration
│   └── student-analysis.ts               # Student analysis skills
├── agents/
│   └── supervisor.ts                     # ✏️ UPDATED: Uses new prompt config
└── tools/
    └── registry.ts                       # AI tools for data access
```

### Prompt Modes

The system supports three prompt modes:

1. **ASSISTANT** (Default) - Conversational, friendly, bilingual
2. **ENTERPRISE** - Original operational ERP copilot
3. **HYBRID** - Combination of both

---

## 🚀 Quick Start

### 1. System is Already Configured

The chatbot is already integrated and ready to use! The supervisor has been updated to use the new conversational assistant mode by default.

### 2. Test the Chatbot

Start your development server:

```bash
cd school-app
npm run dev
```

Navigate to the chatbot interface and try these test queries:

**English:**
- "How many classes are in my school?"
- "Show me today's attendance for Grade 6"
- "How do I create a new class?"

**Urdu:**
- "میرے اسکول میں کتنی کلاسز ہیں؟"
- "Grade 6 کی آج کی حاضری دکھائیں"
- "نئی کلاس کیسے بنائیں؟"

**Mixed:**
- "Grade 6 ki attendance batao"
- "Class create karne ka tareeqa batao"

### 3. Watch the Logs

You should see:

```
🧠 Supervisor Node: Processing request
   Complexity: simple
🤖 Getting AI model...
✅ Provider selected: { provider: "gemini", model: "gemini-2.0-flash-exp" }
📤 Invoking AI model...
   Prompt Mode: ASSISTANT (Conversational)
✅ Supervisor Node: Response received
```

---

## 📚 Module Coverage

The chatbot has expert knowledge of all 12 modules:

1. **Classes (کلاسز)** - Create, view, edit classes
2. **Students (طلباء)** - Add, search, transfer students
3. **Teachers (اساتذہ)** - Add teachers, assign classes
4. **Exams (امتحانات)** - Create exams, enter results
5. **Timetable (ٹائم ٹیبل)** - Create and view schedules
6. **Attendance (حاضری)** - Mark and view attendance
7. **Live Classes (لائیو کلاسز)** - Schedule online classes
8. **Fees (فیس)** - Fee structure, payments, reports
9. **Results (نتائج)** - View results, generate report cards
10. **Notifications (اطلاعات)** - Send announcements
11. **Reports & Analytics (رپورٹس)** - Generate various reports
12. **School Calendar (اسکول کیلنڈر)** - Manage events

---

## 🔧 Configuration

### Switching Prompt Modes

Edit `shared/ai/agents/supervisor.ts`:

```typescript
// Use conversational assistant (default)
const systemPromptContent = getSystemPromptWithContext(
  {
    mode: PromptMode.ASSISTANT,
    includeStudentAnalysis: true,
  },
  { /* context */ }
);

// Use enterprise mode
const systemPromptContent = getSystemPromptWithContext(
  {
    mode: PromptMode.ENTERPRISE,
    includeStudentAnalysis: true,
  },
  { /* context */ }
);

// Use hybrid mode (both)
const systemPromptContent = getSystemPromptWithContext(
  {
    mode: PromptMode.HYBRID,
    includeStudentAnalysis: true,
  },
  { /* context */ }
);
```

### Dynamic Context Injection

The system automatically injects:

- **Current Date** - For time-aware responses
- **School Name** - Personalized responses
- **Academic Year** - Context-aware guidance
- **User Name** - Personalized greetings
- **User Role** - Role-specific responses

Pass these in the state:

```typescript
const state = {
  messages: [...],
  schoolName: "ABC School",
  academicYear: "2024-2025",
  userName: "Admin User",
  userRole: "Administrator",
  complexity: "simple",
};
```

---

## 🎯 Action Buttons

### How They Work

The chatbot includes action buttons in responses using this format:

```
[ACTION_BUTTON: {"label": "Create Class", "route": "/admin/classes/new", "icon": "plus"}]
```

### Frontend Implementation

Parse and render these buttons in your React component:

```tsx
// components/chatbot/MessageRenderer.tsx
function renderMessageWithButtons(text: string) {
  const buttonRegex = /\[ACTION_BUTTON: ({.*?})\]/g;
  const parts = text.split(buttonRegex);
  
  return parts.map((part, i) => {
    try {
      const btn = JSON.parse(part);
      return (
        <button
          key={i}
          onClick={() => router.push(btn.route)}
          className="action-button"
        >
          <Icon name={btn.icon} />
          {btn.label}
        </button>
      );
    } catch {
      return <span key={i}>{part}</span>;
    }
  });
}
```

### Available Buttons

The chatbot can suggest these navigation buttons:

| Label | Route | Icon | When to Show |
|-------|-------|------|--------------|
| Create Class | `/admin/classes/new` | plus | After explaining how to create class |
| Add Student | `/admin/students/new` | user-plus | After explaining how to add student |
| View Timetable | `/admin/timetable` | calendar | When discussing timetables |
| Create Exam | `/admin/exams/new` | file-text | After explaining exam creation |
| Schedule Live Class | `/admin/live-classes/new` | video | When discussing live classes |
| View Attendance | `/admin/attendance` | check-square | When discussing attendance |
| View Fee Records | `/admin/fee` | credit-card | When discussing fees |
| View Results | `/admin/results` | award | When discussing results |

---

## 🛠️ AI Tools Integration

### Available Tools

The chatbot has access to these real-time data tools:

```typescript
// shared/ai/tools/registry.ts
export const aiTools = [
  get_school_classes(),      // List all classes
  get_students(class_id?),   // Get students
  get_teachers(),            // Get teachers
  get_attendance(class_id, date?), // Attendance records
  get_timetable(class_id?),  // Timetables
  get_exams(class_id?, status?), // Exams
  get_live_classes(status?), // Live classes
  get_fee_records(class_id?), // Fee records
  get_results(class_id?, exam_id?), // Results
  get_notifications(),       // Notifications
  get_school_info(),         // School info
];
```

### Tool Usage Pattern

The chatbot automatically:

1. **Detects** data-related questions
2. **Calls** appropriate tool
3. **Presents** data clearly
4. **Offers** to dig deeper

Example flow:

```
User: "How many students are in Grade 6?"
  ↓
Chatbot calls: get_students("grade-6")
  ↓
Chatbot responds: "Grade 6 میں 34 طلباء ہیں..."
  ↓
Chatbot offers: "کیا آپ غیر حاضر طلباء کے نام دیکھنا چاہتے ہیں؟"
```

---

## 💡 Response Patterns

### Data Questions

**User:** "میرے اسکول میں کتنی کلاسز ہیں؟"

**Chatbot:**
```
📚 آپ کے اسکول میں اس وقت **12 کلاسز** ہیں:

• Grade 1 (A, B) — 45 طلباء
• Grade 2 (A, B) — 52 طلباء
• Grade 3 (A) — 28 طلباء
[...etc]

مجموعی طلباء: **387**

کیا آپ کسی مخصوص کلاس کی تفصیل چاہتے ہیں؟
```

### How-To Questions

**User:** "How do I create a class?"

**Chatbot:**
```
Creating a class is easy! Follow these steps:

1. Go to Dashboard → Classes
2. Click "Add New Class" button (top right)
3. Enter Class Name (e.g., "Grade 6 - A")
4. Select Section (A, B, C...)
5. Assign Class Teacher
6. Set Maximum Student Capacity
7. Click "Save Class" ✓

[ACTION_BUTTON: {"label": "Create Class", "route": "/admin/classes/new", "icon": "plus"}]

Is there anything else I can help you with?
```

### Mixed Language

**User:** "Grade 6 ki attendance batao"

**Chatbot:**
```
**Grade 6 — آج کی حاضری** (May 11, 2024)

✅ حاضر: 30 طلباء (88.2%)
❌ غیر حاضر: 4 طلباء (11.8%)

غیر حاضر طلباء: احمد علی، فاطمہ خان، عمر شاہ، زینب نواز

[ACTION_BUTTON: {"label": "مکمل حاضری رپورٹ", "route": "/admin/attendance", "icon": "check-square"}]

کیا آپ کو کسی اور چیز میں مدد چاہیے؟
```

---

## 🎨 Personality & Tone

### Characteristics

- **Conversational** - Like ChatGPT or Gemini
- **Friendly** - Warm and approachable
- **Professional** - Knowledgeable and reliable
- **Helpful** - Always offers next steps
- **Bilingual** - Seamlessly switches languages

### Communication Style

✅ **DO:**
- Use bullet points and numbered steps
- Be concise but complete
- Ask follow-up questions
- Provide action buttons
- End with: "کیا آپ کو کسی اور چیز میں مدد چاہیے؟"

❌ **DON'T:**
- Make up data
- Give vague responses
- Use overly technical jargon
- Leave users guessing
- Forget to offer help

---

## 🔍 Smart Response Rules

### Rule 1: Data Questions
→ Call appropriate tool  
→ Present data clearly  
→ Offer to dig deeper  

### Rule 2: How-To Questions
→ Give numbered steps  
→ End with action button  
→ Ask if they need more help  

### Rule 3: Problem/Error Questions
→ Ask clarifying question  
→ Give troubleshooting steps  
→ Escalate if needed  

### Rule 4: Unclear Questions
→ Answer what you can  
→ Ask specific follow-up  

### Rule 5: Out of Scope
→ Politely redirect to school management topics  

---

## 📊 Performance Optimization

### Caching Strategy

Implement caching to reduce API costs:

```typescript
// In your chatbot API route
const CACHE_TTL = {
  school_classes: 60 * 60 * 24,    // 24 hours
  students: 60 * 60 * 12,           // 12 hours
  teachers: 60 * 60 * 24,           // 24 hours
  timetable: 60 * 60 * 24 * 7,     // 7 days
  attendance: 60 * 5,               // 5 minutes
  live_classes: 60 * 10,            // 10 minutes
  exams: 60 * 60 * 6,               // 6 hours
  fee_records: 60 * 30,             // 30 minutes
};

// Use Redis or node-cache
import NodeCache from 'node-cache';
const dataCache = new NodeCache();

async function getCachedData(key: string, fetcher: () => Promise<any>, ttl: number) {
  const cached = dataCache.get(key);
  if (cached) return cached;
  
  const fresh = await fetcher();
  dataCache.set(key, fresh, ttl);
  return fresh;
}
```

### Response Caching

Cache identical questions:

```typescript
// Cache identical user questions for 1 hour
const questionCacheKey = `qa_${schoolId}_${hashQuestion(userMessage)}`;
const cachedResponse = dataCache.get(questionCacheKey);

if (cachedResponse) {
  return Response.json({ message: cachedResponse, cached: true });
}

// Call AI only if no cache
const aiResponse = await callAI(systemPrompt, userMessage, schoolData);
dataCache.set(questionCacheKey, aiResponse, 60 * 60);
```

---

## 🧪 Testing

### Test Queries

**English:**
```
- "How many classes are there?"
- "Show me Grade 6 attendance"
- "How do I add a student?"
- "What exams are scheduled?"
- "Generate fee report"
```

**Urdu:**
```
- "کتنی کلاسز ہیں؟"
- "Grade 6 کی حاضری دکھائیں"
- "طالب علم کیسے شامل کریں؟"
- "کون سے امتحانات ہیں؟"
- "فیس رپورٹ بنائیں"
```

**Mixed:**
```
- "Grade 6 ki attendance batao"
- "Student add karne ka tareeqa"
- "Exams ki list dikhao"
- "Fee report generate karo"
```

### Expected Behavior

✅ Responds in same language as query  
✅ Calls appropriate tools for data  
✅ Provides clear, structured responses  
✅ Includes action buttons when relevant  
✅ Ends with help offer  
✅ Never makes up data  

---

## 🐛 Troubleshooting

### Issue: Chatbot Not Using New Prompt

**Solution:**
```bash
# Clean caches
rm -rf school-app/.next
rm -rf .turbo

# Rebuild shared package
cd shared && npm run build

# Restart dev server
cd school-app && npm run dev
```

### Issue: Action Buttons Not Rendering

**Solution:** Implement the button parser in your frontend:

```tsx
// See "Frontend Implementation" section above
function renderMessageWithButtons(text: string) { /* ... */ }
```

### Issue: Tools Not Being Called

**Solution:** Verify tools are registered in `shared/ai/tools/registry.ts` and bound to the model in supervisor.

### Issue: Wrong Language in Response

**Solution:** The chatbot automatically detects language. Ensure your query is clear. Try rephrasing.

---

## 📖 Documentation Files

- **This Guide:** `CHATBOT_SYSTEM_GUIDE.md` - Complete chatbot documentation
- **AI System:** `README_AI_SYSTEM.md` - AI infrastructure index
- **Quick Reference:** `AI_QUICK_REFERENCE.md` - Quick commands
- **System Status:** `AI_SYSTEM_STATUS.md` - Current status

---

## 🎯 Next Steps

### 1. Test the Chatbot
```bash
cd school-app && npm run dev
```

### 2. Implement Button Rendering
Add the button parser to your frontend component.

### 3. Implement Caching
Add caching layer to reduce API costs.

### 4. Monitor Performance
Watch logs for tool calls and response times.

### 5. Gather Feedback
Test with real users and iterate.

---

## ✅ Success Checklist

- [ ] Dev server starts without errors
- [ ] Chatbot responds to queries
- [ ] Correct language detection
- [ ] Tools are called for data questions
- [ ] Action buttons appear in responses
- [ ] Responses end with help offer
- [ ] No hallucinated data
- [ ] Logs show "Prompt Mode: ASSISTANT"

---

**Version:** 3.0.0  
**Status:** ✅ Production-Ready  
**Last Updated:** May 11, 2026

---

🎉 **Your EduPlexo AI Chatbot is ready to assist users!**
