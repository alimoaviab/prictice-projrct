/**
 * Auto-Fix Domain Script
 * Automatically checks and fixes domain issues
 * Usage: ts-node scripts/auto-fix-domain.ts example.com
 */

import * as dotenv from 'dotenv';
import { DomainManagerService } from '../shared/services/domain/domain-manager.service';

// Load environment variables
dotenv.config();

async function main() {
  try {
    const cloudflareApiToken = process.env.CLOUDFLARE_API_TOKEN;
    const email = process.env.SSL_EMAIL;
    const serverIP = process.env.SERVER_IP;
    const staging = process.env.SSL_STAGING === 'true';

    if (!cloudflareApiToken || !email || !serverIP) {
      console.error('❌ Missing required environment variables');
      process.exit(1);
    }

    const domain = process.argv[2];
    
    if (!domain) {
      console.error('❌ Please provide a domain name');
      console.log('\nUsage: ts-node scripts/auto-fix-domain.ts example.com');
      process.exit(1);
    }

    // Initialize Domain Manager
    const domainManager = new DomainManagerService(
      cloudflareApiToken,
      email,
      staging
    );

    await domainManager.initialize();

    // Auto-fix domain
    const success = await domainManager.autoFixDomain({
      domain,
      serverIP,
      email,
    });

    if (success) {
      console.log('✅ Auto-fix completed successfully!');
      process.exit(0);
    } else {
      console.error('❌ Auto-fix failed');
      process.exit(1);
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
