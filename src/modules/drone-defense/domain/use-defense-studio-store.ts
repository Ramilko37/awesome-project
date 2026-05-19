"use client";

import { create } from "zustand";
import { buildScenarioConfiguration, hexCells, threatRoutes } from "@/modules/drone-defense/infra/mock-defense-data";
import {
  evaluateConfigurationRequest,
  fetchCatalog,
  fetchFacilities,
  fetchLayers,
  recommendConfigurationRequest,
} from "@/modules/drone-defense/infra/api-client";
import type { RecommendRequest } from "@/shared/types/drone-defense";
import {
  recommendDefense as localRecommendDefense,
  evaluateDefense as localEvaluateDefense,
  getCatalog as localGetCatalog,
  getFacilities as localGetFacilities,
  getLayers as localGetLayers,
} from "@/modules/drone-defense/infra/mock-defense-repository";
import type {
  DefenseCatalogResponse,
  DefenseLayersResponse,
  DefenseScenarioId,
  Facility,
  KpiResult,
  Recommendation,
} from "@/shared/types/drone-defense";

type StudioView = "gis" | "comparison" | "drilldown";

type StudioState = {
  view: StudioView;
  facilityId: string;
  scenarioId: DefenseScenarioId;
  budgetRub: number;
  loading: boolean;
  error: string | null;
  catalog: DefenseCatalogResponse | null;
  facilities: Facility[];
  layers: DefenseLayersResponse | null;
  kpiByScenario: Partial<Record<DefenseScenarioId, KpiResult>>;
  recommendations: Recommendation[];
  init: () => Promise<void>;
  setView: (view: StudioView) => void;
  setFacilityId: (facilityId: string) => Promise<void>;
  setScenarioId: (scenarioId: DefenseScenarioId) => Promise<void>;
  setBudgetRub: (budgetRub: number) => Promise<void>;
  refreshScenarioData: () => Promise<void>;
};

const allScenarios: DefenseScenarioId[] = ["baseline", "balanced", "reinforced"];
const useLocalRuntime = process.env.NEXT_PUBLIC_DEFENSE_RUNTIME === "local";

const runtime = {
  fetchCatalog: useLocalRuntime ? localGetCatalog : fetchCatalog,
  fetchFacilities: useLocalRuntime ? localGetFacilities : fetchFacilities,
  fetchLayers: useLocalRuntime
    ? (args: { facilityId: string; scenarioId: DefenseScenarioId }) => localGetLayers(args.facilityId, args.scenarioId)
    : fetchLayers,
  evaluate: useLocalRuntime
    ? (configuration: ReturnType<typeof buildScenarioConfiguration>) =>
        localEvaluateDefense({ configuration, scope: "facility" })
    : (configuration: ReturnType<typeof buildScenarioConfiguration>) =>
        evaluateConfigurationRequest(configuration, "facility"),
  recommend: useLocalRuntime
    ? (configuration: ReturnType<typeof buildScenarioConfiguration>, budgetRub: number) =>
        localRecommendDefense({ configuration, budgetRub, limit: 3 } satisfies RecommendRequest)
    : recommendConfigurationRequest,
};

async function loadScenarioPack(facilityId: string, scenarioId: DefenseScenarioId, budgetRub: number) {
  const layers = await runtime.fetchLayers({ facilityId, scenarioId });

  const kpiEntries = await Promise.all(
    allScenarios.map(async (item) => {
      const configuration = buildScenarioConfiguration(facilityId, item);
      const kpi = await runtime.evaluate(configuration);
      return [item, kpi] as const;
    }),
  );

  const kpiByScenario = Object.fromEntries(kpiEntries) as Partial<Record<DefenseScenarioId, KpiResult>>;
  const recommendations = await runtime.recommend(buildScenarioConfiguration(facilityId, scenarioId), budgetRub);

  return { layers, kpiByScenario, recommendations };
}

export const useDefenseStudioStore = create<StudioState>((set, get) => ({
  view: "gis",
  facilityId: "facility-alpha",
  scenarioId: "baseline",
  budgetRub: 55_000_000,
  loading: false,
  error: null,
  catalog: null,
  facilities: [],
  layers: null,
  kpiByScenario: {},
  recommendations: [],
  init: async () => {
    set({ loading: true, error: null });
    try {
      const [catalog, facilities] = await Promise.all([runtime.fetchCatalog(), runtime.fetchFacilities()]);
      const facilityId = facilities[0]?.id ?? "facility-alpha";
      const scenarioId = get().scenarioId;
      const budgetRub = get().budgetRub;
      const pack = await loadScenarioPack(facilityId, scenarioId, budgetRub);
      set({
        catalog,
        facilities,
        facilityId,
        layers: pack.layers,
        kpiByScenario: pack.kpiByScenario,
        recommendations: pack.recommendations,
        loading: false,
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "failed to initialize", loading: false });
    }
  },
  setView: (view) => set({ view }),
  setFacilityId: async (facilityId) => {
    set({ loading: true, facilityId, error: null });
    try {
      const scenarioId = get().scenarioId;
      const budgetRub = get().budgetRub;
      const pack = await loadScenarioPack(facilityId, scenarioId, budgetRub);
      set({ layers: pack.layers, kpiByScenario: pack.kpiByScenario, recommendations: pack.recommendations, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "failed to switch facility", loading: false });
    }
  },
  setScenarioId: async (scenarioId) => {
    set({ loading: true, scenarioId, error: null });
    try {
      const { facilityId, budgetRub } = get();
      const pack = await loadScenarioPack(facilityId, scenarioId, budgetRub);
      set({ layers: pack.layers, kpiByScenario: pack.kpiByScenario, recommendations: pack.recommendations, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "failed to switch scenario", loading: false });
    }
  },
  setBudgetRub: async (budgetRub) => {
    set({ loading: true, budgetRub, error: null });
    try {
      const { facilityId, scenarioId } = get();
      const pack = await loadScenarioPack(facilityId, scenarioId, budgetRub);
      set({ layers: pack.layers, recommendations: pack.recommendations, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "failed to update budget", loading: false });
    }
  },
  refreshScenarioData: async () => {
    set({ loading: true, error: null });
    try {
      const { facilityId, scenarioId, budgetRub } = get();
      const pack = await loadScenarioPack(facilityId, scenarioId, budgetRub);
      set({ layers: pack.layers, kpiByScenario: pack.kpiByScenario, recommendations: pack.recommendations, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "failed to refresh", loading: false });
    }
  },
}));

export const studioPreviewData = {
  hexCells,
  threatRoutes,
};
