<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Project Architecture

Lightweight FSD-inspired structure. Two roots inside `src/`:

```
src/
├── app/                  # Next.js App Router (routing only — no logic here)
│   ├── layout.tsx
│   ├── globals.css
│   └── [route]/
│       └── page.tsx      # thin: just imports and renders a module
│
├── shared/               # Truly global, project-wide utilities
│   ├── ui/               # Generic UI primitives (Button, Input, Badge…)
│   ├── config/           # Env vars, constants, feature flags
│   ├── lib/              # Pure helpers (cn, formatDate, etc.)
│   └── types/            # Global TS types shared across modules
│
└── modules/              # Features and pages, one folder per slice
    └── [module-name]/
        ├── ui/           # React components for this module
        ├── domain/       # Store, business logic, business hooks
        └── infra/        # API calls, request hooks, backend types
```

## Rules

**`app/` pages are thin.** A page file does one thing — imports the module's root component and renders it. No logic, no hooks.

```tsx
// src/app/prototype/page.tsx
import { DroneDefensePrototype } from "@/modules/drone-defense/ui/drone-defense-prototype";
export default function Page() {
  return <DroneDefensePrototype />;
}
```

**`shared/` has no dependency on `modules/`.** Shared code must not import anything from `modules/`. Modules can import from `shared/`, never the reverse.

**Module layers import strictly downward.**

```
ui  →  domain  →  infra
```

- `ui` may import from `domain` and `infra`
- `domain` may import from `infra`
- `infra` imports only from `shared/` or external packages
- No circular imports between layers

**`infra/` owns the backend boundary.** Backend types, API clients, and data-fetching hooks live here. Components never call fetch directly.

**`domain/` owns state and business rules.** Zustand stores, business-logic hooks (`useScenario`, `useObjectSelection`), derived state. No JSX, no fetch.

**`ui/` owns rendering.** Components, CSS modules, layout. Reads from `domain`, calls `infra` through `domain` hooks.

**Cross-module imports are allowed but kept minimal.** If module A needs something from module B's `domain` or `infra`, extract it to `shared/` instead.

## Where the current prototype fits

```
src/modules/drone-defense/
├── ui/
│   ├── drone-defense-prototype.tsx   ← root component / layout
│   ├── scene.tsx                     ← Three.js canvas
│   ├── topbar.tsx
│   ├── assets-panel.tsx
│   ├── properties-panel.tsx
│   ├── status-bar.tsx
│   └── drone-defense-prototype.module.css
└── domain/
    └── types.ts                      ← SceneObject, ScenarioId, presets
```

> `infra/` is empty for now — the prototype has no backend calls yet.

