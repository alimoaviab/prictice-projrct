/**
 * Cloudflare DNS Management Service
 * Manages custom domain DNS records via Cloudflare API
 */

import axios, { AxiosInstance } from 'axios';

interface CloudflareConfig {
  apiToken: string;
  accountId?: string;
}

interface DNSRecord {
  id?: string;
  type: 'A' | 'AAAA' | 'CNAME' | 'TXT' | 'MX';
  name: string;
  content: string;
  ttl?: number;
  proxied?: boolean;
  priority?: number;
}

interface Zone {
  id: string;
  name: string;
  status: string;
  name_servers: string[];
}

export class CloudflareService {
  private client: AxiosInstance;
  private apiToken: string;

  constructor(config: CloudflareConfig) {
    this.apiToken = config.apiToken;
    
    this.client = axios.create({
      baseURL: 'https://api.cloudflare.com/client/v4',
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  /**
   * Verify API token is valid
   */
  async verifyToken(): Promise<boolean> {
    try {
      console.log('🔐 Verifying Cloudflare API token...');
      const response = await this.client.get('/user/tokens/verify');
      
      if (response.data.success) {
        console.log('✅ Cloudflare API token verified successfully');
        console.log('   Token Status:', response.data.result.status);
        return true;
      }
      
      console.error('❌ Token verification failed:', response.data.errors);
      return false;
    } catch (error: any) {
      console.error('❌ Error verifying token:', error.message);
      return false;
    }
  }

  /**
   * Get zone ID by domain name
   */
  async getZoneId(domain: string): Promise<string | null> {
    try {
      console.log(`🔍 Looking up zone ID for domain: ${domain}`);
      
      const response = await this.client.get('/zones', {
        params: { name: domain }
      });

      if (response.data.success && response.data.result.length > 0) {
        const zoneId = response.data.result[0].id;
        console.log(`✅ Found zone ID: ${zoneId}`);
        return zoneId;
      }

      console.warn(`⚠️ No zone found for domain: ${domain}`);
      return null;
    } catch (error: any) {
      console.error(`❌ Error getting zone ID:`, error.message);
      return null;
    }
  }

  /**
   * List all zones in account
   */
  async listZones(): Promise<Zone[]> {
    try {
      console.log('📋 Fetching all zones...');
      
      const response = await this.client.get('/zones');

      if (response.data.success) {
        const zones = response.data.result;
        console.log(`✅ Found ${zones.length} zones`);
        return zones;
      }

      return [];
    } catch (error: any) {
      console.error('❌ Error listing zones:', error.message);
      return [];
    }
  }

  /**
   * Create a new zone (domain)
   */
  async createZone(domain: string, accountId?: string): Promise<Zone | null> {
    try {
      console.log(`🆕 Creating new zone for domain: ${domain}`);
      
      const payload: any = {
        name: domain,
        jump_start: true, // Auto-scan for DNS records
      };

      if (accountId) {
        payload.account = { id: accountId };
      }

      const response = await this.client.post('/zones', payload);

      if (response.data.success) {
        const zone = response.data.result;
        console.log(`✅ Zone created successfully`);
        console.log(`   Zone ID: ${zone.id}`);
        console.log(`   Name Servers:`, zone.name_servers);
        return zone;
      }

      console.error('❌ Failed to create zone:', response.data.errors);
      return null;
    } catch (error: any) {
      console.error('❌ Error creating zone:', error.message);
      return null;
    }
  }

  /**
   * List DNS records for a zone
   */
  async listDNSRecords(zoneId: string): Promise<DNSRecord[]> {
    try {
      console.log(`📋 Fetching DNS records for zone: ${zoneId}`);
      
      const response = await this.client.get(`/zones/${zoneId}/dns_records`);

      if (response.data.success) {
        const records = response.data.result;
        console.log(`✅ Found ${records.length} DNS records`);
        return records;
      }

      return [];
    } catch (error: any) {
      console.error('❌ Error listing DNS records:', error.message);
      return [];
    }
  }

  /**
   * Create DNS record
   */
  async createDNSRecord(zoneId: string, record: DNSRecord): Promise<DNSRecord | null> {
    try {
      console.log(`🆕 Creating DNS record: ${record.type} ${record.name} -> ${record.content}`);
      
      const payload = {
        type: record.type,
        name: record.name,
        content: record.content,
        ttl: record.ttl || 1, // 1 = automatic
        proxied: record.proxied !== undefined ? record.proxied : false,
        ...(record.priority && { priority: record.priority }),
      };

      const response = await this.client.post(`/zones/${zoneId}/dns_records`, payload);

      if (response.data.success) {
        console.log(`✅ DNS record created successfully`);
        console.log(`   Record ID: ${response.data.result.id}`);
        return response.data.result;
      }

      console.error('❌ Failed to create DNS record:', response.data.errors);
      return null;
    } catch (error: any) {
      console.error('❌ Error creating DNS record:', error.message);
      if (error.response?.data?.errors) {
        console.error('   API Errors:', error.response.data.errors);
      }
      return null;
    }
  }

  /**
   * Update DNS record
   */
  async updateDNSRecord(zoneId: string, recordId: string, record: Partial<DNSRecord>): Promise<DNSRecord | null> {
    try {
      console.log(`🔄 Updating DNS record: ${recordId}`);
      
      const response = await this.client.patch(`/zones/${zoneId}/dns_records/${recordId}`, record);

      if (response.data.success) {
        console.log(`✅ DNS record updated successfully`);
        return response.data.result;
      }

      console.error('❌ Failed to update DNS record:', response.data.errors);
      return null;
    } catch (error: any) {
      console.error('❌ Error updating DNS record:', error.message);
      return null;
    }
  }

  /**
   * Delete DNS record
   */
  async deleteDNSRecord(zoneId: string, recordId: string): Promise<boolean> {
    try {
      console.log(`🗑️ Deleting DNS record: ${recordId}`);
      
      const response = await this.client.delete(`/zones/${zoneId}/dns_records/${recordId}`);

      if (response.data.success) {
        console.log(`✅ DNS record deleted successfully`);
        return true;
      }

      console.error('❌ Failed to delete DNS record:', response.data.errors);
      return false;
    } catch (error: any) {
      console.error('❌ Error deleting DNS record:', error.message);
      return false;
    }
  }

  /**
   * Find DNS record by name and type
   */
  async findDNSRecord(zoneId: string, name: string, type: string): Promise<DNSRecord | null> {
    try {
      const records = await this.listDNSRecords(zoneId);
      const record = records.find(r => r.name === name && r.type === type);
      
      if (record) {
        console.log(`✅ Found DNS record: ${record.type} ${record.name}`);
        return record;
      }

      console.log(`⚠️ DNS record not found: ${type} ${name}`);
      return null;
    } catch (error: any) {
      console.error('❌ Error finding DNS record:', error.message);
      return null;
    }
  }

  /**
   * Create or update DNS record (upsert)
   */
  async upsertDNSRecord(zoneId: string, record: DNSRecord): Promise<DNSRecord | null> {
    try {
      // Check if record exists
      const existing = await this.findDNSRecord(zoneId, record.name, record.type);

      if (existing) {
        console.log(`🔄 Record exists, updating...`);
        return await this.updateDNSRecord(zoneId, existing.id!, record);
      } else {
        console.log(`🆕 Record doesn't exist, creating...`);
        return await this.createDNSRecord(zoneId, record);
      }
    } catch (error: any) {
      console.error('❌ Error upserting DNS record:', error.message);
      return null;
    }
  }

  /**
   * Setup custom domain with DNS records
   * Creates A record pointing to your server IP
   */
  async setupCustomDomain(domain: string, serverIP: string): Promise<boolean> {
    try {
      console.log(`\n🚀 Setting up custom domain: ${domain}`);
      console.log(`   Server IP: ${serverIP}`);

      // Get or create zone
      let zoneId = await this.getZoneId(domain);
      
      if (!zoneId) {
        console.log(`⚠️ Zone not found, creating new zone...`);
        const zone = await this.createZone(domain);
        if (!zone) {
          console.error('❌ Failed to create zone');
          return false;
        }
        zoneId = zone.id;
        
        console.log(`\n📝 Please update your domain nameservers to:`);
        zone.name_servers.forEach(ns => console.log(`   - ${ns}`));
        console.log(`\n⏳ Wait 24-48 hours for nameserver propagation\n`);
      }

      // Create A record for root domain
      const rootRecord = await this.upsertDNSRecord(zoneId, {
        type: 'A',
        name: domain,
        content: serverIP,
        ttl: 1,
        proxied: true, // Enable Cloudflare proxy for SSL
      });

      if (!rootRecord) {
        console.error('❌ Failed to create root A record');
        return false;
      }

      // Create A record for www subdomain
      const wwwRecord = await this.upsertDNSRecord(zoneId, {
        type: 'A',
        name: `www.${domain}`,
        content: serverIP,
        ttl: 1,
        proxied: true,
      });

      if (!wwwRecord) {
        console.error('❌ Failed to create www A record');
        return false;
      }

      console.log(`\n✅ Custom domain setup completed successfully!`);
      console.log(`   Domain: ${domain}`);
      console.log(`   Root: ${domain} -> ${serverIP}`);
      console.log(`   WWW: www.${domain} -> ${serverIP}`);
      console.log(`   Cloudflare Proxy: Enabled (SSL included)\n`);

      return true;
    } catch (error: any) {
      console.error('❌ Error setting up custom domain:', error.message);
      return false;
    }
  }

  /**
   * Create TXT record for domain verification (e.g., for SSL)
   */
  async createVerificationRecord(domain: string, value: string): Promise<DNSRecord | null> {
    try {
      const zoneId = await this.getZoneId(domain);
      if (!zoneId) {
        console.error('❌ Zone not found for domain:', domain);
        return null;
      }

      return await this.createDNSRecord(zoneId, {
        type: 'TXT',
        name: `_acme-challenge.${domain}`,
        content: value,
        ttl: 120, // 2 minutes for quick propagation
      });
    } catch (error: any) {
      console.error('❌ Error creating verification record:', error.message);
      return null;
    }
  }

  /**
   * Delete verification record after SSL is obtained
   */
  async deleteVerificationRecord(domain: string): Promise<boolean> {
    try {
      const zoneId = await this.getZoneId(domain);
      if (!zoneId) return false;

      const record = await this.findDNSRecord(zoneId, `_acme-challenge.${domain}`, 'TXT');
      if (!record || !record.id) return false;

      return await this.deleteDNSRecord(zoneId, record.id);
    } catch (error: any) {
      console.error('❌ Error deleting verification record:', error.message);
      return false;
    }
  }

  /**
   * Check if domain is active and DNS is propagated
   */
  async checkDomainStatus(domain: string): Promise<{
    active: boolean;
    nameservers: string[];
    status: string;
  }> {
    try {
      const zoneId = await this.getZoneId(domain);
      if (!zoneId) {
        return { active: false, nameservers: [], status: 'not_found' };
      }

      const response = await this.client.get(`/zones/${zoneId}`);
      
      if (response.data.success) {
        const zone = response.data.result;
        return {
          active: zone.status === 'active',
          nameservers: zone.name_servers,
          status: zone.status,
        };
      }

      return { active: false, nameservers: [], status: 'error' };
    } catch (error: any) {
      console.error('❌ Error checking domain status:', error.message);
      return { active: false, nameservers: [], status: 'error' };
    }
  }
}

export default CloudflareService;
