import { NextResponse, type NextRequest } from "next/server";

const protectedRoutes = ["/prototype", "/calculator", "/workspace"];
const authGuardEnabled = process.env.FORTIS_AUTH_ENABLED === "true";

function isProtectedPath(pathname: string) {
  return protectedRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export function proxy(request: NextRequest) {
  if (!authGuardEnabled || !isProtectedPath(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get("access-token")?.value;
  if (token) return NextResponse.next();

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.search = "";
  loginUrl.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/prototype/:path*", "/calculator/:path*", "/workspace/:path*"],
};
