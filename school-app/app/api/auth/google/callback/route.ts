import { NextResponse } from "next/server";
import { exchangeCodeForTokens } from "../../../../../../shared/services/google/oauth2-helper";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL(`/admin/live-class?error=${encodeURIComponent(error)}`, request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/admin/live-class?error=no_code", request.url)
    );
  }

  try {
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);

    // TODO: Save tokens to teacher's record in database
    // For now, just redirect with success
    
    return NextResponse.redirect(
      new URL("/admin/live-class?success=connected", request.url)
    );
  } catch (err) {
    console.error("Google OAuth callback error:", err);
    return NextResponse.redirect(
      new URL("/admin/live-class?error=auth_failed", request.url)
    );
  }
}
