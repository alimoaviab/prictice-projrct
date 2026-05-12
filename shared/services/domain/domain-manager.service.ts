/**
 * Domain Manager Service
 * Complete domain and SSL management with automatic checks and fixes
 */

import { CloudflareService } from '../cloudflare/cloudflare.service';
import { ACMEService } from '../ssl/acme.service';

interface DomainConfig {
  domain: string;
  serverIP: string;
  email: string;
}

interface DomainStatus {
  domain: string;
  dnsConfigured: boolean;
  sslConfigured: boolean;
  sslExpiresAt?: Date;
  errors: string[];
  warnings: string[];
}

export class DomainManagerService {
  private cloudflare: CloudflareService;
  private acme: ACMEService;
  private email: string;

  constructor(cloudflareApiToken: string, email: string, staging: boolean = false) {
    this.email = email;
    
    this.cloudflare = new CloudflareService({
      apiToken: cloudflareApiToken,
    });

    this.acme = new ACMEService({
      email,
      cloudflareApiToken,
      staging,
    });
  }

  /**
   * Initialize services
   */
  async initialize(): Promise<boolean> {
    try {
      console.log('🚀 Initializing Domain Manager...\n');

      // Verify Cloudflare token
      const tokenValid = await this.cloudflare.verifyToken();
      if (!tokenValid) {
        console.error('❌ Cloudflare API token is invalid');
        return false;
      }

      // Initialize ACME client
      await this.acme.initialize();

      console.log('\n✅ Domain Manager initialized successfully\n');
      return true;
    } catch (error: any) {
      console.error('❌ Error initializing Domain Manager:', error.message);
      return false;
    }
  }

