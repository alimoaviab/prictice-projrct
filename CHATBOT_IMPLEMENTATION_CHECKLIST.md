# ✅ EduPlexo Chatbot Implementation Checklist

**Date:** May 11, 2026  
**Version:** 3.0.0

---

## 🎯 Backend Implementation (COMPLETE ✅)

### Core Files Created

- [x] **`shared/ai/skills/eduplexo-assistant-prompt.ts`** ⭐ NEW
  - Complete conversational assistant prompt
  - Bilingual support (English/Urdu)
  - Module knowledge base (12 modules)
  - Action button templates
  - Smart response rules

- [x] **`shared/ai/skills/prompt-config.ts`** ⭐ NEW
  - Prompt mode configuration (ASSISTANT/ENTERPRISE/HYBRID)
  - Dynamic context injection
  - Quick access functions

- [x] **`shared/ai/agents/supervisor.ts`** ✏️ UPDATED
  - Uses new prompt configuration
  - Injects dynamic context (date, school, user)
  - Defaults to ASSISTANT mode
  - Logs prompt mode

### Documentation Created

- [x] **`CHATBOT_SYSTEM_GUIDE.md`** ⭐ NEW
  - Complete chatbot documentation
  - Architecture overview
  - Configuration guide
  - Testing instructions

- [x] **`CHATBOT_IMPLEMENTATION_CHECKLIST.md`** ⭐ THIS FILE
  - Step-by-step implementation guide
  - Frontend tasks
  - Testing checklist

---

## 🎨 Frontend Implementation (TODO)

### 1. Action Button Parser

**File:** `school-app/components/chatbot/MessageRenderer.tsx`

**Status:** ⏳ TODO

**Implementation:**

```tsx
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/ui/icon';

interface ActionButton {
  label: string;
  route: string;
  icon: string;
}

export function MessageRenderer({ text }: { text: string }) {
  const router = useRouter();
  
  const renderMessageWithButtons = (text: string) => {
    const buttonRegex = /\[ACTION_BUTTON: ({.*?})\]/g;
    const parts = text.split(buttonRegex);
    
    return parts.map((part, i) => {
      try {
        const btn: ActionButton = JSON.parse(part);
        return (
          <button
            key={i}
            onClick={() => router.push(btn.route)}
            className="inline-flex items-center gap-2 px-4 py-2 mt-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Icon name={btn.icon} className="w-4 h-4" />
            <span>{btn.label}</span>
          </button>
        );
      } catch {
        // Not a button, render as text
        return <span key={i}>{part}</span>;
      }
    });
  };
  
  return (
    <div className="message-content">
      {renderMessageWithButtons(text)}
    </div>
  );
}
```

**Tasks:**
- [ ] Create `MessageRenderer.tsx` component
- [ ] Add button styling
- [ ] Test button navigation
- [ ] Handle button icons

---

### 2. Chatbot UI Component

**File:** `school-app/components/chatbot/ChatInterface.tsx`

**Status:** ⏳ TODO (if not exists)

**Key Features:**
- [ ] Message input field
- [ ] Message history display
- [ ] Loading indicator
- [ ] Error handling
- [ ] Bilingual support (English/Urdu text direction)
- [ ] Use `MessageRenderer` for responses

**Example Structure:**

```tsx
export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  const sendMessage = async () => {
    // Add user message
    setMessages([...messages, { role: 'user', content: input }]);
    setLoading(true);
    
    // Call API
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message: input }),
    });
    
    const data = await response.json();
    
    // Add AI response
    setMessages([...messages, 
      { role: 'user', content: input },
      { role: 'assistant', content: data.message }
    ]);
    
    setLoading(false);
    setInput('');
  };
  
  return (
    <div className="chat-interface">
      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            {msg.role === 'assistant' ? (
              <MessageRenderer text={msg.content} />
            ) : (
              <span>{msg.content}</span>
            )}
          </div>
        ))}
      </div>
      
      <div className="input-area">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Ask me anything... / کچھ بھی پوچھیں..."
        />
        <button onClick={sendMessage} disabled={loading}>
          {loading ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
}
```

