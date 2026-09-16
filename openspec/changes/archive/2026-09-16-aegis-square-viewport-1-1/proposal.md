## Why

The recent fixed-viewport work stopped the dashboard from growing with violations, but the shell still stretches to full browser width (`max-w-[1600px]` × `100dvh`) — a wide rectangle on typical demo displays. Presenters want a **square 1:1 frame** (width equals height) locked from first paint so the SOC layout looks tidy, symmetrical, and consistent across Dashboard and Break-Glass Control.

## What Changes

- Constrain the Aegis Vault application frame to a **1:1 aspect ratio** (width : height = 1 : 1) from startup.
- Center the square frame in the browser viewport; letterbox/pillarbox the surrounding area with the existing `#0a0a0f` background.
- Size the square to the largest square that fits within the viewport (`min(100vw, 100dvh)` minus safe padding).
- Preserve internal panel scrolling — only the outer frame is square; violation tables and demo output still scroll inside their regions.
- Remove or replace `max-w-[1600px]` full-width stretch so the frame does not become a wide rectangle on ultrawide monitors.

## Capabilities

### New Capabilities

_None — extends existing viewport shell capability._

### Modified Capabilities

- `aegis-fixed-viewport-shell`: Add explicit 1:1 aspect-ratio requirement and centering behavior on top of the existing fixed-frame rules.

## Impact

- Affected code: `aegis-vault/src/app/page.tsx` (root layout wrapper), possibly `aegis-vault/src/app/globals.css` or `layout.tsx` for centering/background
- No API, database, or backend changes
- Complements archived `aegis-vault-fixed-layout-transaction-reset`; supersedes the rectangular `100dvh × max-w-[1600px]` shell sizing
