import { exportDefenseProjectJson } from "@/shared/lib/defense-project";
import { readJson } from "@/shared/lib/api-client";
import type { DefenseProject, VariantListResponse, VariantSummary } from "@/shared/types/defense-project";
import type {
  DefenseCatalogResponse,
  DefenseLayersResponse,
  Facility,
} from "@/shared/types/drone-defense";

type LayersQuery = {
  facilityId: string;
  scenarioId: string;
};

async function readVariantJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  if (!response.ok) {
    let message = `Запрос не выполнен (${response.status})`;
    let code: string | undefined;
    try {
      const body = (await response.json()) as { error?: { code?: string; message?: string }; message?: string };
      code = body?.error?.code;
      if (body?.error?.message) message = body.error.message;
      else if (body?.message) message = body.message;
    } catch {
      // Keep the generic message when the response body is not JSON.
    }
    if (response.status === 409 || code === "version_conflict") {
      throw Object.assign(new Error(message), { status: 409, code: "version_conflict" });
    }
    throw Object.assign(new Error(message), { status: response.status, code });
  }
  return (await response.json()) as T;
}

export function fetchCatalog() {
  return readJson<DefenseCatalogResponse>("/api/defense/catalog");
}

export function fetchFacilities() {
  return readJson<Facility[]>("/api/defense/facilities");
}

export function fetchLayers(query: LayersQuery) {
  const params = new URLSearchParams({
    facilityId: query.facilityId,
    scenarioId: query.scenarioId,
  });
  return readJson<DefenseLayersResponse>(`/api/defense/layers?${params.toString()}`);
}

export function listVariants(): Promise<VariantListResponse> {
  return readVariantJson<VariantListResponse>("/api/defense/projects");
}

export function loadVariant(id: string): Promise<DefenseProject> {
  return readVariantJson<DefenseProject>(`/api/defense/projects/${encodeURIComponent(id)}`);
}

const backendUuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function uuidOrUndefined(value: string | undefined | null) {
  return value && backendUuidPattern.test(value) ? value : undefined;
}

function backendEnterpriseId(project: DefenseProject) {
  return uuidOrUndefined(project.enterpriseId) ?? uuidOrUndefined(project.baseObject.id);
}

function exportBackendProjectJson(project: DefenseProject) {
  const enterpriseId = backendEnterpriseId(project);
  return exportDefenseProjectJson({
    ...project,
    enterpriseId,
  });
}

function projectUpdatePayload(args: { name: string; project: DefenseProject }) {
  const enterpriseId = backendEnterpriseId(args.project);
  return {
    name: args.name,
    ...(enterpriseId ? { enterpriseId } : {}),
    projectJson: exportBackendProjectJson(args.project),
    ...(typeof args.project.version === "number" ? { version: args.project.version } : {}),
  };
}

export function saveVariantAsNew(args: { name: string; project: DefenseProject }): Promise<VariantSummary> {
  return readVariantJson<VariantSummary>("/api/defense/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(projectUpdatePayload(args)),
  });
}

export function overwriteVariant(args: { id: string; name: string; project: DefenseProject }): Promise<VariantSummary> {
  return readVariantJson<VariantSummary>(`/api/defense/projects/${encodeURIComponent(args.id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(projectUpdatePayload(args)),
  });
}

export function deleteVariant(id: string): Promise<{ status: string }> {
  return readVariantJson<{ status: string }>(`/api/defense/projects/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export {
  buildAssetLibraryUrl,
  createDefenseAsset,
  deleteDefenseAsset,
  fetchAssetLibrary,
  normalizeDefenseAssetPayload,
  updateDefenseAsset,
} from "@/modules/drone-defense/infra/asset-library-api";