---

### 3. API Route

**File:** `school-app/app/api/ai/chat/route.ts`

**Status:** ⏳ CHECK (may already exist)

**Required Updates:**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { supervisorNode } from '@edu/shared/ai/agents/supervisor';

export async function POST(req: NextRequest) {
  try {
    const { message, schoolId, userId } = await req.json();
    
    // Get school and user context
    const school = await getSchool(schoolId);
    const user = await getUser(userId);
    
    // Prepare state with context
    const state = {
      messages: [{ role: 'user', content: message }],
      schoolName: school.name,
      academicYear: school.academicYear,
      userName: user.name,
      userRole: user.role,
      complexity: 'simple', // or detect from message
    };
    
    // Call supervisor
    const result = await supervisorNode(state, {});
    
    return NextResponse.json({
      message: result.messages[0].content,
      success: true,
    });
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}
```

**Tasks:**
- [ ] Verify API route exists
- [ ] Add context injection (school, user)
- [ ] Add error handling
- [ ] Test with sample queries

---

### 4. Caching Layer (Optional but Recommended)

**File:** `school-app/lib/cache.ts`

**Status:** ⏳ TODO

**Implementation:**

```typescript
import NodeCache from 'node-cache';

const dataCache = new NodeCache();

export const CACHE_TTL = {
  school_classes: 60 * 60 * 24,    // 24 hours
  students: 60 * 60 * 12,           // 12 hours
  teachers: 60 * 60 * 24,           // 24 hours
  timetable: 60 * 60 * 24 * 7,     // 7 days
  attendance: 60 * 5,               // 5 minutes
  live_classes: 60 * 10,            // 10 minutes
  exams: 60 * 60 * 6,               // 6 hours
  fee_records: 60 * 30,             // 30 minutes
};

export async function getCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number
): Promise<T> {
  const cached = dataCache.get<T>(key);
  if (cached) {
    console.log(`✅ Cache hit: ${key}`);
    return cached;
  }
  
  console.log(`⏳ Cache miss: ${key} - Fetching...`);
  const fresh = await fetcher();
  dataCache.set(key, fresh, ttl);
  return fresh;
}

