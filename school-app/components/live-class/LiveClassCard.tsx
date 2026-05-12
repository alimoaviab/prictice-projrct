/**
 * Live Class Card Component
 * Displays a scheduled live class with Join button
 */

'use client';

import { useState } from 'react';

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric'
  }).format(date);
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  }).format(date);
}

function isPast(date: Date) {
  return date.getTime() < Date.now();
}

function isFuture(date: Date) {
  return date.getTime() > Date.now();
}

function isWithinInterval(date: Date, interval: { start: Date; end: Date }) {
  const time = date.getTime();
  return time >= interval.start.getTime() && time <= interval.end.getTime();
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

interface LiveClassCardProps {
  liveClass: {
    _id: string;
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    meetingLink?: string;
    status: 'scheduled' | 'started' | 'ended' | 'cancelled';
    googleCalendarLink?: string;
  };
  onDelete?: (id: string) => void;
}

export default function LiveClassCard({ liveClass, onDelete }: LiveClassCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const startTime = new Date(liveClass.startTime);
  const endTime = new Date(liveClass.endTime);
  const now = new Date();

  // Determine class status
  const isUpcoming = isFuture(startTime);
  const isLive = isWithinInterval(now, { start: startTime, end: endTime });
  const isEnded = isPast(endTime);
  
  // Allow joining 15 minutes before start time
  const canJoin = isWithinInterval(now, { 
    start: addMinutes(startTime, -15), 
    end: endTime 
  });

  // Handle delete
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this live class?')) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/live/classes/${liveClass._id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete class');
      }

      onDelete?.(liveClass._id);
    } catch (error) {
      console.error('Error deleting class:', error);
      alert('Failed to delete class. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Get status badge
  const getStatusBadge = () => {
    if (liveClass.status === 'cancelled') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Cancelled
        </span>
      );
    }

    if (isLive) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <span className="animate-pulse mr-1">●</span>
          Live Now
        </span>
      );
    }

    if (isEnded) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          Ended
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        Upcoming
      </span>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {liveClass.title}
            </h3>
            {getStatusBadge()}
          </div>
          {liveClass.description && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {liveClass.description}
            </p>
          )}
        </div>

        {/* Delete Button */}
        {!isEnded && (
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="ml-4 text-gray-400 hover:text-red-600 focus:outline-none disabled:opacity-50"
            title="Delete class"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/>
            </svg>
          </button>
        )}
      </div>

      {/* Time Info */}
      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
        <div className="flex items-center">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
          </svg>
          {formatDate(startTime)}
        </div>
        <div className="flex items-center">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
          </svg>
          {formatTime(startTime)} - {formatTime(endTime)}
        </div>
      </div>

      {/* Meeting Link */}
      {liveClass.meetingLink && (
        <div className="mb-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z"/>
            </svg>
            <span className="font-medium">Google Meet</span>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={liveClass.meetingLink}
              readOnly
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md bg-gray-50 text-gray-600"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(liveClass.meetingLink!);
                alert('Link copied to clipboard!');
              }}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Copy link"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"/>
                <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center space-x-3">
        {/* Join Button */}
        {liveClass.meetingLink && canJoin && !isEnded && (
          <a
            href={liveClass.meetingLink}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              isLive 
                ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500 animate-pulse' 
                : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
            }`}
          >
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z"/>
            </svg>
            {isLive ? 'Join Now' : 'Join Live Class'}
          </a>
        )}

        {/* Upcoming - Can't join yet */}
        {!canJoin && isUpcoming && (
          <div className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-500 bg-gray-50 cursor-not-allowed">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
            </svg>
            Available 15 min before
          </div>
        )}

        {/* Ended */}
        {isEnded && (
          <div className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-500 bg-gray-50">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
            </svg>
            Class Ended
          </div>
        )}

        {/* View in Google Calendar */}
        {liveClass.googleCalendarLink && (
          <a
            href={liveClass.googleCalendarLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            title="View in Google Calendar"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
            </svg>
          </a>
        )}
      </div>

      {/* Join Info */}
      {canJoin && !isEnded && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-xs text-blue-800">
            💡 <strong>Tip:</strong> You can join the class up to 15 minutes before the scheduled start time.
          </p>
        </div>
      )}
    </div>
  );
}
