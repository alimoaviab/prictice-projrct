# Domain Management - Quick Start Guide (اردو)

## 🚀 فوری شروعات

### 1. Dependencies Install کریں

```bash
cd /Users/ali/Desktop/EDUEXPLO/Eduplexo
npm install
```

### 2. Environment Variables Setup کریں

`.env` file بنائیں:

```bash
# Cloudflare Configuration
CLOUDFLARE_API_TOKEN=cfut_sYb9ZEoAJVpilqxv1988wHPriNIMGXFtwgs5m5VK7d8c7fea

# SSL Configuration
SSL_EMAIL=your-email@example.com
SSL_STAGING=false

# Server Configuration
SERVER_IP=your_server_ip_here
```

### 3. Token Verify کریں

```bash
curl "https://api.cloudflare.com/client/v4/user/tokens/verify" \
  -H "Authorization: Bearer cfut_sYb9ZEoAJVpilqxv1988wHPriNIMGXFtwgs5m5VK7d8c7fea"
```

---

## 📝 استعمال

### نیا Domain Setup کریں

```bash
npm run domain:setup example.com
```

یہ کرے گا:
- ✅ Cloudflare میں zone بنائے گا
- ✅ DNS records configure کرے گا
- ✅ SSL certificate حاصل کرے گا
- ✅ Auto-renewal setup کرے گا

### Domain Status Check کریں

```bash
npm run domain:check example.com
```

### Domain Issues Auto-Fix کریں

```bash
npm run domain:fix example.com
```

### SSL Certificates Renew کریں

```bash
npm run ssl:renew
```

---

## 🔧 Code میں استعمال

```typescript
import { DomainManagerService } from './shared/services/domain/domain-manager.service';

// Initialize
const manager = new DomainManagerService(
  process.env.CLOUDFLARE_API_TOKEN!,
  process.env.SSL_EMAIL!,
  false // production mode
);

await manager.initialize();

// Setup domain
await manager.setupDomain({
  domain: 'myapp.com',
  serverIP: '1.2.3.4',
  email: 'admin@myapp.com',
});

// Auto-monitoring شروع کریں (ہر 24 گھنٹے)
manager.startAutoMonitoring([
  { domain: 'myapp.com', serverIP: '1.2.3.4', email: 'admin@myapp.com' },
], 24);
```

---

## 📁 Files Structure

```
shared/services/
├── cloudflare/cloudflare.service.ts    # DNS management
├── ssl/acme.service.ts                 # SSL certificates
└── domain/domain-manager.service.ts    # Complete automation

scripts/
├── setup-domain.ts      # نیا domain setup
├── check-domain.ts      # Status check
├── auto-fix-domain.ts   # Auto-fix issues
└── renew-ssl.ts         # SSL renewal

certificates/            # SSL certificates یہاں save ہوں گے
└── example.com/
    ├── certificate.pem
    ├── private-key.pem
    └── chain.pem
```

---

## ✅ Features

### Cloudflare DNS
- ✅ Zone management
- ✅ DNS records (A, CNAME, TXT, MX)
- ✅ Automatic proxy (SSL included)
- ✅ Nameserver configuration

### Let's Encrypt SSL
- ✅ Automatic certificate generation
- ✅ DNS-01 challenge (via Cloudflare)
- ✅ Auto-renewal (30 days before expiry)
- ✅ Certificate storage

### Auto-Fix & Monitoring
- ✅ Automatic issue detection
- ✅ Self-healing loops
- ✅ 24/7 monitoring
- ✅ Email notifications (optional)

---

## 🔄 Automatic Renewal

SSL certificates خودکار طور پر renew ہوں گے:
- Certificate expire ہونے سے 30 دن پہلے
- Daily cron job کے ذریعے
- Monitoring loop میں

### Cron Job Setup

```bash
# ہر روز صبح 3 بجے SSL renew کریں
0 3 * * * cd /path/to/project && npm run ssl:renew >> /var/log/ssl-renewal.log 2>&1
```

---

## 🐛 مسائل اور حل

### مسئلہ: Token verify نہیں ہو رہا

**حل:**
```bash
# Token check کریں
curl "https://api.cloudflare.com/client/v4/user/tokens/verify" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Token permissions check کریں:
# - Zone:Read ✅
# - Zone:Edit ✅
# - DNS:Read ✅
# - DNS:Edit ✅
```

### مسئلہ: DNS propagate نہیں ہو رہا

**حل:**
```bash
# Nameservers check کریں
dig example.com NS

# 24-48 گھنٹے انتظار کریں
# Testing کے لیے staging mode استعمال کریں:
SSL_STAGING=true npm run domain:setup example.com
```

### مسئلہ: SSL challenge fail ہو رہا

**حل:**
```bash
# پہلے DNS active ہونا ضروری ہے
npm run domain:check example.com

# DNS propagation check کریں
dig _acme-challenge.example.com TXT

# DNS active ہونے کے بعد دوبارہ try کریں
npm run domain:fix example.com
```

---

## 📊 Monitoring Setup

```typescript
// Express/Next.js API میں health check endpoint
app.get('/api/health/domains', async (req, res) => {
  const status = await manager.checkDomainStatus('example.com');
  res.json({ 
    dns: status.dnsConfigured,
    ssl: status.sslConfigured,
    expires: status.sslExpiresAt 
  });
});
```

---

## 🔒 Security

1. **API tokens کبھی commit نہ کریں**
   ```bash
   # .gitignore میں add کریں
   .env
   .env.local
   .env.production
   ```

2. **Testing کے لیے staging استعمال کریں**
   ```env
   SSL_STAGING=true
   ```

3. **Certificates secure رکھیں**
   ```bash
   chmod 600 certificates/*/private-key.pem
   ```

---

## 📞 مدد

مسائل کے لیے:
1. Console logs check کریں
2. Environment variables verify کریں
3. Cloudflare dashboard check کریں
4. Documentation پڑھیں: `CLOUDFLARE_SSL_SETUP.md`

---

## ✨ مثال: مکمل Setup

```typescript
import { DomainManagerService } from './shared/services/domain/domain-manager.service';

async function main() {
  const manager = new DomainManagerService(
    'cfut_sYb9ZEoAJVpilqxv1988wHPriNIMGXFtwgs5m5VK7d8c7fea',
    'admin@myapp.com',
    false
  );

  await manager.initialize();

  // Domain setup
  await manager.setupDomain({
    domain: 'myapp.com',
    serverIP: '1.2.3.4',
    email: 'admin@myapp.com',
  });

  // Monitoring شروع کریں
  manager.startAutoMonitoring([
    { domain: 'myapp.com', serverIP: '1.2.3.4', email: 'admin@myapp.com' },
  ], 24);

  console.log('✅ Domain management active!');
}

main();
```

---

**Status:** ✅ Production Ready  
**تاریخ:** 12 مئی 2026
