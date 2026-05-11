# Live Class Link Generation - Flow Diagrams

## 1. Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                    USER CREATES LIVE CLASS                          │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│              POST /api/live/classes (Form Data)                     │
│  - title: "Weekly Math Review"                                      │
│  - teacherId: "507f1f77bcf86cd799439011"                           │
│  - classId: "507f1f77bcf86cd799439012"                             │
│  - subjectId: "507f1f77bcf86cd799439013"                           │
│  - startTime: "2026-05-12T10:00:00Z"                               │
│  - endTime: "2026-05-12T11:00:00Z"                                 │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│         LiveClassService.createClass(ctx, data)                    │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
        ┌─────────────────────────────────────────┐
        │  RESOLVE TEACHER EMAIL                  │
        │  - Find teacher by ID                   │
        │  - Get teacher's user email             │
        │  - Add to attendees list                │
        └─────────────────────────────────────────┘
                              ↓
        ┌─────────────────────────────────────────┐
        │  GENERATE MEETING LINK                  │
        │  (Three-Tier System)                    │
        └─────────────────────────────────────────┘
                              ↓
        ┌─────────────────────────────────────────┐
        │  TIER 1: Google Meet Link               │
        │  Try: createGoogleMeetEvent()           │
        └─────────────────────────────────────────┘
                    ↙                    ↘
            SUCCESS ✅              FAIL ❌
                ↓                      ↓
        Use Google Link         Continue to Tier 2
                ↓                      ↓
                └──────────┬───────────┘
                           ↓
        ┌─────────────────────────────────────────┐
        │  TIER 2: Fallback Link Generation       │
        │  Try: generateFallbackMeetingLink()     │
        └─────────────────────────────────────────┘
                    ↙                    ↘
            SUCCESS ✅              FAIL ❌
                ↓                      ↓
        Use Fallback Link        Continue to Tier 3
                ↓                      ↓
                └──────────┬───────────┘
                           ↓
        ┌─────────────────────────────────────────┐
        │  TIER 3: Safety Net                     │
        │  if (!meetingLink)                      │
        │    generateFallbackMeetingLink()        │
        └─────────────────────────────────────────┘
                              ↓
        ┌─────────────────────────────────────────┐
        │  RESULT: meetingLink is ALWAYS set ✅   │
        │  Example:                               │
        │  https://meet.eduexplo.com/class-...    │
        └─────────────────────────────────────────┘
                              ↓
        ┌─────────────────────────────────────────┐
        │  SAVE LIVE CLASS TO DATABASE            │
        │  - Store all data                       │
        │  - Include meetingLink                  │
        │  - Set status: "SCHEDULED"              │
        └─────────────────────────────────────────┘
                              ↓
        ┌─────────────────────────────────────────┐
        │  SHARE LINK WITH STUDENTS               │
        │  - Find all active students in class    │
        │  - Get their email addresses            │
        │  - Log sharing action                   │
        │  - (Future: Send notifications)         │
        └─────────────────────────────────────────┘
                              ↓
        ┌─────────────────────────────────────────┐
        │  RETURN API RESPONSE                    │
        │  {                                      │
        │    success: true,                       │
        │    data: {                              │
        │      meetingLink: "https://...",        │
        │      meetingId: "abc123",               │
        │      ...                                │
        │    }                                    │
        │  }                                      │
        └─────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│              FRONTEND RECEIVES RESPONSE                             │
│  - Extract meetingLink from response                                │
│  - Show success toast with link                                     │
│  - Redirect to live classes list                                    │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│              USER SEES LIVE CLASS IN LIST                           │
│  - Title: "Weekly Math Review"                                      │
│  - Time: "10:00 AM - 11:00 AM"                                      │
│  - Teacher: "Mr. Smith"                                             │
│  - Button: [🎥 Join Session] ← ENABLED ✅                          │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│              USER CLICKS "JOIN SESSION"                             │
│  - Opens meeting link in new tab                                    │
│  - Joins video conference                                           │
│  - Teaching/Learning begins ✅                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## 2. Link Generation Decision Tree

```
                    START
                      ↓
        ┌─────────────────────────────┐
        │ Try Google Meet Link?        │
        └─────────────────────────────┘
                  ↙         ↘
            YES ✅       NO ❌
              ↓             ↓
        ┌─────────┐   ┌──────────────────┐
        │ Success?│   │ Use Fallback     │
        └─────────┘   │ Link             │
          ↙   ↘       └──────────────────┘
        YES  NO                ↓
         ↓    ↓         ┌──────────────┐
         │    └────────→│ Link Ready?  │
         │              └──────────────┘
         │                    ↓
         │              YES ✅ (Always)
         │                    ↓
         └────────┬───────────┘
                  ↓
        ┌─────────────────────────────┐
        │ Save Live Class             │
        │ with meetingLink            │
        └─────────────────────────────┘
                  ↓
        ┌─────────────────────────────┐
        │ Share with Students         │
        └─────────────────────────────┘
                  ↓
        ┌─────────────────────────────┐
        │ Return Response             │
        │ with meetingLink            │
        └─────────────────────────────┘
                  ↓
                 END ✅
```

