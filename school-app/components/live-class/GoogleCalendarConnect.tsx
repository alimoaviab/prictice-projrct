/**
 * Google Calendar Connect Component
 * Allows teachers to connect their Google Calendar account
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface GoogleCalendarConnectProps {
  onConnectionChange?: (isConnected: boolean) => void;
}

export default function GoogleCalendarConnect({ onConnectionChange }: GoogleCalendarConnectProps) {
  const { data: session } = useSession();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [googleEmail, setGoogleEmail] = useState<string | null>(null);

  // Check connection status on mount
  useEffect(() => {
    checkConnectionStatus();
  }, []);

  // Check if Google Calendar is already connected
  const checkConnectionStatus = async () => {
    try {
      const response = await fetch('/api/auth/google/status');
      if (response.ok) {
        const data = await response.json();
        setIsConnected(data.isConnected);
        setGoogleEmail(data.email);
        onConnectionChange?.(data.isConnected);
      }
    } catch (error) {
      console.error('Error checking connection status:', error);
    }
  };

  // Initiate Google OAuth flow
  const handleConnect = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get authorization URL from backend
      const response = await fetch('/api/auth/google/calendar');
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to initiate Google Calendar connection');
      }

      const data = await response.json();

      // Redirect to Google OAuth consent screen
      window.location.href = data.authUrl;
    } catch (error: any) {
      console.error('Error connecting Google Calendar:', error);
      setError(error.message);
      setIsLoading(false);
    }
  };

  // Disconnect Google Calendar
  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect Google Calendar? You will need to reconnect to schedule classes with Google Meet.')) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/google/disconnect', {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to disconnect Google Calendar');
      }

      setIsConnected(false);
      setGoogleEmail(null);
      onConnectionChange?.(false);
    } catch (error: any) {
      console.error('Error disconnecting Google Calendar:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          {/* Google Calendar Icon */}
          <div className="flex-shrink-0">
            <svg className="w-12 h-12" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path fill="#1976D2" d="M38,42H10c-2.2,0-4-1.8-4-4V10c0-2.2,1.8-4,4-4h28c2.2,0,4,1.8,4,4v28C42,40.2,40.2,42,38,42z"/>
              <path fill="#FFF" d="M34,16H14v-2h20V16z M34,22H14v-2h20V22z M34,28H14v-2h20V28z M28,34H14v-2h14V34z"/>
            </svg>
          </div>

          {/* Connection Info */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Google Calendar
            </h3>
            {isConnected ? (
              <div className="mt-1">
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                    Connected
                  </span>
                </div>
                {googleEmail && (
                  <p className="mt-1 text-sm text-gray-600">
                    {googleEmail}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  You can now schedule classes with Google Meet links
                </p>
              </div>
            ) : (
              <div className="mt-1">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  Not Connected
                </span>
                <p className="mt-1 text-sm text-gray-600">
                  Connect your Google Calendar to automatically generate Meet links
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Connect/Disconnect Button */}
        <div>
          {isConnected ? (
            <button
              onClick={handleDisconnect}
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Disconnecting...
                </>
              ) : (
                'Disconnect'
              )}
            </button>
          ) : (
            <button
              onClick={handleConnect}
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Connecting...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd"/>
                  </svg>
                  Connect Google Calendar
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
            </svg>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Benefits */}
      {!isConnected && (
        <div className="mt-6 border-t border-gray-200 pt-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Benefits of connecting Google Calendar:
          </h4>
          <ul className="space-y-2">
            <li className="flex items-start">
              <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              <span className="text-sm text-gray-600">
                Automatically generate Google Meet links for live classes
              </span>
            </li>
            <li className="flex items-start">
              <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              <span className="text-sm text-gray-600">
                Sync classes with your Google Calendar
              </span>
            </li>
            <li className="flex items-start">
              <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              <span className="text-sm text-gray-600">
                Send automatic email invitations to students
              </span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
