---
name: Academic Intelligence System
colors:
  surface: '#f9f9ff'
  surface-dim: '#cfdaf2'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e7eeff'
  surface-container-high: '#dee8ff'
  surface-container-highest: '#d8e3fb'
  on-surface: '#111c2d'
  on-surface-variant: '#464555'
  inverse-surface: '#263143'
  inverse-on-surface: '#ecf1ff'
  outline: '#777587'
  outline-variant: '#c7c4d8'
  surface-tint: '#4d44e3'
  primary: '#3525cd'
  on-primary: '#ffffff'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#c3c0ff'
  secondary: '#5c5f61'
  on-secondary: '#ffffff'
  secondary-container: '#e0e3e5'
  on-secondary-container: '#626567'
  tertiary: '#004d70'
  on-tertiary: '#ffffff'
  tertiary-container: '#006693'
  on-tertiary-container: '#b8e0ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#e0e3e5'
  secondary-fixed-dim: '#c4c7c9'
  on-secondary-fixed: '#191c1e'
  on-secondary-fixed-variant: '#444749'
  tertiary-fixed: '#c9e6ff'
  tertiary-fixed-dim: '#89ceff'
  on-tertiary-fixed: '#001e2f'
  on-tertiary-fixed-variant: '#004c6e'
  background: '#f9f9ff'
  on-background: '#111c2d'
  surface-variant: '#d8e3fb'
typography:
  display:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-lg:
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
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  sidebar_width: 280px
  container_max: 1440px
  gutter: 24px
  margin_mobile: 16px
  margin_desktop: 40px
---

## Brand & Style

The design system is engineered for high-stakes academic supervision, where clarity, authority, and focus are paramount. The brand personality is **scholarly yet technologically advanced**, positioning the AI not as a replacement for human oversight, but as a sophisticated co-pilot.

The visual style follows a **Corporate / Modern** aesthetic with elements of **Minimalism**. It prioritizes a high signal-to-noise ratio, utilizing expansive whitespace to reduce cognitive load during complex data analysis. The interface should feel institutional and reliable, evoking the same trust as a prestigious university's digital infrastructure while maintaining the fluid speed of a modern SaaS platform.

## Colors

The palette is anchored by **Deep Indigo**, a color associated with intelligence and stability. This is used exclusively for primary actions, active navigation states, and brand-critical elements. 

The background architecture utilizes a **Soft Blue-Gray** to provide a cool, calm canvas that reduces eye strain during long supervision sessions. 

**Semantic colors** are strictly reserved for status communication:
- **Emerald** for completed milestones and successful submissions.
- **Amber** for pending reviews or deadline warnings.
- **Sky Blue** for active research phases and "In-Progress" indicators.
- **Rose** for critical alerts or failed academic validations.

Neutrals are tiered to create a natural information hierarchy, using **Slate** for high-contrast reading and **Gray** for metadata and secondary descriptions.

## Typography

The design system utilizes **Inter** across all levels to ensure maximum legibility and a systematic, utilitarian feel. 

The hierarchy is built on a tight scale. **Display and Headline** levels use bold weights and negative letter-spacing to create a strong "editorial" anchor for dashboard sections. **Body text** is optimized for long-form reading of research papers and feedback notes, using a generous line-height of 1.5x the font size. **Labels** utilize uppercase styling and increased tracking to differentiate functional UI metadata from content.

## Layout & Spacing

The design system employs a **Fixed Grid** model for the navigation and a **Fluid Content** area. 

- **Sidebar:** A fixed 280px vertical navigation bar anchors the left side of the viewport. On mobile, this transitions to a hidden off-canvas drawer.
- **Main Canvas:** Content resides in a scrollable area with a maximum width of 1440px to prevent excessive line lengths in text-heavy academic documents.
- **Rhythm:** An 8px base unit governs all dimensions. Use 24px (3 units) for standard component spacing and 40px (5 units) for section margins on desktop.
- **Tables:** Data tables should stretch to fill the content container, utilizing a horizontal scroll only when column density exceeds the viewport.

## Elevation & Depth

Visual hierarchy is achieved through **Tonal Layers** combined with **Ambient Shadows**. 

The base application background is the neutral Soft Blue-Gray (#F8FAFC). Interactive containers and cards are elevated using pure White (#FFFFFF) surfaces.

To create "Academic Depth," use a single standard shadow: 
- **Card Shadow:** `0px 4px 6px -1px rgba(0, 0, 0, 0.05), 0px 2px 4px -2px rgba(0, 0, 0, 0.05)`. 
This creates a soft, sophisticated lift without appearing heavy or dated. 

For the **AI Assistant** components, a unique depth treatment is applied: a subtle 1px inner stroke using a light Indigo-to-SkyBlue gradient to signify "intelligence" within the layer.

## Shapes

The design system uses a **Rounded** shape language to soften the institutional feel and make the platform approachable for students and faculty alike.

- **Standard Components:** (Buttons, Inputs, Small Cards) use a **0.5rem (8px)** radius.
- **Dashboard Cards:** Use a **rounded-xl (1.5rem/24px)** radius to create large, distinct content containers.
- **Status Badges & Chips:** Use a **Pill-shaped** radius (9999px) to contrast against the structured rectangular grid of the dashboard.
- **Avatars:** Large profile selection cards use a slightly softer **1rem (16px)** radius to mimic a "modern streaming" profile selector.

## Components

### Buttons & Interaction
- **Primary:** Solid Indigo fill, white text, 8px radius. High emphasis.
- **Secondary:** Ghost style with Indigo border and text. Low emphasis.
- **Tables:** Use a subtle background fill change (`#F1F5F9`) on row hover to assist with horizontal tracking across data points.

### Cards & AI Elements
- **Main Cards:** White background, 24px radius, soft ambient shadow.
- **AI Specific Cards:** Include a "sparkle" or "magic" icon in the top right. Apply a 2px left-border accent using the Primary Indigo color to distinguish AI-generated insights from human data.
- **Profile Cards:** Large square avatars (min 120px) with the name centered below in `title-lg`.

### Navigation & Feedback
- **Sidebar:** Icons should be stroke-based (2px width) for a clean, modern look. The active state uses a subtle Indigo background wash (10% opacity) and a vertical 4px bar on the left edge.
- **Progress Bars:** Extremely thin (4px height) with a grounded Slate background and a vibrant Sky Blue or Emerald fill for the progress indicator.
- **File Upload:** Dashed border using Gray (#64748B) with a 2px stroke and 8px dash-gap. Background shifts to a faint Indigo on drag-over.

### Badges
- **Status Pills:** Small text size (`label-md`), high-contrast text on a 10% opacity background of the respective semantic color (e.g., Emerald text on light Emerald background).