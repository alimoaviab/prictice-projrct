# Google Meet Integration - Quick Commands

**All commands you need to get started**

---

## 🚀 Installation & Setup

### 1. Install Dependencies
```bash
npm install googleapis crypto-js date-fns
```

### 2. Verify Installation
```bash
npm list googleapis crypto-js date-fns
```

### 3. Generate Encryption Key
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🔧 Development

### Start Development Server
```bash
npm run dev:school
```

### Build Project
```bash
npm run build
```

### Run Tests
```bash
npm run test
```

### Lint Code
```bash
npm run lint
```

---

## 🧪 Testing

### Test OAuth Flow
```bash
curl http://localhost:3000/api/auth/google/calendar
```

### Check Connection Status
```bash
curl http://localhost:3000/api/auth/google/status
```

### Schedule Live Class
```bash
curl -X POST http://localhost:3000/api/live/classes/schedule \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Class",
    "startTime": "2026-05-15T10:00:00Z",
    "endTime": "2026-05-15T11:00:00Z",
    "timezone": "Asia/Karachi",
    "classId": "class_123"
  }'
```

### Disconnect Google Calendar
```bash
curl -X POST http://localhost:3000/api/auth/google/disconnect
```

---

## 📁 File Locations

### Backend Services
```
shared/services/google/
├── oauth2-helper.ts
└── calendar.service.ts
```

### API Routes
```
school-app/app/api/
├── auth/google/
│   ├── calendar/route.ts
│   ├── callback/route.ts
│   ├── disconnect/route.ts
│   └── status/route.ts
└── live/classes/
    └── schedule/route.ts
```

### React Components
```
school-app/components/live-class/
├── GoogleCalendarConnect.tsx
├── ScheduleLiveClassForm.tsx
└── LiveClassCard.tsx
```

### Database Models
```
shared/models/
├── teacher.model.ts
└── live/live-class.model.ts
```

---

## 🔐 Environment Variables

### Generate Encryption Key
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Add to `.env.local`
```env
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
GOOGLE_REDIRECT_URI_PROD=https://yourdomain.com/api/auth/google/callback
GOOGLE_TOKEN_ENCRYPTION_KEY=your_32_char_key
```

---

## 📊 Database

### Check Teacher Model
```bash
# View teacher with Google Calendar fields
db.teachers.findOne({ _id: ObjectId("...") })
```

### Check LiveClass Model
```bash
# View live class with meeting details
db.liveClasses.findOne({ _id: ObjectId("...") })
```

---

## 🐛 Debugging

### Enable Debug Logging
```bash
DEBUG=* npm run dev:school
```

### Check Logs
```bash
# View recent logs
tail -f logs/app.log

# Search for errors
grep "ERROR" logs/app.log

# Search for Google OAuth logs
grep "Google OAuth" logs/app.log
```

### Test Token Encryption
```bash
node -e "
const CryptoJS = require('crypto-js');
const key = 'your_encryption_key';
const token = 'test_token';
const encrypted = CryptoJS.AES.encrypt(token, key).toString();
const decrypted = CryptoJS.AES.decrypt(encrypted, key).toString(CryptoJS.enc.Utf8);
console.log('Original:', token);
console.log('Encrypted:', encrypted);
console.log('Decrypted:', decrypted);
"
```

---

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Start Production Server
```bash
npm start
```

### Deploy to Vercel
```bash
vercel deploy --prod
```

### Deploy to Heroku
```bash
git push heroku main
```

---

## 📚 Documentation

### View All Documentation
```bash
# List all Google Meet docs
ls -la GOOGLE_MEET_*.md

# View specific doc
cat GOOGLE_MEET_IMPLEMENTATION_GUIDE.md
```

### Generate Documentation
```bash
# Create API documentation
npm run docs

# Generate TypeScript docs
npm run typedoc
```

---

## 🔍 Monitoring

