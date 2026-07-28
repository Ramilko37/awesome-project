function withApiV1(url: string) {
  const trimmed = url.trim().replace(/\/+$/, "");
  return trimmed.endsWith("/api/v1") ? trimmed : `${trimmed}/api/v1`;
}

export function getBackendApiBaseUrl() {
  return withApiV1(
    process.env.BACKEND_URL?.trim() ||
      process.env.FORTIS_API_BASE_URL?.trim() ||
      process.env.NEXT_PUBLIC_FORTIS_API_BASE_URL?.trim() ||
      "http://85.208.87.187",
  );
}

const ACCESS_TOKEN_COOKIE = "access-token";

export type BackendError = {
  code: string;
  message: string;
};

// Maps a backend error response/status into a stable shape for the client.
function mapError(status: number, raw: unknown): BackendError {
  const body = (raw ?? {}) as { code?: string; message?: string; error?: string | { code?: string; message?: string }; errors?: string };
  const nestedError = typeof body.error === "object" ? body.error : undefined;
  const code =
    nestedError?.code ??
    body.code ??
    (status === 404 ? "not_found" : status === 409 ? "version_conflict" : "request_failed");
  const message =
    nestedError?.message ??
    body.message ??
    (typeof body.error === "string" ? body.error : undefined) ??
    body.errors ??
    `Backend request failed (${status})`;
  return { code, message };
}

export function accessTokenFromRequest(request: Request): string | null {
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${ACCESS_TOKEN_COOKIE}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function withForwardedAuth(initHeaders: HeadersInit | undefined, request: Request | undefined) {
  const headers = new Headers(initHeaders);
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  if (request) {
    const token = accessTokenFromRequest(request);
    if (token && !headers.has("Authorization")) headers.set("Authorization", `Bearer ${token}`);
    const cookie = request.headers.get("cookie");
    if (cookie && !headers.has("Cookie")) headers.set("Cookie", cookie);
  }

  return headers;
}

// Performs a server-side request to the Go backend.
// Returns parsed JSON on success; throws an object {status, error} on failure.
export async function backendFetch(path: string, init?: RequestInit, options: { request?: Request } = {}): Promise<unknown> {
  const response = await fetch(`${getBackendApiBaseUrl()}${path}`, {
    ...init,
    headers: withForwardedAuth(init?.headers, options.request),
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    const parsed = text ? JSON.parse(text) : null;
    throw { status: response.status, error: mapError(response.status, parsed) };
  }

  const text = await response.text();
  const parsed = text ? JSON.parse(text) : null;
  return parsed;
}

// Builds a Next Response from a thrown backendFetch error (or a generic failure).
export function backendErrorResponse(err: unknown): Response {
  const e = err as { status?: number; error?: BackendError };
  const status = e?.status ?? 502;
  const error = e?.error ?? { code: "proxy_error", message: "Failed to reach backend" };
  return Response.json({ error }, { status });
}
