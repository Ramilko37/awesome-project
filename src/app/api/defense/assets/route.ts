import { backendErrorResponse, backendFetch } from "@/modules/drone-defense/infra/backend-proxy";
import { normalizeDefenseAssetPayload } from "@/modules/drone-defense/infra/asset-library-api";
import { defenseAssetLibrary } from "@/shared/config/defense-asset-library";

export const dynamic = "force-dynamic";

type BackendAssetListResponse = {
  items?: Array<Record<string, unknown>>;
  totalItems?: number;
};

function fallbackAssetLibrary() {
  return Response.json({ items: defenseAssetLibrary, totalItems: defenseAssetLibrary.length });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const qs = searchParams.toString();

  try {
    const data = (await backendFetch(`/assets${qs ? `?${qs}` : ""}`, undefined, { request })) as
      | BackendAssetListResponse
      | Array<Record<string, unknown>>;
    const items = Array.isArray(data) ? data : data.items ?? [];
    if (items.length === 0) return fallbackAssetLibrary();
    return Response.json({
      items: items.map(normalizeDefenseAssetPayload),
      totalItems: Array.isArray(data) ? items.length : data.totalItems ?? items.length,
    });
  } catch (err) {
    const status = (err as { status?: number })?.status;
    if (status === 401 || status === 404) return fallbackAssetLibrary();
    return backendErrorResponse(err);
  }
}