  /**
   * Setup complete domain with DNS and SSL
   */
  async setupDomain(config: DomainConfig): Promise<boolean> {
    try {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🌐 SETTING UP DOMAIN: ${config.domain}`);
      console.log(`${'='.repeat(60)}\n`);

      // Step 1: Setup DNS
      console.log('📍 STEP 1: Configuring DNS...\n');
      const dnsSuccess = await this.cloudflare.setupCustomDomain(
        config.domain,
        config.serverIP
      );

      if (!dnsSuccess) {
        console.error('❌ DNS setup failed');
        return false;
      }

      // Step 2: Wait for DNS propagation
      console.log('\n⏳ STEP 2: Waiting for DNS propagation...');
      console.log('   This may take a few minutes...\n');
      
      let dnsReady = false;
      let attempts = 0;
      const maxAttempts = 10;

      while (!dnsReady && attempts < maxAttempts) {
        attempts++;
        console.log(`   Attempt ${attempts}/${maxAttempts}...`);
        
        const status = await this.cloudflare.checkDomainStatus(config.domain);
        
        if (status.active) {
          dnsReady = true;
          console.log('   ✅ DNS is active and propagated');
        } else {
          console.log(`   ⏳ DNS status: ${status.status}, waiting 30 seconds...`);
          await this.sleep(30000);
        }
      }

      if (!dnsReady) {
        console.warn('⚠️ DNS may not be fully propagated yet');
        console.warn('   You can continue, but SSL might fail');
        console.warn('   Consider running SSL setup later\n');
      }

      // Step 3: Obtain SSL certificate
      console.log('\n🔒 STEP 3: Obtaining SSL certificate...\n');
      const certificate = await this.acme.obtainCertificate(config.domain);

      if (!certificate) {
        console.error('❌ SSL certificate setup failed');
        console.error('   DNS might not be fully propagated');
        console.error('   Try running SSL setup again later\n');
        return false;
      }

      console.log(`\n${'='.repeat(60)}`);
      console.log(`✅ DOMAIN SETUP COMPLETED SUCCESSFULLY!`);
      console.log(`${'='.repeat(60)}\n`);
      console.log(`Domain: ${config.domain}`);
      console.log(`DNS: Configured ✅`);
      console.log(`SSL: Configured ✅`);
      console.log(`Expires: ${certificate.expiresAt.toISOString()}`);
      console.log(`\n🎉 Your domain is ready to use!\n`);

      return true;
    } catch (error: any) {
      console.error('❌ Error setting up domain:', error.message);
      return false;
    }
  }

  /**
   * Check domain status
   */
  async checkDomainStatus(domain: string): Promise<DomainStatus> {
    const status: DomainStatus = {
      domain,
      dnsConfigured: false,
      sslConfigured: false,
      errors: [],
      warnings: [],
    };

    try {
      console.log(`\n🔍 Checking status for: ${domain}\n`);

      // Check DNS
      const dnsStatus = await this.cloudflare.checkDomainStatus(domain);
      status.dnsConfigured = dnsStatus.active;

      if (status.dnsConfigured) {
        console.log('✅ DNS: Configured and active');
      } else {
        console.log(`⚠️ DNS: ${dnsStatus.status}`);
        status.warnings.push(`DNS status: ${dnsStatus.status}`);
      }

      // Check SSL
      const certificate = await this.acme.loadCertificate(domain);
      
      if (certificate) {
        status.sslConfigured = true;
        status.sslExpiresAt = certificate.expiresAt;

        const daysUntilExpiry = Math.floor(
          (certificate.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );

        console.log(`✅ SSL: Configured (expires in ${daysUntilExpiry} days)`);

        if (daysUntilExpiry < 30) {
          status.warnings.push(`SSL certificate expires in ${daysUntilExpiry} days`);
        }
      } else {
        console.log('⚠️ SSL: Not configured');
        status.warnings.push('SSL certificate not found');
      }

      console.log('');
      return status;
    } catch (error: any) {
      console.error('❌ Error checking domain status:', error.message);
      status.errors.push(error.message);
      return status;
    }
  }

  /**
   * Auto-fix domain issues
   */
  async autoFixDomain(config: DomainConfig): Promise<boolean> {
    try {
      console.log(`\n🔧 AUTO-FIX: Checking and fixing issues for ${config.domain}\n`);

      const status = await this.checkDomainStatus(config.domain);

      let fixed = false;

      // Fix DNS if not configured
      if (!status.dnsConfigured) {
        console.log('🔧 Fixing DNS configuration...\n');
        const dnsFixed = await this.cloudflare.setupCustomDomain(
          config.domain,
          config.serverIP
        );
        
        if (dnsFixed) {
          console.log('✅ DNS fixed successfully\n');
          fixed = true;
        }
      }

      // Fix SSL if not configured or expiring soon
      if (!status.sslConfigured || (status.sslExpiresAt && this.needsRenewal(status.sslExpiresAt))) {
        console.log('🔧 Fixing SSL certificate...\n');
        const certificate = await this.acme.renewCertificateIfNeeded(config.domain);
        
        if (certificate) {
          console.log('✅ SSL fixed successfully\n');
          fixed = true;
        }
      }

      if (!fixed) {
        console.log('✅ No issues found, domain is healthy\n');
      }

      return true;
    } catch (error: any) {
      console.error('❌ Error in auto-fix:', error.message);
      return false;
    }
  }

  /**
   * Auto-renew all SSL certificates
   */
  async autoRenewAllCertificates(): Promise<void> {
    try {
      console.log('\n🔄 AUTO-RENEW: Checking all SSL certificates...\n');
      await this.acme.autoRenewAll();
    } catch (error: any) {
      console.error('❌ Error in auto-renew:', error.message);
    }
  }

  /**
   * Start automatic monitoring and fixing loop
   */
  startAutoMonitoring(domains: DomainConfig[], intervalHours: number = 24): void {
    console.log(`\n🤖 Starting automatic monitoring (every ${intervalHours} hours)...\n`);

    const intervalMs = intervalHours * 60 * 60 * 1000;

    setInterval(async () => {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🤖 AUTOMATIC MONITORING CHECK`);
      console.log(`   Time: ${new Date().toISOString()}`);
      console.log(`${'='.repeat(60)}\n`);

      for (const config of domains) {
        await this.autoFixDomain(config);
      }

      console.log(`\n✅ Monitoring check completed\n`);
    }, intervalMs);

    console.log('✅ Automatic monitoring started\n');
  }

  /**
   * Check if certificate needs renewal
   */
  private needsRenewal(expiresAt: Date): boolean {
    const daysUntilExpiry = Math.floor(
      (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry < 30;
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default DomainManagerService;
