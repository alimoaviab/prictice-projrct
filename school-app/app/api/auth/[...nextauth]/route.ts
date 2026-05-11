import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { connectDb } from "@edu/shared/db/connect";
import { UserModel } from "@edu/shared/models/user.model";
import { persistGoogleToken } from "@edu/shared/lib/google/google-auth";
import { refreshGoogleAccessToken } from "@edu/shared/lib/google/token-refresh";

function logNextAuth(message: string, details?: Record<string, unknown>) {
  if (details) {
    console.info(`[NextAuthGoogle] ${message}`, details);
  } else {
    console.info(`[NextAuthGoogle] ${message}`);
  }
}

async function resolveSchoolUserByEmail(email?: string | null) {
  if (!email) return null;
  await connectDb();
  return UserModel.findOne({ email: email.toLowerCase() })
    .select("_id school_id email")
    .lean();
}

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: "openid email profile https://www.googleapis.com/auth/calendar"
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 30
  },
  callbacks: {
    async jwt({ token, account, user }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token || token.refreshToken;
        token.expiresAt = account.expires_at ? account.expires_at * 1000 : undefined;
        token.scope = account.scope;
        token.tokenType = account.token_type || "Bearer";

        const profileEmail = user?.email || token.email;
        const schoolUser = await resolveSchoolUserByEmail(profileEmail);

        if (schoolUser) {
          token.schoolUserId = String((schoolUser as any)._id);
          token.schoolId = String((schoolUser as any).school_id);

          if (account.access_token) {
            await persistGoogleToken({
              schoolId: token.schoolId as string,
              userId: token.schoolUserId as string,
              userEmail: (schoolUser as any).email,
              accessToken: account.access_token,
              refreshToken: (account.refresh_token || token.refreshToken) as string | undefined,
              expiresAt: (token.expiresAt as number | undefined),
              scope: account.scope,
              tokenType: account.token_type || "Bearer"
            });
          }
        } else {
          logNextAuth("No matching school user found for Google account", {
            email: profileEmail || null
          });
        }

        logNextAuth("OAuth callback received", {
          hasAccessToken: Boolean(account.access_token),
          hasRefreshToken: Boolean(account.refresh_token),
          expiresAt: token.expiresAt ? new Date(token.expiresAt as number).toISOString() : null,
          scope: account.scope || null
        });
      }

      const expiresAt = Number(token.expiresAt || 0);
      const shouldRefresh = Boolean(
        token.refreshToken &&
        expiresAt > 0 &&
        Date.now() >= expiresAt - 60_000
      );

      if (shouldRefresh) {
        try {
          const refreshed = await refreshGoogleAccessToken(String(token.refreshToken));
          token.accessToken = refreshed.accessToken;
          token.refreshToken = refreshed.refreshToken || token.refreshToken;
          token.expiresAt = refreshed.expiryDate;
          token.scope = refreshed.scope || token.scope;
          token.tokenType = refreshed.tokenType || token.tokenType;
          token.error = undefined;

          if (token.schoolId && token.schoolUserId) {
            await persistGoogleToken({
              schoolId: String(token.schoolId),
              userId: String(token.schoolUserId),
              userEmail: (token.email as string | undefined) || undefined,
              accessToken: String(token.accessToken),
              refreshToken: (token.refreshToken as string | undefined) || undefined,
              expiresAt: Number(token.expiresAt || 0),
              scope: (token.scope as string | undefined) || undefined,
              tokenType: (token.tokenType as string | undefined) || "Bearer"
            });
          }

          logNextAuth("Access token refreshed during jwt callback", {
            expiresAt: token.expiresAt ? new Date(Number(token.expiresAt)).toISOString() : null
          });
        } catch (error: any) {
          token.error = "RefreshAccessTokenError";
          logNextAuth("Failed to refresh access token", {
            message: error?.message || "unknown"
          });
        }
      }

      return token;
    },
    async session({ session, token }: any) {
      session.accessToken = token.accessToken;
      session.refreshToken = token.refreshToken;
      session.expiresAt = token.expiresAt;
      session.scope = token.scope;
      session.schoolUserId = token.schoolUserId;
      session.schoolId = token.schoolId;
      session.error = token.error;
      return session;
    }
  }
});

export { handler as GET, handler as POST };
