/**
 * ChatWidget Tests — Plexa frontend (streaming version).
 *
 * The widget streams responses from /chat/stream over Server-Sent Events.
 * Each test mocks fetch to return a ReadableStream of SSE frames and asserts
 * on the rendered output once the stream is consumed.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ChatWidget } from "@/components/chatbot/ChatWidget";

// ─── Storage / crypto mocks ───────────────────────────────────────────────

let mockStorage: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => mockStorage[key] ?? null,
  setItem: (key: string, val: string) => { mockStorage[key] = val; },
  removeItem: (key: string) => { delete mockStorage[key]; },
  clear: () => { mockStorage = {}; },
};
vi.stubGlobal("localStorage", localStorageMock);

let uuidCounter = 0;
vi.stubGlobal("crypto", {
  randomUUID: () => `uuid-${++uuidCounter}`,
});

// ─── Helpers ──────────────────────────────────────────────────────────────

const VALID_JWT = "eyJ.fake.jwt.token";

/** Encode an SSE event frame string. */
function sse(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

/** Build a ReadableStream that emits the given string in one push. */
function streamOf(payload: string): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(payload));
      controller.close();
    },
  });
}

/** Mock fetch responding with an SSE stream of the given chunks. */
function mockStream(chunks: { event: string; data: unknown }[]) {
  const body = chunks.map(c => sse(c.event, c.data)).join("");
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    body: streamOf(body),
    json: async () => ({}),
  });
}

/** Mock fetch that returns a non-streaming error response. */
function mockErrorOnce(status: number, body: unknown) {
  return vi.fn().mockResolvedValueOnce({
    ok: false,
    status,
    body: null,
    json: async () => body,
  });
}

function renderWidget() {
  return render(
    <MemoryRouter>
      <ChatWidget />
    </MemoryRouter>
  );
}

function openWidget() {
  fireEvent.click(screen.getByLabelText(/open ai assistant/i));
}

function getInput() {
  return screen.getByPlaceholderText(/type your message/i) as HTMLInputElement;
}

function getSendButton() {
  const buttons = screen.getAllByRole("button");
  return buttons[buttons.length - 1] as HTMLButtonElement;
}

