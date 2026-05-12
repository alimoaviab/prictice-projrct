/**
 * ACME (Let's Encrypt) SSL Certificate Service
 * Automatically obtains and renews SSL certificates
 */

import * as acme from 'acme-client';
import * as fs from 'fs/promises';
import * as path from 'path';
import { CloudflareService } from '../cloudflare/cloudflare.service';

interface SSLConfig {
  email: string;
  cloudflareApiToken: string;
  certificatesDir?: string;
  staging?: boolean; // Use Let's Encrypt staging for testing
}

interface Certificate {
  domain: string;
  certificate: string;
  privateKey: string;
  chain: string;
  expiresAt: Date;
  createdAt: Date;
}

export class ACMEService {
  private client: acme.Client;
  private cloudflare: CloudflareService;
  private email: string;
  private certificatesDir: string;
  private staging: boolean;

  constructor(config: SSLConfig) {
    this.email = config.email;
    this.staging = config.staging || false;
    this.certificatesDir = config.certificatesDir || './certificates';
    
    // Initialize Cloudflare service
    this.cloudflare = new CloudflareService({
      apiToken: config.cloudflareApiToken,
    });

    // Initialize ACME client (will be set in initialize())
    this.client = null as any;
  }

  /**
   * Initialize ACME client with account
   */
  async initialize(): Promise<void> {
    try {
      console.log('🔐 Initializing ACME client...');
      
      // Use staging or production Let's Encrypt
      const directoryUrl = this.staging
        ? acme.directory.letsencrypt.staging
        : acme.directory.letsencrypt.production;

      console.log(`   Environment: ${this.staging ? 'STAGING' : 'PRODUCTION'}`);
      console.log(`   Directory: ${directoryUrl}`);

      // Create account key
      const accountKey = await acme.crypto.createPrivateKey();

      // Create ACME client
      this.client = new acme.Client({
        directoryUrl,
        accountKey,
      });

      // Create account
      await this.client.createAccount({
        termsOfServiceAgreed: true,
        contact: [`mailto:${this.email}`],
      });

      console.log('✅ ACME client initialized successfully');
      console.log(`   Email: ${this.email}`);

      // Ensure certificates directory exists
      await fs.mkdir(this.certificatesDir, { recursive: true });
      console.log(`   Certificates directory: ${this.certificatesDir}`);
    } catch (error: any) {
      console.error('❌ Error initializing ACME client:', error.message);
      throw error;
    }
  }

  /**
   * Obtain SSL certificate for domain
   */
  async obtainCertificate(domain: string): Promise<Certificate | null> {
    try {
      console.log(`\n🔒 Obtaining SSL certificate for: ${domain}`);
      
      // Check if Cloudflare is accessible
      const tokenValid = await this.cloudflare.verifyToken();
      if (!tokenValid) {
        console.error('❌ Cloudflare API token is invalid');
        return null;
      }

      // Check if domain exists in Cloudflare
      const zoneId = await this.cloudflare.getZoneId(domain);
      if (!zoneId) {
        console.error('❌ Domain not found in Cloudflare');
        return null;
      }

      // Create private key for certificate
      console.log('🔑 Generating private key...');
      const [privateKey, csr] = await acme.crypto.createCsr({
        commonName: domain,
        altNames: [`www.${domain}`],
      });

      console.log('✅ Private key generated');

      // Create certificate order
      console.log('📝 Creating certificate order...');
      const order = await this.client.createOrder({
        identifiers: [
          { type: 'dns', value: domain },
          { type: 'dns', value: `www.${domain}` },
        ],
      });

      console.log('✅ Order created');

      // Get authorizations
      const authorizations = await this.client.getAuthorizations(order);
      console.log(`📋 Got ${authorizations.length} authorizations`);

      // Complete challenges
      for (const auth of authorizations) {
        const domain = auth.identifier.value;
        console.log(`\n🎯 Processing authorization for: ${domain}`);

        // Get DNS challenge
        const challenge = auth.challenges.find((c: any) => c.type === 'dns-01');
        if (!challenge) {
          console.error('❌ DNS challenge not found');
          continue;
        }

        // Get challenge key authorization
        const keyAuthorization = await this.client.getChallengeKeyAuthorization(challenge);
        
        // Create TXT record in Cloudflare
        console.log('📝 Creating DNS TXT record for verification...');
        const txtRecord = await this.cloudflare.createVerificationRecord(
          domain,
          keyAuthorization
        );

        if (!txtRecord) {
          console.error('❌ Failed to create verification record');
          continue;
        }

        console.log('✅ Verification record created');

        // Wait for DNS propagation
        console.log('⏳ Waiting for DNS propagation (30 seconds)...');
        await this.sleep(30000);

        // Verify challenge
        console.log('✅ Verifying challenge...');
        await this.client.verifyChallenge(auth, challenge);

        // Complete challenge
        console.log('✅ Completing challenge...');
        await this.client.completeChallenge(challenge);

        // Wait for validation
        console.log('⏳ Waiting for validation...');
        await this.client.waitForValidStatus(challenge);

        console.log('✅ Challenge validated successfully');

        // Clean up verification record
        console.log('🧹 Cleaning up verification record...');
        await this.cloudflare.deleteVerificationRecord(domain);
      }

      // Finalize order
      console.log('\n🏁 Finalizing certificate order...');
      await this.client.finalizeOrder(order, csr);

      // Get certificate
      console.log('📜 Retrieving certificate...');
      const certificate = await this.client.getCertificate(order);

      console.log('✅ Certificate obtained successfully!');

      // Parse certificate to get expiry date
      const cert = await acme.crypto.readCertificateInfo(certificate);
      const expiresAt = cert.notAfter;
      const createdAt = new Date();

      console.log(`   Expires: ${expiresAt.toISOString()}`);
      console.log(`   Valid for: ${Math.floor((expiresAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))} days`);

      // Save certificate
      const certData: Certificate = {
        domain,
        certificate,
        privateKey: privateKey.toString(),
        chain: certificate,
        expiresAt,
        createdAt,
      };

      await this.saveCertificate(certData);

      return certData;
    } catch (error: any) {
      console.error('❌ Error obtaining certificate:', error.message);
      if (error.response?.data) {
        console.error('   API Error:', error.response.data);
      }
      return null;
    }
  }

