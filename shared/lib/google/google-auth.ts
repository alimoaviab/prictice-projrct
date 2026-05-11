import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { google } from "googleapis";
import { connectDb } from "../../db/connect";
import { GoogleOauthTokenModel } from "../../models/google-oauth-token.model";
import { RequestContext } from "../../types/core";

const GOOGLE_PROVIDER = "google";
const ALGO = "aes-256-gcm";

export type PersistGoogleTokenInput = {
  schoolId: string;
  userId: string;
  userEmail?: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  scope?: string;
  tokenType?: string;
};

export type ResolvedGoogleToken = {
  source: "user-db" | "env";
  accessToken?: string;
  refreshToken?: string;
  expiryDate?: number;
  scope?: string;
  tokenType?: string;
  schoolId?: string;
  userId?: string;
  userEmail?: string;
};

function logAuth(message: string, details?: Record<string, unknown>) {
  if (details) {
    console.info(`[GoogleAuth] ${message}`, details);
  } else {
    console.info(`[GoogleAuth] ${message}`);
  }
}

function getEncryptionKey(): Buffer {
  const secret = process.env.GOOGLE_OAUTH_TOKEN_ENCRYPTION_KEY || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      "Missing GOOGLE_OAUTH_TOKEN_ENCRYPTION_KEY (or fallback JWT_SECRET). Cannot securely store Google OAuth tokens."
    );
  }

  return createHash("sha256").update(secret).digest();
}

function encryptSecret(value: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, key, iv);

  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
}