export function clearCache(pattern?: string) {
  if (pattern) {
    const keys = dataCache.keys().filter(k => k.includes(pattern));
    dataCache.del(keys);
  } else {
    dataCache.flushAll();
  }
}
```

**Tasks:**
- [ ] Install `node-cache`: `npm install node-cache`
- [ ] Create cache utility
- [ ] Integrate with API tools
- [ ] Add cache invalidation

---

## 🧪 Testing Checklist

### Backend Tests

- [ ] **Prompt Loading**
  ```bash
  cd school-app && npm run dev
  # Check logs for: "Prompt Mode: ASSISTANT (Conversational)"
  ```

- [ ] **Model Selection**
  ```bash
  # Check logs for: "Provider selected: { provider: 'gemini', model: 'gemini-2.0-flash-exp' }"
  ```

- [ ] **Context Injection**
  ```bash
  # Verify logs show current date, school name, user info
  ```

### Frontend Tests

- [ ] **Message Sending**
  - Send a simple query
  - Verify response appears
  - Check for loading state

- [ ] **Action Buttons**
  - Send: "How do I create a class?"
  - Verify button appears
  - Click button
  - Verify navigation works

- [ ] **Bilingual Support**
  - Send English query → Get English response
  - Send Urdu query → Get Urdu response
  - Send mixed query → Get appropriate response

- [ ] **Tool Integration**
  - Send: "How many classes are there?"
  - Verify tool is called (check logs)
  - Verify real data is returned

### End-to-End Tests

- [ ] **English Queries**
  ```
  - "How many classes are in my school?"
  - "Show me Grade 6 attendance"
  - "How do I add a student?"
  ```

- [ ] **Urdu Queries**
  ```
  - "میرے اسکول میں کتنی کلاسز ہیں؟"
  - "Grade 6 کی حاضری دکھائیں"
  - "طالب علم کیسے شامل کریں؟"
  ```

- [ ] **Mixed Queries**
  ```
  - "Grade 6 ki attendance batao"
  - "Student add karne ka tareeqa"
  ```

- [ ] **Response Quality**
  - [ ] Responses are clear and structured
  - [ ] Bullet points and numbering used
  - [ ] Action buttons appear when relevant
  - [ ] Ends with: "کیا آپ کو کسی اور چیز میں مدد چاہیے؟"
  - [ ] No hallucinated data

---

## 📦 Dependencies

### Required Packages

Check if these are installed:

```bash
cd school-app
npm list node-cache
```

If not installed:

```bash
npm install node-cache
npm install @types/node-cache --save-dev
```

---

## 🚀 Deployment Checklist

### Pre-Deployment

- [ ] All frontend components implemented
- [ ] Action button parser working
- [ ] Caching layer implemented
- [ ] All tests passing
- [ ] No console errors
- [ ] Performance optimized

### Environment Variables

Verify these are set in production:

```bash
GEMINI_API_KEY=your_production_key
GEMINI_MODEL=gemini-2.0-flash-exp
MONGODB_URI=your_production_db
```

### Production Testing

- [ ] Test on production environment
- [ ] Verify API calls work
- [ ] Check response times
- [ ] Monitor error rates
- [ ] Test with real users

---

## 📊 Success Metrics

### Technical Metrics

- [ ] Response time < 2 seconds
- [ ] Tool call success rate > 95%
- [ ] Cache hit rate > 60%
- [ ] Error rate < 1%

### User Experience Metrics

- [ ] Users can complete tasks
- [ ] Responses are helpful
- [ ] Navigation buttons work
- [ ] Bilingual support works
- [ ] No confusion or frustration

---

## 🎯 Quick Start Commands

```bash
# 1. Verify backend is ready
cd school-app && npm run dev
# Check logs for: "Prompt Mode: ASSISTANT"

# 2. Test chatbot API
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "How many classes are there?"}'

# 3. Implement frontend components
# See sections above for code

# 4. Test end-to-end
# Navigate to chatbot UI and test queries
```

---

## 📞 Support

### If You Encounter Issues

1. **Check logs** - Look for errors in console
2. **Verify configuration** - Check `supervisor.ts` is using ASSISTANT mode
3. **Clear caches** - Run `./clean-and-rebuild.sh`
4. **Read documentation** - See `CHATBOT_SYSTEM_GUIDE.md`

### Documentation Files

- **Complete Guide:** `CHATBOT_SYSTEM_GUIDE.md`
- **AI System:** `README_AI_SYSTEM.md`
- **Quick Reference:** `AI_QUICK_REFERENCE.md`
- **This Checklist:** `CHATBOT_IMPLEMENTATION_CHECKLIST.md`

---

## ✅ Final Checklist

### Backend (Complete ✅)
- [x] System prompt created
- [x] Prompt configuration created
- [x] Supervisor updated
- [x] Documentation created

### Frontend (TODO)
- [ ] Message renderer component
- [ ] Action button parser
- [ ] Chatbot UI component
- [ ] API route verified/updated
- [ ] Caching layer implemented

### Testing (TODO)
- [ ] Backend tests passed
- [ ] Frontend tests passed
- [ ] End-to-end tests passed
- [ ] User acceptance testing

### Deployment (TODO)
- [ ] Production environment configured
- [ ] Performance optimized
- [ ] Monitoring set up
- [ ] User training completed

---

**Status:** Backend Complete ✅ | Frontend TODO ⏳  
**Next Step:** Implement frontend components (see sections above)  
**Version:** 3.0.0  
**Date:** May 11, 2026

---

🎯 **Follow this checklist to complete the chatbot implementation!**
