import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createCsrfCookie, CSRF_COOKIE } from "@/lib/csrf";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, message: "Not authenticated." },
      { status: 401 }
    );
  }

  const existing = request.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${CSRF_COOKIE}=`))
    ?.slice(CSRF_COOKIE.length + 1);

  if (existing && existing.length === 64) {
    return new NextResponse(null, { status: 204 });
  }

  const response = new NextResponse(null, { status: 204 });
  const { token, options } = createCsrfCookie();
  response.cookies.set(CSRF_COOKIE, token, options);
  return response;
}