function decryptSecret(payload: string): string {
  const [ivB64, tagB64, cipherB64] = payload.split(":");
  if (!ivB64 || !tagB64 || !cipherB64) {
    throw new Error("Invalid encrypted token format.");
  }

  const key = getEncryptionKey();
  const iv = Buffer.from(ivB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const ciphertext = Buffer.from(cipherB64, "base64");

  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString("utf8");
}

export function buildGoogleOAuthClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret) {
    throw new Error("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required for Google OAuth.");
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export async function persistGoogleToken(input: PersistGoogleTokenInput): Promise<void> {
  if (!input.schoolId || !input.userId || !input.accessToken) {
    logAuth("Skipping token persistence due to missing required fields", {
      hasSchoolId: Boolean(input.schoolId),
      hasUserId: Boolean(input.userId),
      hasAccessToken: Boolean(input.accessToken)
    });
    return;
  }

  await connectDb();

  await GoogleOauthTokenModel.findOneAndUpdate(
    {
      school_id: input.schoolId,
      user_id: input.userId,
      provider: GOOGLE_PROVIDER
    },
    {
      $set: {
        user_email: (input.userEmail || "").toLowerCase(),
        access_token_enc: encryptSecret(input.accessToken),
        ...(input.refreshToken ? { refresh_token_enc: encryptSecret(input.refreshToken) } : {}),
        ...(input.expiresAt ? { expires_at: new Date(input.expiresAt) } : {}),
        scope: input.scope || "",
        token_type: input.tokenType || "Bearer",
        last_refreshed_at: new Date(),
        status: "active",
        last_error: ""
      }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  logAuth("Stored Google OAuth token", {
    schoolId: input.schoolId,
    userId: input.userId,
    hasRefreshToken: Boolean(input.refreshToken),
    expiresAt: input.expiresAt ? new Date(input.expiresAt).toISOString() : null
  });
}

export async function markGoogleTokenError(
  schoolId: string,
  userId: string,
  errorMessage: string,
  status: "active" | "revoked" | "invalid" = "invalid"
): Promise<void> {
  if (!schoolId || !userId) return;

  await connectDb();
  await GoogleOauthTokenModel.findOneAndUpdate(
    { school_id: schoolId, user_id: userId, provider: GOOGLE_PROVIDER },
    {
      $set: {
        status,
        last_error: errorMessage,
        updatedAt: new Date()
      }
    }
  );
}

export async function resolveGoogleToken(ctx: RequestContext): Promise<ResolvedGoogleToken> {
  await connectDb();

  const normalizeEmail = (value?: string) => (value || "").trim().toLowerCase();

  const buildResolvedFromDoc = (doc: any): ResolvedGoogleToken => ({
    source: "user-db",
    schoolId: String(doc.school_id),
    userId: String(doc.user_id),
    userEmail: doc.user_email || ctx.actor_email,
    accessToken: decryptSecret(doc.access_token_enc),
    refreshToken: doc.refresh_token_enc ? decryptSecret(doc.refresh_token_enc) : undefined,
    expiryDate: doc.expires_at ? new Date(doc.expires_at).getTime() : undefined,
    scope: doc.scope || undefined,
    tokenType: doc.token_type || "Bearer"
  });

  const dbToken = await GoogleOauthTokenModel.findOne({
    school_id: ctx.school_id,
    user_id: ctx.user_id,
    provider: GOOGLE_PROVIDER,
    status: "active"
  }).lean();

  if (dbToken?.access_token_enc) {
    const resolved = buildResolvedFromDoc(dbToken);

    logAuth("Resolved Google token from database", {
      userId: resolved.userId,
      hasAccessToken: Boolean(resolved.accessToken),
      hasRefreshToken: Boolean(resolved.refreshToken),
      expiryDate: resolved.expiryDate ? new Date(resolved.expiryDate).toISOString() : null
    });

    return resolved;
  }

  const actorEmail = normalizeEmail(ctx.actor_email);
  if (actorEmail) {
    const emailToken = await GoogleOauthTokenModel.findOne({
      school_id: ctx.school_id,
      user_email: actorEmail,
      provider: GOOGLE_PROVIDER,
      status: "active"
    })
      .sort({ updatedAt: -1 })
      .lean();

    if (emailToken?.access_token_enc) {
      const resolved = buildResolvedFromDoc(emailToken);
      logAuth("Resolved Google token by actor email", {
        actorEmail,
        userId: resolved.userId,
        hasAccessToken: Boolean(resolved.accessToken),
        hasRefreshToken: Boolean(resolved.refreshToken)
      });
      return resolved;
    }
  }

  const schoolFallbackToken = await GoogleOauthTokenModel.findOne({
    school_id: ctx.school_id,
    provider: GOOGLE_PROVIDER,
    status: "active"
  })
    .sort({ updatedAt: -1 })
    .lean();

  if (schoolFallbackToken?.access_token_enc) {
    const resolved = buildResolvedFromDoc(schoolFallbackToken);
    logAuth("Resolved Google token from school-level fallback", {
      schoolId: resolved.schoolId,
      resolvedUserId: resolved.userId,
      hasAccessToken: Boolean(resolved.accessToken),
      hasRefreshToken: Boolean(resolved.refreshToken)
    });
    return resolved;
  }

  const envAccessToken = process.env.GOOGLE_ACCESS_TOKEN;
  const envRefreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  const envExpiry = process.env.GOOGLE_ACCESS_TOKEN_EXPIRY
    ? Number(process.env.GOOGLE_ACCESS_TOKEN_EXPIRY)
    : undefined;

  if (envAccessToken || envRefreshToken) {
    logAuth("Resolved Google token from environment fallback", {
      hasAccessToken: Boolean(envAccessToken),
      hasRefreshToken: Boolean(envRefreshToken),
      expiryDate: envExpiry ? new Date(envExpiry).toISOString() : null
    });

    return {
      source: "env",
      accessToken: envAccessToken,
      refreshToken: envRefreshToken,
      expiryDate: envExpiry,
      scope: "https://www.googleapis.com/auth/calendar",
      tokenType: "Bearer",
      schoolId: ctx.school_id,
      userId: ctx.user_id,
      userEmail: ctx.actor_email
    };
  }

  throw new Error(
    "No Google OAuth token found for this user. Connect Google account first or set GOOGLE_REFRESH_TOKEN for fallback."
  );
}
