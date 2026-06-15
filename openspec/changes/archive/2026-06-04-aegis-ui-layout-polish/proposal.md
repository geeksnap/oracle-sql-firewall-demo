## Why

Two minor layout issues reduce visual clarity in Aegis Vault: the Break-Glass Control section renders too close to the top of the content area (no breathing room after the navbar), and the Dashboard section lacks a section-level header to frame the summary view.

## What Changes

- **Break-Glass Control top spacing**: add vertical margin/padding before the `DemoControlPanel` so the "Break-Glass Control" heading doesn't crowd the top edge of the main content area.
- **Dashboard summary header**: add a header block above the metrics cards (and below the navbar) with a title ("Security Operations Center") and a brief subtitle, matching the visual pattern of other sections.

## Capabilities

### New Capabilities
- `aegis-ui-layout-polish`: Two layout-only tweaks — top spacing for Break-Glass Control and a summary header for the Dashboard section.

### Modified Capabilities

## Impact

- `aegis-vault/src/app/page.tsx` — add `pt-*` / wrapper div to Break-Glass content, add header JSX to dashboard section.
- No API, state, or business-logic changes.
