import { NextRequest } from "next/server";

export function sessionRequest(request: NextRequest) {
  const cookies = Object.fromEntries(
    request.cookies.getAll().map((cookie) => [cookie.name, cookie.value])
  );

  const authHeader = request.headers.get("authorization");

  return {
    cookies,
    headers: {
      authorization: authHeader ?? undefined,
      "user-agent": request.headers.get("user-agent") ?? undefined
    },
    ip: request.headers.get("x-forwarded-for") ?? undefined
  };
}
