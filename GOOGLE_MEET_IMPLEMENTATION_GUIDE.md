# Google Meet Integration - Complete Implementation Guide

**Project**: EduPlexo School Management System
**Feature**: Live Class with Google Meet Integration
**Date**: May 12, 2026

---

## Overview

This guide provides a complete implementation for integrating Google Meet into the Live Class feature using Google Calendar API with OAuth2.0 authentication.

---

## Prerequisites

1. ✅ Google Cloud Project created
2. ✅ Client ID and Client Secret obtained
3. ✅ OAuth2.0 consent screen configured
4. ✅ Google Calendar API enabled
5. ✅ Redirect URI configured in Google Cloud Console

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         FLOW DIAGRAM                            │
└─────────────────────────────────────────────────────────────────┘

1. Teacher clicks "Connect Google Calendar"
   ↓
2. Backend redirects to Google OAuth consent screen
   ↓
3. Teacher grants calendar.events permission
   ↓
4. Google redirects back with authorization code
   ↓
5. Backend exchanges code for access_token & refresh_token
   ↓
6. Backend stores refresh_token in database (encrypted)
   ↓
7. Teacher schedules a live class
   ↓
8. Backend creates Google Calendar event with Meet link
   ↓
9. Meet link returned and displayed to teacher
   ↓
10. Students can join via the Meet link
```

---

## Database Schema

### Add to Teacher Model

```javascript
// Add these fields to your Teacher schema
{
  googleCalendar: {
    isConnected: { type: Boolean, default: false },
    refreshToken: { type: String, select: false }, // Encrypted
    email: { type: String }, // Google account email
    connectedAt: { type: Date },
    lastSyncedAt: { type: Date }
  }
}
```

### Add to LiveClass Model

```javascript
// Add these fields to your LiveClass schema
{
  meetingLink: { type: String },
  meetingProvider: { type: String, enum: ['google_meet', 'zoom', 'manual'], default: 'google_meet' },
  googleCalendarEventId: { type: String }, // For updating/deleting events
  meetingStatus: { type: String, enum: ['scheduled', 'started', 'ended', 'cancelled'], default: 'scheduled' }
}
```

---

## Environment Variables

Add to your `.env` file:

```env
# Google OAuth2.0 Configuration
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
GOOGLE_REDIRECT_URI_PROD=https://yourdomain.com/api/auth/google/callback

# Encryption key for storing refresh tokens
GOOGLE_TOKEN_ENCRYPTION_KEY=your_32_character_encryption_key_here
```

---

## Implementation Steps

### Step 1: Install Dependencies

```bash
npm install googleapis crypto-js
```

### Step 2: Create OAuth2 Helper

File: `shared/services/google/oauth2-helper.ts`

### Step 3: Create Google Calendar Service

File: `shared/services/google/calendar.service.ts`

### Step 4: Create API Routes

Files:
- `school-app/app/api/auth/google/route.ts` - Initiate OAuth
- `school-app/app/api/auth/google/callback/route.ts` - Handle callback
- `school-app/app/api/live/classes/schedule/route.ts` - Schedule class

### Step 5: Create Frontend Components

Files:
- `school-app/components/live-class/GoogleCalendarConnect.tsx`
- `school-app/components/live-class/ScheduleLiveClassForm.tsx`
- `school-app/components/live-class/LiveClassCard.tsx`

---

## Security Considerations

### 1. Token Storage
- ✅ Store refresh_token encrypted in database
- ✅ Use `select: false` to prevent accidental exposure
- ✅ Never send refresh_token to frontend
- ✅ Use environment variable for encryption key

### 2. Token Refresh
- ✅ Implement automatic token refresh when expired
- ✅ Handle token refresh errors gracefully
- ✅ Re-authenticate if refresh token is invalid

### 3. API Security
- ✅ Verify user authentication before OAuth flow
- ✅ Validate tenant_id to prevent cross-tenant access
- ✅ Rate limit OAuth endpoints
- ✅ Validate all input data

### 4. Error Handling
- ✅ Handle OAuth errors (user denied, invalid grant)
- ✅ Handle API errors (quota exceeded, network errors)
- ✅ Provide user-friendly error messages
- ✅ Log errors for debugging

---

## Testing Checklist

### OAuth Flow
- [ ] Teacher can initiate Google Calendar connection
- [ ] Consent screen shows correct scopes
- [ ] Callback handles authorization code correctly
- [ ] Refresh token is stored encrypted
- [ ] Connection status is updated in database

### Live Class Scheduling
- [ ] Teacher can schedule a class with date/time
- [ ] Google Calendar event is created successfully
- [ ] Meet link is generated and returned
- [ ] Meet link is stored in database
- [ ] Students can see the Meet link

### Token Refresh
- [ ] Expired access token is automatically refreshed
- [ ] Invalid refresh token triggers re-authentication
- [ ] Token refresh errors are handled gracefully

### Error Scenarios
- [ ] User denies OAuth consent
- [ ] Invalid credentials
- [ ] Network errors
- [ ] API quota exceeded
- [ ] Invalid date/time format

---

## API Endpoints

### 1. Initiate OAuth Flow
```
GET /api/auth/google/calendar
```

**Response:**
```json
{
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?..."
}
```

### 2. OAuth Callback
```
GET /api/auth/google/callback?code=xxx&state=xxx
```

**Response:**
```json
{
  "success": true,
  "message": "Google Calendar connected successfully",
  "email": "teacher@example.com"
}
```

### 3. Schedule Live Class
```
POST /api/live/classes/schedule
```

**Request:**
```json
{
  "title": "Math Class - Grade 10",
  "description": "Algebra and Geometry",
  "startTime": "2026-05-15T10:00:00Z",
  "endTime": "2026-05-15T11:00:00Z",
  "timezone": "Asia/Karachi",
  "classId": "class_123",
  "subjectId": "subject_456"
}
```

**Response:**
```json
{
  "success": true,
  "liveClass": {
    "_id": "live_class_789",
    "title": "Math Class - Grade 10",
    "meetingLink": "https://meet.google.com/abc-defg-hij",
    "startTime": "2026-05-15T10:00:00Z",
    "endTime": "2026-05-15T11:00:00Z",
    "status": "scheduled"
  }
}
```

### 4. Get Live Classes
```
GET /api/live/classes?classId=class_123
```

**Response:**
```json
{
  "success": true,
  "liveClasses": [
    {
      "_id": "live_class_789",
      "title": "Math Class - Grade 10",
      "meetingLink": "https://meet.google.com/abc-defg-hij",
      "startTime": "2026-05-15T10:00:00Z",
      "status": "scheduled"
    }
  ]
}
```

---

## Frontend Integration

### 1. Connect Google Calendar

```tsx
import GoogleCalendarConnect from '@/components/live-class/GoogleCalendarConnect';

