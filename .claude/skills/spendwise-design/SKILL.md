---
name: spendwise-design
description: SpendWise "Emerald" design system — colors, fonts, radii, category palette, icons, animations, screen layout conventions, and Indian ₹ formatting. Use whenever building or reviewing any SpendWise UI (Angular web or iOS) so screens match the design prototype.
---

# SpendWise Emerald Design System

Source of truth: `docs/design/SpendWiseApp.dc.html` (the claude.ai/design prototype). When a detail is ambiguous, open that file and match it.

## Fonts
- **Web**: `Manrope` (400/500/600/700/800) for UI text; `Space Grotesk` (400/500/600/700) for money amounts, headings, and the logo wordmark. Load via Google Fonts.
- **iOS**: system SF Pro Text / SF Pro Display instead.
- Money and numerals ALWAYS use Space Grotesk (web), weight 600, letter-spacing -0.5px on large figures.

## Core colors
| Token | Value |
|---|---|
| Primary brand green | `#0e7c66` |
| Brand gradient | `linear-gradient(150deg,#18b184,#0e7c66)` (dark end `#0a5f4e`) |
| Sidebar / dark surface | `#0C2A22` (text `#cfe3db`, accent mint `#4fd1a8`, muted `#8fb8aa`) |
| App background (web) | `#F5F8F6` (mobile: `#F2F2F7`) |
| Card background | `#fff`, border `#e9efec` (alt `#e4ece8`) |
| Text primary | `#182420` |
| Text scale (dark→light) | `#3f524b` `#5a6b65` `#6a7d76` `#7d8d87` `#8b9a94` `#9aa8a2` |
| Success / income | `#16a06a` (tint bg `#e7f4ee`, panel `#eefaf5` border `#cdeee0`, dark text `#0a5f4e`) |
| Warning / amber | `#d9822b` / `#e0912b` (bg `#fef4e7`, border `#f6e2c4`, text `#8a5a12`, mid `#a5762f`) |
| Error / over-budget | `#d9503f` (bg `#fdf1ef`, border `#f2c9c2`) |
| Avatar gradient | `linear-gradient(135deg,#f0b6d3,#c77dae)` (user initial "L") |

## Category palette (fixed 8 defaults)
| Key | Name | Color |
|---|---|---|
| food | Food & Dining | `#0E7C66` |
| rent | Rent | `#2C6E9B` |
| shopping | Shopping | `#B0679E` |
| travel | Travel | `#2F9C8F` |
| bills | Bills & Utilities | `#D98A2B` |
| subs | Subscriptions | `#7568C4` |
| health | Health | `#D26A57` |
| other | Other | `#8A9691` |

Each category gets a tint background (~12% opacity of its color) for icon tiles and chips. Custom user categories cycle a 7-hue palette; icon defaults to `other`.

## Shape & spacing
- Cards: radius 18–20px, padding 18–24px, 1px border `#e9efec`, no shadow (shadows only on hero/dark cards and buttons: `0 2px 8px rgba(14,124,102,.28)` on primary buttons).
- Inputs/buttons: radius 10–14px, height 40–48px (large amount input 62px).
- Chips/pills/tabs: radius 99px. Segmented controls: `#eef2f0` track, white active pill.
- Content max-width 940–1000px centered; grid gaps 14–20px.
- Icon tiles: 38–44px square, radius 11–13px, category tint bg + category color stroke icon.

## Icons
~40 custom stroke-based line icons (24×24 viewBox, stroke-width ~2, round caps/joins), NOT an icon library. In Angular, implement as an `sw-icon` component with an SVG-path registry keyed by name: dashboard, tx, add, scan, importf, budget, analytics, reports, settings, search, bell, chevL/R/D, plus, wallet, arrowUp, arrowDown, piggy (logo), food, rent, shopping, travel, bills, subs, health, other, edit, trash, filter, calendar, download, camera, cloud, check, alert, shield, lock, sparkles, x, user, trendUp, home, dots, note, card. Copy exact paths from the prototype's `ic()` helper in `docs/design/SpendWiseApp.dc.html`.

## Charts
- Donut: SVG circle stroke-dasharray arcs (no chart library). Center label = total. Web dashboard donut ~150px, stroke ~20.
- Trend bars: plain divs with % heights; current month bar gets the brand gradient, others `#dceae4`.
- Progress bars: 6–12px tall, radius 99px, track `#eef2f0`, fill = category/status color (budget bar uses the brand gradient).

## Animations
- `swrise`: every screen mounts with fade + translateY(10px→0), .3–.4s ease.
- `swspin`: spinners (2.5–3px border, brand color top).
- `swscan`: scanning laser line sweeping top 6%→92%, 1.1s alternate, mint glow — used while receipt is processing.
- `swtoast`: toast entrance. Toast = fixed bottom-center dark (`#0C2A22`) pill with check icon, auto-dismiss ~2.6s.

## Money formatting — IMPORTANT
Indian lakh/crore digit grouping: last 3 digits, then groups of 2 → `₹1,20,000`, `₹78,450`. Never Western grouping. Expenses render as `-₹420` in text color `#182420`; income as `+₹1,20,000` in `#16a06a`. Amounts are stored as integer paise in the API; divide by 100 for display, no decimals shown unless non-zero.

## Screen conventions
- Desktop: 248px dark sidebar (9 nav items; Budgets shows an amber badge with the over-budget count) + 70px topbar (page title + subtitle, search, bell with orange dot, green "Add" button) + scrollable main.
- Page titles come from a per-screen map (e.g. Dashboard → "Good morning, Lakshmi 👋", Scan → "Snap it, we'll do the typing").
- Status chips on budgets: "On track" green, "Close" amber (≥85%), "Over" red (spent > budget).
- Empty states: centered, icon tile + bold grey title + lighter hint text.
- Multi-step flows (scan, import): idle → processing (spinner + step checklist) → review/preview → confirm navigates to Transactions with a toast.
