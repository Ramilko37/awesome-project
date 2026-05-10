const rawBasePath = process.env.NEXT_PUBLIC_BASE_PATH?.trim() ?? "";

export const appBasePath =
  rawBasePath && rawBasePath !== "/"
    ? `/${rawBasePath.replace(/^\/+|\/+$/g, "")}`
    : "";

export function withBasePath(path: string) {
  if (!path) return path;
  if (!appBasePath) return path;
  if (/^(https?:)?\/\//.test(path)) return path;
  if (!path.startsWith("/")) return `${appBasePath}/${path}`;
  return `${appBasePath}${path}`;
}
