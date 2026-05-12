# Google Meet Integration - Quick Reference

**Quick reference for developers working with Google Meet integration**

---

## 🚀 Quick Start (5 Minutes)

### 1. Environment Setup
```bash
# Add to .env.local
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
GOOGLE_TOKEN_ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
```

### 2. Install Dependencies
```bash
npm install googleapis crypto-js date-fns
```

### 3. Test
```bash
npm run dev:school
# Navigate to http://localhost:3000/admin/live-classes
```

---

## 📁 File Structure

```
Eduplexo/
├── shared/services/google/
│   ├── oauth2-helper.ts          # OAuth2.0 authentication
│   └── calendar.service.ts       # Google Calendar API
│
├── school-app/app/api/
│   ├── auth/google/
│   │   ├── calendar/route.ts     # Initiate OAuth
│   │   └── callback/route.ts     # Handle callback
│   └── live/classes/
│       └── schedule/route.ts     # Schedule class
│
└── school-app/components/live-class/
    ├── GoogleCalendarConnect.tsx # Connect button
    ├── ScheduleLiveClassForm.tsx # Schedule form
    └── LiveClassCard.tsx         # Display class
```

---

## 🔑 Key Functions

### OAuth2 Helper (`oauth2-helper.ts`)

```typescript
// Generate auth URL
const authUrl = generateAuthUrl(teacherId);

// Exchange code for tokens
const { accessToken, refreshToken } = await exchangeCodeForTokens(code);

// Refresh access token
const { accessToken } = await refreshAccessToken(encryptedRefreshToken);

// Encrypt/decrypt tokens
const encrypted = encryptToken(refreshToken);
const decrypted = decryptToken(encrypted);
```

### Calendar Service (`calendar.service.ts`)

```typescript
// Create event with Meet link
const event = await createCalendarEventWithMeet(
  accessToken,
  encryptedRefreshToken,
  {
    summary: 'Math Class',
    startTime: '2026-05-15T10:00:00Z',
    endTime: '2026-05-15T11:00:00Z',
    timezone: 'Asia/Karachi',
  }
);

// With automatic token refresh
const { result, newAccessToken } = await executeWithTokenRefresh(
  (token, refresh) => createCalendarEventWithMeet(token, refresh, params),
  accessToken,
  encryptedRefreshToken,
  expiryDate
);
```

---

## 🎯 API Endpoints

### Connect Google Calendar
```typescript
// Frontend
const response = await fetch('/api/auth/google/calendar');
const { authUrl } = await response.json();
window.location.href = authUrl;
```

### Schedule Live Class
```typescript
// Frontend
const response = await fetch('/api/live/classes/schedule', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Math Class',
    startTime: '2026-05-15T10:00:00Z',
    endTime: '2026-05-15T11:00:00Z',
    timezone: 'Asia/Karachi',
    classId: 'class_123',
  }),
});
const { liveClass } = await response.json();
console.log(liveClass.meetingLink); // Google Meet link
```

---

## 🧩 React Components

### Connect Google Calendar
```tsx
import GoogleCalendarConnect from '@/components/live-class/GoogleCalendarConnect';

<GoogleCalendarConnect 
  onConnectionChange={(isConnected) => console.log(isConnected)} 
/>
```

### Schedule Live Class
```tsx
import ScheduleLiveClassForm from '@/components/live-class/ScheduleLiveClassForm';

<ScheduleLiveClassForm 
  classId="class_123"
  onSuccess={(liveClass) => console.log(liveClass.meetingLink)}
/>
```

### Display Live Class
```tsx
import LiveClassCard from '@/components/live-class/LiveClassCard';

<LiveClassCard 
  liveClass={liveClass}
  onDelete={(id) => console.log('Deleted:', id)}
/>
```

---

## 🗄️ Database Schema

### Teacher Model
```typescript
googleCalendar: {
  isConnected: Boolean,
  refreshToken: String,      // Encrypted, select: false
  accessToken: String,        // select: false
  tokenExpiryDate: Number,    // select: false
  email: String,
  connectedAt: Date,
  lastSyncedAt: Date
}
```