beforeEach(() => {
  mockStorage = { token: VALID_JWT };
  uuidCounter = 0;
  vi.useRealTimers();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── R: Rendering ─────────────────────────────────────────────────────────

describe("ChatWidget — rendering", () => {
  it("R1: renders the floating button when closed", () => {
    renderWidget();
    expect(screen.getByLabelText(/open ai assistant/i)).toBeTruthy();
    expect(screen.queryByPlaceholderText(/type your message/i)).toBeNull();
  });

  it("R2: opens the panel on click", () => {
    renderWidget();
    openWidget();
    expect(screen.getByText("Plexa")).toBeTruthy();
    expect(screen.getByPlaceholderText(/type your message/i)).toBeTruthy();
  });

  it("R3: closes the panel on Close button", () => {
    renderWidget();
    openWidget();
    fireEvent.click(screen.getByTitle("Close"));
    expect(screen.queryByPlaceholderText(/type your message/i)).toBeNull();
  });

  it("R4: shows quick suggestions when no messages", () => {
    renderWidget();
    openWidget();
    expect(screen.getByText(/how do i create a class/i)).toBeTruthy();
    expect(screen.getByText(/how do i add a new student/i)).toBeTruthy();
  });
});

// ─── S: Session ID ────────────────────────────────────────────────────────

describe("ChatWidget — session id", () => {
  it("S1: generates and persists a session id, sends it in the stream body", async () => {
    const fetchMock = mockStream([
      { event: "meta", data: { session_id: "sid", message_id: "mid" } },
      { event: "chunk", data: { text: "hi" } },
      { event: "done", data: { reason: "complete" } },
    ]);
    vi.stubGlobal("fetch", fetchMock);

    renderWidget();
    openWidget();
    fireEvent.change(getInput(), { target: { value: "hi" } });
    fireEvent.click(getSendButton());

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const body = JSON.parse((fetchMock.mock.calls[0] as any[])[1].body);
    expect(body.session_id).toMatch(/^uuid-/);
    expect(mockStorage.plexa_session_id).toBe(body.session_id);
  });

  it("S2: reuses the same session id across messages", async () => {
    let nextChunks = [
      { event: "chunk", data: { text: "1" } },
      { event: "done", data: {} },
    ];
    const fetchMock = vi.fn().mockImplementation(async () => ({
      ok: true,
      status: 200,
      body: streamOf(nextChunks.map(c => sse(c.event, c.data)).join("")),
      json: async () => ({}),
    }));
    vi.stubGlobal("fetch", fetchMock);

    renderWidget();
    openWidget();

    fireEvent.change(getInput(), { target: { value: "first" } });
    fireEvent.click(getSendButton());
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    nextChunks = [
      { event: "chunk", data: { text: "2" } },
      { event: "done", data: {} },
    ];
    fireEvent.change(getInput(), { target: { value: "second" } });
    fireEvent.click(getSendButton());
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

    const id1 = JSON.parse((fetchMock.mock.calls[0] as any[])[1].body).session_id;
    const id2 = JSON.parse((fetchMock.mock.calls[1] as any[])[1].body).session_id;
    expect(id1).toBe(id2);
  });
});

// ─── M: Sending Messages ──────────────────────────────────────────────────

describe("ChatWidget — streaming messages", () => {
  it("M1: POSTs to /chat/stream with bearer token, JSON body, and Accept header", async () => {
    const fetchMock = mockStream([
      { event: "chunk", data: { text: "ok" } },
      { event: "done", data: {} },
    ]);
    vi.stubGlobal("fetch", fetchMock);

    renderWidget();
    openWidget();
    fireEvent.change(getInput(), { target: { value: "hello" } });
    fireEvent.click(getSendButton());

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/chat/stream");
    expect(init.method).toBe("POST");
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe(`Bearer ${VALID_JWT}`);
    expect(headers["Content-Type"]).toBe("application/json");
    expect(headers.Accept).toBe("text/event-stream");
    const body = JSON.parse(init.body as string);
    expect(body.message).toBe("hello");
    expect(body.language).toBe("english");
  });

  it("M2: appends streamed chunks into the assistant bubble", async () => {
    const fetchMock = mockStream([
      { event: "chunk", data: { text: "Hel" } },
      { event: "chunk", data: { text: "lo!" } },
      { event: "done", data: {} },
    ]);
    vi.stubGlobal("fetch", fetchMock);

    renderWidget();
    openWidget();
    fireEvent.change(getInput(), { target: { value: "hi" } });
    fireEvent.click(getSendButton());

    await waitFor(() => expect(screen.getByText(/Hello!/)).toBeTruthy());
  });

  it("M3: applies replace event to swap reply content", async () => {
    const fetchMock = mockStream([
      { event: "chunk", data: { text: "raw" } },
      { event: "replace", data: { text: "filtered" } },
      { event: "done", data: {} },
    ]);
    vi.stubGlobal("fetch", fetchMock);

    renderWidget();
    openWidget();
    fireEvent.change(getInput(), { target: { value: "x" } });
    fireEvent.click(getSendButton());

    await waitFor(() => expect(screen.getByText("filtered")).toBeTruthy());
    expect(screen.queryByText("raw")).toBeNull();
  });

  it("M4: renders action buttons from the actions event", async () => {
    const fetchMock = mockStream([
      { event: "chunk", data: { text: "Here are the steps." } },
      {
        event: "actions",
        data: {
          actions: [
            { label: "Create Class", path: "/admin/classes/create", intent: "create" },
            { label: "View Classes", path: "/admin/classes", intent: "navigate" },
          ],
        },
      },
      { event: "done", data: {} },
    ]);
    vi.stubGlobal("fetch", fetchMock);

    renderWidget();
    openWidget();
    fireEvent.change(getInput(), { target: { value: "how do i create a class" } });
    fireEvent.click(getSendButton());

    await waitFor(() => expect(screen.getByText("Create Class")).toBeTruthy());
    expect(screen.getByText("View Classes")).toBeTruthy();
  });

  it("M5: empty / whitespace messages are not sent", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    renderWidget();
    openWidget();
    fireEvent.click(getSendButton());
    expect(fetchMock).not.toHaveBeenCalled();

    fireEvent.change(getInput(), { target: { value: "   " } });
    fireEvent.click(getSendButton());
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

// ─── E: Error Handling ────────────────────────────────────────────────────

describe("ChatWidget — error handling", () => {
  it("E1: 401 → expired session message", async () => {
    const fetchMock = mockErrorOnce(401, { detail: "Invalid token" });
    vi.stubGlobal("fetch", fetchMock);

    renderWidget();
    openWidget();
    fireEvent.change(getInput(), { target: { value: "hi" } });
    fireEvent.click(getSendButton());

    await waitFor(() => expect(screen.getByText(/session has expired/i)).toBeTruthy());
  });

  it("E2: 429 → rate limit message", async () => {
    const fetchMock = mockErrorOnce(429, { detail: "Slow down" });
    vi.stubGlobal("fetch", fetchMock);

    renderWidget();
    openWidget();
    fireEvent.change(getInput(), { target: { value: "hi" } });
    fireEvent.click(getSendButton());

    await waitFor(() => expect(screen.getByText(/too many messages/i)).toBeTruthy());
  });

  it("E3: 503 → server detail surfaced", async () => {
    const fetchMock = mockErrorOnce(503, { detail: "Plexa is taking too long. Please try again." });
    vi.stubGlobal("fetch", fetchMock);

    renderWidget();
    openWidget();
    fireEvent.change(getInput(), { target: { value: "hi" } });
    fireEvent.click(getSendButton());

    await waitFor(() => expect(screen.getByText(/Plexa is taking too long/i)).toBeTruthy());
  });

  it("E4: network failure → connection error", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("net down"));
    vi.stubGlobal("fetch", fetchMock);

    renderWidget();
    openWidget();
    fireEvent.change(getInput(), { target: { value: "hi" } });
    fireEvent.click(getSendButton());

    await waitFor(() => expect(screen.getByText(/connection error/i)).toBeTruthy());
  });

  it("E5: server emits error event mid-stream", async () => {
    const fetchMock = mockStream([
      { event: "error", data: { detail: "AI service down", code: "AI_ERROR" } },
    ]);
    vi.stubGlobal("fetch", fetchMock);

    renderWidget();
    openWidget();
    fireEvent.change(getInput(), { target: { value: "hi" } });
    fireEvent.click(getSendButton());

    await waitFor(() => expect(screen.getByText(/AI service down/i)).toBeTruthy());
  });
});

// ─── L: localStorage Persistence ──────────────────────────────────────────

describe("ChatWidget — localStorage persistence", () => {
  it("L1: restores messages on mount", () => {
    mockStorage.plexa_messages = JSON.stringify([
      { id: "1", role: "user", content: "old user msg", timestamp: new Date().toISOString() },
      { id: "2", role: "assistant", content: "old bot reply", timestamp: new Date().toISOString() },
    ]);

    renderWidget();
    openWidget();
    expect(screen.getByText("old user msg")).toBeTruthy();
    expect(screen.getByText(/old bot reply/)).toBeTruthy();
  });

  it("L2: persists final assistant reply after stream completes", async () => {
    const fetchMock = mockStream([
      { event: "chunk", data: { text: "saved reply" } },
      { event: "done", data: {} },
    ]);
    vi.stubGlobal("fetch", fetchMock);

    renderWidget();
    openWidget();
    fireEvent.change(getInput(), { target: { value: "saved user" } });
    fireEvent.click(getSendButton());

    await waitFor(() => expect(screen.getByText(/saved reply/)).toBeTruthy());
    await waitFor(() => {
      const raw = mockStorage.plexa_messages;
      expect(raw).toBeTruthy();
      const stored = JSON.parse(raw);
      expect(stored.some((m: any) => m.content === "saved user")).toBe(true);
      expect(stored.some((m: any) => m.content.includes("saved reply"))).toBe(true);
    });
  });

  it("L4: corrupt JSON in localStorage doesn't crash", () => {
    mockStorage.plexa_messages = "{not json";
    expect(() => renderWidget()).not.toThrow();
  });
});

// ─── C: Clear Chat ────────────────────────────────────────────────────────

describe("ChatWidget — clear chat", () => {
  it("C1: clears local state and calls DELETE /chat/session", async () => {
    // Send one message first
    const fetchMock = vi.fn().mockImplementationOnce(async () => ({
      ok: true,
      status: 200,
      body: streamOf(sse("chunk", { text: "yo" }) + sse("done", {})),
      json: async () => ({}),
    })).mockImplementationOnce(async () => ({
      ok: true,
      status: 200,
      body: null,
      json: async () => ({ status: "cleared" }),
    }));
    vi.stubGlobal("fetch", fetchMock);

    renderWidget();
    openWidget();
    fireEvent.change(getInput(), { target: { value: "hello" } });
    fireEvent.click(getSendButton());
    await waitFor(() => expect(screen.getByText("yo")).toBeTruthy());

    fireEvent.click(screen.getByTitle("Clear chat"));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(mockStorage.plexa_messages).toBeUndefined();
      expect(mockStorage.plexa_session_id).toBeUndefined();
    });
    const [url, init] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(url).toBe("/chat/session");
    expect(init.method).toBe("DELETE");
  });
});

// ─── K: Keyboard ──────────────────────────────────────────────────────────

describe("ChatWidget — keyboard", () => {
  it("K1: Enter sends the message", async () => {
    const fetchMock = mockStream([
      { event: "chunk", data: { text: "ok" } },
      { event: "done", data: {} },
    ]);
    vi.stubGlobal("fetch", fetchMock);

    renderWidget();
    openWidget();
    const input = getInput();
    fireEvent.change(input, { target: { value: "via enter" } });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
  });

  it("K2: Shift+Enter does NOT send", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    renderWidget();
    openWidget();
    const input = getInput();
    fireEvent.change(input, { target: { value: "draft" } });
    fireEvent.keyDown(input, { key: "Enter", shiftKey: true });

    expect(fetchMock).not.toHaveBeenCalled();
  });
});

// ─── L: Language picker ───────────────────────────────────────────────────

describe("ChatWidget — language picker", () => {
  it("LANG1: switching to Urdu sends language=urdu", async () => {
    const fetchMock = mockStream([
      { event: "chunk", data: { text: "ٹھیک" } },
      { event: "done", data: {} },
    ]);
    vi.stubGlobal("fetch", fetchMock);

    renderWidget();
    openWidget();

    const langSelect = screen.getByTitle(/Language/i) as HTMLSelectElement;
    fireEvent.change(langSelect, { target: { value: "urdu" } });

    // After language switch, the placeholder is now Urdu — find the input by role.
    const urduInput = screen.getByRole("textbox") as HTMLInputElement;
    fireEvent.change(urduInput, { target: { value: "test" } });
    fireEvent.click(getSendButton());

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const body = JSON.parse((fetchMock.mock.calls[0] as any[])[1].body);
    expect(body.language).toBe("urdu");
  });
});
