import createMiddleware from "next-intl/middleware";
import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";

import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
const PROTECTED_PREFIXES = ["/api/invoices", "/api/suppliers", "/api/admin"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (isProtected) {
    const token = request.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set("x-user-id", String(payload.userId));
      requestHeaders.set("x-user-role", String(payload.role));

      return NextResponse.next({ request: { headers: requestHeaders } });
    } catch {
      return NextResponse.json(
        { error: "Session invalide ou expirée." },
        { status: 401 }
      );
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: [
    "/api/invoices/:path*",
    "/api/suppliers/:path*",
    "/api/admin/:path*",
    "/((?!api/|_next|_vercel|.*\\..*).*)",
  ],
};
