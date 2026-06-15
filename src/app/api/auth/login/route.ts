import { backendErrorResponse, backendFetch } from "@/modules/drone-defense/infra/backend-proxy";

const accessTokenCookie = "access-token";

type AuthResponse = {
  token?: string;
  user?: unknown;
};

function authCookie(token: string) {
  return `${accessTokenCookie}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`;
}

export async function POST(request: Request) {
  const body = await request.text();
  try {
    const data = (await backendFetch("/auth/login", { method: "POST", body })) as AuthResponse;
    if (!data.token) {
      return Response.json({ error: { code: "auth_error", message: "Backend did not return an access token" } }, { status: 502 });
    }
    return Response.json(
      { user: data.user },
      {
        headers: {
          "Set-Cookie": authCookie(data.token),
        },
      },
    );
  } catch (err) {
    return backendErrorResponse(err);
  }
}
