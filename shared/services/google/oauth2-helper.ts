/**
 * Google OAuth2.0 Helper
 * Handles OAuth2.0 authentication flow and token management
 */

import { google } from 'googleapis';
import CryptoJS from 'crypto-js';

// OAuth2.0 Configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const GOOGLE_REDIRECT_URI = process.env.NODE_ENV === 'production' 
  ? process.env.GOOGLE_REDIRECT_URI_PROD! 
  : process.env.GOOGLE_REDIRECT_URI!;
const ENCRYPTION_KEY = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY!;

// OAuth2.0 Scopes
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events', // Create and manage calendar events
  'https://www.googleapis.com/auth/userinfo.email',  // Get user email
];

/**
 * Create OAuth2 Client
 */
export function createOAuth2Client() {
  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );
}

/**
 * Generate Authorization URL
 * @param state - State parameter for CSRF protection (e.g., teacher_id)
 * @returns Authorization URL
 */
export function generateAuthUrl(state: string): string {
  const oauth2Client = createOAuth2Client();
  
  return oauth2Client.generateAuthUrl({
    access_type: 'offline', // Get refresh token
    scope: SCOPES,
    state: state, // Pass teacher_id or tenant_id for verification
    prompt: 'consent', // Force consent screen to get refresh token
  });
}

/**
 * Exchange Authorization Code for Tokens
 * @param code - Authorization code from Google
 * @returns Access token and refresh token
 */
export async function exchangeCodeForTokens(code: string) {
  const oauth2Client = createOAuth2Client();
  
  try {
    const { tokens } = await oauth2Client.getToken(code);
    
    return {
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token!, // Only provided on first authorization
      expiryDate: tokens.expiry_date!,
    };
  } catch (error: any) {
    console.error('Error exchanging code for tokens:', error);
    throw new Error(`Failed to exchange authorization code: ${error.message}`);
  }
}

/**
 * Refresh Access Token
 * @param refreshToken - Encrypted refresh token from database
 * @returns New access token
 */
export async function refreshAccessToken(encryptedRefreshToken: string) {
  const oauth2Client = createOAuth2Client();
  
  try {
    // Decrypt refresh token
    const refreshToken = decryptToken(encryptedRefreshToken);
    
    // Set refresh token
    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });
    
    // Refresh access token
    const { credentials } = await oauth2Client.refreshAccessToken();
    
    return {
      accessToken: credentials.access_token!,
      expiryDate: credentials.expiry_date!,
    };
  } catch (error: any) {
    console.error('Error refreshing access token:', error);
    
    // If refresh token is invalid, user needs to re-authenticate
    if (error.message.includes('invalid_grant')) {
      throw new Error('REFRESH_TOKEN_INVALID');
    }
    
    throw new Error(`Failed to refresh access token: ${error.message}`);
  }
}

/**
 * Get OAuth2 Client with Credentials
 * @param accessToken - Access token
 * @param refreshToken - Encrypted refresh token (optional)
 * @returns Configured OAuth2 client
 */
export function getAuthenticatedClient(accessToken: string, encryptedRefreshToken?: string) {
  const oauth2Client = createOAuth2Client();
  
  const credentials: any = {
    access_token: accessToken,
  };
  
  if (encryptedRefreshToken) {
    credentials.refresh_token = decryptToken(encryptedRefreshToken);
  }
  
  oauth2Client.setCredentials(credentials);
  
  return oauth2Client;
}

/**
 * Get User Info from Google
 * @param accessToken - Access token
 * @returns User email and info
 */
export async function getUserInfo(accessToken: string) {
  const oauth2Client = getAuthenticatedClient(accessToken);
  
  try {
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data } = await oauth2.userinfo.get();
    
    return {
      email: data.email!,
      name: data.name,
      picture: data.picture,
    };
  } catch (error: any) {
    console.error('Error getting user info:', error);
    throw new Error(`Failed to get user info: ${error.message}`);
  }
}

/**
 * Encrypt Refresh Token
 * @param token - Plain text refresh token
 * @returns Encrypted token
 */
export function encryptToken(token: string): string {
  if (!ENCRYPTION_KEY) {
    throw new Error('GOOGLE_TOKEN_ENCRYPTION_KEY is not set');
  }
  
  return CryptoJS.AES.encrypt(token, ENCRYPTION_KEY).toString();
}

/**
 * Decrypt Refresh Token
 * @param encryptedToken - Encrypted refresh token
 * @returns Plain text token
 */
export function decryptToken(encryptedToken: string): string {
  if (!ENCRYPTION_KEY) {
    throw new Error('GOOGLE_TOKEN_ENCRYPTION_KEY is not set');
  }
  
  const bytes = CryptoJS.AES.decrypt(encryptedToken, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}

/**
 * Validate OAuth2 Configuration
 * @throws Error if configuration is invalid
 */
export function validateOAuthConfig() {
  const errors: string[] = [];
  
  if (!GOOGLE_CLIENT_ID) {
    errors.push('GOOGLE_CLIENT_ID is not set');
  }
  
  if (!GOOGLE_CLIENT_SECRET) {
    errors.push('GOOGLE_CLIENT_SECRET is not set');
  }
  
  if (!GOOGLE_REDIRECT_URI) {
    errors.push('GOOGLE_REDIRECT_URI is not set');
  }
  
  if (!ENCRYPTION_KEY) {
    errors.push('GOOGLE_TOKEN_ENCRYPTION_KEY is not set');
  }
  
  if (ENCRYPTION_KEY && ENCRYPTION_KEY.length < 32) {
    errors.push('GOOGLE_TOKEN_ENCRYPTION_KEY must be at least 32 characters');
  }
  
  if (errors.length > 0) {
    throw new Error(`OAuth2 configuration errors:\n${errors.join('\n')}`);
  }
}

/**
 * Check if Access Token is Expired
 * @param expiryDate - Token expiry date (timestamp)
 * @returns True if expired
 */
export function isTokenExpired(expiryDate: number): boolean {
  // Add 5 minute buffer
  const bufferMs = 5 * 60 * 1000;
  return Date.now() >= (expiryDate - bufferMs);
}

export default {
  createOAuth2Client,
  generateAuthUrl,
  exchangeCodeForTokens,
  refreshAccessToken,
  getAuthenticatedClient,
  getUserInfo,
  encryptToken,
  decryptToken,
  validateOAuthConfig,
  isTokenExpired,
};
