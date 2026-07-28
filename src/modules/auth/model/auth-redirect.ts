const DEFAULT_AUTH_REDIRECT = "/workspace";
const ALLOWED_AUTH_REDIRECT_PREFIXES = ["/workspace", "/prototype", "/calculator"] as const;

function isAllowedAuthRedirectPath(pathname: string) {
  return ALLOWED_AUTH_REDIRECT_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function resolveAuthRedirect(rawRedirect: string | null | undefined) {
  if (!rawRedirect || !rawRedirect.startsWith("/") || rawRedirect.startsWith("//") || rawRedirect.startsWith("/\\")) {
    return DEFAULT_AUTH_REDIRECT;
  }

  try {
    const url = new URL(rawRedirect, "https://fortis.local");
    if (url.origin !== "https://fortis.local" || !isAllowedAuthRedirectPath(url.pathname)) {
      return DEFAULT_AUTH_REDIRECT;
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return DEFAULT_AUTH_REDIRECT;
  }
}
