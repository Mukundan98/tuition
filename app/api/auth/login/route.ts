import { AUTH_COOKIE_NAME } from "@/lib/constants";
import { laravelApiUrl } from "@/lib/laravel";
import { NextResponse } from "next/server";

const cookieOpts = {
  httpOnly: true as const,
  sameSite: "lax" as const,
  path: "/" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 24 * 7,
};

function stripTokenFromPayload(payload: Record<string, unknown>) {
  if (!payload?.data || typeof payload.data !== "object" || payload.data === null) {
    return payload;
  }
  const data = { ...(payload.data as Record<string, unknown>) };
  delete data.token;
  return { ...payload, data };
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  const res = await fetch(laravelApiUrl("/api/auth/login"), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  let payload: Record<string, unknown>;
  try {
    payload = (await res.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { message: "Unexpected response from API" },
      { status: 502 }
    );
  }

  if (!res.ok) {
    return NextResponse.json(payload, { status: res.status });
  }

  const data = payload.data as Record<string, unknown> | undefined;
  const token = typeof data?.token === "string" ? data.token : "";
  if (!token) {
    return NextResponse.json(
      { success: false, message: "Missing token from API" },
      { status: 502 }
    );
  }

  const out = NextResponse.json(stripTokenFromPayload(payload));
  out.cookies.set(AUTH_COOKIE_NAME, token, cookieOpts);
  return out;
}
