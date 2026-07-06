## Context

`aegis-vault-fixed-layout-transaction-reset` introduced `h-[100dvh] overflow-hidden` and internal scroll panels. The inner container still uses `max-w-[1600px]` with full viewport height, producing a ~16:9 or taller rectangle depending on monitor size. The presenter request is explicitly **width : length = 1 : 1** — a square command-center frame fixed from startup.

## Goals / Non-Goals

**Goals:**

- Square application frame (1:1 aspect ratio) on first paint at `lg` breakpoint and above.
- Frame centered horizontally and vertically in the browser window.
- Frame size = largest square fitting in viewport (with existing page padding).
- Dashboard ↔ Break-Glass toggles do not change frame dimensions.
- Internal scroll behavior unchanged.

**Non-Goals:**

- Redesigning panel proportions inside the square (globe size, column widths stay as-is within the square).
- Mobile-specific square layout below `lg` (may remain full-width stacked; square enforced at demo breakpoint).
- Changing LuminaForge or other apps.

## Decisions

### 1. CSS `aspect-ratio: 1 / 1` on the app shell container

Wrap the existing `max-w-[1600px]` flex column in a centered square container:

```tsx
<main className="flex h-[100dvh] items-center justify-center overflow-hidden bg-[#0a0a0f] p-4 lg:p-6">
  <div className="flex aspect-square h-full max-h-full w-full max-w-full min-h-0 min-w-0 flex-col overflow-hidden"
       style={{ width: 'min(100%, 100dvh - 2rem)', height: 'min(100%, 100dvh - 2rem)' }}>
    {/* header + grid */}
  </div>
</main>
```

Use `min(100vw - padding, 100dvh - padding)` for both width and height so the box is always square and fits the viewport.

**Alternative considered:** Fixed pixel size (e.g. 1200×1200) — rejected; does not adapt to presenter laptop screens.

**Alternative considered:** `aspect-square` only without max dimension — rejected; wide viewports would overflow height.

### 2. Remove `max-w-[1600px]` wide rectangle cap

The square constraint replaces the 1600px max-width as the primary sizing rule. Inner three-column grid (`220px | 1fr | 340px`) remains inside the square.

### 3. Letterboxing

Areas outside the square use the same `#0a0a0f` background (already on `<main>`). No additional chrome.

## Risks / Trade-offs

- **[Risk] Square frame reduces horizontal space on ultrawide monitors** → Mitigation: intended for demo tidiness; internal panels already scroll.
- **[Risk] Shield globe + metrics may feel cramped in a smaller square on short screens** → Mitigation: size square to `min(vw, vh)` so it uses all available space; optional slight globe scale-down if needed during apply (out of scope unless overflow occurs).

## Migration Plan

1. Update `page.tsx` layout wrapper.
2. Visual check at 1920×1080 and 1440×900 presenter resolutions.
3. No DB or deploy script changes.

## Open Questions

- None.
