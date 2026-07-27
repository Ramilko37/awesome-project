import { backendErrorResponse, backendFetch } from "@/modules/drone-defense/infra/backend-proxy";
import { mapProtectedObjectsToFacilities } from "@/modules/drone-defense/infra/backend-demo-adapters";
import { normalizeEnterprisePayload } from "@/modules/drone-defense/infra/enterprise-api";
import { getFacilities } from "@/modules/drone-defense/infra/mock-defense-repository";

export const dynamic = "force-dynamic";

type BackendEnterpriseListResponse = {
  items?: Array<Record<string, unknown>>;
};

export async function GET(request: Request) {
  try {
    const data = (await backendFetch("/enterprises?limit=200", undefined, { request })) as BackendEnterpriseListResponse | Array<Record<string, unknown>>;
    const items = Array.isArray(data) ? data : data.items ?? [];
    if (items.length === 0) return Response.json(await getFacilities());
    return Response.json(mapProtectedObjectsToFacilities(items.map(normalizeEnterprisePayload)));
  } catch (err) {
    if ((err as { status?: number })?.status === 401 || (err as { status?: number })?.status === 404) {
      return Response.json(await getFacilities());
    }
    return backendErrorResponse(err);
  }
}
