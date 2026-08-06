---
name: LearnHub AI
colors:
  surface: '#fff8f0'
  surface-dim: '#e2d9c9'
  surface-bright: '#fff8f0'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fcf3e1'
  surface-container: '#f6eddc'
  surface-container-high: '#f0e7d6'
  surface-container-highest: '#eae2d1'
  on-surface: '#1f1b11'
  on-surface-variant: '#44474c'
  inverse-surface: '#343025'
  inverse-on-surface: '#f9f0df'
  outline: '#74777d'
  outline-variant: '#c4c6cd'
  surface-tint: '#506073'
  primary: '#162536'
  on-primary: '#ffffff'
  primary-container: '#2c3b4d'
  on-primary-container: '#95a5bb'
  inverse-primary: '#b8c8de'
  secondary: '#8b5003'
  on-secondary: '#ffffff'
  secondary-container: '#feb061'
  on-secondary-container: '#754200'
  tertiary: '#4a0f00'
  on-tertiary: '#ffffff'
  tertiary-container: '#672410'
  on-tertiary-container: '#eb8a6e'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d4e4fb'
  primary-fixed-dim: '#b8c8de'
  on-primary-fixed: '#0d1d2d'
  on-primary-fixed-variant: '#39485a'
  secondary-fixed: '#ffdcbf'
  secondary-fixed-dim: '#ffb872'
  on-secondary-fixed: '#2d1600'
  on-secondary-fixed-variant: '#6a3b00'
  tertiary-fixed: '#ffdbd1'
  tertiary-fixed-dim: '#ffb5a0'
  on-tertiary-fixed: '#3b0900'
  on-tertiary-fixed-variant: '#78311b'
  background: '#fff8f0'
  on-background: '#1f1b11'
  surface-variant: '#eae2d1'
typography:
  display-lg:
    fontFamily: literata
    fontSize: 48px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: literata
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.3'
  headline-lg-mobile:
    fontFamily: literata
    fontSize: 28px
    fontWeight: '600'
    lineHeight: '1.3'
  headline-md:
    fontFamily: literata
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.4'
  body-lg:
    fontFamily: inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: 0.01em
  label-sm:
    fontFamily: inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.03em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  container-max: 1200px
  gutter: 24px
---

## Brand & Style

The design system focuses on cognitive clarity and intentionality. It targets lifelong learners and professionals who require a high-focus environment for synthesizing information. 

The design style is **Minimalist-Professional**. It borrows the systematic rigor of developer tools like Linear while maintaining the warmth and editorial character of modern knowledge-management platforms like Notion. The aesthetic prioritizes generous whitespace to reduce visual noise, allowing the AI-generated content to remain the primary focus. High-quality typography and a sophisticated, muted base palette create a "digital sanctuary" for deep work.

## Colors

The palette is grounded in earthy, sophisticated tones that diverge from traditional high-vibrancy tech colors to prevent eye strain during long study sessions.

- **Backgrounds:** The primary workspace uses "Palladian" in light mode for a paper-like feel, and "Abyssal Anchorfish Blue" in dark mode for deep, low-contrast focus.
- **Primary / Action:** "Blue Fantastic" serves as the foundational color for text and primary interactive states in light mode.
- **Accent / Momentum:** "Burning Flame" is reserved for high-value signals: progress bars, daily streaks, and primary CTAs. It represents "the spark of insight."
- **Secondary Accent:** "Truffle Trouble" is used sparingly for destructive actions, cautions, or differentiating specific categories of knowledge.
- **System:** "Oatmeal" acts as the structural glue, used exclusively for thin borders, subtle dividers, and secondary UI elements.

## Typography

This design system employs a "Serif-for-Structure" strategy. By using a warm serif (**Literata**) for headings, the platform evokes the authority of a textbook or a literary journal. The UI and body text rely on **Inter** for its neutral, highly legible characteristics at small sizes.

- **Hierarchical Contrast:** Large serif headings should always be paired with ample top-margin to signify the start of a new concept.
- **Line Height:** Body text uses a generous 1.6x line height to maximize readability for long-form AI explanations.
- **Labels:** Small labels and metadata should use Inter with increased letter-spacing and medium weights to ensure clarity against the textured background.

## Layout & Spacing

The layout is built on an **8px soft grid** with a focus on centered, single-column reading experiences for learning modules and a flexible 12-column grid for dashboards.

- **Desktop:** Use a fixed-width container (1200px) for general browsing, but narrow it to 720px for "Focus Mode" reading.
- **Margins:** Minimum page margins are 24px on mobile and 40px+ on desktop to emphasize the minimalist aesthetic.
- **Spacing Philosophy:** When in doubt, increase the spacing. Elements should feel like they have "room to breathe," reflecting a calm, unhurried learning environment.

## Elevation & Depth

To maintain a clean, flat aesthetic, this design system avoids heavy drop shadows. Depth is communicated through **Tonal Layering** and **Low-Contrast Outlines**.

- **Surfaces:** In light mode, use a slightly lighter tint of the background or white for cards. In dark mode, use a subtle shift in the blue hex to signify elevation.
- **Outlines:** Most containers (cards, inputs, dropdowns) use a 1px "Oatmeal" border.
- **Interactions:** On hover, instead of a shadow, elements should utilize a subtle background color shift (e.g., 5% darker/lighter) or a border-color change to the Primary Blue.
- **Modals:** Use a high-blur (20px) backdrop filter rather than a heavy black overlay to maintain the "Glassmorphism" feel while staying grounded.

## Shapes

The shape language is **Soft** but disciplined. 

- **Standard Radius:** 4px (0.25rem) for inputs and small buttons to maintain a precise, professional look.
- **Large Radius:** 8px (0.5rem) for cards and modals to provide a welcoming, modern feel.
- **Pill Shapes:** Used exclusively for "Badges" and "Progress Tracks" to distinguish them from interactive buttons.
- **Consistency:** Avoid fully circular buttons (except for floating action buttons) to maintain the "Linear-style" structural integrity.

## Components

### Buttons
- **Primary:** "Blue Fantastic" background, white text. No shadow. 4px radius.
- **Secondary:** Transparent background, 1px "Oatmeal" border, "Blue Fantastic" text.
- **Ghost:** No border/background. Text-only until hover (light "Oatmeal" fill on hover).
- **Destructive:** "Truffle Trouble" text or background depending on emphasis.

### Input & Textarea
- 1px "Oatmeal" border. Background is 2% darker than the page background. 
- Focus state: Border changes to "Blue Fantastic" with a 2px outer glow of the same color at 10% opacity.

### Cards
- Background: White (Light Mode) or +2% lighter than Abyssal (Dark Mode).
- 1px "Oatmeal" border. No shadow.

### Badges (Status)
- **AI-generated:** "Burning Flame" text, light orange tint background, pill-shaped.
- **Manual:** "Blue Fantastic" text, light blue tint background, pill-shaped.
- **Completed:** "Oatmeal" background, white text.

### Progress Bar/Ring
- Track: "Oatmeal" (20% opacity).
- Indicator: "Burning Flame". For rings, use a stroke width of 4px for a delicate look.

### Animations
- Use `cubic-bezier(0.4, 0, 0.2, 1)` for all transitions.
- Fades for modals: 250ms.
- Hover states: 150ms.
- Skeleton loaders: Subtle pulse between Background and Oatmeal.