  /**
   * Save certificate to disk
   */
  private async saveCertificate(cert: Certificate): Promise<void> {
    try {
      const domainDir = path.join(this.certificatesDir, cert.domain);
      await fs.mkdir(domainDir, { recursive: true });

      // Save certificate
      await fs.writeFile(
        path.join(domainDir, 'certificate.pem'),
        cert.certificate
      );

      // Save private key
      await fs.writeFile(
        path.join(domainDir, 'private-key.pem'),
        cert.privateKey
      );

      // Save chain
      await fs.writeFile(
        path.join(domainDir, 'chain.pem'),
        cert.chain
      );

      // Save metadata
      await fs.writeFile(
        path.join(domainDir, 'metadata.json'),
        JSON.stringify({
          domain: cert.domain,
          expiresAt: cert.expiresAt,
          createdAt: cert.createdAt,
        }, null, 2)
      );

      console.log(`💾 Certificate saved to: ${domainDir}`);
    } catch (error: any) {
      console.error('❌ Error saving certificate:', error.message);
      throw error;
    }
  }

  /**
   * Load certificate from disk
   */
  async loadCertificate(domain: string): Promise<Certificate | null> {
    try {
      const domainDir = path.join(this.certificatesDir, domain);

      const [certificate, privateKey, chain, metadataStr] = await Promise.all([
        fs.readFile(path.join(domainDir, 'certificate.pem'), 'utf-8'),
        fs.readFile(path.join(domainDir, 'private-key.pem'), 'utf-8'),
        fs.readFile(path.join(domainDir, 'chain.pem'), 'utf-8'),
        fs.readFile(path.join(domainDir, 'metadata.json'), 'utf-8'),
      ]);

      const metadata = JSON.parse(metadataStr);

      return {
        domain,
        certificate,
        privateKey,
        chain,
        expiresAt: new Date(metadata.expiresAt),
        createdAt: new Date(metadata.createdAt),
      };
    } catch (error: any) {
      console.log(`⚠️ Certificate not found for domain: ${domain}`);
      return null;
    }
  }

  /**
   * Check if certificate needs renewal (expires in less than 30 days)
   */
  needsRenewal(cert: Certificate): boolean {
    const daysUntilExpiry = Math.floor(
      (cert.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    console.log(`📅 Certificate expires in ${daysUntilExpiry} days`);

    return daysUntilExpiry < 30;
  }

  /**
   * Renew certificate if needed
   */
  async renewCertificateIfNeeded(domain: string): Promise<Certificate | null> {
    try {
      console.log(`\n🔄 Checking certificate renewal for: ${domain}`);

      // Load existing certificate
      const existingCert = await this.loadCertificate(domain);

      if (!existingCert) {
        console.log('⚠️ No existing certificate found, obtaining new one...');
        return await this.obtainCertificate(domain);
      }

      // Check if renewal is needed
      if (!this.needsRenewal(existingCert)) {
        console.log('✅ Certificate is still valid, no renewal needed');
        return existingCert;
      }

      console.log('⚠️ Certificate needs renewal, obtaining new one...');
      return await this.obtainCertificate(domain);
    } catch (error: any) {
      console.error('❌ Error renewing certificate:', error.message);
      return null;
    }
  }

  /**
   * Auto-renew all certificates
   */
  async autoRenewAll(): Promise<void> {
    try {
      console.log('\n🔄 Starting auto-renewal check for all certificates...');

      // Get all certificate directories
      const domains = await fs.readdir(this.certificatesDir);

      for (const domain of domains) {
        const stat = await fs.stat(path.join(this.certificatesDir, domain));
        if (!stat.isDirectory()) continue;

        await this.renewCertificateIfNeeded(domain);
      }

      console.log('\n✅ Auto-renewal check completed');
    } catch (error: any) {
      console.error('❌ Error in auto-renewal:', error.message);
    }
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default ACMEService;
