# Cloudflare DNS + Let's Encrypt SSL - Complete Setup Guide

## 📋 Overview

Complete automation system for managing custom domains with:
- ✅ Cloudflare DNS management
- ✅ Let's Encrypt SSL certificates (ACME protocol)
- ✅ Automatic renewal (30 days before expiry)
- ✅ Auto-fix and monitoring loops
- ✅ Production-ready code

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd /Users/ali/Desktop/EDUEXPLO/Eduplexo

npm install acme-client axios dotenv
npm install --save-dev @types/node ts-node
```

### 2. Configure Environment Variables

Create `.env` file:

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Cloudflare Configuration
CLOUDFLARE_API_TOKEN=cfut_sYb9ZEoAJVpilqxv1988wHPriNIMGXFtwgs5m5VK7d8c7fea
CLOUDFLARE_ACCOUNT_ID=your_account_id

# SSL Configuration
SSL_EMAIL=your-email@example.com
SSL_STAGING=false

# Server Configuration
SERVER_IP=your_server_ip_here
```

### 3. Verify Cloudflare Token

```bash
curl "https://api.cloudflare.com/client/v4/user/tokens/verify" \
  -H "Authorization: Bearer cfut_sYb9ZEoAJVpilqxv1988wHPriNIMGXFtwgs5m5VK7d8c7fea"
```

Expected response:
```json
{
  "success": true,
  "result": {
    "id": "...",
    "status": "active"
  }
}
```

---

## 📖 Usage

### Setup New Domain

```bash
ts-node scripts/setup-domain.ts example.com
```

This will:
1. ✅ Create Cloudflare zone (if needed)
2. ✅ Configure DNS records (A records for root and www)
3. ✅ Wait for DNS propagation
4. ✅ Obtain SSL certificate from Let's Encrypt
5. ✅ Save certificate to disk

### Check Domain Status

```bash
ts-node scripts/check-domain.ts example.com
```

Output:
```
📊 DOMAIN STATUS REPORT
============================================================
Domain: example.com
DNS Configured: ✅
SSL Configured: ✅
SSL Expires: 2026-08-10T12:00:00.000Z (90 days)
============================================================
```

### Auto-Fix Domain Issues

```bash
ts-node scripts/auto-fix-domain.ts example.com
```

This will:
- Check DNS configuration
- Check SSL certificate
- Fix any issues automatically
- Renew SSL if expiring soon

### Renew All SSL Certificates

```bash
ts-node scripts/renew-ssl.ts
```

This will:
- Check all certificates
- Renew those expiring in < 30 days
- Skip those still valid

---

## 🔧 API Usage

### Basic Usage

```typescript
import { DomainManagerService } from './shared/services/domain/domain-manager.service';

async function setupDomain() {
  // Initialize
  const domainManager = new DomainManagerService(
    process.env.CLOUDFLARE_API_TOKEN!,
    process.env.SSL_EMAIL!,
    false // staging = false for production
  );

  await domainManager.initialize();

  // Setup domain
  const success = await domainManager.setupDomain({
    domain: 'example.com',
    serverIP: '1.2.3.4',
    email: 'admin@example.com',
  });

  console.log('Setup success:', success);
}
```

### Check Status

```typescript
const status = await domainManager.checkDomainStatus('example.com');

console.log('DNS:', status.dnsConfigured);
console.log('SSL:', status.sslConfigured);
console.log('Expires:', status.sslExpiresAt);
```

### Auto-Fix

```typescript
await domainManager.autoFixDomain({
  domain: 'example.com',
  serverIP: '1.2.3.4',
  email: 'admin@example.com',
});
```

### Start Monitoring Loop

```typescript
const domains = [
  { domain: 'example.com', serverIP: '1.2.3.4', email: 'admin@example.com' },
  { domain: 'another.com', serverIP: '1.2.3.4', email: 'admin@another.com' },
];

// Check every 24 hours
domainManager.startAutoMonitoring(domains, 24);
```

---

## 📁 File Structure

```
shared/services/
├── cloudflare/
│   └── cloudflare.service.ts      # Cloudflare DNS management
├── ssl/
│   └── acme.service.ts            # Let's Encrypt SSL
└── domain/
    └── domain-manager.service.ts  # Complete domain management

scripts/
├── setup-domain.ts                # Setup new domain
├── check-domain.ts                # Check domain status
├── auto-fix-domain.ts             # Auto-fix issues
└── renew-ssl.ts                   # Renew SSL certificates

certificates/                      # SSL certificates storage
└── example.com/
    ├── certificate.pem
    ├── private-key.pem
    ├── chain.pem
    └── metadata.json
```

---

## 🔐 Cloudflare API Features

### DNS Management

```typescript
import { CloudflareService } from './shared/services/cloudflare/cloudflare.service';

const cloudflare = new CloudflareService({
  apiToken: process.env.CLOUDFLARE_API_TOKEN!,
});

// Verify token
await cloudflare.verifyToken();

// List zones
const zones = await cloudflare.listZones();

// Get zone ID
const zoneId = await cloudflare.getZoneId('example.com');

// Create DNS record
await cloudflare.createDNSRecord(zoneId, {
  type: 'A',
  name: 'example.com',
  content: '1.2.3.4',
  proxied: true,
});

// Update DNS record
await cloudflare.updateDNSRecord(zoneId, recordId, {
  content: '5.6.7.8',
});

// Delete DNS record
await cloudflare.deleteDNSRecord(zoneId, recordId);

// Upsert (create or update)
await cloudflare.upsertDNSRecord(zoneId, {
  type: 'A',
  name: 'example.com',
  content: '1.2.3.4',
});
```

