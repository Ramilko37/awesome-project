import type { SceneObject, ScenarioId, ObjectKind } from "@/components/prototype/types";

export type { ObjectKind, ScenarioId, SceneObject };

// ─── Объект / Предприятие ────────────────────────────────────────────────────

export type SiteStatus = "active" | "configuring" | "offline";

export type Site = {
  id: string;
  name: string;
  address: string;
  status: SiteStatus;
  coveragePercent: number;
  devicesCount: number;
  lastIncident?: Date;
  configurationId?: string;
};

// ─── Конфигурация защиты объекта ─────────────────────────────────────────────

export type SiteConfiguration = {
  siteId: string;
  scenarioId: ScenarioId;
  objects: SceneObject[];
  lastSyncedAt: Date;
  version: number;
};

export type DeviceStatus = {
  objectId: string;
  online: boolean;
  batteryLevel?: number;
  lastPing: Date;
  signalStrength?: number;
};

// ─── Угрозы и тревоги ────────────────────────────────────────────────────────

export type ThreatLevel = "low" | "medium" | "high" | "critical";

export type ThreatEventStatus =
  | "detected"
  | "acknowledged"
  | "false_alarm"
  | "alarm_raised";

export type ThreatEvent = {
  id: string;
  siteId: string;
  siteName: string;
  sourceId: string;
  sourceKind: ObjectKind;
  sourceLabel: string;
  detectedAt: Date;
  threatLevel: ThreatLevel;
  zone: string;
  status: ThreatEventStatus;
  operatorId?: string;
  notes?: string;
};

export type GlobalAlertStatus = "normal" | "threat_detected" | "alarm_active";

export type AlertState = {
  siteId: string;
  siteName: string;
  status: GlobalAlertStatus;
  activeAlertId?: string;
  updatedAt: Date;
};

// ─── Команда ─────────────────────────────────────────────────────────────────

export type TeamRole = "admin" | "operator" | "viewer";

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: TeamRole;
  siteIds: string[];
  smsNotifications: boolean;
  lastSeenAt?: Date;
};