### LiveClass Model
```typescript
{
  title: String,
  description: String,
  startTime: Date,
  endTime: Date,
  timezone: String,
  meetingLink: String,
  meetingProvider: String,    // 'google_meet', 'zoom', 'manual'
  googleCalendarEventId: String,
  status: String,             // 'scheduled', 'started', 'ended', 'cancelled'
  teacher_id: ObjectId,
  class_id: ObjectId,
  tenant_id: ObjectId
}
```

---

## ⚠️ Common Errors & Solutions

### redirect_uri_mismatch
```
Solution: Add redirect URI to Google Cloud Console
→ APIs & Services → Credentials → OAuth 2.0 Client ID
→ Add: http://localhost:3000/api/auth/google/callback
```

### invalid_grant
```
Solution: User needs to reconnect Google Calendar
→ Refresh token expired or revoked
→ Delete stored tokens and reconnect
```

### Meet link not generated
```
Solution: Ensure conferenceDataVersion: 1 is set
→ Check calendar.service.ts line 45
→ Verify conferenceData object is included
```

### Token refresh fails
```
Solution: Check encryption key hasn't changed
→ Verify GOOGLE_TOKEN_ENCRYPTION_KEY in .env
→ User may need to reconnect
```

---

## 🔒 Security Checklist

- [ ] Refresh tokens encrypted before storage
- [ ] `select: false` on sensitive fields
- [ ] State parameter validated (CSRF protection)
- [ ] User authenticated before OAuth
- [ ] Tenant ID validated
- [ ] Rate limiting implemented
- [ ] Input validation on all endpoints
- [ ] HTTPS in production
- [ ] Error logging enabled

---

## 🧪 Testing Checklist

### OAuth Flow
- [ ] Teacher can initiate connection
- [ ] Consent screen shows correct scopes
- [ ] Callback handles code correctly
- [ ] Refresh token stored encrypted
- [ ] Connection status updated

### Live Class Scheduling
- [ ] Form validation works
- [ ] Calendar event created
- [ ] Meet link generated
- [ ] Link stored in database
- [ ] Students can see link

### Token Refresh
- [ ] Expired token refreshed automatically
- [ ] Invalid refresh token handled
- [ ] Errors handled gracefully

---

## 📊 Monitoring

### Key Metrics
- OAuth success rate
- Token refresh rate
- Calendar event creation time
- API error rate
- Meet link generation success rate

### What to Log
- OAuth flow initiation/completion
- Token refresh attempts/failures
- Calendar event creation success/failure
- API errors and rate limits
- User authentication errors

---

## 🚀 Production Deployment

### Environment Variables
```bash
# Production .env
GOOGLE_CLIENT_ID=prod_client_id
GOOGLE_CLIENT_SECRET=prod_client_secret
GOOGLE_REDIRECT_URI_PROD=https://yourdomain.com/api/auth/google/callback
GOOGLE_TOKEN_ENCRYPTION_KEY=strong_32_char_key_here
NODE_ENV=production
```

### Google Cloud Console
1. Add production redirect URI
2. Verify OAuth consent screen
3. Check API quotas
4. Enable error reporting

---

## 📚 Useful Commands

```bash
# Generate encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Test OAuth flow
curl http://localhost:3000/api/auth/google/calendar

# Check connection status
curl http://localhost:3000/api/auth/google/status

# Schedule class (with auth token)
curl -X POST http://localhost:3000/api/live/classes/schedule \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","startTime":"2026-05-15T10:00:00Z","endTime":"2026-05-15T11:00:00Z","classId":"123"}'
```

---

## 🔗 Quick Links

- [Google Cloud Console](https://console.cloud.google.com/)
- [Calendar API Docs](https://developers.google.com/calendar/api)
- [OAuth2 Playground](https://developers.google.com/oauthplayground/)
- [Implementation Guide](./GOOGLE_MEET_IMPLEMENTATION_GUIDE.md)
- [Setup Instructions](./GOOGLE_MEET_SETUP_INSTRUCTIONS.md)

---

## 💡 Pro Tips

1. **Cache access tokens** in memory to reduce API calls
2. **Use exponential backoff** for retries
3. **Log everything** during development
4. **Test token refresh** before production
5. **Monitor API quotas** in Google Cloud Console
6. **Set up alerts** for OAuth failures
7. **Document error codes** for support team
8. **Test with multiple users** before launch

---

**Last Updated**: May 12, 2026
**Version**: 1.0.0
