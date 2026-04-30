import { NextRequest } from "next/server";

export function sessionRequest(request: NextRequest) {
  return {
    cookies: Object.fromEntries(request.cookies.getAll().map((cookie) => [cookie.name, cookie.value])),
    headers: {
      authorization: request.headers.get("authorization") ?? undefined,
      "user-agent": request.headers.get("user-agent") ?? undefined
    },
    ip: request.headers.get("x-forwarded-for") ?? undefined
  };
}
