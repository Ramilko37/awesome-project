import { backendFetch, backendErrorResponse } from "@/modules/drone-defense/infra/backend-proxy";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Ctx) {
  const { id } = await params;
  try {
    const data = await backendFetch(`/projects/export?id=${encodeURIComponent(id)}`, undefined, { request });
    return Response.json(data);
  } catch (err) {
    return backendErrorResponse(err);
  }
}

export async function PUT(request: Request, { params }: Ctx) {
  const [{ id }, body] = await Promise.all([params, request.text()]);
  try {
    const data = await backendFetch(`/projects/update?id=${encodeURIComponent(id)}`, { method: "PUT", body }, { request });
    return Response.json(data);
  } catch (err) {
    return backendErrorResponse(err);
  }
}

export async function DELETE(request: Request, { params }: Ctx) {
  const { id } = await params;
  try {
    const data = await backendFetch(`/projects/delete?id=${encodeURIComponent(id)}`, { method: "DELETE" }, { request });
    return Response.json(data);
  } catch (err) {
    return backendErrorResponse(err);
  }
}
