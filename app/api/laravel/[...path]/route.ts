import { AUTH_COOKIE_NAME } from "@/lib/constants";
import { laravelApiUrl } from "@/lib/laravel";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const ALLOWED_ROOTS = new Set([
  "students",
  "teachers",
  "classes",
  "subjects",
  "attendances",
  "payhere",
  "fees",
  "fee-payments",
  "exams",
  "exam-papers",
  "online-exams",
  "online-exam-questions",
  "my-teaching-subjects",
  "timetable",
  "in-app-notifications",
  "dashboard",
  "search",
  "leaves",
]);

function allowPath(segments: string[]): boolean {
  if (segments.length === 0) {
    return false;
  }
  const root = segments[0] ?? "";
  if (ALLOWED_ROOTS.has(root)) {
    return true;
  }
  /** `PATCH auth/password` — account page; requires Bearer cookie (same as other BFF routes). */
  if (root === "auth" && segments[1] === "password" && segments.length === 2) {
    return true;
  }
  return false;
}

async function forward(
  request: NextRequest,
  pathSegments: string[]
): Promise<Response> {
  if (!allowPath(pathSegments)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const token = cookies().get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const path = `/api/${pathSegments.join("/")}`;
  const search = request.nextUrl.search;
  const target = `${laravelApiUrl(path)}${search}`;

  const method = request.method;
  const contentType = request.headers.get("content-type") ?? "";

  let body: BodyInit | undefined;

  if (
    method !== "GET" &&
    method !== "HEAD" &&
    method !== "DELETE" &&
    method !== "OPTIONS"
  ) {
    if (contentType.includes("multipart/form-data")) {
      body = await request.formData();
    } else {
      const text = await request.text();
      body = text.length > 0 ? text : undefined;
    }
  }

  const headers = new Headers({
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  });

  if (
    body !== undefined &&
    typeof body === "string" &&
    contentType.includes("application/json")
  ) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(target, {
    method,
    headers,
    ...(body !== undefined ? { body } : {}),
  });

  const resContentType = res.headers.get("content-type") ?? "";
  if (resContentType.includes("application/json")) {
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  const blob = await res.blob();
  const out = new Headers();
  const cd = res.headers.get("content-disposition");
  if (cd) {
    out.set("Content-Disposition", cd);
  }
  if (resContentType) {
    out.set("Content-Type", resContentType);
  }
  return new NextResponse(blob, { status: res.status, headers: out });
}

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return forward(request, params.path ?? []);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return forward(request, params.path ?? []);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return forward(request, params.path ?? []);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return forward(request, params.path ?? []);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return forward(request, params.path ?? []);
}
