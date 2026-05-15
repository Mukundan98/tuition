import { AUTH_COOKIE_NAME } from "@/lib/constants";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const protectedPrefixes = [
  "/dashboard",
  "/profile",
  "/students",
  "/teachers",
  "/classes",
  "/subjects",
  "/attendance",
  "/fees",
  "/exam-results",
  "/exams",
  "/online-exams",
  "/exam-papers",
  "/timetable",
  "/notifications",
  "/reports",
];

export function middleware(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const { pathname } = request.nextUrl;
  const isLoginOrRegister =
    pathname.startsWith("/login") || pathname.startsWith("/register");
  const needsAuth = protectedPrefixes.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );

  if (needsAuth && !token) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  if (token && isLoginOrRegister) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/profile",
    "/profile/:path*",
    "/students",
    "/students/:path*",
    "/teachers",
    "/teachers/:path*",
    "/classes",
    "/classes/:path*",
    "/subjects",
    "/subjects/:path*",
    "/attendance",
    "/attendance/:path*",
    "/fees",
    "/fees/:path*",
    "/exam-results",
    "/exam-results/:path*",
    "/exams",
    "/exams/:path*",
    "/online-exams",
    "/online-exams/:path*",
    "/exam-papers",
    "/exam-papers/:path*",
    "/timetable",
    "/timetable/:path*",
    "/notifications",
    "/notifications/:path*",
    "/reports",
    "/reports/:path*",
    "/login",
    "/login/:path*",
    "/register",
    "/register/:path*",
  ],
};
