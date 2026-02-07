import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicRoutePatterns = [
  /^\/sign-in(\/.*)?$/,
  /^\/sign-up(\/.*)?$/,
  /^\/access-denied$/,
];

const textEncoder = new TextEncoder();

const toHex = (buffer: ArrayBuffer) =>
  Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

const signToken = async (token: string, secret: string) => {
  const key = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(secret),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    textEncoder.encode(token)
  );
  return toHex(signature);
};

const isPublicRoute = (pathname: string) =>
  publicRoutePatterns.some((pattern) => pattern.test(pathname));

export default async function middleware(req: NextRequest) {
  const requestHeaders = new Headers(req.headers);
  const sessionToken = req.cookies.get("__session")?.value;
  const secretKey = process.env.CLERK_SECRET_KEY || "";

  if (sessionToken && secretKey) {
    const signature = await signToken(sessionToken, secretKey);
    requestHeaders.set("x-clerk-auth-status", "signed-in");
    requestHeaders.set("x-clerk-auth-token", sessionToken);
    requestHeaders.set("x-clerk-auth-signature", signature);
  } else {
    requestHeaders.set("x-clerk-auth-status", "signed-out");
  }

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  const { pathname, search } = req.nextUrl;
  if (!sessionToken && !isPublicRoute(pathname)) {
    const signInUrl = req.nextUrl.clone();
    signInUrl.pathname = "/sign-in";
    signInUrl.searchParams.set("redirect_url", `${pathname}${search}`);
    return NextResponse.redirect(signInUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
