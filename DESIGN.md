---
name: Cursor Leaderboard
description: Native Cursor dark tooling surface for community stats and rankings
colors:
  brand-orange: "#f54e00"
  brand-foreground: "#ffffff"
  chrome-bg: "#14120B"
  surface-card: "#1C1914"
  luminous-text: "#e4e4e4"
  info-blue: "#5da1e5"
  success-green: "#3fa266"
  warning-amber: "#f1b467"
  destructive-rose: "#e34671"
  border-subtle: "#e4e4e41a"
  muted-text: "#e4e4e4b3"
typography:
  display:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "normal"
  mono:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  xl: "12px"
  2xl: "14px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  2xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.luminous-text}"
    textColor: "{colors.chrome-bg}"
    rounded: "9999px"
    padding: "0 12px"
    height: "28px"
  button-primary-hover:
    backgroundColor: "color-mix(in oklab, {colors.luminous-text} 80%, transparent)"
    textColor: "{colors.chrome-bg}"
    rounded: "9999px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.luminous-text}"
    rounded: "9999px"
    padding: "0 8px"
    height: "28px"
  card-default:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.luminous-text}"
    rounded: "{rounded.xl}"
    padding: "0"
  input-default:
    backgroundColor: "#e4e4e41f"
    textColor: "{colors.luminous-text}"
    rounded: "{rounded.md}"
    height: "32px"
    padding: "0 10px"
  toggle-group-item-active:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.luminous-text}"
    rounded: "{rounded.md}"
    padding: "0 10px"
    height: "28px"
---

# Design System: Cursor Leaderboard

## 1. Overview

**Creative North Star: "The Native Scoreboard"**

This system extends cursor.com's landing chrome into a community leaderboard: warm near-black background (#14120B), luminous gray type, white pill primary actions, orange reserved for rare brand moments only. Density is compact (13px body, tight vertical rhythm) because users scan lists quickly and share screenshots. The aesthetic is restrained competition, not gamification theater.

The board rejects crypto-neon leaderboard clichés and generic SaaS dashboard slop. Depth comes from tonal layering and subtle borders, not glass panels or gradient hero metrics. Every surface should pass the test: could this live on cursor.com without apology?

**Key Characteristics:**

- Dark-first canonical theme (`#14120B` chrome, `#1C1914` cards)
- White pill primary actions; brand orange (`#f54e00`) rarely, if at all
- Compact tooling typography at 13px base with semibold headlines
- Tonal elevation over decorative shadows
- List-first layout: ranked rows, not card grids
- Share-ready rank moments with clear numerals and country context

## 2. Colors: The Cursor Chrome Palette

A near-monochrome dark tooling palette with one committed accent. Neutrals are tinted luminous gray on charcoal, not pure black or white.

### Primary

