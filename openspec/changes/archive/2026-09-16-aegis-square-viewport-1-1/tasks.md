## 1. Layout — square viewport shell

- [x] 1.1 Update `page.tsx` `<main>` to center content (`flex items-center justify-center`) on `h-[100dvh]` with `#0a0a0f` background
- [x] 1.2 Wrap header + grid in a square container using `aspect-square` and `min(100%, 100dvh - padding)` sizing for both dimensions
- [x] 1.3 Remove `max-w-[1600px]` wide-rectangle cap; let square constraint govern outer frame size

## 2. Regression — internal scroll preserved

- [x] 2.1 Confirm Latest Threats, Live Violations, and Break-Glass output console still scroll internally inside the square frame
- [x] 2.2 Confirm Dashboard ↔ Break-Glass toggle does not change outer frame dimensions

## 3. Verification

- [x] 3.1 Visual check at 1920×1080: frame is square and centered, no body scroll from violations
- [x] 3.2 Visual check at 1440×900: frame fits viewport, remains 1:1
- [x] 3.3 `npm run build` in `aegis-vault` passes
