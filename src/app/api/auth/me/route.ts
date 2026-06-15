import { backendErrorResponse, backendFetch } from "@/modules/drone-defense/infra/backend-proxy";

export async function GET(request: Request) {
  try {
    const data = await backendFetch("/auth/me", undefined, { request });
    return Response.json(data);
  } catch (err) {
    return backendErrorResponse(err);
  }
}
