import { laravelApiUrl } from "@/lib/laravel";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  const res = await fetch(laravelApiUrl("/api/auth/reset-password"), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const payload = await res.json().catch(() => ({
    success: false,
    message: "Unexpected response",
  }));

  return NextResponse.json(payload, { status: res.status });
}
