/**
 * Google Calendar Service
 * Handles Google Calendar API operations for creating events with Meet links
 */

import { google, calendar_v3 } from 'googleapis';
import { getAuthenticatedClient, refreshAccessToken, isTokenExpired } from './oauth2-helper';

interface CreateEventParams {
  summary: string;
  description?: string;
  startTime: string; // ISO 8601 format
  endTime: string;   // ISO 8601 format
  timezone: string;  // e.g., 'Asia/Karachi'
  attendees?: string[]; // Array of email addresses
}

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  startTime: string;
  endTime: string;
  meetingLink?: string;
  htmlLink: string;
}

/**
 * Create Calendar Event with Google Meet Link
 * @param accessToken - Current access token
 * @param encryptedRefreshToken - Encrypted refresh token for token refresh
 * @param eventParams - Event details
 * @returns Created event with Meet link
 */
export async function createCalendarEventWithMeet(
  accessToken: string,
  encryptedRefreshToken: string,
  eventParams: CreateEventParams
): Promise<CalendarEvent> {
  try {
    // Get authenticated OAuth2 client
    const auth = getAuthenticatedClient(accessToken, encryptedRefreshToken);
    
    // Create Calendar API client
    const calendar = google.calendar({ version: 'v3', auth });
    
    // Prepare event data
    const event: calendar_v3.Schema$Event = {
      summary: eventParams.summary,
      description: eventParams.description,
      start: {
        dateTime: eventParams.startTime,
        timeZone: eventParams.timezone,
      },
      end: {
        dateTime: eventParams.endTime,
        timeZone: eventParams.timezone,
      },
      // Conference data for Google Meet
      conferenceData: {
        createRequest: {
          requestId: `meet-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          conferenceSolutionKey: {
            type: 'hangoutsMeet',
          },
        },
      },
      // Add attendees if provided
      attendees: eventParams.attendees?.map(email => ({ email })),
      // Send notifications
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 30 },      // 30 minutes before
        ],
      },
    };
    
    // Create the event
    const response = await calendar.events.insert({
      calendarId: 'primary',
      conferenceDataVersion: 1, // REQUIRED for Meet link generation
      requestBody: event,
      sendUpdates: 'all', // Send email notifications to attendees
    });
    
    const createdEvent = response.data;
    
    // Extract Meet link
    const meetingLink = createdEvent.hangoutLink || createdEvent.conferenceData?.entryPoints?.find(
      ep => ep.entryPointType === 'video'
    )?.uri;
    
    if (!meetingLink) {
      console.warn('Meet link not generated for event:', createdEvent.id);
    }
    
    return {
      id: createdEvent.id!,
      summary: createdEvent.summary!,
      description: createdEvent.description ?? undefined,
      startTime: createdEvent.start?.dateTime!,
      endTime: createdEvent.end?.dateTime!,
      meetingLink: meetingLink ?? undefined,
      htmlLink: createdEvent.htmlLink!,
    };
  } catch (error: any) {
    console.error('Error creating calendar event:', error);
    
    // Handle specific errors
    if (error.code === 401) {
      throw new Error('UNAUTHORIZED');
    }
    
    if (error.code === 403) {
      throw new Error('INSUFFICIENT_PERMISSIONS');
    }
    
    if (error.code === 429) {
      throw new Error('RATE_LIMIT_EXCEEDED');
    }
    
    throw new Error(`Failed to create calendar event: ${error.message}`);
  }
}

/**
 * Update Calendar Event
 * @param accessToken - Current access token
 * @param encryptedRefreshToken - Encrypted refresh token
 * @param eventId - Google Calendar event ID
 * @param updates - Fields to update
 * @returns Updated event
 */
export async function updateCalendarEvent(
  accessToken: string,
  encryptedRefreshToken: string,
  eventId: string,
  updates: Partial<CreateEventParams>
): Promise<CalendarEvent> {
  try {
    const auth = getAuthenticatedClient(accessToken, encryptedRefreshToken);
    const calendar = google.calendar({ version: 'v3', auth });
    
    const event: calendar_v3.Schema$Event = {};
    
    if (updates.summary) event.summary = updates.summary;
    if (updates.description) event.description = updates.description;
    if (updates.startTime) {
      event.start = {
        dateTime: updates.startTime,
        timeZone: updates.timezone,
      };
    }
    if (updates.endTime) {
      event.end = {
        dateTime: updates.endTime,
        timeZone: updates.timezone,
      };
    }
    
    const response = await calendar.events.patch({
      calendarId: 'primary',
      eventId: eventId,
      requestBody: event,
      sendUpdates: 'all',
    });
    
    const updatedEvent = response.data;
    
    return {
      id: updatedEvent.id!,
      summary: updatedEvent.summary!,
      description: updatedEvent.description ?? undefined,
      startTime: updatedEvent.start?.dateTime!,
      endTime: updatedEvent.end?.dateTime!,
      meetingLink: updatedEvent.hangoutLink ?? undefined,
      htmlLink: updatedEvent.htmlLink!,
    };
  } catch (error: any) {
    console.error('Error updating calendar event:', error);
    throw new Error(`Failed to update calendar event: ${error.message}`);
  }
}

/**
 * Delete Calendar Event
 * @param accessToken - Current access token
 * @param encryptedRefreshToken - Encrypted refresh token
 * @param eventId - Google Calendar event ID
 */
export async function deleteCalendarEvent(
  accessToken: string,
  encryptedRefreshToken: string,
  eventId: string
): Promise<void> {
  try {
    const auth = getAuthenticatedClient(accessToken, encryptedRefreshToken);
    const calendar = google.calendar({ version: 'v3', auth });
    
    await calendar.events.delete({
      calendarId: 'primary',
      eventId: eventId,
      sendUpdates: 'all', // Notify attendees
    });
  } catch (error: any) {
    console.error('Error deleting calendar event:', error);
    throw new Error(`Failed to delete calendar event: ${error.message}`);
  }
}

/**
 * Get Calendar Event
 * @param accessToken - Current access token
 * @param encryptedRefreshToken - Encrypted refresh token
 * @param eventId - Google Calendar event ID
 * @returns Event details
 */
export async function getCalendarEvent(
  accessToken: string,
  encryptedRefreshToken: string,
  eventId: string
): Promise<CalendarEvent> {
  try {
    const auth = getAuthenticatedClient(accessToken, encryptedRefreshToken);
    const calendar = google.calendar({ version: 'v3', auth });
    
    const response = await calendar.events.get({
      calendarId: 'primary',
      eventId: eventId,
    });
    
    const event = response.data;
    
    return {
      id: event.id!,
      summary: event.summary!,
      description: event.description ?? undefined,
      startTime: event.start?.dateTime!,
      endTime: event.end?.dateTime!,
      meetingLink: event.hangoutLink ?? undefined,
      htmlLink: event.htmlLink!,
    };
  } catch (error: any) {
    console.error('Error getting calendar event:', error);
    throw new Error(`Failed to get calendar event: ${error.message}`);
  }
}

/**
 * List Upcoming Calendar Events
 * @param accessToken - Current access token
 * @param encryptedRefreshToken - Encrypted refresh token
 * @param maxResults - Maximum number of events to return
 * @returns List of events
 */
export async function listUpcomingEvents(
  accessToken: string,
  encryptedRefreshToken: string,
  maxResults: number = 10
): Promise<CalendarEvent[]> {
  try {
    const auth = getAuthenticatedClient(accessToken, encryptedRefreshToken);
    const calendar = google.calendar({ version: 'v3', auth });
    
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: maxResults,
      singleEvents: true,
      orderBy: 'startTime',
    });
    
    const events = response.data.items || [];
    
    return events.map(event => ({
      id: event.id!,
      summary: event.summary!,
      description: event.description ?? undefined,
      startTime: event.start?.dateTime!,
      endTime: event.end?.dateTime!,
      meetingLink: event.hangoutLink ?? undefined,
      htmlLink: event.htmlLink!,
    }));
  } catch (error: any) {
    console.error('Error listing calendar events:', error);
    throw new Error(`Failed to list calendar events: ${error.message}`);
  }
}

/**
 * Handle Token Refresh and Retry
 * Wrapper function that automatically refreshes token if expired
 * @param operation - Function to execute
 * @param accessToken - Current access token
 * @param encryptedRefreshToken - Encrypted refresh token
 * @param expiryDate - Token expiry date
 * @returns Operation result and new access token if refreshed
 */
export async function executeWithTokenRefresh<T>(
  operation: (accessToken: string, encryptedRefreshToken: string) => Promise<T>,
  accessToken: string,
  encryptedRefreshToken: string,
  expiryDate: number
): Promise<{ result: T; newAccessToken?: string; newExpiryDate?: number }> {
  try {
    // Check if token is expired
    if (isTokenExpired(expiryDate)) {
      console.log('Access token expired, refreshing...');
      
      // Refresh token
      const { accessToken: newAccessToken, expiryDate: newExpiryDate } = 
        await refreshAccessToken(encryptedRefreshToken);
      
      // Execute operation with new token
      const result = await operation(newAccessToken, encryptedRefreshToken);
      
      return {
        result,
        newAccessToken,
        newExpiryDate,
      };
    }
    
    // Token is valid, execute operation
    const result = await operation(accessToken, encryptedRefreshToken);
    
    return { result };
  } catch (error: any) {
    // If unauthorized, try refreshing token
    if (error.message === 'UNAUTHORIZED') {
      console.log('Unauthorized error, attempting token refresh...');
      
      try {
        const { accessToken: newAccessToken, expiryDate: newExpiryDate } = 
          await refreshAccessToken(encryptedRefreshToken);
        
        // Retry operation with new token
        const result = await operation(newAccessToken, encryptedRefreshToken);
        
        return {
          result,
          newAccessToken,
          newExpiryDate,
        };
      } catch (refreshError: any) {
        if (refreshError.message === 'REFRESH_TOKEN_INVALID') {
          throw new Error('REAUTHENTICATION_REQUIRED');
        }
        throw refreshError;
      }
    }
    
    throw error;
  }
}

export default {
  createCalendarEventWithMeet,
  updateCalendarEvent,
  deleteCalendarEvent,
  getCalendarEvent,
  listUpcomingEvents,
  executeWithTokenRefresh,
};
