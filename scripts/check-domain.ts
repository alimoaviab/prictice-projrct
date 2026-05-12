/**
 * Domain Status Check Script
 * Usage: ts-node scripts/check-domain.ts example.com
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

    const domain = process.argv[2];
    
    if (!domain) {
      console.error('❌ Please provide a domain name');
      console.log('\nUsage: ts-node scripts/check-domain.ts example.com');
      process.exit(1);
    }

    // Initialize Domain Manager
    const domainManager = new DomainManagerService(
      cloudflareApiToken,
      email,
      staging
    );

    await domainManager.initialize();

    // Check domain status
    const status = await domainManager.checkDomainStatus(domain);

    console.log('\n📊 DOMAIN STATUS REPORT');
    console.log('='.repeat(60));
    console.log(`Domain: ${status.domain}`);
    console.log(`DNS Configured: ${status.dnsConfigured ? '✅' : '❌'}`);
    console.log(`SSL Configured: ${status.sslConfigured ? '✅' : '❌'}`);
    
    if (status.sslExpiresAt) {
      const daysUntilExpiry = Math.floor(
        (status.sslExpiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      console.log(`SSL Expires: ${status.sslExpiresAt.toISOString()} (${daysUntilExpiry} days)`);
    }

    if (status.warnings.length > 0) {
      console.log('\n⚠️ Warnings:');
      status.warnings.forEach(w => console.log(`   - ${w}`));
    }

    if (status.errors.length > 0) {
      console.log('\n❌ Errors:');
      status.errors.forEach(e => console.log(`   - ${e}`));
    }

    console.log('='.repeat(60) + '\n');

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
