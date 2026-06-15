## 1. Data model and mapping

- [x] 1.1 Add `firewall_action` and `action_label` to `FirewallViolation`; map `CAUSE` → `violation_type`, `FIREWALL_ACTION` → `action_label` in `queries.ts`

## 2. Navigation and layout

- [x] 2.1 Remove `policy` from `NavSection`, `Sidebar`, and `page.tsx` center route
- [x] 2.2 Confirm right-rail `PolicyPanel` / Monitored Apps unchanged unless duplicate removal desired

## 3. ViolationsTable UI

- [x] 3.1 Add **Action** column to `ViolationsTable` with styling for Blocked vs Logged without Block
- [x] 3.2 Enable Action column on Threat Feed, Violations, and dashboard/right-rail violation tables

## 4. Verification

- [x] 4.1 `npm run build` passes
- [ ] 4.2 Manual: luminaforge attack with block off → Logged without Block; block on → Blocked
