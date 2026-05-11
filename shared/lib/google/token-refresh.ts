import { buildGoogleOAuthClient } from "./google-auth";

export type RefreshedGoogleToken = {
  accessToken: string;
  refreshToken?: string;
  expiryDate?: number;
  scope?: string;
  tokenType?: string;
};

function logRefresh(message: string, details?: Record<string, unknown>) {
  if (details) {
    console.info(`[GoogleTokenRefresh] ${message}`, details);
  } else {
    console.info(`[GoogleTokenRefresh] ${message}`);
  }
}

const RETRYABLE_CODES = new Set([408, 425, 429, 500, 502, 503, 504]);

export async function refreshGoogleAccessToken(
  refreshToken: string,
  retries = 2
): Promise<RefreshedGoogleToken> {
  if (!refreshToken) {
    throw new Error("Missing refresh token. Re-authentication with Google consent is required.");
  }

  const oauth2Client = buildGoogleOAuthClient();
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const refreshed = await oauth2Client.refreshAccessToken();
      const credentials = refreshed.credentials;

      if (!credentials.access_token) {
        throw new Error("Google refresh succeeded but no access token was returned.");
      }

      logRefresh("Access token refreshed", {
        attempt,
        hasRefreshToken: Boolean(credentials.refresh_token || refreshToken),
        expiryDate: credentials.expiry_date
          ? new Date(credentials.expiry_date).toISOString()
          : null
      });

      return {
        accessToken: credentials.access_token,
        refreshToken: credentials.refresh_token || refreshToken,
        expiryDate: credentials.expiry_date || undefined,
        scope: credentials.scope || undefined,
        tokenType: credentials.token_type || "Bearer"
      };
    } catch (error: any) {
      const status = error?.response?.status;

      logRefresh("Refresh attempt failed", {
        attempt,
        status: status || null,
        code: error?.code || null,
        message: error?.message
      });

      if (attempt >= retries || !status || !RETRYABLE_CODES.has(status)) {
        throw error;
      }
    }
  }

  throw new Error("Unable to refresh Google access token after retries.");
}
