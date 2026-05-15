export type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
};

/** Call Next.js BFF that proxies to Laravel `/api/…` with cookie auth. Path without leading slash (e.g. `students?page=1`). */
export async function apiFetch<T>(
  path: string,
  init?: RequestInit
): Promise<{ ok: boolean; status: number; json: ApiEnvelope<T> | null }> {
  const url = `/api/laravel/` + path.replace(/^\/*/, "");

  const res = await fetch(url, {
    ...init,
    cache: "no-store",
    credentials: "include",
  });

  let json: ApiEnvelope<T> | null = null;
  try {
    json = (await res.json()) as ApiEnvelope<T>;
  } catch {
    json = null;
  }

  return { ok: res.ok, status: res.status, json };
}

/** Binary download via BFF (PDF, CSV); forwards `Content-Disposition` when Laravel sets it. */
export async function apiDownload(path: string): Promise<{
  ok: boolean;
  status: number;
  blob: Blob;
  filename: string | null;
}> {
  const url = `/api/laravel/` + path.replace(/^\/*/, "");
  const res = await fetch(url, { credentials: "include", cache: "no-store" });
  const blob = await res.blob();
  let filename: string | null = null;
  const cd = res.headers.get("content-disposition");
  if (cd) {
    const m = /filename\*?=(?:UTF-8''|")?([^";]+)"?/i.exec(cd);
    filename = decodeURIComponent(m?.[1]?.trim() ?? "") || null;
  }
  return { ok: res.ok, status: res.status, blob, filename };
}

export function triggerBrowserDownload(blob: Blob, fallbackName: string) {
  const a = document.createElement("a");
  const href = URL.createObjectURL(blob);
  a.href = href;
  a.download = fallbackName;
  a.click();
  URL.revokeObjectURL(href);
}

export async function apiJson<TResp, TBody = unknown>(
  path: string,
  method: string,
  body?: TBody
): Promise<{ ok: boolean; status: number; json: ApiEnvelope<TResp> | null }> {
  const headers: Record<string, string> = { Accept: "application/json" };
  let initBody: string | undefined;

  if (method !== "GET" && method !== "HEAD" && body !== undefined) {
    headers["Content-Type"] = "application/json";
    initBody = JSON.stringify(body);
  }

  return apiFetch<TResp>(path, {
    method,
    headers,
    ...(initBody !== undefined ? { body: initBody } : {}),
  });
}
