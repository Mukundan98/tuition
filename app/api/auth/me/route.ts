import { AUTH_COOKIE_NAME } from "@/lib/constants";
import { laravelApiUrl } from "@/lib/laravel";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/** Avoid hanging the session bootstrap when Laravel or the DB is unreachable (client stays on loading skeleton). */
const LARAVEL_FETCH_MS = 12_000;

export async function GET() {
  const token = cookies().get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LARAVEL_FETCH_MS);

  let res: Response;
  try {
    res = await fetch(laravelApiUrl("/api/auth/me"), {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
      signal: controller.signal,
    });
  } catch (e) {
    clearTimeout(timeout);
    const aborted = e instanceof Error && e.name === "AbortError";
    return NextResponse.json(
      {
        success: false,
        message: aborted
          ? "Auth service timed out. Check that the API is running."
          : "Could not reach auth service.",
      },
      { status: aborted ? 504 : 503 }
    );
  }

  clearTimeout(timeout);

  let payload: unknown;
  try {
    payload = await res.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  if (!res.ok) {
    cookies().delete(AUTH_COOKIE_NAME);
    const response = NextResponse.json(payload as object, {
      status: res.status === 403 ? res.status : 401,
    });
    response.cookies.delete(AUTH_COOKIE_NAME);
    return response;
  }

  return NextResponse.json(payload as object);
}