- **Cursor Brand Orange** (#f54e00): Reserved for optional logo-adjacent marks only, not primary UI actions.
- **Primary Action** (#e4e4e4 on #14120b): Join leaderboard and rank #1 badge use luminous fill with warm dark text, matching cursor.com landing CTAs.
- **Brand Foreground** (#ffffff): Text on orange surfaces.

### Secondary

- **Info Blue** (#5da1e5): Focus rings, links, chart accent. Structural UI feedback, not decoration.

### Tertiary

- **Success Green** (#3fa266): Confirmation states (joined successfully).
- **Warning Amber** (#f1b467): Cautionary emphasis when needed.
- **Destructive Rose** (#e34671): Errors and destructive actions.

### Neutral

- **Chrome Background** (#14120B): Page canvas, sticky header backdrop.
- **Surface Card** (#1C1914): Cards, popovers, active toggle segments.
- **Luminous Text** (#e4e4e4 at ~94% mix): Primary foreground on dark surfaces.
- **Muted Text** (#e4e4e4 at ~70% mix): Secondary lines, unit labels, placeholders.
- **Border Subtle** (#e4e4e4 at ~10% mix): Dividers, card borders, input strokes.

### Named Rules

**The One Accent Rule.** Brand orange does not appear on primary CTAs or rank badges. White pill actions and neutral rank styling carry hierarchy. Orange, if used at all, is limited to logo-adjacent marks.

**The No-Neon Rule.** No purple gradients, no glow effects, no saturated secondary accents competing with orange. If a color reads as gaming or crypto, remove it.

## 3. Typography

**Display Font:** System UI stack (-apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif)
**Body Font:** Same system stack
**Label/Mono Font:** System monospace for tabular stats when needed

**Character:** Native macOS/Windows tooling feel. Tight tracking on headlines, relaxed body at 13px. Numbers use tabular figures where ranking matters.

### Hierarchy

- **Display** (600, 1.25rem / 20px, 1.25): Page title ("Global leaderboard"). One per view.
- **Title** (600, 1rem / 16px, 1.25): Dialog titles, success headings.
- **Body** (400, 13px, 1.5): Default UI copy, table secondary lines. Max ~65ch for prose blocks.
- **Label** (500, 0.6875rem / 11px, 1.4): Field labels, metric unit captions, error text.
- **Stat** (600, 1rem / 16px base, tabular-nums): Rank values and primary metric column.

### Named Rules

**The Compact Base Rule.** Body text defaults to 13px. Do not inflate to 16px for "readability"; this is a tool surface, not a marketing page.

## 4. Elevation

Depth is conveyed primarily through tonal layering: `#141414` canvas → `#181818` cards → pressed toggle segments with `shadow-card`. Shadows are structural and subtle, never decorative glows.

### Shadow Vocabulary

- **Card** (`0 0 2px 0 rgb(0 0 0 / 0.4), 0 6px 16px 0 rgb(0 0 0 / 0.4)`): Default card containers and active toggle items.
- **Popover** (`0 10px 15px -3px rgb(0 0 0 / 0.4), 0 4px 6px -2px rgb(0 0 0 / 0.3)`): Dialogs and dropdowns.
- **Elevated** (`0 8px 32px rgb(0 0 0 / 0.5)`): Rare top-layer emphasis only.

### Named Rules

**The Flat-By-Default Rule.** Surfaces at rest are flat tonal panels. Shadows appear on elevated overlays (dialog, active toggle) or card containers, never on every list row.

## 5. Components

### Buttons

- **Shape:** Pill (`rounded-full`), compact height 28px (`h-7`).
- **Primary (default):** Luminous fill (#e4e4e4), warm dark text (#14120b), hover at 80% opacity.
- **Ghost / outline:** Transparent or bordered pills, muted text, hover fills with muted surface.
- **Focus:** 2px ring using info blue at 30% opacity.

### Chips / Badges

- **Style:** Tinted background at 12% brand mix, border at 42% mix, brand-colored text.
- **Use:** Ambassador badge, status tags. Never oversized or animated.

### Cards / Containers

- **Corner Style:** 12px (`rounded-xl`) for outer cards.
- **Background:** Surface card (#181818) on chrome (#141414).
- **Border:** 1px border-subtle; dividers inside use divide-y at 60% opacity.
- **Internal Padding:** 12–16px for content blocks; list rows use 10px vertical.

### Inputs / Fields

- **Style:** 32px height, 6px radius, subtle input background (12% luminous mix), 1px border.
- **Focus:** Border shifts to info blue ring at 30% opacity.
- **Error:** Destructive border and ring.

### Navigation / Header

- **Style:** Sticky 48px bar, border-bottom at 60% opacity, 80% background with backdrop blur.
- **Brand mark:** 24px cube asset (no orange fill block), adjacent wordmark at text-sm semibold.

### Toggle Groups (Metric / Scope Filters)

- **Container:** Secondary/60 background, 8px outer radius, 2px inner padding.
- **Items:** 28px height, muted text at rest; active state lifts to card background with shadow-card.
- **Icons:** 14px Lucide icons inline with labels; short labels on mobile.

### Leaderboard Row (Signature Component)

- **Layout:** Rank badge (28px) → avatar initial (32px circle) → name/handle → stat column → external link icon on hover.
- **Rank colors:** #1–#3 use faint brand tint (text 80% → 65% → 50% opacity); others muted numeral only.
- **Hover:** Muted/40 row background, no shadow, no scale transform.
- **Stats:** Semibold tabular numerals right-aligned with unit label below.

### Dialog

- **Overlay:** Black at 60% with light backdrop blur.
- **Panel:** Popover surface, 12px radius, shadow-popover, max-width md.
- **Motion:** 150ms scale/opacity enter-exit; respect reduced motion.

## 6. Do's and Don'ts

### Do:

- **Do** use white pill primary buttons (#e4e4e4 on #14120b) for join and confirm actions.
- **Do** keep the warm dark chrome (#14120B / #1C1914) as the canonical theme.
- **Do** show rank as a numeral in a small badge; color supports but never replaces the number.
- **Do** use compact 13px body type and tight list rows for scannable rankings.
- **Do** design join-success and rank displays for screenshot sharing (country flag, clear #rank).
- **Do** respect `prefers-reduced-motion` on dialog and hover transitions.

### Don't:

- **Don't** use crypto and gaming leaderboard aesthetics: neon glows, dark purple gradients, over-the-top rank badges, particle effects, "LEVEL UP" energy.
- **Don't** use generic SaaS dashboard slop: hero metric blocks, identical card grids, gradient text, glassmorphism chrome.
- **Don't** add aggressive gamification: XP bars, loot-box metaphors, streak flames, shouty CTAs.
- **Don't** use gradient text (`background-clip: text`) for emphasis; use weight and size.
- **Don't** add colored side-stripe borders on list items or cards.
- **Don't** rely on color alone for rank meaning; always show the numeric rank.
- **Don't** inflate typography to marketing-page sizes; this is a native tool surface.
