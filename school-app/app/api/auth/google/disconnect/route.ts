import { NextResponse } from "next/server";

export async function POST(request: Request) {
  // TODO: Get teacher ID from session and disconnect Google Calendar
  // Remove tokens from database
  
  return NextResponse.json({ 
    ok: true, 
    data: { 
      success: true,
      message: "Google Calendar disconnected successfully"
    } 
  });
}
