## 1. Break-Glass Control top spacing

- [x] 1.1 In `page.tsx`, wrap `<DemoControlPanel .../>` in `<div className="pt-4">` to add top breathing room when the section is unlocked
- [x] 1.2 Apply the same `pt-4` wrapper to the not-granted fallback `<div>` so spacing is consistent whether modal is pending or panel is shown

## 2. Dashboard summary header

- [x] 2.1 In `page.tsx`, add a `glass-panel rounded-xl px-4 py-3` header block as the first child inside the `{section === "dashboard"}` fragment, with title "Security Operations Center" and a brief subtitle

## 3. Manual verification

- [x] 3.1 Manual: open Dashboard → header "Security Operations Center" visible above metrics cards
- [x] 3.2 Manual: click Break-Glass Control → login → panel appears with visible top spacing between nav and heading
