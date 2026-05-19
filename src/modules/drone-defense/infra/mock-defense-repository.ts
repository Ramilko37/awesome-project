import { evaluateConfiguration, recommendNextMoves } from "@/modules/drone-defense/domain/evaluation";
import {
  buildCatalogResponse,
  buildScenarioConfiguration,
  defenseAssets,
  defenseLayers,
  facilities,
  hexCells,
  threatRoutes,
} from "@/modules/drone-defense/infra/mock-defense-data";
import type {
  Configuration,
  DefenseCatalogResponse,
  DefenseLayersResponse,
  DefenseScenarioId,
  EvaluateRequest,
  KpiResult,
  RecommendRequest,
  Recommendation,
} from "@/shared/types/drone-defense";

const assetsById = new Map(defenseAssets.map((asset) => [asset.id, asset]));

function getScenarioConfiguration(
  facilityId: string,
  scenarioId: DefenseScenarioId,
): Configuration {
  return buildScenarioConfiguration(facilityId, scenarioId);
}

export async function getCatalog(): Promise<DefenseCatalogResponse> {
  return buildCatalogResponse();
}

export async function getFacilities() {
  return facilities;
}

export async function getThreatRoutes() {
  return threatRoutes;
}

export async function getHexCells() {
  return hexCells;
}

export async function getLayers(
  facilityId: string,
  scenarioId: DefenseScenarioId,
): Promise<DefenseLayersResponse> {
  const configuration = getScenarioConfiguration(facilityId, scenarioId);
  const kpi = evaluateConfiguration(configuration, {
    catalog: buildCatalogResponse(),
    assetsById,
    cells: hexCells,
    layers: defenseLayers,
  });

  return {
    facilityId,
    scenarioId,
    layerCoverage: defenseLayers.map((layer, index) => ({
      layerId: layer.id,
      coveredPct: Math.min(1, kpi.perimeterCoveredPct * (0.62 + index * 0.045)),
    })),
  };
}

export async function evaluateDefense(request: EvaluateRequest): Promise<KpiResult> {
  return evaluateConfiguration(request.configuration, {
    catalog: buildCatalogResponse(),
    assetsById,
    cells: hexCells,
    layers: defenseLayers,
  });
}

export async function recommendDefense(request: RecommendRequest): Promise<Recommendation[]> {
  return recommendNextMoves(
    request.configuration,
    {
      catalog: buildCatalogResponse(),
      assetsById,
      cells: hexCells,
      layers: defenseLayers,
    },
    request.budgetRub,
    request.limit ?? 3,
  );
}
