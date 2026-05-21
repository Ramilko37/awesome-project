"use client";

import { useMemo, useState } from "react";
import DeckGL from "@deck.gl/react";
import { H3HexagonLayer } from "@deck.gl/geo-layers";
import { PathLayer, PolygonLayer, ScatterplotLayer, TextLayer } from "@deck.gl/layers";
import { Layer } from "@deck.gl/core";
import MaplibreMap from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import type { StyleSpecification } from "maplibre-gl";
import { defenseLayers, type EchelonCatalogGroup } from "@/modules/drone-defense/infra/mock-defense-data";
import { buildEchelonMapModel, type EchelonMapPlacement, type EchelonZone } from "@/modules/drone-defense/domain/echelon-map-model";
import type {
  Configuration,
  DefenseCatalogResponse,
  DefenseLayerId,
  DefenseLayersResponse,
  Facility,
  HexCell,
  ThreatRoute,
} from "@/shared/types/drone-defense";

type GisBoardProps = {
  className?: string;
  facilities: Facility[];
  selectedFacilityId: string;
  onSelectFacility: (facilityId: string) => void;
  hexCells: HexCell[];
  threatRoutes: ThreatRoute[];
  layers: DefenseLayersResponse | null;
  configuration: Configuration;
  catalog: DefenseCatalogResponse | null;
  selectedLayerId: DefenseLayerId;
  selectedLayerGroups: EchelonCatalogGroup[];
  onSelectLayer: (layerId: DefenseLayerId) => void;
  onAddCatalogGroup: (groupId: string) => void;
  onRemoveCatalogGroup: (groupId: string) => void;
  onOpenComparison?: () => void;
  onOpenDrilldown?: () => void;
};

const mapStyle: StyleSpecification = {
  version: 8,
  glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
    },
  },
  layers: [{ id: "osm", type: "raster", source: "osm" }],
};

function hexCoverageByLayer(layerCoverage: DefenseLayersResponse | null) {
  if (!layerCoverage) return 0;
  const total = layerCoverage.layerCoverage.reduce((acc, item) => acc + item.coveredPct, 0);
  return total / Math.max(layerCoverage.layerCoverage.length, 1);
}

function readinessClassName(coveredPct: number) {
  if (coveredPct >= 0.55) return "bg-emerald-100 text-emerald-700";
  if (coveredPct >= 0.28) return "bg-amber-100 text-amber-700";
  if (coveredPct > 0) return "bg-orange-100 text-orange-700";
  return "bg-slate-100 text-slate-500";
}

function readinessLabel(coveredPct: number) {
  if (coveredPct >= 0.55) return "covered";
  if (coveredPct >= 0.28) return "partial";
  if (coveredPct > 0) return "weak";
  return "missing";
}

