version: alpha
name: Intelligence Internet New Homepage Design System
description: Editorial design system for the new homepage in the Intelligent Internet website.
colors:
  primary: "#0F233F"
  primary-hover: "#12335A"
  secondary: "#516071"
  tertiary: "#83A1CC"
  accent: "#2F95A6"
  accent-gold: "#C9A96E"
  neutral: "#F2EEE2"
  neutral-soft: "#E8EDE5"
  surface: "#F2EEE2"
  surface-elevated: "#E8EDE5"
  on-surface: "#212121"
  border: "#5D6572"
  inverse: "#F2EEE2"
typography:
  headline-display:
    fontFamily: "Cormorant Garamond"
    fontSize: 96px
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: "Cormorant Garamond"
    fontSize: 72px
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: -0.02em
  headline-md:
    fontFamily: "Cormorant Garamond"
    fontSize: 56px
    fontWeight: 400
    lineHeight: 1.12
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: "Cormorant Garamond"
    fontSize: 40px
    fontWeight: 400
    lineHeight: 1.15
    letterSpacing: -0.01em
  body-lg:
    fontFamily: "Source Serif 4"
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.55
  body-md:
    fontFamily: "Source Serif 4"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: "Source Serif 4"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.6
  label-lg:
    fontFamily: "Source Serif 4"
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: 0.08em
  label-md:
    fontFamily: "Source Serif 4"
    fontSize: 16px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: 0.08em
  label-sm:
    fontFamily: "Source Serif 4"
    fontSize: 13px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: 0.08em
  utility-sans:
    fontFamily: "Geist Sans"
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: 0.04em
rounded:
  none: 0px
  sm: 8px
  md: 12px
  lg: 20px
  xl: 30px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  section: 80px
  page-gutter: 48px
  page-gutter-wide: 80px
  content-max: 1600px
  grid-step: 130px
components:
  navbar:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    typography: "{typography.body-sm}"
    height: 80px
    padding: "{spacing.page-gutter}"
    rounded: "{rounded.none}"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.inverse}"
    typography: "{typography.label-md}"
    rounded: "{rounded.full}"
    height: 44px
    padding: 12px
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.inverse}"
  button-gold:
    backgroundColor: "{colors.accent-gold}"
    textColor: "{colors.primary}"
    typography: "{typography.utility-sans}"
    rounded: "{rounded.full}"
    height: 48px
    padding: 12px
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    typography: "{typography.utility-sans}"
    rounded: "{rounded.full}"
    height: 48px
    padding: 12px
  card-surface:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: "{spacing.xl}"
  card-surface-hover:
    backgroundColor: "{colors.surface-elevated}"
    textColor: "{colors.primary}"
  quote-block:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    typography: "{typography.body-md}"
    rounded: "{rounded.none}"
    padding: "{spacing.lg}"
  eyebrow:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.secondary}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.full}"
    padding: "{spacing.sm}"
---

# New Homepage Design System

## Overview

The homepage should feel like a research manifesto rather than a marketing dashboard. It combines editorial calm, sovereign-systems seriousness, and a faint Renaissance mood: large serif headlines, generous breathing room, disciplined cream surfaces, and precise navy structure.

The emotional target is confidence without startup noise. Motion should feel cinematic but measured. Accent colors are scarce and intentional: blue-green marks conceptual emphasis, periwinkle supports product signaling, and gold is reserved for Logos or other moments that need a rarer, almost ceremonial highlight.

## Colors

The palette is anchored in parchment and navy, then extended with two cool accents and one warm accent.

- **Primary (`#0F233F`)**: The structural ink. Use for main text, primary actions, section dividers, and dark surfaces.
- **Secondary (`#516071`)**: Quiet metadata color for labels, rules, hints, and supporting UI chrome.
- **Tertiary (`#83A1CC`)**: Soft periwinkle for product emphasis, supportive highlights, and restrained contrast on cream.
- **Accent (`#2F95A6`)**: Intellectual emphasis color for italic keywords, card titles, and concept callouts.
- **Accent Gold (`#C9A96E`)**: Special-use highlight for Logos and other premium, mythic, or ceremonial moments.
- **Neutral / Surface (`#F2EEE2`)**: The default canvas. It should never read as sterile white.
- **Surface Elevated (`#E8EDE5`)**: Hover state and lifted card tone. Use for tonal depth instead of stronger shadows.
- **On Surface (`#212121`)**: Dense body copy when the content needs more readability than the navy provides.

