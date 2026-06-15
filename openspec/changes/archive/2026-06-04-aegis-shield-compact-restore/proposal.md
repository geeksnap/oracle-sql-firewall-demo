## Why

The `aegis-vault-soc-ui-refresh` change enlarged the dashboard shield (420–520px, torus ring, gold crest) to emphasize branding. Presenters prefer the earlier **compact force-field globe** (~360px) that balanced dashboard density with a strong cyber “wow” effect. Restoring that treatment keeps Threat Feed / metrics visible without scrolling while preserving alert-mode behavior.

## What Changes

- Revert `ShieldGlobe.tsx` 3D composition to the **pre-refresh** wireframe sphere + icosahedron stack (no torus/octahedron crest, no 1.35× scale).
- Restore container height to **fixed `h-[360px]`** (remove `min-h-[420px]` / `lg:min-h-[520px]`).
- Restore camera, rotation speeds, sparkle density, and footer copy (**Force-Field Shield Globe**).
- **Keep** alert-mode red/cyan coloring and LuminaForge attack label (no regression from soc-ui-refresh).

## Capabilities

### New Capabilities

- `aegis-shield-compact`: Dashboard shield visual regression to compact wow globe.

### Modified Capabilities

- _(none)_

## Impact

- **aegis-vault/**: `src/components/ShieldGlobe.tsx` only (optional one-line note in `SPEC-aegis.md`).
- No API, database, or nav changes.
