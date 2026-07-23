# Fortis UI Kit v1.0 Final

This directory is the versioned, immutable handoff of the approved Fortis design system. It was copied from the private Open Design project on 2026-07-22; the source remains outside Git and is not modified by frontend work.

## Status

- Version: `1.0.0`
- Design status: `final`
- Handoff status: `implementation-ready-design-contract`
- Scope: shared foundations and the GIS Workspace reference flow

The package is a specification, not generated application code. Production components must be implemented manually against the JSON/Markdown contracts; do not copy either HTML prototype into a Next.js route.

## Contents

- `design-tokens.json` — primitive, semantic, component, context, density, motion, and GIS data token contract.
- `component-contracts.json` — public component anatomy, states, accessibility, responsive, and migration expectations.
- `screen-contracts.json` — GIS Workspace states, transitions, responsive behavior, keyboard, focus, and live-region requirements.
- `implementation-contract.md` — ownership, migration boundaries, verification ledger, and staged implementation order.
- `critique.json` — final audit result and known runtime risks.
- `index.html`, `ui-kit.html`, `gis-workspace-flow.html` — visual references only.
- `screenshots/` — final visual and responsive evidence from Open Design.

## Runtime ownership and boundaries

- Shared Fortis runtime primitives live in `src/shared/ui/fortis`.
- `FortisProvider` scopes generated tokens with `data-fortis-theme` and `data-fortis-density`; it does not replace current dashboard or prototype tokens.
- New Fortis controls use the typed Lucide resolver. Existing `@ant-design/icons` imports are migration inputs and remain unchanged until a call-site has an approved replacement.
- IBM Plex Sans is not currently loaded in the frontend root layout. Foundations use the existing Manrope variable as a safe sans fallback; the font asset/loading decision remains explicit work.
- Overlay-provider ownership, real focus-trap verification, Storybook, visual regression fixtures, offline persistence, and backend conflict payloads are deferred. They must not be inferred from this reference package.

## Integrity

The archive is intentionally copied byte-for-byte. Validate it with SHA-256 against:

`/Users/rr/Documents/Open Design/.od/projects/fortis-unified-design-system`

Only the selected Final screenshots are archived here: the final UI Kit, 1440/1024/768/effective-720 GIS Workspace, states, and focus/accessibility evidence.