function TeacherDashboard() {
  return (
    <div>
      <h1>Live Classes</h1>
      <GoogleCalendarConnect />
    </div>
  );
}
```

### 2. Schedule Live Class

```tsx
import ScheduleLiveClassForm from '@/components/live-class/ScheduleLiveClassForm';

function ScheduleClassPage() {
  return (
    <div>
      <h1>Schedule Live Class</h1>
      <ScheduleLiveClassForm classId="class_123" />
    </div>
  );
}
```

### 3. Display Live Classes

```tsx
import LiveClassCard from '@/components/live-class/LiveClassCard';

function LiveClassList({ classes }) {
  return (
    <div>
      {classes.map(liveClass => (
        <LiveClassCard key={liveClass._id} liveClass={liveClass} />
      ))}
    </div>
  );
}
```

---

## Troubleshooting

### Issue: "redirect_uri_mismatch" Error

**Solution:**
1. Go to Google Cloud Console
2. Navigate to APIs & Services > Credentials
3. Click on your OAuth 2.0 Client ID
4. Add your redirect URI to "Authorized redirect URIs"
5. Make sure it matches exactly (including http/https and trailing slash)

### Issue: "invalid_grant" Error

**Solution:**
- Refresh token has expired or been revoked
- User needs to re-authenticate
- Delete stored refresh_token and reconnect

### Issue: Meet Link Not Generated

**Solution:**
1. Ensure `conferenceDataVersion: 1` is set in the request
2. Ensure `conferenceData` is included in the event
3. Check that Google Calendar API is enabled
4. Verify OAuth scope includes `calendar.events`

### Issue: Token Refresh Fails

**Solution:**
1. Check that refresh_token is stored correctly
2. Verify encryption/decryption is working
3. Check that GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are correct
4. User may need to re-authenticate

---

## Performance Optimization

### 1. Caching
- Cache access tokens in memory (expires in 1 hour)
- Cache teacher's Google Calendar connection status
- Use Redis for distributed caching in production

### 2. Rate Limiting
- Implement rate limiting on OAuth endpoints
- Limit API calls to Google Calendar API
- Use exponential backoff for retries

### 3. Background Jobs
- Schedule class creation in background queue
- Send notifications asynchronously
- Update calendar events in background

---

## Monitoring & Logging

### What to Log
- OAuth flow initiation and completion
- Token refresh attempts and failures
- Calendar event creation success/failure
- API errors and rate limit hits
- User authentication errors

### Metrics to Track
- OAuth success rate
- Token refresh rate
- Calendar event creation time
- API error rate
- Meet link generation success rate

---

## Production Deployment

### Before Deploying

1. ✅ Update GOOGLE_REDIRECT_URI to production URL
2. ✅ Add production redirect URI to Google Cloud Console
3. ✅ Set strong GOOGLE_TOKEN_ENCRYPTION_KEY
4. ✅ Enable error logging and monitoring
5. ✅ Test OAuth flow in production environment
6. ✅ Set up rate limiting
7. ✅ Configure CORS properly
8. ✅ Test token refresh logic
9. ✅ Verify encryption/decryption works
10. ✅ Test error scenarios

### Post-Deployment

1. Monitor OAuth success rate
2. Monitor API error rate
3. Check token refresh logs
4. Verify Meet links are generated
5. Gather user feedback

---

## Next Steps

1. Implement the code files (provided separately)
2. Test OAuth flow locally
3. Test live class scheduling
4. Test token refresh logic
5. Deploy to staging
6. Test in staging environment
7. Deploy to production
8. Monitor and optimize

---

## Support & Resources

### Google Documentation
- [Google Calendar API](https://developers.google.com/calendar/api/guides/overview)
- [OAuth2.0 for Web Apps](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Conference Data](https://developers.google.com/calendar/api/guides/conference)

### Useful Links
- [Google Cloud Console](https://console.cloud.google.com/)
- [OAuth2.0 Playground](https://developers.google.com/oauthplayground/)
- [API Explorer](https://developers.google.com/calendar/api/v3/reference)

---

**Status**: Ready for Implementation
**Last Updated**: May 12, 2026
**Version**: 1.0.0