## Typography

Typography carries the brand. Headlines are literary and expansive; body copy is sober and readable.

- **Display and headline text** use **Cormorant Garamond** at light or regular weights. This is the homepage's voice. Use italics surgically on concept nouns, product names, or one emphasized word, not entire sentences.
- **Body, labels, and navigation** use **Source Serif 4**. This keeps the site feeling thoughtful and text-first rather than app-like.
- **Utility sans text** may use **Geist Sans** for compact CTA labels or small operational controls when a sharper, productized tone is helpful.
- Keep most screens within two weights. The contrast should come from scale, italics, and spacing rather than a parade of boldness.

## Layout

The homepage uses a **fixed max-width editorial grid** inside a snap-scrolling stage. The shared content shell caps at `1600px`, with responsive gutters that widen toward `80px` on large screens.

Visible vertical guide lines are part of the visual language. They are not decorative noise; they remind the user that the page is structured, measured, and deliberate. The base rhythm is a simple spacing ladder of `4 / 8 / 16 / 24 / 32 / 48 / 80`, with `80px` functioning as the main section interval.

Sections should feel like slides from a research keynote: centered when declarative, asymmetrical when explanatory, and never cramped. Cards may break the grid slightly for optical balance, but the overall composition should still read as ordered.

## Elevation & Depth

Depth comes from tonal layering, atmospheric gradients, and restrained lift. Prefer cream-on-cream transitions, radial navy washes, particle fields, and subtle hover elevation over heavy drop shadows.

The homepage has two depth modes:

- **Light mode sections**: cream surfaces, visible grid lines, soft navy shadows, and shell gradients that feel embedded into the page rather than floating above it.
- **Dark feature sections**: deep navy backgrounds, particle noise, gold or cream glows, and high-contrast inverse text.

If a component already has a strong tonal separation, do not add a stronger shadow just to make it louder.

## Shapes

The shape language is soft but not bubbly. Cards use modest radii (`8px` to `12px`), large framed panels may stretch to `20px`, and actions default to pill geometry.

The more distinctive shape motif is not the corner radius but the **corner-cross frame**: thin rules plus short protruding ticks at the corners. Use that motif on hero cards, CTA tiles, and bordered callouts to make the UI feel engineered rather than generic.

## Components

- **Navigation bar**: fixed, translucent cream when pinned, with dark serif links and a compact pill CTA. It should feel light enough to float over the hero, not like a separate app chrome block.
- **Primary buttons**: navy pill buttons with cream text, slight lift on hover, and tight uppercase or semi-formal label spacing.
- **Gold buttons**: reserved for Logos or similarly elevated calls to action. Use only when the screen has already established a dark navy field.
- **Secondary buttons**: transparent or cream-toned pills with thin borders. They are supporting actions, never the screen's loudest element.
- **Section cards**: cream surfaces with a navy radial tint, thin border language, and optional corner-cross decoration. Hover states should shift tonally to `surface-elevated` and rise slightly.
- **Editorial quotes and book callouts**: left-rule structure, generous line height, and serif italics. These should feel excerpted from a text, not boxed like app notifications.
- **Research or product grids**: evenly spaced, visually calm, and text-led. Illustrations are allowed, but typography remains the primary organizer.

## Do's and Don'ts

- Do keep the homepage quiet, spacious, and text-forward.
- Do use italics as an emphasis scalpel, especially inside headlines.
- Do reserve gold for rare moments so it stays expensive.
- Do prefer tonal depth and motion choreography over stronger shadows.
- Don't introduce bright saturated colors outside the defined accent set.
- Don't mix rounded-soft cards with harsh rectangular controls in the same section.
- Don't treat every CTA as primary; one screen should usually have one dominant action.
- Don't let utility UI overpower the editorial voice of the page.
