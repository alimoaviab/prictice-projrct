import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // Generate Google OAuth URL
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/api/auth/google/callback";
  
  if (!clientId) {
    return NextResponse.json(
      { ok: false, error: { message: "Google Client ID not configured" } },
      { status: 500 }
    );
  }

  const scopes = [
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/userinfo.email"
  ];

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${clientId}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `response_type=code&` +
    `scope=${encodeURIComponent(scopes.join(" "))}&` +
    `access_type=offline&` +
    `prompt=consent`;

  return NextResponse.json({ ok: true, data: { authUrl } });
}