export function GisBoard({
  className = "",
  facilities,
  selectedFacilityId,
  onSelectFacility,
  hexCells,
  threatRoutes,
  layers,
  configuration,
  catalog,
  selectedLayerId,
  selectedLayerGroups,
  onSelectLayer,
  onAddCatalogGroup,
  onRemoveCatalogGroup,
  onOpenComparison,
  onOpenDrilldown,
}: GisBoardProps) {
  const [hoverLabel, setHoverLabel] = useState<string | null>(null);

  const selectedFacility = facilities.find((item) => item.id === selectedFacilityId);
  const layerCoverage = hexCoverageByLayer(layers);
  const selectedLayer = defenseLayers.find((layer) => layer.id === selectedLayerId) ?? defenseLayers[0];
  const selectedLayerPlacements = configuration.placements.filter((placement) => placement.layerId === selectedLayerId);
  const nextGroupToPlace = selectedLayerGroups.find(
    (group) => !configuration.placements.some((placement) => placement.catalogGroupId === group.id),
  );
  const removableLayerPlacement = selectedLayerPlacements.find((placement) => placement.catalogGroupId);
  const layerOrderById = useMemo(() => new globalThis.Map(defenseLayers.map((layer) => [layer.id, layer.order])), []);
  const echelonModel = useMemo(
    () =>
      buildEchelonMapModel({
        facility: selectedFacility ?? null,
        layers: defenseLayers,
        layerCoverage: layers,
        configuration,
        catalog,
      }),
    [catalog, configuration, layers, selectedFacility],
  );

  const filteredHexes = useMemo(
    () => hexCells.filter((cell) => cell.facilityId === selectedFacilityId),
    [hexCells, selectedFacilityId],
  );
  const filteredRoutes = useMemo(
    () => threatRoutes.filter((route) => route.facilityId === selectedFacilityId),
    [threatRoutes, selectedFacilityId],
  );

  const deckLayers = useMemo(
    () =>
      [
        new PolygonLayer<EchelonZone>({
          id: "echelon-distance-zones",
          data: echelonModel.zones.toSorted((a, b) => {
            const aLayer = defenseLayers.find((layer) => layer.id === a.layerId);
            const bLayer = defenseLayers.find((layer) => layer.id === b.layerId);
            return (aLayer?.order ?? 0) - (bLayer?.order ?? 0);
          }),
          pickable: true,
          stroked: true,
          filled: true,
          extruded: false,
          getPolygon: (item) => item.polygon,
          getFillColor: (item) => {
            if (item.layerId === selectedLayerId) return [item.fillColor[0], item.fillColor[1], item.fillColor[2], 135];
            return item.fillColor;
          },
          getLineColor: (item) => {
            if (item.layerId === selectedLayerId) return [15, 23, 42, 255];
            return item.lineColor;
          },
          getLineWidth: (item) => (item.layerId === selectedLayerId ? 180 : 90),
          lineWidthUnits: "meters",
          onClick: ({ object }) => {
            if (!object) return;
            onSelectLayer(object.layerId);
          },
          onHover: ({ object }) =>
            setHoverLabel(
              object
                ? `${object.shortName}: ${object.name}, ${object.distanceLabel}, объектов ${object.placedCount}`
                : null,
            ),
        }),
        new ScatterplotLayer<EchelonZone>({
          id: "echelon-interaction-rings",
          data: echelonModel.zones,
          getPosition: () =>
            selectedFacility ? [selectedFacility.center.lon, selectedFacility.center.lat] : [60.5945, 56.8389],
          radiusUnits: "pixels",
          getRadius: (item) => 58 + (10 - (layerOrderById.get(item.layerId) ?? 1)) * 17,
          stroked: true,
          filled: false,
          lineWidthMinPixels: 2,
          getLineColor: (item) => {
            if (item.layerId === selectedLayerId) return [15, 23, 42, 255];
            return [item.lineColor[0], item.lineColor[1], item.lineColor[2], 190];
          },
          pickable: true,
          onClick: ({ object }) => {
            if (!object) return;
            onSelectLayer(object.layerId);
          },
          onHover: ({ object }) =>
            setHoverLabel(
              object
                ? `${object.shortName}: интерактивный слой размещения, ${object.distanceLabel}`
                : null,
            ),
        }),
        new H3HexagonLayer<HexCell>({
          id: "regional-h3-gaps",
          data: filteredHexes,
          getHexagon: (item) => item.id,
          pickable: true,
          extruded: false,
          stroked: true,
          getFillColor: (item) => {
            const avgRisk =
              (item.baseRisk.fixedWing + item.baseRisk.fpv + item.baseRisk.loitering + item.baseRisk.swarm) / 4;
            const riskAdjusted = Math.max(0, Math.min(1, avgRisk * (1 - layerCoverage)));
            const red = Math.round(190 + 45 * riskAdjusted);
            const green = Math.round(220 - 130 * riskAdjusted);
            const blue = Math.round(255 - 170 * riskAdjusted);
            return [red, green, blue, 145];
          },
          getLineColor: [132, 146, 176, 180],
          lineWidthMinPixels: 1,
          onHover: ({ object }) => setHoverLabel(object ? `H3 ${object.id}` : null),
        }),
        new ScatterplotLayer<EchelonMapPlacement>({
          id: "echelon-placement-objects",
          data: echelonModel.placements,
          getPosition: (item) => item.position,
          getRadius: (item) => (item.layerId === selectedLayerId ? 1700 : 1150),
          radiusMinPixels: 5,
          radiusMaxPixels: 14,
          getFillColor: (item) => item.color,
          getLineColor: (item) => (item.layerId === selectedLayerId ? [15, 23, 42, 255] : [255, 255, 255, 220]),
          lineWidthMinPixels: 1,
          stroked: true,
          pickable: true,
          onClick: ({ object }) => {
            if (!object) return;
            onSelectLayer(object.layerId);
          },
          onHover: ({ object }) =>
            setHoverLabel(object ? `${object.label} · ${defenseLayers.find((layer) => layer.id === object.layerId)?.shortName}` : null),
        }),
        new TextLayer<EchelonMapPlacement>({
          id: "echelon-placement-labels",
          data: echelonModel.placements.filter((item) => item.layerId === selectedLayerId),
          getPosition: (item) => item.position,
          getText: (item) => item.label,
          getColor: [15, 23, 42, 255],
          getSize: 11,
          getTextAnchor: "start",
          getAlignmentBaseline: "center",
          getPixelOffset: [9, 0],
          background: true,
          getBackgroundColor: [255, 255, 255, 220],
          backgroundPadding: [3, 2],
        }),
        new TextLayer<EchelonZone>({
          id: "echelon-zone-labels",
          data: echelonModel.zones,
          getPosition: (item) => item.polygon[0]?.[Math.floor(item.polygon[0].length / 8)] ?? [0, 0],
          getText: (item) => `${item.shortName} · ${item.distanceLabel}`,
          getColor: (item) => (item.layerId === selectedLayerId ? [15, 23, 42, 255] : item.lineColor),
          getSize: (item) => (item.layerId === selectedLayerId ? 14 : 11),
          getTextAnchor: "middle",
          getAlignmentBaseline: "center",
          background: true,
          getBackgroundColor: [255, 255, 255, 205],
          backgroundPadding: [4, 2],
          pickable: true,
          onClick: ({ object }) => {
            if (!object) return;
            onSelectLayer(object.layerId);
          },
        }),
        new PathLayer<ThreatRoute>({
          id: "threat-corridors",
          data: filteredRoutes,
          getPath: (item) => item.path.map((point) => [point.lon, point.lat] as [number, number]),
          getColor: [255, 118, 102, 220],
          widthUnits: "pixels",
          getWidth: 3,
          pickable: true,
          onHover: ({ object }) => setHoverLabel(object ? `Маршрут угрозы: ${object.id}` : null),
        }),
        new ScatterplotLayer<Facility>({
          id: "facility-nodes",
          data: facilities,
          getPosition: (item) => [item.center.lon, item.center.lat],
          getRadius: (item) => (item.id === selectedFacilityId ? 9000 : 6200),
          radiusMinPixels: 6,
          radiusMaxPixels: 20,
          getFillColor: (item) => (item.id === selectedFacilityId ? [0, 174, 255, 255] : [24, 199, 120, 210]),
          pickable: true,
          onClick: ({ object }) => {
            if (!object) return;
            onSelectFacility(object.id);
          },
          onHover: ({ object }) => setHoverLabel(object ? object.name : null),
        }),
        new TextLayer<Facility>({
          id: "facility-labels",
          data: facilities,
          getPosition: (item) => [item.center.lon, item.center.lat],
          getText: (item) => item.name,
          getColor: [30, 41, 59, 255],
          getSize: 12,
          getTextAnchor: "start",
          getAlignmentBaseline: "bottom",
          getPixelOffset: [12, -12],
        }),
      ] satisfies Layer[],
    [echelonModel, facilities, filteredHexes, filteredRoutes, layerCoverage, layerOrderById, onSelectFacility, onSelectLayer, selectedFacility, selectedFacilityId, selectedLayerId],
  );

  return (
    <section className={`relative h-[calc(100vh-11.5rem)] min-h-[540px] overflow-hidden rounded-lg border border-slate-200 ${className}`}>
      <DeckGL
        initialViewState={{
          longitude: selectedFacility?.center.lon ?? 60.5945,
          latitude: selectedFacility?.center.lat ?? 56.8389,
          zoom: 7.2,
          pitch: 28,
          bearing: 0,
        }}
        controller
        layers={deckLayers}
      >
        <MaplibreMap mapStyle={mapStyle} />
      </DeckGL>

      <div className="absolute left-4 top-4 z-10 flex max-w-[min(42rem,calc(100%-2rem))] flex-wrap items-center gap-2">
        <button
          type="button"
          className="grid h-10 w-10 place-items-center rounded-lg bg-white/95 text-lg text-slate-500 shadow-md shadow-slate-900/10 backdrop-blur hover:text-slate-900"
          title="Поиск по карте"
        >
          ⌕
        </button>
        <div className="rounded-lg border border-white/60 bg-white/95 px-3 py-2 text-xs shadow-md shadow-slate-900/10 backdrop-blur">
          <p className="font-semibold text-slate-950">{selectedFacility?.name ?? "Facility"}</p>
          <p className="text-slate-500">
            {selectedLayer.shortName} · {selectedLayer.distanceBandM.label} · {selectedLayerPlacements.length} объектов
          </p>
        </div>
      </div>

      <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
        <button className="h-10 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-md shadow-blue-600/25" type="button">
          Опубликовать
        </button>
        <button className="grid h-10 w-10 place-items-center rounded-lg bg-white/95 text-slate-500 shadow-md shadow-slate-900/10" type="button" title="На весь экран">
          ⛶
        </button>
        <button className="grid h-10 w-10 place-items-center rounded-lg bg-white/95 text-slate-500 shadow-md shadow-slate-900/10" type="button" title="Информация">
          i
        </button>
      </div>

      <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-lg border border-white/70 bg-white/95 p-1 shadow-lg shadow-slate-900/15 backdrop-blur">
        {defenseLayers.map((layer) => {
          const layerItem = layers?.layerCoverage.find((item) => item.layerId === layer.id);
          const coverage = layerItem?.coveredPct ?? 0;
          return (
            <button
              key={layer.id}
              type="button"
              className={`h-9 min-w-10 rounded-md px-2 text-[11px] font-bold transition ${
                selectedLayerId === layer.id ? "bg-slate-900 text-white" : readinessClassName(coverage)
              }`}
              onClick={() => onSelectLayer(layer.id)}
              title={`${layer.name}: ${readinessLabel(coverage)} (${Math.round(coverage * 100)}%)`}
            >
              {layer.shortName}
            </button>
          );
        })}
        <span className="mx-1 h-6 w-px bg-slate-200" />
        <button
          className="h-9 rounded-md px-3 text-xs font-semibold text-slate-600 hover:bg-slate-100"
          type="button"
          onClick={() => nextGroupToPlace && onAddCatalogGroup(nextGroupToPlace.id)}
          disabled={!nextGroupToPlace}
          title={nextGroupToPlace ? `Поставить: ${nextGroupToPlace.name}` : "Все группы выбранного эшелона уже поставлены"}
        >
          Поставить
        </button>
        <button
          className="h-9 rounded-md px-3 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-40"
          type="button"
          onClick={() => removableLayerPlacement?.catalogGroupId && onRemoveCatalogGroup(removableLayerPlacement.catalogGroupId)}
          disabled={!removableLayerPlacement?.catalogGroupId}
        >
          Убрать
        </button>
        <button className="h-9 rounded-md px-3 text-xs font-semibold text-slate-600 hover:bg-slate-100" type="button" onClick={onOpenComparison}>
          Сравнить
        </button>
        <button className="h-9 rounded-md px-3 text-xs font-semibold text-slate-600 hover:bg-slate-100" type="button" onClick={onOpenDrilldown}>
          3D
        </button>
      </div>

      <div className="absolute bottom-5 right-4 z-10 flex flex-col overflow-hidden rounded-lg bg-white/95 text-slate-500 shadow-md shadow-slate-900/10">
        <button className="grid h-10 w-10 place-items-center border-b border-slate-100 text-lg" type="button">+</button>
        <button className="grid h-10 w-10 place-items-center border-b border-slate-100 text-xs font-semibold" type="button">3.6</button>
        <button className="grid h-10 w-10 place-items-center text-lg" type="button">−</button>
      </div>

      <div className="absolute bottom-5 left-4 z-10 rounded bg-white/90 px-3 py-1.5 text-[11px] text-slate-600 shadow">
        1000 км
      </div>

      {hoverLabel ? (
        <div className="pointer-events-none absolute bottom-3 left-3 rounded bg-slate-900/88 px-2 py-1 text-xs text-white">
          {hoverLabel}
        </div>
      ) : null}
    </section>
  );
}
