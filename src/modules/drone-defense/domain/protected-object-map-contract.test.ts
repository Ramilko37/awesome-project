import assert from "node:assert/strict";
import {
  buildLayerFocusViewState,
  buildMapScaleBar,
  buildProtectedObjectInitialViewState,
  buildProtectedObjectPerimeter,
} from "@/modules/drone-defense/domain/echelon-map-model";
import { defenseLayers, facilities, measureGeoDistanceM } from "@/modules/drone-defense/infra/mock-defense-data";

const facility = facilities[0];
assert(facility, "facility fixture is required for protected object map tests");

const initialViewState = buildProtectedObjectInitialViewState({
  facility,
  layers: defenseLayers,
});

assert.equal(initialViewState.longitude, facility.center.lon, "initial map viewport must center on protected object longitude");
assert.equal(initialViewState.latitude, facility.center.lat, "initial map viewport must center on protected object latitude");
assert(
  initialViewState.zoom >= 10.8 && initialViewState.zoom <= 12.6,
  "initial map viewport must open at enterprise scale, not regional scale",
);

const l1Layer = defenseLayers.find((layer) => layer.id === "layer_01_external_warning");
assert(l1Layer, "L1 fixture is required for protected object map tests");
const regionalLayerFocus = buildLayerFocusViewState({ facility, layer: l1Layer });

assert(
  initialViewState.zoom > regionalLayerFocus.zoom + 2,
  "first map screen must be much closer than the external warning layer focus",
);

const scaleBar = buildMapScaleBar({
  latitude: initialViewState.latitude,
  zoom: initialViewState.zoom,
  maxWidthPx: 108,
});

assert.notEqual(scaleBar.label, "1000 км", "enterprise scale bar must not use the old hardcoded regional label");
assert(
  scaleBar.distanceM <= 5_000,
  "initial map scale bar must stay within a few kilometers for an enterprise map",
);
assert(scaleBar.widthPx >= 44, "scale bar must remain visible at touch-friendly size");

const perimeter = buildProtectedObjectPerimeter({
  center: facility.center,
});

assert.equal(perimeter.polygon.length, 4, "protected object placeholder perimeter must be a deliberate rectangle");
assert.deepEqual(perimeter.center, [facility.center.lon, facility.center.lat], "perimeter must expose the protected object center marker");
assert(
  perimeter.polygon.every((point) => measureGeoDistanceM(facility.center, { lon: point[0], lat: point[1] }) <= 900),
  "protected object placeholder perimeter must stay near the object center",
);

console.log("protected-object-map-contract.test.ts: protected object first viewport contract passed");