## 3. Link Type Comparison

```
┌──────────────────────────────────────────────────────────────────┐
│                    LINK TYPE COMPARISON                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  GOOGLE MEET LINK                                               │
│  ├─ Format: https://meet.google.com/xxx-xxxx-xxx               │
│  ├─ Source: Google Calendar API                                │
│  ├─ Availability: When Google Workspace configured             │
│  ├─ Features: Calendar integration, attendees, recordings      │
│  ├─ Professional: Yes ✅                                        │
│  └─ Fallback: Yes (to fallback link)                           │
│                                                                  │
│  FALLBACK LINK                                                  │
│  ├─ Format: https://meet.eduexplo.com/class-{id}-{ts}-{rand}  │
│  ├─ Source: Generated locally                                  │
│  ├─ Availability: Always ✅                                     │
│  ├─ Features: Unique, secure, instant                          │
│  ├─ Professional: Yes ✅                                        │
│  └─ Fallback: None (this is the fallback)                      │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

## 4. Error Handling Flow

```
                    START
                      ↓
        ┌─────────────────────────────┐
        │ Try Google Meet Link         │
        └─────────────────────────────┘
                      ↓
            ┌─────────────────┐
            │ Error Occurred? │
            └─────────────────┘
              ↙              ↘
            YES ❌          NO ✅
              ↓               ↓
        ┌──────────────┐  ┌──────────────┐
        │ Log Warning  │  │ Use Google   │
        │ "Could not   │  │ Link         │
        │ generate     │  └──────────────┘
        │ Google Meet" │        ↓
        └──────────────┘        │
              ↓                 │
        ┌──────────────┐        │
        │ Generate     │        │
        │ Fallback     │        │
        │ Link         │        │
        └──────────────┘        │
              ↓                 │
        ┌──────────────┐        │
        │ Log Info     │        │
        │ "Fallback    │        │
        │ link         │        │
        │ generated"   │        │
        └──────────────┘        │
              ↓                 │
              └────────┬────────┘
                       ↓
        ┌──────────────────────────┐
        │ Check: Link exists?      │
        └──────────────────────────┘
              ↙                  ↘
            YES ✅             NO ❌
              ↓                  ↓
              │          ┌──────────────┐
              │          │ Generate     │
              │          │ Fallback     │
              │          │ (Safety Net) │
              │          └──────────────┘
              │                 ↓
              └────────┬────────┘
                       ↓
        ┌──────────────────────────┐
        │ Continue with Link       │
        │ (Guaranteed to exist)    │
        └──────────────────────────┘
                       ↓
                      END ✅
```

## 5. Student Sharing Flow

```
                    START
                      ↓
        ┌─────────────────────────────┐
        │ Find Students in Class      │
        │ - Query: class_id = X       │
        │ - Filter: status = "active" │
        └─────────────────────────────┘
                      ↓
        ┌─────────────────────────────┐
        │ Students Found?             │
        └─────────────────────────────┘
              ↙                    ↘
            YES ✅              NO ❌
              ↓                   ↓
        ┌──────────────┐    ┌──────────────┐
        │ Get User IDs │    │ Log: No      │
        │ from         │    │ students     │
        │ students     │    │ found        │
        └──────────────┘    └──────────────┘
              ↓                   ↓
        ┌──────────────┐         │
        │ Query Users  │         │
        │ for emails   │         │
        └──────────────┘         │
              ↓                   │
        ┌──────────────┐         │
        │ Build Email  │         │
        │ Map          │         │
        └──────────────┘         │
              ↓                   │
        ┌──────────────┐         │
        │ Extract      │         │
        │ Student      │         │
        │ Emails       │         │
        └──────────────┘         │
              ↓                   │
        ┌──────────────┐         │
        │ Log Sharing  │         │
        │ Action       │         │
        └──────────────┘         │
              ↓                   │
        ┌──────────────┐         │
        │ TODO: Send   │         │
        │ Notifications│         │
        │ (Future)     │         │
        └──────────────┘         │
              ↓                   │
              └────────┬──────────┘
                       ↓
                      END ✅
