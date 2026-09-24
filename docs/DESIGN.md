---
version: alpha
name: Нить Caring Camp
description: A warm, nature-rooted brand system for a winter camp in Serbia — deep forest greens paired with soft sage and cream surfaces, accented with honey-gold and terracotta warm tones. Rounded pill buttons and generously curved cards sit on airy off-white surfaces, with a friendly display face (Marmelad) atop a calm humanist sans (Niti Sans). Soft green-tinted shadows give a gentle, caring elevation.
colors:
  primary: "#214C3F"
  primary-dark: "#0D352B"
  secondary: "#577064"
  tertiary: "#708D68"
  accent-gold: "#F0CF63"
  accent-gold-soft: "#F8EDBD"
  accent-terracotta: "#EE8F7F"
  accent-terracotta-soft: "#F7E4DC"
  ink: "#3C564C"
  surface: "#FFFFFF"
  surface-mint: "#E5F0E8"
  surface-sage: "#DDE9D4"
  surface-cream: "#F5F7F0"
  on-dark: "#FFFFFF"
  footer-bg: "#284D3F"
typography:
  display-lg:
    fontFamily: Marmelad
    fontSize: 32px
    fontWeight: 400
    lineHeight: 1.15
    letterSpacing: normal
  title-md:
    fontFamily: Marmelad
    fontSize: 29px
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: normal
  title-sm:
    fontFamily: Marmelad
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: normal
  body-lg:
    fontFamily: Niti Sans
    fontSize: 21px
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: normal
  body:
    fontFamily: Niti Sans
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: normal
  body-relaxed:
    fontFamily: Niti Sans
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: normal
  body-sm:
    fontFamily: Niti Sans
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: normal
  input:
    fontFamily: Niti Sans
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: normal
  body-strong:
    fontFamily: Niti Sans
    fontSize: 15px
    fontWeight: 700
    lineHeight: 1.55
    letterSpacing: normal
  caption:
    fontFamily: Niti Sans
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: normal
  nav-link:
    fontFamily: Niti Sans
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1.55
    letterSpacing: normal
  label-caps:
    fontFamily: Niti Sans
    fontSize: 13px
    fontWeight: 700
    lineHeight: 1.55
    letterSpacing: 2.08px
  micro-caps:
    fontFamily: Niti Sans
    fontSize: 10px
    fontWeight: 700
    lineHeight: 1.55
    letterSpacing: 1.3px
  micro:
    fontFamily: Niti Sans
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: normal
rounded:
  md: 12px
  lg: 16px
  xl: 26px
  2xl: 30px
  3xl: 38px
  pill: 999px
spacing:
  xs: 5px
  sm: 10px
  md: 16px
  lg: 24px
  xl: 28px
  2xl: 32px
  section: 68px
  section-lg: 115px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-dark}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: 18px 28px
  button-accent:
    backgroundColor: "{colors.accent-gold}"
    textColor: "{colors.primary}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.pill}"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.2xl}"
    padding: 28px
    boxShadow: rgba(18, 60, 49, 0.19) 0px 24px 55px 0px
  card-mint:
    backgroundColor: "{colors.surface-mint}"
    rounded: "{rounded.xl}"
    boxShadow: rgba(33, 76, 63, 0.11) 0px 14px 34px 0px
  card-sage:
    backgroundColor: "{colors.surface-sage}"
    rounded: "{rounded.lg}"
    padding: 24px
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    typography: "{typography.input}"
    rounded: "{rounded.lg}"
    borderColor: "{colors.primary}"
    borderWidth: 1px
    padding: 12px 16px
  badge:
    backgroundColor: "{colors.surface-mint}"
    textColor: "{colors.primary}"
    typography: "{typography.micro-caps}"
    rounded: "{rounded.pill}"
  avatar:
    borderColor: "{colors.surface}"
    borderWidth: 1px
  navbar:
    textColor: "{colors.primary}"
    height: 68px
    borderColor: "{colors.primary}"
    borderWidth: 0px
    position: fixed
  nav-link:
    textColor: "{colors.on-dark}"
    typography: "{typography.nav-link}"
  footer:
    backgroundColor: "{colors.footer-bg}"
    textColor: "{colors.on-dark}"
    height: 115px
    borderColor: "{colors.on-dark}"
    borderWidth: 0px
  footer-link:
    textColor: "{colors.on-dark}"
    typography: "{typography.micro}"
  link:
    textColor: "{colors.primary}"
    typography: "{typography.body-strong}"
