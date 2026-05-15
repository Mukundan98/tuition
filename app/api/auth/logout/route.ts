import { AUTH_COOKIE_NAME } from "@/lib/constants";
import { laravelApiUrl } from "@/lib/laravel";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const jar = cookies();
  const token = jar.get(AUTH_COOKIE_NAME)?.value;

  if (token) {
    await fetch(laravelApiUrl("/api/auth/logout"), {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    }).catch(() => undefined);
  }

  jar.delete(AUTH_COOKIE_NAME);

  const res = NextResponse.json({
    success: true,
    message: "Logged out",
  });

  res.cookies.delete(AUTH_COOKIE_NAME);

  return res;
}
