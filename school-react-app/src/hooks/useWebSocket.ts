/**
 * useWebSocket — persistent WebSocket connection with auto-reconnect.
 *
 * Features:
 *   - Connects to /ws with JWT auth
 *   - Exponential backoff reconnect (1s, 2s, 4s, 8s, ... max 30s)
 *   - Dispatches messages to registered handlers by type
 *   - Updates TanStack Query cache on notification messages
 *   - Graceful cleanup on unmount
 *
 * Usage:
 * ```tsx
 * const { isConnected, lastMessage } = useWebSocket();
 * ```
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";

interface WSMessage {
  type: string;
  payload: any;
}

interface UseWebSocketOptions {
  enabled?: boolean;
  onMessage?: (msg: WSMessage) => void;
}

const MAX_RECONNECT_DELAY = 30_000; // 30 seconds
const INITIAL_RECONNECT_DELAY = 1_000; // 1 second

export function useWebSocket(opts: UseWebSocketOptions = {}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WSMessage | null>(null);

  const enabled = opts.enabled !== false && !!user;

  // Build WebSocket URL
  const getWSUrl = useCallback(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const token = localStorage.getItem("token") || "";
    return `${protocol}//${host}/ws?token=${encodeURIComponent(token)}`;
  }, []);

  // Handle incoming messages
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      try {
        // Messages may be batched (newline-separated)
        const messages = (event.data as string).split("\n").filter(Boolean);

        for (const raw of messages) {
          const msg: WSMessage = JSON.parse(raw);
          setLastMessage(msg);

          // Route message to appropriate cache update
          switch (msg.type) {
            case "notification":
              // Invalidate notifications cache — triggers refetch
              queryClient.invalidateQueries({ queryKey: ["notifications"] });
              // Also update the unread count if provided
              if (msg.payload?.unread_count !== undefined) {
                queryClient.setQueryData(
                  ["notification-count"],
                  msg.payload.unread_count
                );
              }
              break;

            case "attendance":
              // Invalidate all attendance caches across all portals
              queryClient.invalidateQueries({ queryKey: ["attendance"] });
              queryClient.invalidateQueries({ queryKey: ["parent-attendance"] });
              queryClient.invalidateQueries({ queryKey: ["parent-student-attendance"] });
              queryClient.invalidateQueries({ queryKey: ["attendance-summary"] });
              queryClient.invalidateQueries({ queryKey: ["dashboard"] });
              break;

            case "fee_update":
              queryClient.invalidateQueries({ queryKey: ["fees"] });
              queryClient.invalidateQueries({ queryKey: ["dashboard"] });
              break;

            case "job_progress":
              // Update job status in cache
              if (msg.payload?.job_id) {
                queryClient.setQueryData(
                  ["job", msg.payload.job_id],
                  msg.payload
                );
              }
              break;
          }

          // Call custom handler if provided
          opts.onMessage?.(msg);
        }
      } catch {
        // Ignore parse errors for non-JSON messages (ping/pong)
      }
    },
    [queryClient, opts]
  );

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (!enabled || !mountedRef.current) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const url = getWSUrl();
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!mountedRef.current) return;
      setIsConnected(true);
      reconnectAttemptRef.current = 0; // Reset backoff on successful connect
      console.info("[ws] connected");
    };

    ws.onmessage = handleMessage;

    ws.onclose = (event) => {
      if (!mountedRef.current) return;
      setIsConnected(false);
      wsRef.current = null;

      // Don't reconnect on intentional close (1000) or auth failure (4001)
      if (event.code === 1000 || event.code === 4001) {
        console.info("[ws] closed intentionally:", event.code);
        return;
      }

      // Exponential backoff reconnect
      const attempt = reconnectAttemptRef.current;
      const delay = Math.min(
        INITIAL_RECONNECT_DELAY * Math.pow(2, attempt),
        MAX_RECONNECT_DELAY
      );
      reconnectAttemptRef.current = attempt + 1;

      console.info(`[ws] reconnecting in ${delay}ms (attempt ${attempt + 1})`);
      reconnectTimerRef.current = setTimeout(connect, delay);
    };

    ws.onerror = () => {
      // Error is followed by onclose — no action needed here
    };
  }, [enabled, getWSUrl, handleMessage]);

  // Connect on mount, reconnect on user change
  useEffect(() => {
    mountedRef.current = true;

    if (enabled) {
      connect();
    }

    return () => {
      mountedRef.current = false;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close(1000, "component unmount");
        wsRef.current = null;
      }
    };
  }, [enabled, connect]);

  return {
    isConnected,
    lastMessage,
  };
}
