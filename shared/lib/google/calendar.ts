import { RequestContext } from "../../types/core";
import { createMeetCalendarEvent, deleteMeetCalendarEvent } from "./meet.service";

export async function createGoogleMeetEvent(
  ctx: RequestContext,
  title: string,
  startTime: string,
  endTime: string,
  description?: string,
  attendees: Array<{ email: string; displayName?: string }> = []
) {
  const result = await createMeetCalendarEvent(ctx, {
    title,
    startTime,
    endTime,
    description,
    attendees,
    timezone: process.env.GOOGLE_CALENDAR_TIMEZONE || "UTC"
  });

  return {
    eventId: result.eventId,
    meetingLink: result.meetingLink,
    htmlLink: result.htmlLink
  };
}

export async function deleteGoogleMeetEvent(ctx: RequestContext, eventId: string) {
  await deleteMeetCalendarEvent(ctx, eventId);
  return true;
}
