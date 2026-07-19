---
name: UPESphere
description: A fintech-grade academic command console for Indian university students
colors:
  indigo-primary: "#6366f1"
  violet-secondary: "#8b5cf6"
  cyan-accent: "#06b6d4"
  emerald-success: "#10b981"
  ink-dark: "#fafafa"
  surface-dark: "#09090b"
  surface-dark-raised: "#27272a"
  muted-ink-dark: "#878792"
  ink-light: "#0e0e11"
  surface-light: "#fafafc"
  surface-light-raised: "#efeff1"
  muted-ink-light: "#71717a"
  border-light: "#e4e4e7"
  destructive: "#ef4343"
  destructive-dark: "#7f1d1d"
typography:
  display:
    fontFamily: "Space Grotesk, system-ui, sans-serif"
    fontSize: "clamp(2.25rem, 5vw, 4.5rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "normal"
  micro:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: "normal"
  micro-sub:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.625rem"
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: "normal"
  micro-dense:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.5625rem"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "normal"
rounded:
  sm: "0.5rem"
  md: "0.625rem"
  lg: "0.75rem"
  xl: "1rem"
components:
  button-primary:
    backgroundColor: "{colors.indigo-primary}"
    textColor: "#ffffff"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    padding: "0.5rem 1rem"
    height: "2.5rem"
  button-primary-hover:
    backgroundColor: "{colors.violet-secondary}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.ink-dark}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    padding: "0.5rem 1rem"
  card-glass:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.ink-dark}"
    rounded: "{rounded.xl}"
    padding: "1.5rem"
  input-default:
    backgroundColor: "{colors.surface-dark-raised}"
    textColor: "{colors.ink-dark}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "0.5rem 0.75rem"
    height: "2.5rem"
---

# Design System: UPESphere

## 1. Overview

**Creative North Star: "The Academic Command Console"**

UPESphere reads like a fintech dashboard for a student's academic life, not a calculator site. It's a near-black console in dark mode (an airy near-white one in light mode) where every panel is a soft indigo-violet glass surface — translucent, blurred, thinly bordered — floating on a faint colored glow instead of a hard shadow. PRODUCT.md's brief that students should "check regularly, the way they'd check a banking app" is a literal design instruction here: dark-by-default like a trading terminal, one saturated identity gradient (indigo → violet, occasionally → cyan) reserved for calls to action, the wordmark, and numbers that matter — everything else stays quiet.

It explicitly rejects the "free calculator site" look named in PRODUCT.md's anti-references: no banner-ad chrome, no cartoon mascots, no gamified badge clutter. Precision reads as restraint — flat neutral surfaces, one accent hue family, glass instead of gray boxes.

**Key Characteristics:**
- Dark-by-default (`next-themes`, `defaultTheme="dark"`), with full light-mode parity through paired HSL tokens.
- One identity gradient — indigo → violet, occasionally → cyan — carried by glass borders, shadows, focus rings, CTAs, and the wordmark, never the whole screen.
- Elevation expressed as blur + tinted glow, never a flat drop shadow.
- Space Grotesk display type over Inter body type: a geometric, slightly technical heading voice over a humanist reading voice.
- Color as trust signal, not decoration — used sparingly enough that its appearance always means "this matters."

## 2. Colors

The palette is a near-monochrome dark (or near-white light) canvas with a single indigo→violet identity gradient doing almost all of the accent work, plus a small set of semantic accents for state.

