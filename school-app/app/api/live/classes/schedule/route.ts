import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, startTime, endTime, classId, subjectId, timezone } = body;

    // Validate required fields
    if (!title || !startTime || !endTime) {
      return NextResponse.json(
        { ok: false, error: { message: "Missing required fields" } },
        { status: 400 }
      );
    }

    // TODO: 
    // 1. Get teacher from session
    // 2. Check if teacher has Google Calendar connected
    // 3. Create Google Calendar event with Meet link
    // 4. Save live class to database

    // Mock response for now
    const data = {
      success: true,
      message: "Live class scheduled successfully",
      liveClass: {
        id: "mock-live-class-id",
        title,
        description,
        startTime,
        endTime,
        classId,
        subjectId,
        timezone: timezone || "Asia/Karachi",
        meetingLink: "https://meet.google.com/mock-meeting-link",
        meetingProvider: "google_meet",
        status: "scheduled"
      }
    };

    return NextResponse.json({ ok: true, data });
  } catch (error) {
    console.error("Schedule live class error:", error);
    return NextResponse.json(
      { ok: false, error: { message: "Failed to schedule live class" } },
      { status: 500 }
    );
  }
}
