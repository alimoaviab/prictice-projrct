import { google } from "googleapis";
import { RequestContext } from "../../types/core";
import {
  buildGoogleOAuthClient,
  markGoogleTokenError,
  persistGoogleToken,
  resolveGoogleToken
} from "./google-auth";
import { refreshGoogleAccessToken } from "./token-refresh";

type MeetEventInput = {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  attendees?: Array<{ email: string; displayName?: string }>;
  timezone?: string;
};

export type MeetEventResult = {
  eventId?: string;
  meetingLink?: string;
  htmlLink?: string;
};

function logMeet(message: string, details?: Record<string, unknown>) {
  if (details) {
    console.info(`[GoogleMeet] ${message}`, details);
  } else {
    console.info(`[GoogleMeet] ${message}`);
  }
}

function isExpired(expiryDate?: number) {
  if (!expiryDate) return false;
  return Date.now() >= expiryDate - 60_000;
}

function normalizeAttendees(attendees: Array<{ email: string; displayName?: string }> = []) {
  const deduped = new Map<string, { email: string; displayName?: string }>();
  for (const attendee of attendees) {
    if (!attendee?.email) continue;
    deduped.set(attendee.email.toLowerCase(), {
      email: attendee.email.toLowerCase(),
      displayName: attendee.displayName
    });
  }
  return Array.from(deduped.values());
}

export async function createMeetCalendarEvent(
  ctx: RequestContext,
  input: MeetEventInput
): Promise<MeetEventResult> {
  const tokenState = await resolveGoogleToken(ctx);

  logMeet("Resolved token for event creation", {
    source: tokenState.source,
    hasAccessToken: Boolean(tokenState.accessToken),
    hasRefreshToken: Boolean(tokenState.refreshToken),
    expiryDate: tokenState.expiryDate ? new Date(tokenState.expiryDate).toISOString() : null,
    userId: tokenState.userId
  });

  let accessToken = tokenState.accessToken;
  let refreshToken = tokenState.refreshToken;
  let expiryDate = tokenState.expiryDate;

  if (!accessToken || isExpired(expiryDate)) {
    if (!refreshToken) {
      await markGoogleTokenError(
        tokenState.schoolId || ctx.school_id,
        tokenState.userId || ctx.user_id,
        "No refresh token available while access token is missing/expired.",
        "invalid"
      );
      throw new Error("Google token expired and no refresh token is available. Reconnect Google account.");
    }

    const refreshed = await refreshGoogleAccessToken(refreshToken);
    accessToken = refreshed.accessToken;
    refreshToken = refreshed.refreshToken || refreshToken;
    expiryDate = refreshed.expiryDate;

    if (tokenState.source === "user-db" && tokenState.schoolId && tokenState.userId && accessToken) {
      await persistGoogleToken({
        schoolId: tokenState.schoolId,
        userId: tokenState.userId,
        userEmail: tokenState.userEmail,
        accessToken,
        refreshToken,
        expiresAt: expiryDate,
        scope: refreshed.scope || tokenState.scope,
        tokenType: refreshed.tokenType || tokenState.tokenType
      });
    }
  }

  if (!accessToken) {
    throw new Error("Google access token is not available.");
  }

  const oauth2Client = buildGoogleOAuthClient();
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
    expiry_date: expiryDate
  });

  logMeet("OAuth client credentials set", {
    hasAccessToken: Boolean(accessToken),
    hasRefreshToken: Boolean(refreshToken),
    expiryDate: expiryDate ? new Date(expiryDate).toISOString() : null
  });

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });
  const timezone = input.timezone || process.env.GOOGLE_CALENDAR_TIMEZONE || "UTC";

  const response = await calendar.events.insert({
    calendarId: process.env.GOOGLE_CALENDAR_ID || "primary",
    conferenceDataVersion: 1,
    requestBody: {
      summary: input.title,
      description: input.description || "Live class session",
      start: {
        dateTime: new Date(input.startTime).toISOString(),
        timeZone: timezone
      },
      end: {
        dateTime: new Date(input.endTime).toISOString(),
        timeZone: timezone
      },
      attendees: normalizeAttendees(input.attendees),
      conferenceData: {
        createRequest: {
          requestId: `meet-${ctx.school_id}-${Date.now()}`,
          conferenceSolutionKey: {
            type: "hangoutsMeet"
          }
        }
      }
    }
  });

  const result: MeetEventResult = {
    eventId: response.data.id || undefined,
    meetingLink: response.data.hangoutLink || undefined,
    htmlLink: response.data.htmlLink || undefined
  };

  logMeet("Calendar event created", {
    eventId: result.eventId || null,
    hasMeetingLink: Boolean(result.meetingLink),
    htmlLink: result.htmlLink || null
  });

  return result;
}

export async function deleteMeetCalendarEvent(ctx: RequestContext, eventId: string): Promise<void> {
  if (!eventId) return;

  const tokenState = await resolveGoogleToken(ctx);
  let accessToken = tokenState.accessToken;
  let refreshToken = tokenState.refreshToken;
  let expiryDate = tokenState.expiryDate;

  if (!accessToken || isExpired(expiryDate)) {
    if (!refreshToken) {
      throw new Error("Cannot delete Google event because refresh token is unavailable.");
    }
    const refreshed = await refreshGoogleAccessToken(refreshToken);
    accessToken = refreshed.accessToken;
    refreshToken = refreshed.refreshToken || refreshToken;
    expiryDate = refreshed.expiryDate;

    if (tokenState.source === "user-db" && tokenState.schoolId && tokenState.userId) {
      await persistGoogleToken({
        schoolId: tokenState.schoolId,
        userId: tokenState.userId,
        userEmail: tokenState.userEmail,
        accessToken,
        refreshToken,
        expiresAt: expiryDate,
        scope: refreshed.scope || tokenState.scope,
        tokenType: refreshed.tokenType || tokenState.tokenType
      });
    }
  }

  if (!accessToken) {
    throw new Error("Google access token is not available.");
  }

  const oauth2Client = buildGoogleOAuthClient();
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
    expiry_date: expiryDate
  });

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });
  await calendar.events.delete({
    calendarId: process.env.GOOGLE_CALENDAR_ID || "primary",
    eventId
  });

  logMeet("Calendar event deleted", { eventId });
}
