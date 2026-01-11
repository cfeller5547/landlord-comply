# LandlordComply — Design System Starter (Tailwind + shadcn/ui)
Version: v1.0  

Goal: Consistent, modern, minimal UI that feels trustworthy and calm for high-stakes compliance tasks.

---

## 1) Principles
- Calm authority
- Clarity over decoration
- One primary action per screen
- Coverage limitations always visible
- Explainability: citations + timestamps + versioning

---

## 2) Theme: “Calm Ledger”

### Color tokens (CSS variables, shadcn-compatible)
```css
:root {
  --background: 210 33% 97%;
  --card: 0 0% 100%;
  --popover: 0 0% 100%;

  --foreground: 222 47% 11%;
  --muted-foreground: 215 16% 47%;

  --primary: 198 83% 23%;
  --primary-foreground: 0 0% 100%;

  --secondary: 188 45% 74%;
  --secondary-foreground: 222 47% 11%;

  --border: 214 24% 90%;
  --input: 214 24% 90%;
  --ring: 198 83% 23%;

  --success: 142 45% 35%;
  --warning: 38 92% 50%;
  --danger: 0 62% 45%;

  --highlight: 46 100% 94%;
  --info: 215 85% 55%;
}
```
Usage:
- Danger only for critical blockers and deadlines <72 hours.
- Warning for partial coverage and missing forwarding address.
- Success for exported/closed cases.

---

## 3) Typography
- Font: Inter
- Scale:
  - H1 22/28
  - H2 18/24
  - Body 14/20
  - Small 12/16
  - Mono 12/16 (citations/version IDs)

---

## 4) Spacing & Layout
- 8px grid
- Page padding: 24px desktop / 16px mobile
- Card padding: 16px
- Max width: 1120px
- Sidebar: 260px
- Case workspace: 3 columns (timeline / main / status)

---

## 5) Components (shadcn mappings)
Core:
- Button, Card, Badge, Tabs, Dialog, Toast, Table, Separator, Skeleton

Domain components:
1) Deadline Radar Chip (Normal/Warning/Danger)
2) Coverage Banner (always visible)
3) Rules Snapshot Card + Sources Drawer
4) Checklist Blocker (jump-to-fix)
5) Packet Export Modal (file list + CTA)

---

## 6) Interaction Patterns
- Autosave with status (“Saved”)
- Errors actionable (“Could not save — retry”)
- Progressive disclosure for citations
- Avoid absolute claims (“guaranteed compliant”)

---

## 7) Accessibility
- AA contrast
- Keyboard accessible
- Focus visible
- Errors tied to inputs
- Never rely on color alone

---

## 8) Tailwind Implementation Notes
- Use CSS variables for colors (no hardcoded hex in components).
- Use consistent radii: rounded-lg.
- Shadows: shadow-sm only.
- Keep tables compact and scannable.
