# Google Meet Integration - Setup Instructions

**Complete step-by-step guide to implement Google Meet in EduPlexo**

---

## Table of Contents

1. [Google Cloud Setup](#google-cloud-setup)
2. [Environment Configuration](#environment-configuration)
3. [Database Schema Updates](#database-schema-updates)
4. [Install Dependencies](#install-dependencies)
5. [Test the Implementation](#test-the-implementation)
6. [Troubleshooting](#troubleshooting)

---

## Google Cloud Setup

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name: "EduPlexo" (or your choice)
4. Click "Create"

### Step 2: Enable Google Calendar API

1. In the Google Cloud Console, go to "APIs & Services" → "Library"
2. Search for "Google Calendar API"
3. Click on it and click "Enable"

### Step 3: Configure OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Select "External" (or "Internal" if using Google Workspace)
3. Click "Create"
4. Fill in the required fields:
   - **App name**: EduPlexo
   - **User support email**: your-email@example.com
   - **Developer contact**: your-email@example.com
5. Click "Save and Continue"
6. **Scopes**: Click "Add or Remove Scopes"
   - Search and add: `https://www.googleapis.com/auth/calendar.events`
   - Search and add: `https://www.googleapis.com/auth/userinfo.email`
7. Click "Save and Continue"
8. **Test users** (for development):
   - Add your test email addresses
   - Click "Save and Continue"
9. Click "Back to Dashboard"

### Step 4: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Select "Web application"
4. Enter name: "EduPlexo Web Client"
5. **Authorized redirect URIs**:
   - For development: `http://localhost:3000/api/auth/google/callback`
   - For production: `https://yourdomain.com/api/auth/google/callback`
6. Click "Create"
7. **IMPORTANT**: Copy your Client ID and Client Secret
   - Save them securely - you'll need them for environment variables

---

## Environment Configuration

### Step 1: Update Root `.env.local`

Add these variables to `/Users/ali/Desktop/EDUEXPLO/Eduplexo/.env.local`:

```env
# Google OAuth2.0 Configuration
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
GOOGLE_REDIRECT_URI_PROD=https://yourdomain.com/api/auth/google/callback

# Encryption key for storing refresh tokens (32+ characters)
GOOGLE_TOKEN_ENCRYPTION_KEY=your_32_character_encryption_key_here_12345
```

### Step 2: Update School App `.env.local`

Add the same variables to `/Users/ali/Desktop/EDUEXPLO/Eduplexo/school-app/.env.local`:

```env
# Google OAuth2.0 Configuration
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
GOOGLE_REDIRECT_URI_PROD=https://yourdomain.com/api/auth/google/callback

# Encryption key for storing refresh tokens
GOOGLE_TOKEN_ENCRYPTION_KEY=your_32_character_encryption_key_here_12345
```

### Step 3: Generate Encryption Key

You can generate a secure encryption key using Node.js:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and use it as your `GOOGLE_TOKEN_ENCRYPTION_KEY`.

---

## Database Schema Updates

### Step 1: Update Teacher Model

Add to `shared/models/teacher.model.ts`:

```typescript
// Add this to your Teacher schema
googleCalendar: {
  isConnected: { type: Boolean, default: false },
  refreshToken: { type: String, select: false }, // Encrypted, not returned by default
  accessToken: { type: String, select: false },  // Temporary, will be refreshed
  tokenExpiryDate: { type: Number, select: false }, // Timestamp
  email: { type: String }, // Google account email
  connectedAt: { type: Date },
  lastSyncedAt: { type: Date }
}
```

### Step 2: Update LiveClass Model

Add to `shared/models/live-class.model.ts`:

```typescript
// Add these fields to your LiveClass schema
meetingLink: { type: String },
meetingProvider: { 
  type: String, 
  enum: ['google_meet', 'zoom', 'manual'], 
  default: 'google_meet' 
},
googleCalendarEventId: { type: String }, // For updating/deleting events
meetingStatus: { 
  type: String, 
  enum: ['scheduled', 'started', 'ended', 'cancelled'], 
  default: 'scheduled' 
},
timezone: { type: String, default: 'UTC' }
```

---

## Install Dependencies

### Step 1: Install Required Packages

```bash
cd /Users/ali/Desktop/EDUEXPLO/Eduplexo

# Install googleapis and crypto-js
npm install googleapis crypto-js

# Install date-fns for date handling (if not already installed)
npm install date-fns

# Install types
npm install --save-dev @types/crypto-js
```

### Step 2: Verify Installation

```bash
npm list googleapis crypto-js date-fns
```

You should see the installed versions.

---

## Test the Implementation

### Step 1: Start Development Server

```bash
cd /Users/ali/Desktop/EDUEXPLO/Eduplexo
npm run dev:school
```

### Step 2: Test OAuth Flow

1. Navigate to: `http://localhost:3000/admin/live-classes`
2. You should see the "Connect Google Calendar" component
3. Click "Connect Google Calendar"
4. You should be redirected to Google's consent screen
5. Grant permissions
6. You should be redirected back with success message

### Step 3: Test Live Class Scheduling

1. After connecting Google Calendar, click "Schedule Live Class"
2. Fill in the form:
   - Title: "Test Math Class"
   - Date: Tomorrow's date
   - Start Time: 10:00 AM
   - End Time: 11:00 AM
3. Click "Schedule Live Class"
4. You should see:
   - Success message
   - Google Meet link generated
   - Event created in your Google Calendar

### Step 4: Verify in Google Calendar

1. Open [Google Calendar](https://calendar.google.com/)
2. You should see the event you just created
3. Click on it - it should have a Google Meet link

---

## API Endpoints Reference

### 1. Initiate OAuth Flow
```
GET /api/auth/google/calendar
```

**Response:**
```json
{
  "success": true,
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?..."
}
```

### 2. OAuth Callback (handled automatically)
```
GET /api/auth/google/callback?code=xxx&state=xxx
```

### 3. Check Connection Status
```
GET /api/auth/google/status
```

**Response:**
```json
{
  "isConnected": true,
  "email": "teacher@example.com"
}
```

### 4. Schedule Live Class
```
POST /api/live/classes/schedule
```

**Request:**
```json
{
  "title": "Math Class",
  "description": "Algebra lesson",
  "startTime": "2026-05-15T10:00:00Z",
  "endTime": "2026-05-15T11:00:00Z",
  "timezone": "Asia/Karachi",
  "classId": "class_123",
  "notifyStudents": true
}
```

**Response:**
```json
{
  "success": true,
  "liveClass": {
    "_id": "live_class_789",
    "title": "Math Class",
    "meetingLink": "https://meet.google.com/abc-defg-hij",
    "startTime": "2026-05-15T10:00:00Z",
    "endTime": "2026-05-15T11:00:00Z",
    "status": "scheduled"
  }
}
```

### 5. Disconnect Google Calendar
```
POST /api/auth/google/disconnect
```

**Response:**
```json
{
  "success": true,
  "message": "Google Calendar disconnected successfully"
}
```

---

## Troubleshooting

### Issue: "redirect_uri_mismatch" Error

**Cause**: The redirect URI in your request doesn't match the one configured in Google Cloud Console.

**Solution**:
1. Go to Google Cloud Console → Credentials
2. Click on your OAuth 2.0 Client ID
3. Add your redirect URI to "Authorized redirect URIs"
4. Make sure it matches exactly (including http/https and port)
5. Wait a few minutes for changes to propagate

### Issue: "invalid_grant" Error

**Cause**: Refresh token has expired or been revoked.

**Solution**:
1. User needs to disconnect and reconnect Google Calendar
2. Make sure `prompt: 'consent'` is set in OAuth URL generation
3. Check that `access_type: 'offline'` is set

### Issue: Meet Link Not Generated

**Cause**: `conferenceDataVersion: 1` not set or conference data not included.

**Solution**:
1. Verify `conferenceDataVersion: 1` is set in the API call
2. Verify `conferenceData` object is included in event creation
3. Check that Google Calendar API is enabled
4. Verify OAuth scope includes `calendar.events`

### Issue: "Insufficient Permissions" Error

**Cause**: OAuth scope doesn't include calendar.events.

**Solution**:
1. Check that `https://www.googleapis.com/auth/calendar.events` is in the scopes
2. User needs to disconnect and reconnect with proper permissions
3. Verify OAuth consent screen has the correct scopes

### Issue: Token Refresh Fails

**Cause**: Refresh token is invalid or encryption key changed.

**Solution**:
1. Verify `GOOGLE_TOKEN_ENCRYPTION_KEY` hasn't changed
2. Check that refresh token is stored correctly in database
3. User may need to reconnect Google Calendar
4. Check error logs for specific error message

### Issue: "Rate Limit Exceeded" Error

**Cause**: Too many API requests to Google Calendar API.

**Solution**:
1. Implement rate limiting on your endpoints
2. Use exponential backoff for retries
3. Cache access tokens to reduce token refresh calls
4. Check Google Cloud Console for quota limits

---

## Security Best Practices

### 1. Token Storage
- ✅ Always encrypt refresh tokens before storing
- ✅ Use `select: false` on sensitive fields
- ✅ Never send refresh tokens to frontend
- ✅ Rotate encryption keys periodically

### 2. OAuth Flow
- ✅ Validate state parameter to prevent CSRF
- ✅ Set state expiration (10 minutes recommended)
- ✅ Verify user is authenticated before OAuth
- ✅ Validate tenant_id to prevent cross-tenant access

### 3. API Security
- ✅ Implement rate limiting
- ✅ Validate all input data
- ✅ Use HTTPS in production
- ✅ Log security events

### 4. Error Handling
- ✅ Don't expose sensitive error details to users
- ✅ Log errors for debugging
- ✅ Handle token expiration gracefully
- ✅ Provide user-friendly error messages

---

## Production Deployment Checklist

### Before Deploying

- [ ] Update `GOOGLE_REDIRECT_URI_PROD` with production URL
- [ ] Add production redirect URI to Google Cloud Console
- [ ] Set strong `GOOGLE_TOKEN_ENCRYPTION_KEY` (32+ characters)
- [ ] Enable error logging and monitoring
- [ ] Test OAuth flow in production environment
- [ ] Verify HTTPS is enabled
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Test token refresh logic
- [ ] Verify encryption/decryption works
- [ ] Test error scenarios
- [ ] Submit OAuth consent screen for verification (if needed)

### After Deploying

- [ ] Monitor OAuth success rate
- [ ] Monitor API error rate
- [ ] Check token refresh logs
- [ ] Verify Meet links are generated
- [ ] Gather user feedback
- [ ] Monitor Google API quota usage

---

## Additional Resources

### Google Documentation
- [Google Calendar API](https://developers.google.com/calendar/api/guides/overview)
- [OAuth2.0 for Web Apps](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Conference Data](https://developers.google.com/calendar/api/guides/conference)
- [API Reference](https://developers.google.com/calendar/api/v3/reference)

### Useful Tools
- [Google Cloud Console](https://console.cloud.google.com/)
- [OAuth2.0 Playground](https://developers.google.com/oauthplayground/)
- [API Explorer](https://developers.google.com/calendar/api/v3/reference)

---

## Support

If you encounter any issues:

1. Check the troubleshooting section above
2. Review the error logs
3. Check Google Cloud Console for API errors
4. Verify environment variables are set correctly
5. Test with OAuth2.0 Playground to isolate issues

---

**Status**: Ready for Implementation
**Last Updated**: May 12, 2026
**Version**: 1.0.0