---

# Нить Caring Camp

## Overview

Нить Caring Camp presents itself as a warm, nurturing brand aimed at parents evaluating a children's winter camp in Serbia. The personality is caring and humanistic rather than corporate: deep forest greens ground the palette while soft sage, cream, honey-gold and terracotta accents keep it gentle. A friendly display face (Marmelad) sits atop a calm humanist sans (Niti Sans), and every corner is rounded — pill buttons, generously curved cards, and even an arched "doorway" photo frame on the interior page.

Density is airy. Sections breathe with large vertical rhythm ({spacing.section} — 68px and {spacing.section-lg} — 115px between blocks) and content lives in a single marketing column with an oversized left-aligned headline balanced by an asymmetric polaroid-style photo collage. Depth is created primarily through **surface color change** — pastel gradient washes from sage to cream — supplemented by very soft, green-tinted shadows on floating cards rather than hard material elevation.

Hierarchy is built by scale and family contrast: Marmelad display type ({typography.display-lg}) announces sections, Niti Sans carries all reading and UI text, and accent colors (honey-gold, terracotta) mark warmth and calls to action. Uppercase tracked labels ({typography.label-caps}, {typography.micro-caps}) provide the small structural signposts.

**Key Characteristics:**
- Forest-green-and-blush palette anchored by **Forest** (`{colors.primary}` — #214C3F)
- Two-typeface system only: Marmelad display + Niti Sans body — no third family
- Pill-shaped CTAs ({rounded.pill}) and large soft-radius cards ({rounded.2xl})
- Depth from pastel gradient surfaces, not heavy shadows
- Polaroid/collage photo treatment with white borders and slight tilt
- Generous section spacing (68–115px) and single-column flow
- Warm accent duo: honey-gold ({colors.accent-gold}) and terracotta ({colors.accent-terracotta})

## Colors

The palette is a warm forest system: deep greens for structure and text, soft sage/mint/cream for surfaces, and a honey-gold plus terracotta pair for warm accents. No CSS gradients are captured as tokens, but the screenshots show soft sage-to-cream background washes used decoratively behind sections.

### Brand & Accent
- **Forest** (`{colors.primary}` — #214C3F): the dominant brand color — primary buttons, most body/heading text, links, input borders. The single most-used color on the site.
- **Deep Pine** (`{colors.primary-dark}` — #0D352B): darkest green for deep contrast surfaces and emphasis text.
- **Sage** (`{colors.secondary}` — #577064): secondary text and muted labels.
- **Moss** (`{colors.tertiary}` — #708D68): tertiary text and quiet accents.
- **Honey Gold** (`{colors.accent-gold}` — #F0CF63): the warm CTA accent — background of accent buttons.
- **Honey Gold Soft** (`{colors.accent-gold-soft}` — #F8EDBD): soft gold surface fill for gentle highlight panels.
- **Terracotta** (`{colors.accent-terracotta}` — #EE8F7F): warm blush accent, used sparingly for emphasis.
- **Terracotta Soft** (`{colors.accent-terracotta-soft}` — #F7E4DC): pale blush surface fill.

### Surface
- **White** (`{colors.surface}` — #FFFFFF): default card surface and polaroid photo borders.
- **Mint** (`{colors.surface-mint}` — #E5F0E8): tinted card and badge surfaces.
- **Sage Tint** (`{colors.surface-sage}` — #DDE9D4): soft sage card fill.
- **Cream** (`{colors.surface-cream}` — #F5F7F0): warm off-white section background.

### Text
- **Ink** (`{colors.ink}` — #3C564C): a green-tinted near-black for extended reading text.
- **On Dark** (`{colors.on-dark}` — #FFFFFF): text on green/footer backgrounds and nav links.

### Footer
- **Footer Green** (`{colors.footer-bg}` — #284D3F): dedicated footer background, a hair lighter than primary.

There are no dark-mode overrides in the tokens — this is a single light theme. A builder should not synthesize a dark variant; the green-on-cream contrast is the intended and only mode.

## Typography

Two families do all the work: a friendly display face for headings and a humanist sans for everything else.

### Font Family
- **Marmelad** — the display/heading face. Rounded, warm, used for section headlines and titles ({typography.display-lg}, {typography.title-md}, {typography.title-sm}). Always weight 400.
- **Niti Sans** — the humanist workhorse for body copy, UI, labels, captions and nav ({typography.body} through {typography.micro}).

### Hierarchy
| Token | Size | Weight | Line Height | Letter Spacing | Use |
|---|---|---|---|---|---|
| {typography.display-lg} | 32px | 400 | 1.15 | normal | Marmelad — largest section headlines |
| {typography.title-md} | 29px | 400 | 1.1 | normal | Marmelad — h3 section titles |
| {typography.title-sm} | 18px | 400 | 1.55 | normal | Marmelad — small titles/eyebrows |
| {typography.body-lg} | 21px | 400 | 1.55 | normal | Niti Sans — lead paragraphs, large buttons |
| {typography.body} | 18px | 400 | 1.55 | normal | Niti Sans — default body & primary button text |
| {typography.body-relaxed} | 16px | 400 | 1.7 | normal | Niti Sans — long-form relaxed reading |
| {typography.body-sm} | 15px | 400 | 1.55 | normal | Niti Sans — secondary copy |
| {typography.input} | 15px | 400 | 1.5 | normal | Niti Sans — form fields |
| {typography.body-strong} | 15px | 700 | 1.55 | normal | Niti Sans — bold inline emphasis, links, accent button |
| {typography.caption} | 14px | 400 | 1.55 | normal | Niti Sans — captions |
| {typography.nav-link} | 14px | 600 | 1.55 | normal | Niti Sans — header nav links |
| {typography.label-caps} | 13px | 700 | 1.55 | 2.08px | Niti Sans — tracked uppercase labels |
| {typography.micro-caps} | 10px | 700 | 1.55 | 1.3px | Niti Sans — badge/eyebrow micro-labels |
| {typography.micro} | 12px | 400 | 1.55 | normal | Niti Sans — footer links, fine print |

### Principles
Only three weights exist: 400 (all display + most body), 700 (strong/labels), and a single 600 reserved for nav links. **Weight 500 is deliberately absent** — do not introduce it. Letter-spacing is normal everywhere except the two uppercase label styles ({typography.label-caps} at 2.08px, {typography.micro-caps} at 1.3px), where wide tracking signals a caps eyebrow. Line-height clusters at 1.55 for the sans and tightens to 1.1–1.15 for large Marmelad headlines; only {typography.body-relaxed} opens to 1.7 for comfortable long-form reading.

### Note on Font Substitutes
Both Marmelad and Niti Sans are specific faces. Marmelad is available as an open Google Font (Cyrillic-supporting, rounded display) — use it directly. For Niti Sans, substitute a humanist sans such as **Nunito Sans** or **Mulish** (both Cyrillic-capable); keep weights to 400/600/700 and line-height 1.55 to match the calm rhythm.

## Layout

### Spacing System
Spacing follows a roughly 4–8px-derived scale, expressed in these tokens: {spacing.xs} (5px), {spacing.sm} (10px), {spacing.md} (16px), {spacing.lg} (24px), {spacing.xl} (28px), {spacing.2xl} (32px), then a large jump to {spacing.section} (68px) and {spacing.section-lg} (115px) for between-section rhythm. The 28px value ({spacing.xl}) is the most frequently measured — it doubles as card padding.

### Grid & Container
The layout is a single marketing column with generous top padding. The hero is asymmetric: an oversized left-aligned display headline balanced by a photo collage on the right. The interior gallery uses a dense 3-column portrait grid with consistent gutters. Cards use 28px internal padding ({components.card} padding: 28px; {components.card-sage} padding: 24px). Exact max container width was not captured in tokens, so treat the column as a centered content measure sized to the display headline block.

### Whitespace Philosophy
Whitespace is a feature, not a leftover. Large section gaps (68–115px) let each content block breathe, reinforcing the calm, caring tone. Cards float on airy off-white and pastel surfaces with soft shadows rather than hard borders, so negative space carries the separation. Keep copy blocks narrow and let the surrounding air do the framing.

## Elevation & Depth

| Level | Treatment | Use |
|---|---|---|
| 0 — Flat | Pastel surface color change (sage/mint/cream washes) | Section backgrounds, base separation |
| 1 — Soft tint card | `rgba(33,76,63,0.11) 0px 14px 34px` | Mint tinted cards ({components.card-mint}) |
| 2 — Floating card | `rgba(18,60,49,0.19) 0px 24px 55px` | Primary white cards ({components.card}) |
| 3 — Polaroid | Subtle drop shadow + white border | Tilted photo collage images |

**Shadow philosophy.** Elevation here is soft and green-tinted, never hard. Shadows are always low-alpha (0.11–0.19) and cast with large blur (34–55px) and a big downward offset, producing a gentle floating-card feel rather than crisp material lift. Critically, depth comes first from **surface color change** — the sage-to-cream gradient washes — with shadow only reinforcing the largest cards. Every shadow color is a desaturated forest green (rgba around 18–49, 60–79, 49–63), so lift always feels like it belongs to the same warm forest world rather than a neutral gray drop shadow.

## Shapes

### Border Radius Scale
| Token | Value | Use |
|---|---|---|
| {rounded.md} | 12px | Small elements, tight corners |
| {rounded.lg} | 16px | Inputs, sage cards |
| {rounded.xl} | 26px | Mint tinted cards |
| {rounded.2xl} | 30px | Primary white cards |
| {rounded.3xl} | 38px | Largest panel containers |
| {rounded.pill} | 999px | Buttons, badges, tags |

The geometry is uniformly soft and organic — nothing is sharp. Radii scale with element size so that big panels ({rounded.3xl} — 38px) feel as gently curved as small cards, keeping the family visually consistent. Pills ({rounded.pill}) define all buttons and badges, and full circles (50% radius, seen heavily in the evidence) are used for avatars and blob accents. The interior page adds a distinctive arched (tombstone/doorway) photo frame and wavy decorative line motifs, extending the non-angular language beyond simple rounding into playful organic shapes. When in doubt, round it — angular corners are off-brand.

## Components

### Navigation
**`navbar`** — A fixed-position bar ({components.navbar} position: fixed) 68px tall ({components.navbar} height). It has a transparent background (the intended `rgba(0,0,0,0)` overlay was not directly measured but implied) and no backdrop blur. Text color is Forest ({colors.primary}) per the token, though the measured nav links render white ({components.nav-link} textColor: {colors.on-dark}) atop hero imagery. Nine nav links appear, styled with {typography.nav-link} (14px, weight 600). The header carries a CTA button (hasCtaButton: true). Border width is 0 — no hairline rule.

### Buttons
**`button-primary`** — Forest fill ({colors.primary}) with white text ({colors.on-dark}), {typography.body} (18px), fully pill-shaped ({rounded.pill}), padding 18px 28px. The workhorse primary action.

**`button-accent`** — Honey-gold fill ({colors.accent-gold}) with Forest text ({colors.primary}), {typography.body-strong} (15px/700), pill-shaped ({rounded.pill}). The warm, high-emphasis alternative CTA.

### Cards & Containers
**`card`** — White surface ({colors.surface}), {rounded.2xl} (30px), 28px padding, and the signature floating shadow `rgba(18,60,49,0.19) 0px 24px 55px`. The default content card.

**`card-mint`** — Mint surface ({colors.surface-mint}), {rounded.xl} (26px), softer shadow `rgba(33,76,63,0.11) 0px 14px 34px`. Tinted feature card.

**`card-sage`** — Sage surface ({colors.surface-sage}), {rounded.lg} (16px), 24px padding, no shadow — a flat tinted panel.

### Inputs & Forms
**`input`** — White fill ({colors.surface}), Forest text ({colors.primary}), {typography.input} (15px), {rounded.lg} (16px) corners, 1px Forest border ({colors.primary}), padding 12px 16px. Bordered rather than filled — the green outline is the field's defining edge.

### Badges & Chips
**`badge`** — Mint surface ({colors.surface-mint}), Forest text ({colors.primary}), {typography.micro-caps} (10px/700, tracked), pill-shaped ({rounded.pill}). Small uppercase tags.

**`avatar`** — White 1px border ({components.avatar} borderColor {colors.surface}). Circular (50% in evidence). Used in photo/testimonial contexts.

### Links
**`link`** — Forest text ({colors.primary}) with {typography.body-strong} (15px/700) weighting to distinguish inline links from body copy.

### Footer
**`footer`** — Static (non-fixed) bar 115px tall ({components.footer} height), background Footer Green ({colors.footer-bg} — #284D3F), white text ({colors.on-dark}), border width 0. It holds five footer links ({components.footer-link}) styled with {typography.micro} (12px/400) in white. No CTA button and no visible column structure (columnCount 0) — a compact single-row legal/link strip.

## Do's and Don'ts

### Do
- Do keep the two-typeface split — Marmelad for display, Niti Sans for everything else; never add a third family.
- Do use only the observed weights: 400, 600 (nav only), and 700 ({typography.body-strong}, {typography.label-caps}).
- Do reach for pill shapes ({rounded.pill}) on every button and badge, and size card radii to match element scale ({rounded.lg} → {rounded.3xl}).
- Do build depth from surface color ({colors.surface-mint}, {colors.surface-sage}, {colors.surface-cream}) first, then reinforce with the soft green-tinted card shadow.
- Do pair Forest ({colors.primary}) actions with Honey Gold ({colors.accent-gold}) accents to keep the warm/caring balance.
- Do use tracked uppercase ({typography.label-caps}, {typography.micro-caps}) only for small eyebrow labels, never for running text.
- Do give sections room to breathe with {spacing.section} (68px) and {spacing.section-lg} (115px) gaps.

### Don't
- Don't introduce weight 500 — it is deliberately absent from the ladder.
- Don't use hard, neutral-gray drop shadows; shadows are always low-alpha forest-green tints.
- Don't add angular or square corners — the entire geometry is rounded/organic.
- Don't apply letter-spacing to body or Marmelad headings; tracking belongs only to caps labels.
- Don't invent a dark theme — the tokens define a single light forest-on-cream mode.
- Don't overuse terracotta ({colors.accent-terracotta}); it appears sparingly as a warm accent, not a surface staple.
- Don't put heavy borders on cards; separation comes from tint and soft shadow, not outlines.

## Responsive Behavior

This is a two-viewport analysis (desktop and mobile captures only); no intermediate breakpoint pixel values were observed, so none are asserted.

### Observed behavior
On desktop the hero is asymmetric — an oversized left-aligned display headline balanced by a photo collage on the right — and the interior gallery uses a dense 3-column portrait grid. On mobile everything collapses into a single narrow column: the collage/gradient hero is preserved but stacks, and the photo grids compress to full-width stacked images. Section spacing and rounded card language carry across both viewports.

### Touch targets
The fixed navbar is 68px tall ({components.navbar} height), and primary buttons carry 18px 28px padding ({components.button-primary}) which yields comfortably tappable pill targets. Inputs use 12px 16px padding ({components.input}) at 15px text — adequate but on the smaller side for touch; verify hit area on mobile.

Because only two viewports were captured, mid-range reflow behavior is inferred, not measured — score this section accordingly.

## Iteration Guide

1. **Change color by token, never by hex.** Edit {colors.primary}, {colors.accent-gold}, {colors.surface-*} rather than hardcoding values — the whole system re-tints from these.
2. **Respect the weight ladder.** Only 400/600/700 exist; if you need emphasis, use {typography.body-strong}, not a new weight. Never add 500.
3. **New buttons inherit pill + token pattern.** Base variants on {components.button-primary} or {components.button-accent}; keep {rounded.pill} and the fill/text token pairing intact.
4. **Card variants live in the card family.** Add tinted panels by cloning {components.card-mint} or {components.card-sage} and swapping surface + radius tokens; keep shadows green-tinted and low-alpha.
5. **Elevation is surface-first.** Reach for {colors.surface-mint}/{colors.surface-sage}/{colors.surface-cream} before adding a shadow; shadows only reinforce the largest cards.
6. **Keep the two families exact.** Marmelad for {typography.display-lg}/{typography.title-md}/{typography.title-sm}; Niti Sans for all else. Do not add a third family.
7. **Unbreakable boundaries:** rounded geometry everywhere, single light theme, tracked caps only on label styles, and section rhythm at {spacing.section}/{spacing.section-lg}.

## Known Gaps

- **Navbar background** — the intended transparent `rgba(0,0,0,0)` value was dropped (not directly observed); the fixed navbar's true resting background over non-hero sections is unverified.
- **Avatar radius** — the original `rounded.circle` (9999px) token and the avatar's reference to it were dropped; circular avatars are inferred from the 50%-radius evidence but not token-confirmed.
- **Hover, focus, active, and disabled states** — no interactive state styling was captured for buttons, links, inputs, or nav; only resting appearance is documented.
- **Gradients** — screenshots show sage-to-cream background washes, but no gradient tokens were extracted, so exact stops and directions are unknown.
- **Breakpoints** — only two viewports (desktop, mobile) were captured; mid-range reflow and exact breakpoint values are not verified.
- **Container max-width** — no explicit container width token was captured; the content measure is inferred from layout.
- **Animation & motion** — wavy line motifs and collage tilts suggest playful decoration, but no transition or motion values were measured.
- **Coverage** — only two pages were captured (home and the interior /niti-carring-space/ page); forms, auth-walled, or deeper pages were not analyzed.
