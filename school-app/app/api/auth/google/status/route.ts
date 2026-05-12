import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // TODO: Get teacher ID from session and check Google Calendar connection status
  
  const data = {
    isConnected: false,
    email: null,
    connectedAt: null,
    lastSyncedAt: null
  };

  return NextResponse.json({ ok: true, data });
}
