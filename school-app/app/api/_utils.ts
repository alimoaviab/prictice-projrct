import { NextRequest } from "next/server";

export function sessionRequest(request: NextRequest) {
  const cookies = Object.fromEntries(
    request.cookies.getAll().map((cookie) => [cookie.name, cookie.value])
  );

  const authHeader = request.headers.get("authorization");

  // Log for debugging
  if (authHeader) {
    const tokenPreview = authHeader.substring(0, 50);
    console.log(
      `[SessionRequest] Auth header received: ${tokenPreview}... ` +
      `(length: ${authHeader.length})`
    );
  }

  if (cookies.session) {
    const tokenPreview = cookies.session.substring(0, 50);
    console.log(
      `[SessionRequest] Session cookie found: ${tokenPreview}... ` +
      `(length: ${cookies.session.length})`
    );
  }

  return {
    cookies,
    headers: {
      authorization: authHeader ?? undefined,
      "user-agent": request.headers.get("user-agent") ?? undefined
    },
    ip: request.headers.get("x-forwarded-for") ?? undefined
  };
}
