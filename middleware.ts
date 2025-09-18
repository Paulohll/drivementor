import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const isAuth = request.cookies.get("firebaseUser");
  const isLoginPage = request.nextUrl.pathname === "/login";

  if (!isAuth && !isLoginPage) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }
  if (isAuth && isLoginPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|api|public).*)"],
};