```

## 6. API Response Structure

```
REQUEST:
┌─────────────────────────────────────────────────────────────┐
│ POST /api/live/classes                                      │
│ {                                                           │
│   "title": "Weekly Math Review",                           │
│   "teacherId": "507f1f77bcf86cd799439011",                │
│   "classId": "507f1f77bcf86cd799439012",                  │
│   "subjectId": "507f1f77bcf86cd799439013",                │
│   "startTime": "2026-05-12T10:00:00Z",                    │
│   "endTime": "2026-05-12T11:00:00Z"                       │
│ }                                                           │
└─────────────────────────────────────────────────────────────┘
                          ↓
PROCESSING:
┌─────────────────────────────────────────────────────────────┐
│ 1. Resolve teacher email                                    │
│ 2. Generate meeting link (Google Meet or Fallback)         │
│ 3. Save live class to database                             │
│ 4. Share link with students                                │
│ 5. Build response                                          │
└─────────────────────────────────────────────────────────────┘
                          ↓
RESPONSE (Success):
┌─────────────────────────────────────────────────────────────┐
│ HTTP 201 Created                                            │
│ {                                                           │
│   "success": true,                                          │
│   "data": {                                                 │
│     "_id": "507f1f77bcf86cd799439014",                     │
│     "title": "Weekly Math Review",                         │
│     "teacherId": "507f1f77bcf86cd799439011",              │
│     "classId": "507f1f77bcf86cd799439012",                │
│     "subjectId": "507f1f77bcf86cd799439013",              │
│     "meetingLink": "https://meet.eduexplo.com/class-...",  │
│     "meetingId": "abc123def456",                           │
│     "startTime": "2026-05-12T10:00:00Z",                  │
│     "endTime": "2026-05-12T11:00:00Z",                    │
│     "status": "SCHEDULED",                                 │
│     "createdBy": "507f1f77bcf86cd799439015",              │
│     "createdAt": "2026-05-11T15:30:00Z",                  │
│     "updatedAt": "2026-05-11T15:30:00Z"                   │
│   }                                                         │
│ }                                                           │
└─────────────────────────────────────────────────────────────┘
                          ↓
RESPONSE (Error):
┌─────────────────────────────────────────────────────────────┐
│ HTTP 400 Bad Request                                        │
│ {                                                           │
│   "success": false,                                         │
│   "error": "teacherId is required"                         │
│ }                                                           │
└─────────────────────────────────────────────────────────────┘
```

## 7. UI State Transitions

```
BEFORE FIX:
┌──────────────────────────────────────────────────────────┐
│ Live Class Card                                          │
├──────────────────────────────────────────────────────────┤
│ Title: Weekly Math Review                               │
│ Time: 10:00 AM - 11:00 AM                              │
│ Teacher: Mr. Smith                                      │
├──────────────────────────────────────────────────────────┤
│ [No Link] ← Disabled ❌                                 │
└──────────────────────────────────────────────────────────┘

AFTER FIX:
┌──────────────────────────────────────────────────────────┐
│ Live Class Card                                          │
├──────────────────────────────────────────────────────────┤
│ Title: Weekly Math Review                               │
│ Time: 10:00 AM - 11:00 AM                              │
│ Teacher: Mr. Smith                                      │
├──────────────────────────────────────────────────────────┤
│ [🎥 Join Session] ← Enabled ✅                         │
└──────────────────────────────────────────────────────────┘
```

## 8. Logging Flow

```
                    START
                      ↓
        ┌─────────────────────────────┐
        │ Try Google Meet Link         │
        └─────────────────────────────┘
                      ↓
            ┌─────────────────┐
            │ Success?        │
            └─────────────────┘
              ↙              ↘
            YES ✅          NO ❌
              ↓               ↓
        ┌──────────────┐  ┌──────────────┐
        │ console.info │  │ console.warn │
        │ "Google Meet │  │ "Could not   │
        │ link         │  │ generate     │
        │ generated"   │  │ Google Meet" │
        └──────────────┘  └──────────────┘
              ↓               ↓
              │          ┌──────────────┐
              │          │ Generate     │
              │          │ Fallback     │
              │          └──────────────┘
              │               ↓
              │          ┌──────────────┐
              │          │ console.info │
              │          │ "Fallback    │
              │          │ link         │
              │          │ generated"   │
              │          └──────────────┘
              │               ↓
              └────────┬──────┘
                       ↓
        ┌──────────────────────────┐
        │ Save Live Class          │
        └──────────────────────────┘
                       ↓
        ┌──────────────────────────┐
        │ Share with Students      │
        └──────────────────────────┘
                       ↓
        ┌──────────────────────────┐
        │ console.info             │
        │ "Sharing live class      │
        │ link with students"      │
        └──────────────────────────┘
                       ↓
                      END ✅
```

---

**All diagrams show the complete flow with:**
- ✅ Success paths
- ❌ Error handling
- 🔄 Fallback mechanisms
- 📊 Data structures
- 🎯 Decision points
