import assert from "node:assert/strict";

import { createDefaultDefenseProject } from "@/shared/lib/defense-project";
import { buildProjectUpdatePayload } from "@/modules/drone-defense/infra/api-client";

const localProject = createDefaultDefenseProject();
const localPayload = buildProjectUpdatePayload({ name: "Локальная карта", project: localProject });

assert.equal(
  "enterpriseId" in localPayload,
  false,
  "a local protected-object id must not be sent as the backend enterprise UUID",
);

const backendProject = { ...localProject, enterpriseId: "550e8400-e29b-41d4-a716-446655440000" };
const backendPayload = buildProjectUpdatePayload({ name: "Карта предприятия", project: backendProject });

assert.equal(
  backendPayload.enterpriseId,
  backendProject.enterpriseId,
  "a real backend enterprise UUID must remain attached to the saved project",
);

console.log("api-client project persistence payload contracts passed");
