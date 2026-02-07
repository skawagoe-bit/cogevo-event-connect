import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicRoutePatterns = [
  /^\/sign-in(\/.*)?$/,
  /^\/sign-up(\/.*)?$/,
  /^\/access-denied$/,
];

const hasClerkSession = (req: NextRequest) =>
  req.cookies.has("__session") ||
  req.cookies.has("__client_uat") ||
  req.cookies.has("__clerk_db_jwt");

const isPublicRoute = (pathname: string) =>
  publicRoutePatterns.some((pattern) => pattern.test(pathname));

export default function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  if (!hasClerkSession(req)) {
    const signInUrl = req.nextUrl.clone();
    signInUrl.pathname = "/sign-in";
    signInUrl.searchParams.set("redirect_url", `${pathname}${search}`);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