### Monitor API Calls
```bash
# Watch for API errors
grep "ERROR" logs/app.log | tail -20

# Watch for OAuth errors
grep "OAuth" logs/app.log | tail -20

# Watch for Calendar API errors
grep "Calendar" logs/app.log | tail -20
```

### Check Performance
```bash
# Monitor response times
grep "duration" logs/app.log | tail -20

# Check API call count
grep "API call" logs/app.log | wc -l
```

---

## 🧹 Cleanup

### Remove Node Modules
```bash
rm -rf node_modules
npm install
```

### Clear Cache
```bash
npm cache clean --force
```

### Reset Database
```bash
# WARNING: This will delete all data
npm run db:reset
```

---

## 📦 Package Management

### Update Dependencies
```bash
npm update
```

### Check for Vulnerabilities
```bash
npm audit
```

### Fix Vulnerabilities
```bash
npm audit fix
```

### Check Outdated Packages
```bash
npm outdated
```

---

## 🔗 Useful Links

### Google Cloud Console
```
https://console.cloud.google.com/
```

### Google Calendar API
```
https://developers.google.com/calendar/api
```

### OAuth2.0 Playground
```
https://developers.google.com/oauthplayground/
```

### API Explorer
```
https://developers.google.com/calendar/api/v3/reference
```

---

## 💾 Backup & Restore

### Backup Database
```bash
mongodump --uri="mongodb+srv://user:pass@cluster.mongodb.net/eduplexo" --out=./backup
```

### Restore Database
```bash
mongorestore --uri="mongodb+srv://user:pass@cluster.mongodb.net/eduplexo" ./backup
```

---

## 🆘 Troubleshooting Commands

### Check Node Version
```bash
node --version
npm --version
```

### Check Port Usage
```bash
# Check if port 3000 is in use
lsof -i :3000

# Kill process on port 3000
kill -9 $(lsof -t -i :3000)
```

### Test Database Connection
```bash
node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected'))
  .catch(err => console.log('Error:', err));
"
```

### Test Google OAuth Config
```bash
node -e "
const oauth2Helper = require('./shared/services/google/oauth2-helper');
oauth2Helper.validateOAuthConfig();
console.log('OAuth config is valid!');
"
```

---

## 📝 Common Tasks

### Add New Teacher
```bash
# Via MongoDB
db.teachers.insertOne({
  school_id: ObjectId("..."),
  email: "teacher@example.com",
  first_name: "John",
  last_name: "Doe",
  employee_no: "T001",
  phone: "1234567890",
  googleCalendar: {
    isConnected: false
  }
})
```

### Create Test Live Class
```bash
# Via MongoDB
db.liveClasses.insertOne({
  school_id: ObjectId("..."),
  title: "Test Class",
  teacherId: ObjectId("..."),
  classId: ObjectId("..."),
  subjectId: ObjectId("..."),
  startTime: new Date("2026-05-15T10:00:00Z"),
  endTime: new Date("2026-05-15T11:00:00Z"),
  status: "SCHEDULED",
  createdBy: ObjectId("...")
})
```

---

## 🎯 Quick Start (Copy & Paste)

```bash
# 1. Install dependencies
npm install googleapis crypto-js date-fns

# 2. Generate encryption key
ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
echo "GOOGLE_TOKEN_ENCRYPTION_KEY=$ENCRYPTION_KEY"

# 3. Add to .env.local
echo "GOOGLE_TOKEN_ENCRYPTION_KEY=$ENCRYPTION_KEY" >> .env.local

# 4. Start dev server
npm run dev:school

# 5. Test OAuth
curl http://localhost:3000/api/auth/google/calendar
```

---

## 📞 Support Commands

### Get Help
```bash
npm help
npm help install
npm help start
```

### Check Project Info
```bash
npm list
npm info googleapis
npm info crypto-js
npm info date-fns
```

### View Package.json
```bash
cat package.json
```

---

**All commands are ready to use! Copy and paste as needed. 🚀**
