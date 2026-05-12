/**
 * Domain Setup Script
 * Usage: ts-node scripts/setup-domain.ts
 */

import * as dotenv from 'dotenv';
import { DomainManagerService } from '../shared/services/domain/domain-manager.service';

// Load environment variables
dotenv.config();

async function main() {
  try {
    // Get configuration from environment
    const cloudflareApiToken = process.env.CLOUDFLARE_API_TOKEN;
    const email = process.env.SSL_EMAIL;
    const serverIP = process.env.SERVER_IP;
    const staging = process.env.SSL_STAGING === 'true';

    // Validate configuration
    if (!cloudflareApiToken) {
      console.error('❌ CLOUDFLARE_API_TOKEN is not set in .env file');
      process.exit(1);
    }

    if (!email) {
      console.error('❌ SSL_EMAIL is not set in .env file');
      process.exit(1);
    }

    if (!serverIP) {
      console.error('❌ SERVER_IP is not set in .env file');
      process.exit(1);
    }

    // Get domain from command line or use default
    const domain = process.argv[2];
    
    if (!domain) {
      console.error('❌ Please provide a domain name');
      console.log('\nUsage: ts-node scripts/setup-domain.ts example.com');
      process.exit(1);
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`🚀 DOMAIN SETUP SCRIPT`);
    console.log(`${'='.repeat(60)}\n`);
    console.log(`Domain: ${domain}`);
    console.log(`Server IP: ${serverIP}`);
    console.log(`Email: ${email}`);
    console.log(`Environment: ${staging ? 'STAGING' : 'PRODUCTION'}`);
    console.log('');

    // Initialize Domain Manager
    const domainManager = new DomainManagerService(
      cloudflareApiToken,
      email,
      staging
    );

    const initialized = await domainManager.initialize();
    if (!initialized) {
      console.error('❌ Failed to initialize Domain Manager');
      process.exit(1);
    }

    // Setup domain
    const success = await domainManager.setupDomain({
      domain,
      serverIP,
      email,
    });

    if (success) {
      console.log('✅ Domain setup completed successfully!');
      process.exit(0);
    } else {
      console.error('❌ Domain setup failed');
      process.exit(1);
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
