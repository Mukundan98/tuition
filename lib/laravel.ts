/** Laravel API origin (must be reachable from the Next.js server during Route Handlers). */
export function laravelApiUrl(apiPath: string): string {
  const base =
    process.env.LARAVEL_API_URL?.replace(/\/$/, "") || "http://127.0.0.1:8000";
  return `${base}${apiPath.startsWith("/") ? apiPath : `/${apiPath}`}`;
}
