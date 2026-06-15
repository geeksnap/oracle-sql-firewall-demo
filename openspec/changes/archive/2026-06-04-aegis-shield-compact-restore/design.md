## Context

`ShieldGlobe.tsx` currently implements the enlarged “Aegis Shield” hero from `aegis-vault-soc-ui-refresh`. The prior version (commit-era before refresh) used a 360px panel, dual wireframe meshes, 120 sparkles, and faster auto-rotate—well received in live demos.

## Goals / Non-Goals

**Goals:**

- Restore compact 360px dashboard footprint.
- Restore wireframe force-field aesthetic (cyan/magenta/red alert palette).
- Preserve `alertMode` prop contract and attack overlay text.

**Non-Goals:**

- New shield designs or SVG crest assets.
- Layout changes to MetricsCards, sidebar, or Demo Control.
- Renaming component file (stay `ShieldGlobe.tsx`).

## Decisions

### 1. Restore prior implementation verbatim where possible

**Decision:** Replace `AegisShieldCore` with the earlier `ShieldCore` structure:

| Element | Restored value |
|---------|----------------|
| Container | `h-[360px]` |
| Group scale | `1` (no 1.35×) |
| Inner sphere | `args={[1.2, 48, 48]}`, wireframe, opacity 0.12 |
| Outer mesh | icosahedron `args={[1.45, 2]}`, wireframe |
| Sparkles | count 120, scale 3.2, size 2 |
| Camera | `[0, 0, 4.2]`, fov 45 |
| Auto-rotate | speed 0.4 |
| Footer | “Force-Field Shield Globe” |

**Rationale:** Matches known-good demo layout; minimal diff risk.

### 2. Do not fork a second component

**Alternative:** `AegisShield.tsx` + feature flag — rejected; single component avoids drift.

## Risks / Trade-offs

- **[Risk] Presenters liked gold crest** → Can reintroduce as optional later; this change is explicit rollback.
- **[Risk] None functional** → Visual-only; no test harness beyond manual dashboard check.

## Migration Plan

1. Apply `ShieldGlobe.tsx` revert.
2. `npm run dev` in `aegis-vault/` and open Dashboard.
3. Toggle LuminaForge attack to confirm alert styling.

## Open Questions

- None.
