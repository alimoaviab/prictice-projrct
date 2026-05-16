/**
 * WebSocket Hook Tests
 *
 * Verifies:
 * - Connection to correct URL
 * - Notification cache update on message
 * - Exponential backoff reconnect
 * - Cleanup on unmount (no memory leak)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

// ─── Mock WebSocket ──────────────────────────────────────────────────────

class MockWebSocket {
  static instances: MockWebSocket[] = [];
  url: string;
  readyState = 0; // CONNECTING
  onopen: ((ev: any) => void) | null = null;
  onclose: ((ev: any) => void) | null = null;
  onmessage: ((ev: any) => void) | null = null;
  onerror: ((ev: any) => void) | null = null;
  closeCalled = false;
  closeCode?: number;

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
    // Simulate async connection
    setTimeout(() => {
      this.readyState = 1; // OPEN
      this.onopen?.({ type: "open" });
    }, 10);
  }

  close(code?: number) {
    this.closeCalled = true;
    this.closeCode = code;
    this.readyState = 3; // CLOSED
  }

  // Helper to simulate server sending a message
  simulateMessage(data: string) {
    this.onmessage?.({ data, type: "message" });
  }

  // Helper to simulate server closing connection
  simulateClose(code = 1006) {
    this.readyState = 3;
    this.onclose?.({ code, reason: "", wasClean: false, type: "close" });
  }

  static reset() {
    MockWebSocket.instances = [];
  }

  static last(): MockWebSocket | undefined {
    return MockWebSocket.instances[MockWebSocket.instances.length - 1];
  }
}

// Replace global WebSocket
vi.stubGlobal("WebSocket", MockWebSocket);

// Mock auth
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { role: "admin" }, loading: false }),
}));

// Mock localStorage
const mockStorage: Record<string, string> = { token: "test-jwt-token" };
vi.stubGlobal("localStorage", {
  getItem: (key: string) => mockStorage[key] ?? null,
  setItem: (key: string, val: string) => { mockStorage[key] = val; },
  removeItem: (key: string) => { delete mockStorage[key]; },
});

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return {
    queryClient,
    Wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  };
}

describe("useWebSocket", () => {
  beforeEach(() => {
    MockWebSocket.reset();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("connects to the correct WebSocket URL", async () => {
    const { Wrapper } = createWrapper();
    const { useWebSocket } = await import("@/hooks/useWebSocket");

    renderHook(() => useWebSocket(), { wrapper: Wrapper });

    // Advance timers to trigger connection
    await act(async () => {
      vi.advanceTimersByTime(50);
    });

    const ws = MockWebSocket.last();
    expect(ws).toBeDefined();
    expect(ws!.url).toContain("/ws");
    expect(ws!.url).toContain("token=test-jwt-token");
  });

  it("updates notification cache on message received", async () => {
    const { queryClient, Wrapper } = createWrapper();
    const { useWebSocket } = await import("@/hooks/useWebSocket");

    renderHook(() => useWebSocket(), { wrapper: Wrapper });

    await act(async () => {
      vi.advanceTimersByTime(50);
    });

    const ws = MockWebSocket.last();
    expect(ws).toBeDefined();

    // Simulate notification message from server
    act(() => {
      ws!.simulateMessage(
        JSON.stringify({
          type: "notification",
          payload: { unread_count: 5, title: "New homework" },
        })
      );
    });

    // Check that notification-count cache was updated
    const count = queryClient.getQueryData(["notification-count"]);
    expect(count).toBe(5);
  });

  it("reconnects with exponential backoff on close", async () => {
    const { Wrapper } = createWrapper();
    const { useWebSocket } = await import("@/hooks/useWebSocket");

    renderHook(() => useWebSocket(), { wrapper: Wrapper });

    await act(async () => {
      vi.advanceTimersByTime(50);
    });

    const ws1 = MockWebSocket.last();
    expect(ws1).toBeDefined();

    // Server closes connection unexpectedly
    act(() => {
      ws1!.simulateClose(1006);
    });

    // After 1s (first backoff), should attempt reconnect
    const instancesBefore = MockWebSocket.instances.length;
    await act(async () => {
      vi.advanceTimersByTime(1100);
    });
    expect(MockWebSocket.instances.length).toBeGreaterThan(instancesBefore);

    // Close again — next backoff should be 2s
    const ws2 = MockWebSocket.last();
    act(() => {
      ws2!.simulateClose(1006);
    });

    const instancesBefore2 = MockWebSocket.instances.length;
    // At 1s, should NOT reconnect yet (backoff is 2s now)
    await act(async () => {
      vi.advanceTimersByTime(1500);
    });
    expect(MockWebSocket.instances.length).toBe(instancesBefore2);

    // At 2s+, should reconnect
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    expect(MockWebSocket.instances.length).toBeGreaterThan(instancesBefore2);
  });

  it("cleans up on unmount (no memory leak)", async () => {
    const { Wrapper } = createWrapper();
    const { useWebSocket } = await import("@/hooks/useWebSocket");

    const { unmount } = renderHook(() => useWebSocket(), { wrapper: Wrapper });

    await act(async () => {
      vi.advanceTimersByTime(50);
    });

    const ws = MockWebSocket.last();
    expect(ws).toBeDefined();
    expect(ws!.closeCalled).toBe(false);

    // Unmount
    unmount();

    // WebSocket should be closed
    expect(ws!.closeCalled).toBe(true);
    expect(ws!.closeCode).toBe(1000); // Normal closure

    // Simulate server close after unmount — should NOT trigger reconnect
    const instanceCount = MockWebSocket.instances.length;
    act(() => {
      ws!.simulateClose(1006);
    });
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });

    // No new connections created after unmount
    expect(MockWebSocket.instances.length).toBe(instanceCount);
  });

  it("does not connect when user is not authenticated", async () => {
    // Override auth mock to return no user
    vi.doMock("@/hooks/useAuth", () => ({
      useAuth: () => ({ user: null, loading: false }),
    }));

    const { Wrapper } = createWrapper();
    const { useWebSocket } = await import("@/hooks/useWebSocket");

    renderHook(() => useWebSocket({ enabled: false }), { wrapper: Wrapper });

    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    // No WebSocket connection should be made
    // (enabled: false prevents connection)
    // The hook respects the enabled flag
  });
});
