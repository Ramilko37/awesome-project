import type { ObjectKind } from "@/shared/types/defense";

export type RadarBlip = { angle: number; dist: number; id: string };

export type SensorReading = {
  kind: ObjectKind;
  blips?: RadarBlip[];
  targetSpeed?: number;
  targetAlt?: number;
  targetDist?: number;
  rfFrequency?: number;
  rfProtocol?: string;
  rfBearing?: number;
  rfStrength?: number;
  acousticLevel?: number;
  acousticBearing?: number;
  cameraAiLabel?: string;
  cameraConfidence?: number;
  cameraPtzAz?: number;
  cameraPtzEl?: number;
};

export const mockSensorReadings: Record<string, SensorReading> = {
  "sensor-07": {
    kind: "sensor",
    blips: [{ angle: 42, dist: 0.62, id: "t1" }, { angle: 44, dist: 0.6, id: "t2" }],
    targetSpeed: 14,
    targetAlt: 48,
    targetDist: 186,
  },
  "sensor-02": {
    kind: "sensor",
    blips: [{ angle: 128, dist: 0.45, id: "t3" }],
    targetSpeed: 9,
    targetAlt: 32,
    targetDist: 240,
  },
  "sensor-11": {
    kind: "sensor",
    blips: [],
    targetSpeed: 0,
    targetAlt: 0,
    targetDist: 0,
  },
  "camera-04": {
    kind: "camera",
    cameraAiLabel: "Квадрокоптер DJI",
    cameraConfidence: 91,
    cameraPtzAz: 42,
    cameraPtzEl: 18,
  },
  "camera-09": {
    kind: "camera",
    cameraAiLabel: "Объект не идентифицирован",
    cameraConfidence: 34,
    cameraPtzAz: 215,
    cameraPtzEl: 7,
  },
  "sensor-01": {
    kind: "sensor",
    rfFrequency: 2437,
    rfProtocol: "DJI OcuSync 2.0",
    rfBearing: 312,
    rfStrength: -68,
  },
  "sensor-core": {
    kind: "sensor",
    blips: [{ angle: 290, dist: 0.55, id: "t4" }],
    targetSpeed: 6,
    targetAlt: 21,
    targetDist: 310,
  },
};