---

## 🔒 SSL Certificate Features

### ACME Service

```typescript
import { ACMEService } from './shared/services/ssl/acme.service';

const acme = new ACMEService({
  email: 'admin@example.com',
  cloudflareApiToken: process.env.CLOUDFLARE_API_TOKEN!,
  staging: false,
});

await acme.initialize();

// Obtain certificate
const cert = await acme.obtainCertificate('example.com');

// Load certificate
const existing = await acme.loadCertificate('example.com');

// Check if needs renewal
const needsRenewal = acme.needsRenewal(existing);

// Renew if needed
await acme.renewCertificateIfNeeded('example.com');

// Auto-renew all
await acme.autoRenewAll();
```

---

## ⚙️ Configuration Options

### Cloudflare Service

```typescript
new CloudflareService({
  apiToken: string,      // Required: Cloudflare API token
  accountId?: string,    // Optional: Account ID for zone creation
});
```

### ACME Service

```typescript
new ACMEService({
  email: string,                // Required: Email for Let's Encrypt
  cloudflareApiToken: string,   // Required: For DNS challenge
  certificatesDir?: string,     // Optional: Default './certificates'
  staging?: boolean,            // Optional: Use staging (testing)
});
```

### Domain Manager

```typescript
new DomainManagerService(
  cloudflareApiToken: string,   // Required
  email: string,                // Required
  staging?: boolean             // Optional: Default false
);
```

---

## 🔄 Automatic Renewal

SSL certificates are automatically renewed when:
- Certificate expires in < 30 days
- Auto-fix is run
- Monitoring loop detects expiry

### Setup Cron Job

Add to crontab:

```bash
# Renew SSL certificates daily at 3 AM
0 3 * * * cd /path/to/project && ts-node scripts/renew-ssl.ts >> /var/log/ssl-renewal.log 2>&1
```

Or use Node.js:

```typescript
// Run every 24 hours
setInterval(async () => {
  await domainManager.autoRenewAllCertificates();
}, 24 * 60 * 60 * 1000);
```

---

## 🐛 Troubleshooting

### Issue: Token verification fails

**Solution:**
```bash
# Check token
curl "https://api.cloudflare.com/client/v4/user/tokens/verify" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Verify token has correct permissions:
# - Zone:Read
# - Zone:Edit
# - DNS:Read
# - DNS:Edit
```

### Issue: DNS not propagating

**Solution:**
```bash
# Check nameservers
dig example.com NS

# Wait for propagation (can take 24-48 hours)
# Use staging mode for testing:
SSL_STAGING=true ts-node scripts/setup-domain.ts example.com
```

### Issue: SSL challenge fails

**Solution:**
```bash
# Ensure DNS is active first
ts-node scripts/check-domain.ts example.com

# Check DNS propagation
dig _acme-challenge.example.com TXT

# Try again after DNS is active
ts-node scripts/auto-fix-domain.ts example.com
```

### Issue: Certificate not found

**Solution:**
```bash
# Check certificates directory
ls -la certificates/example.com/

# Re-obtain certificate
ts-node scripts/setup-domain.ts example.com
```

---

## 📊 Monitoring

### Health Check Endpoint

```typescript
// Add to your Express/Next.js API
app.get('/api/health/domains', async (req, res) => {
  const domains = ['example.com', 'another.com'];
  const statuses = [];

  for (const domain of domains) {
    const status = await domainManager.checkDomainStatus(domain);
    statuses.push(status);
  }

  res.json({ domains: statuses });
});
```

### Logging

All services include comprehensive logging:
- ✅ Success messages
- ⚠️ Warnings
- ❌ Errors
- 📋 Status updates

---

## 🔒 Security Best Practices

1. **Never commit API tokens**
   - Use `.env` file
   - Add `.env` to `.gitignore`

2. **Use staging for testing**
   ```env
   SSL_STAGING=true
   ```

3. **Rotate API tokens regularly**
   - Generate new token in Cloudflare
   - Update `.env` file

4. **Secure certificate storage**
   ```bash
   chmod 600 certificates/*/private-key.pem
   ```

5. **Use environment-specific configs**
   - `.env.development`
   - `.env.production`

---

## 📝 Example: Complete Setup

```typescript
import { DomainManagerService } from './shared/services/domain/domain-manager.service';

async function main() {
  // Initialize
  const manager = new DomainManagerService(
    process.env.CLOUDFLARE_API_TOKEN!,
    'admin@example.com',
    false
  );

  await manager.initialize();

  // Setup domain
  await manager.setupDomain({
    domain: 'myapp.com',
    serverIP: '1.2.3.4',
    email: 'admin@myapp.com',
  });

  // Start monitoring
  manager.startAutoMonitoring([
    { domain: 'myapp.com', serverIP: '1.2.3.4', email: 'admin@myapp.com' },
  ], 24);

  console.log('✅ Domain management active!');
}

main();
```

---

## 🎯 Production Checklist

- [ ] Cloudflare API token configured
- [ ] Email configured for SSL
- [ ] Server IP configured
- [ ] `.env` file created (not committed)
- [ ] Dependencies installed
- [ ] Token verified
- [ ] Domain setup completed
- [ ] SSL certificate obtained
- [ ] Auto-renewal configured
- [ ] Monitoring enabled
- [ ] Logs configured
- [ ] Backup strategy in place

---

## 📞 Support

For issues:
1. Check logs in console
2. Verify environment variables
3. Check Cloudflare dashboard
4. Review troubleshooting section
5. Check certificate files

---

**Status:** ✅ Production Ready  
**Last Updated:** May 12, 2026  
**Version:** 1.0.0
