import { backendErrorResponse, backendFetch } from "@/modules/drone-defense/infra/backend-proxy";
import { buildBackendCatalogResponse } from "@/modules/drone-defense/infra/backend-demo-adapters";
import { normalizeDefenseAssetPayload } from "@/modules/drone-defense/infra/asset-library-api";
import { getCatalog } from "@/modules/drone-defense/infra/mock-defense-repository";

export const dynamic = "force-dynamic";

type BackendAssetListResponse = {
  items?: Array<Record<string, unknown>>;
};

export async function GET(request: Request) {
  try {
    const data = (await backendFetch("/assets?isPublic=true&limit=200", undefined, { request })) as BackendAssetListResponse | Array<Record<string, unknown>>;
    const items = Array.isArray(data) ? data : data.items ?? [];
    if (items.length === 0) return Response.json(await getCatalog());
    return Response.json(buildBackendCatalogResponse(items.map(normalizeDefenseAssetPayload)));
  } catch (err) {
    if ((err as { status?: number })?.status === 401 || (err as { status?: number })?.status === 404) {
      return Response.json(await getCatalog());
    }
    return backendErrorResponse(err);
  }
}
