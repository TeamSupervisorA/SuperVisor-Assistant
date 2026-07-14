---
name: Academic Intelligence Dark
colors:
  surface: '#0b1326'
  surface-dim: '#0b1326'
  surface-bright: '#31394d'
  surface-container-lowest: '#060e20'
  surface-container-low: '#131b2e'
  surface-container: '#171f33'
  surface-container-high: '#222a3d'
  surface-container-highest: '#2d3449'
  on-surface: '#dae2fd'
  on-surface-variant: '#c7c4d7'
  inverse-surface: '#dae2fd'
  inverse-on-surface: '#283044'
  outline: '#908fa0'
  outline-variant: '#464554'
  surface-tint: '#c0c1ff'
  primary: '#c0c1ff'
  on-primary: '#1000a9'
  primary-container: '#8083ff'
  on-primary-container: '#0d0096'
  inverse-primary: '#494bd6'
  secondary: '#b9c8de'
  on-secondary: '#233143'
  secondary-container: '#39485a'
  on-secondary-container: '#a7b6cc'
  tertiary: '#ffb783'
  on-tertiary: '#4f2500'
  tertiary-container: '#d97721'
  on-tertiary-container: '#452000'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e1e0ff'
  primary-fixed-dim: '#c0c1ff'
  on-primary-fixed: '#07006c'
  on-primary-fixed-variant: '#2f2ebe'
  secondary-fixed: '#d4e4fa'
  secondary-fixed-dim: '#b9c8de'
  on-secondary-fixed: '#0d1c2d'
  on-secondary-fixed-variant: '#39485a'
  tertiary-fixed: '#ffdcc5'
  tertiary-fixed-dim: '#ffb783'
  on-tertiary-fixed: '#301400'
  on-tertiary-fixed-variant: '#703700'
  background: '#0b1326'
  on-background: '#dae2fd'
  surface-variant: '#2d3449'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  headline-xl-mobile:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 38px
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 40px
  xl: 64px
  gutter: 24px
  margin: 32px
---

## Brand & Style
The design system focuses on creating a high-stakes, sophisticated environment for academic research and data synthesis. The brand personality is professional, authoritative, and focused, minimizing visual noise to prioritize cognitive throughput.

The design style is **Corporate / Modern** with a lean toward **Minimalism**. It utilizes deep tonal layering to create a sense of focused immersion. By using a dark-first approach, the system reduces eye strain during long-form reading and data analysis, while the vibrant accents guide the user's attention to critical actions and insights.

## Colors
The palette is built on a foundation of deep, cool neutrals to establish a high-fidelity dark mode. 

- **Primary (#6366f1):** A vibrant Indigo reserved for primary actions, active states, and critical highlights.
- **Surface Foundations:** The base background uses a deep Navy (#0f172a). Elevated surfaces and containers use Slate (#1e293b) to create subtle depth without relying on harsh borders.
- **Typography Tiers:** High-contrast legibility is maintained using Slate-50 (#f8fafc) for primary headers and Slate-300 (#cbd5e1) for secondary body text and metadata.

## Typography
The system utilizes **Inter** exclusively to leverage its systematic, utilitarian nature. 

For dark mode optimization, font weights are slightly heavier than their light-mode counterparts to prevent "thinned" letterforms caused by light bleed on dark backgrounds. Large headings use tighter letter-spacing to maintain a compact, professional feel, while small labels use increased tracking for better legibility at a glance.

## Layout & Spacing
This design system employs a **Fixed Grid** model for desktop to ensure data-heavy dashboards remain readable and structured. 

- **Desktop:** 12-column grid with a 1200px max-width, 24px gutters, and 32px side margins.
- **Tablet:** 8-column fluid grid with 16px gutters.
- **Mobile:** 4-column fluid grid with 16px gutters and margins.

Spacing follows a strict 8px linear scale. Vertical rhythm is maintained by ensuring all component heights and stack spacing are multiples of the 8px base unit.

## Elevation & Depth
In this dark mode environment, depth is communicated through **Tonal Layers** and **Low-contrast outlines** rather than traditional shadows.

1.  **Level 0 (Background):** #0f172a - The canvas.
2.  **Level 1 (Cards/Containers):** #1e293b - Subtle elevation.
3.  **Level 2 (Modals/Popovers):** #334155 - Highest elevation.

Borders are used sparingly. When necessary, use a 1px solid border of #334155 to define edges on Level 1 surfaces. For active states, a 1px border of the primary indigo is used to signify focus.

## Shapes
The shape language is defined by the **ROUND_EIGHT** (8px) standard. This provides a balance between the clinical sharpness of academic software and the approachable nature of modern SaaS.

- **Buttons & Inputs:** 8px (rounded-md)
- **Cards & Panes:** 8px (rounded-md)
- **Selection Indicators:** 4px (rounded-sm)
- **Search Bars:** 24px (pill-shaped) to distinguish global navigation from content containers.

## Components

- **Buttons:** Primary buttons use the Indigo background with white text. Ghost buttons use Slate-300 text with a 1px #334155 border. 
- **Input Fields:** Backgrounds are slightly darker than the card surface (#0f172a) to create an inset, tactile feel. Focus states use a 2px Indigo outline.
- **Cards:** Use the #1e293b background with 8px corner radius. Padding is strictly 24px (md) for standard content and 16px (sm) for dense data tables.
- **Chips/Tags:** Used for academic subjects or status. These use a desaturated version of the primary color at 15% opacity with primary-colored text for a "soft-glow" effect.
- **Lists:** High-density rows with 1px #1e293b separators. Hover states transition the background to #334155.
- **Data Visualizations:** Charts should utilize a palette of Indigo, Cyan, and Violet, ensuring all colors maintain a 4.5:1 contrast ratio against the Navy background.