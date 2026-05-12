/**
 * SSL Certificate Renewal Script
 * Automatically renews all SSL certificates that are expiring soon
 * Usage: ts-node scripts/renew-ssl.ts
 */

import * as dotenv from 'dotenv';
import { DomainManagerService } from '../shared/services/domain/domain-manager.service';

// Load environment variables
dotenv.config();

async function main() {
  try {
    const cloudflareApiToken = process.env.CLOUDFLARE_API_TOKEN;
    const email = process.env.SSL_EMAIL;
    const staging = process.env.SSL_STAGING === 'true';

    if (!cloudflareApiToken || !email) {
      console.error('❌ Missing required environment variables');
      process.exit(1);
    }

    console.log('\n🔄 SSL CERTIFICATE RENEWAL');
    console.log('='.repeat(60) + '\n');

    // Initialize Domain Manager
    const domainManager = new DomainManagerService(
      cloudflareApiToken,
      email,
      staging
    );

    await domainManager.initialize();

    // Auto-renew all certificates
    await domainManager.autoRenewAllCertificates();

    console.log('\n✅ SSL renewal check completed!');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
