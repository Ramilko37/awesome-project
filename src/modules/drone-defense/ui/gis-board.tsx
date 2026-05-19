"use client";

import { useMemo, useState } from "react";
import DeckGL from "@deck.gl/react";
import { H3HexagonLayer } from "@deck.gl/geo-layers";
import { PathLayer, ScatterplotLayer, TextLayer } from "@deck.gl/layers";
import { Layer } from "@deck.gl/core";
import Map from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import type { StyleSpecification } from "maplibre-gl";
import type { DefenseLayersResponse, Facility, HexCell, ThreatRoute } from "@/shared/types/drone-defense";

type GisBoardProps = {
  facilities: Facility[];
  selectedFacilityId: string;
  onSelectFacility: (facilityId: string) => void;
  hexCells: HexCell[];
  threatRoutes: ThreatRoute[];
  layers: DefenseLayersResponse | null;
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

export function GisBoard({
  facilities,
  selectedFacilityId,
  onSelectFacility,
  hexCells,
  threatRoutes,
  layers,
}: GisBoardProps) {
  const [hoverLabel, setHoverLabel] = useState<string | null>(null);

  const selectedFacility = facilities.find((item) => item.id === selectedFacilityId);
  const layerCoverage = hexCoverageByLayer(layers);

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
    [facilities, filteredHexes, filteredRoutes, layerCoverage, onSelectFacility, selectedFacilityId],
  );

  return (
    <section className="relative h-[calc(100vh-11.5rem)] min-h-[540px] overflow-hidden rounded-lg border border-slate-200">
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
        <Map mapStyle={mapStyle} />
      </DeckGL>

      <aside className="pointer-events-none absolute left-3 top-3 w-[300px] rounded-md border border-slate-200 bg-white/92 p-3 text-xs shadow-sm backdrop-blur">
        <p className="text-[11px] uppercase tracking-wide text-slate-500">GIS Board</p>
        <p className="mt-1 text-sm font-semibold text-slate-900">{selectedFacility?.name ?? "Facility"}</p>
        <p className="mt-1 text-slate-600">{selectedFacility?.region ?? "—"}</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded bg-slate-100 px-2 py-1.5">
            <p className="text-[10px] uppercase text-slate-500">Hex cells</p>
            <p className="text-sm font-semibold text-slate-900">{filteredHexes.length}</p>
          </div>
          <div className="rounded bg-slate-100 px-2 py-1.5">
            <p className="text-[10px] uppercase text-slate-500">Threat routes</p>
            <p className="text-sm font-semibold text-slate-900">{filteredRoutes.length}</p>
          </div>
        </div>
      </aside>

      {hoverLabel ? (
        <div className="pointer-events-none absolute bottom-3 left-3 rounded bg-slate-900/88 px-2 py-1 text-xs text-white">
          {hoverLabel}
        </div>
      ) : null}
    </section>
  );
}
