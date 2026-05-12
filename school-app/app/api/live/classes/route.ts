import { NextResponse } from "next/server";

// In-memory storage for demo (in production, use database)
let scheduledClasses: any[] = [];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const teacherId = searchParams.get("teacherId");

  // Filter classes based on query params
  let filtered = [...scheduledClasses];
  
  if (status) {
    filtered = filtered.filter(c => c.status === status);
  }
  
  if (teacherId) {
    filtered = filtered.filter(c => c.teacherId === teacherId);
  }

  return NextResponse.json({ 
    ok: true,
    success: true,
    data: filtered
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.title || !body.classId || !body.subjectId || !body.startTime || !body.endTime) {
      return NextResponse.json(
        { 
          ok: false,
          success: false,
          error: "Missing required fields: title, classId, subjectId, startTime, endTime"
        },
        { status: 400 }
      );
    }

    const mockMeetingLink = `https://meet.google.com/mock-${Date.now()}`;
    
    // Create new live class object
    const newLiveClass = {
      _id: `live-class-${Date.now()}`,
      id: `live-class-${Date.now()}`,
      title: body.title,
      classId: body.classId,
      subjectId: body.subjectId,
      teacherId: body.teacherId || null,
      startTime: body.startTime,
      endTime: body.endTime,
      meetingLink: mockMeetingLink,
      meetingProvider: "google_meet",
      status: "SCHEDULED",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Store in memory (in production, save to database)
    scheduledClasses.push(newLiveClass);
    
    console.log("Live class created:", newLiveClass);
    console.log("Total scheduled classes:", scheduledClasses.length);
    
    return NextResponse.json({ 
      ok: true,
      success: true,
      data: newLiveClass
    });
  } catch (error) {
    console.error("Error creating live class:", error);
    return NextResponse.json(
      { 
        ok: false,
        success: false,
        error: error instanceof Error ? error.message : "Failed to create live class"
      },
      { status: 500 }
    );
  }
}