### Primary
- **Indigo Primary** (#6366f1): the brand's one true color. Buttons (`gradient` variant), focus rings, glass-panel borders and shadows (all `rgba(99,102,241,…)`), active-nav indicator dots, the base gradient stop for the wordmark and headline emphasis.

### Secondary
- **Violet Secondary** (#8b5cf6): always paired with Indigo Primary as the second gradient stop — never used alone. Carries the same buttons, wordmark, and headline treatments one shade warmer/cooler than pure indigo, and takes over as the dominant glow tint in dark mode (dropdown shadows, scroll-arrow glow).

### Tertiary
- **Cyan Accent** (#06b6d4): the third stop in the `gradient-text` utility (indigo → violet → cyan) and an occasional standalone accent on calculator stat badges and calendar/hackathon date chips.
- **Emerald Success** (#10b981): the positive-state color — SGPA/CGPA numeric readouts, verified-checkmark states, positive trend indicators. Never used for a CTA; it's a status color, not a brand color.

### Neutral
- **Ink** (#fafafa dark mode / #0e0e11 light mode): body text and headings; near-white on the dark canvas, near-black on the light one.
- **Surface** (#09090b dark / #fafafc light): the page canvas itself — intentionally near-monochrome so the indigo/violet accents read as deliberate, not ambient.
- **Surface Raised** (#27272a dark / #efeff1 light): flat (non-glass) surfaces like input fills and secondary buttons.
- **Muted Ink** (#878792 dark / #71717a light): secondary text, captions, placeholders — always checked against its background rather than defaulted to a generic gray.
- **Border** (#27272a dark / #e4e4e7 light, `--border`/`--input`): hairline dividers on flat surfaces. Glass surfaces use their own translucent `--glass-border` (`rgba(99,102,241,0.14–0.30)`) instead of this token — see the Glass-Not-Flat rule below.
- **Destructive** (#ef4343 light / #7f1d1d dark, from HSL `--destructive`): validation errors, sign-out, delete affordances.

### Named Rules
**The Glass-Not-Flat Rule.** A "surface" in this system is rarely a flat neutral swatch — it's a translucent gradient (`--glass-from` → `--glass-to`) over a `backdrop-blur`, bordered in low-alpha indigo (`--glass-border`) rather than the flat `--border` token. Reach for the flat neutral tokens only on genuinely flat controls (inputs, secondary buttons); everything meant to feel "raised" is glass.

**The One Gradient Rule.** Indigo → violet (→ cyan) is the only gradient in the system. It appears on primary CTAs, the wordmark, and at most one emphasized phrase per headline — never on body copy, never stacked on more than one heading per screen.

## 3. Typography

**Display Font:** Space Grotesk (with system-ui, sans-serif fallback)
**Body Font:** Inter (with system-ui, sans-serif fallback)

**Character:** A geometric, slightly technical display face paired with a humanist, highly-legible body face — the same contrast-pairing logic as a fintech product: numbers and headlines look engineered and precise, paragraphs stay easy to read at length.

### Hierarchy
- **Display** (700, `clamp(2.25rem, 5vw, 4.5rem)` / hero range `text-5xl` → `text-7xl`, line-height 1.1, tracking -0.02em): the landing hero headline only, `font-display`.
- **Headline** (700, 2.25rem / `text-4xl`, tracking tight, `font-display`): page-level H1s (Dashboard, Gradebook).
- **Title** (600, 1.125–1.25rem / `text-lg`–`text-xl`, `font-display`): card and section headers, modal titles.
- **Body** (400, 0.875–1rem / `text-sm`–`text-base`, `font-sans`, line-height 1.6): paragraph copy and descriptions, capped conversationally around 65–75ch; secondary lines use Muted Ink.
- **Label** (500, 0.75–0.8125rem / `text-xs`–`text-sm`, `font-sans`): form labels, stat-card titles, nav items, badges.
- **Micro** (400, 0.6875rem / `text-[11px]`, `font-sans`): the dominant dense-caption size below Label — stat-card subtitles, timetable popover detail lines, today's-classes room/status text, workspace item status text.
- **Micro Sub** (400, 0.625rem / `text-[10px]`, `font-sans`): a second, more de-emphasized tier directly under a Micro line in the same block — "Updated {date}," "{n}% Complete," compact day-of-week headers.
- **Micro Dense** (400, 0.5625rem / `text-[9px]`, `font-sans`): reserved for the tightest contexts only — the Weekly Timetable's hour-ruler ticks and grid-cell slot content, and the "LIVE NOW" badge — where even Micro Sub doesn't fit the available space.

### Named Rules
**The Display-Is-Rare Rule.** `font-display` (Space Grotesk) marks a genuine heading or a number the student is meant to trust (SGPA, CGPA, attendance %) — not every bold word. Body and UI chrome stay in Inter.

**The Three-Tier Micro Rule.** Dense captions have exactly three sizes below Label — Micro, Micro Sub, Micro Dense — each with a fixed purpose. A fourth micro size (an `8px`, `7.5px`, or similar one-off) is drift, not a new tier; consolidate it into whichever of the three it was actually trying to be.

## 4. Elevation

This system has no numbered material elevation scale and almost no hard drop shadows. Depth comes from translucency plus blur: every raised surface is a glass panel — `backdrop-blur`, a subtle gradient fill, a 1px low-alpha indigo border, and an ambient shadow that's tinted, not gray. Dropdowns and popovers use a more opaque glass variant so content underneath doesn't bleed through; a circular scroll-arrow affordance gets its own tight colored glow.

### Shadow Vocabulary
- **Glass ambient** (`--glass-shadow`: `0 4px 24px rgba(99,102,241,.07), 0 1px 4px rgba(0,0,0,.05)` light / `0 8px 32px rgba(0,0,0,.4), 0 0 0 1px rgba(255,255,255,.04)` dark): the default resting shadow under every glass card and glass button.
- **Dropdown/popover** (`--dropdown-shadow`): heavier and more opaque than the ambient glass shadow, so floating menus stay legible over whatever's beneath them.
- **Arrow/CTA glow** (`--arrow-btn-glow`): a tight colored halo around the circular scroll-arrow affordance — indigo-tinted in light mode, violet-tinted in dark mode.

### Named Rules
**The Blur-Over-Black Rule.** Elevation is blur plus a colored glow, never a flat gray drop shadow. A shadow with no indigo/violet tint reads as a bug, not a stylistic choice.

## 5. Components

### Buttons
- **Shape:** `rounded-lg` (0.5rem) at the small size, `rounded-xl` (0.75rem) at default/large, `rounded-2xl` (1rem) at extra-large.
- **Primary (`gradient` variant):** indigo → violet gradient fill, white text, `shadow-lg shadow-indigo-500/25` at rest, deepening shadow plus a 1.02x scale on hover — the hover scale is gated behind `(hover: hover) and (pointer: fine)` so touch devices don't get a stuck hover state.
- **Outline:** transparent fill, 1px border, backdrop blur; fills in softly on hover.
- **Ghost:** no border or fill at rest; text-only with a soft background tint on hover.
- **Press feedback:** `active:scale-[0.98]` on a fast, transform-only 150ms transition, decoupled from the slower 200ms color/shadow transition — so a tap feels immediate even while the hover color fade is still easing out.

### Cards
- **Corner style:** `rounded-2xl` (1rem) — the dominant radius of the whole system.
- **Background:** the translucent glass gradient (`--glass-from` → `--glass-to`), never a flat fill.
- **Shadow strategy:** the Glass Ambient shadow above; no separate elevation steps.
- **Border:** 1px, `--glass-border` (low-alpha indigo).
- **Internal padding:** 1.5rem (`p-6`), header/content/footer stacked with `space-y-1.5` inside the header block.

### Inputs / Fields
- **Style:** `rounded-xl` (0.75rem), 1px `--divider`-colored border, `--muted-surface` fill — flat, not glass; inputs are one of the few places this system uses a plain neutral surface.
- **Focus:** border shifts to indigo at 50% alpha plus a matching 2px focus ring (`focus-visible:ring-2 ring-indigo-500/50`).
- **Placeholder:** muted-foreground at 50% alpha — check this against the input background at implementation time; it sits close to the 4.5:1 floor.

### Navigation
- Glass navbar bar; top-level links are flat text, `hover:bg-white/5` tint, active state adds the same tint plus full-opacity foreground color — no underline anywhere.
- Dropdown panels (nav menus, selects) use the more-opaque dropdown glass variant, anchored with `transform-origin` set to the trigger's corner so the scale-in reads as coming from the click point, not the viewport edge.

## 6. Do's and Don'ts

### Do:
- **Do** keep the indigo → violet gradient to primary CTAs, the wordmark, and at most one emphasized headline phrase per screen.
- **Do** express elevation as blur plus an indigo/violet-tinted shadow (`--glass-shadow`), never a flat black drop shadow.
- **Do** anchor popovers' `transform-origin` to their trigger so scale-in animations read as originating from the click point.
- **Do** check body and placeholder text against its actual background before shipping — the dark near-black canvas needs near-white text, not mid-gray "for elegance."
- **Do** gate hover-only transform effects behind `(hover: hover) and (pointer: fine)` so touch input never gets stuck in a hover state.

### Don't:
- **Don't** ship a cluttered, ad-heavy "free calculator" look — this is PRODUCT.md's explicit anti-reference: no banner-ad chrome, no cartoon mascots, no gamified badge clutter.
- **Don't** add a second gradient-text treatment to the same screen — one wordmark or one emphasized phrase, never both plus every card heading too.
- **Don't** nest glass on glass (a `GlassCard` inside another `GlassCard`) — one translucent layer per surface, flat neutral tokens underneath it.
- **Don't** use `border-left`/`border-right` as a colored accent stripe on cards or list rows — a full border, a background tint, or a leading icon instead.
- **Don't** drop a plain gray `box-shadow` (e.g. `rgba(0,0,0,0.2)` with no hue) onto a raised surface — every shadow in this system carries the indigo/violet tint.
