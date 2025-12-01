# Theme & Widget Configuration Guide

This document explains how the assistant-chat frontend and widget pull their configuration values, what each field controls, and how color changes propagate through the system.

---

## Tailwind Color Reference

When you change `THEME.primary.hex`, update `THEME.primary.tailwind` to match the Tailwind palette you want (e.g. `blue`, `violet`, `cyan`). The palettes and shade values are listed here:

- Tailwind default palette: <https://tailwindcss.com/docs/customizing-colors#default-color-palette>

Pick the palette whose `500/600` shades are closest to your desired hex value. That ensures generated class names such as `bg-{tailwind}-600` map to the correct colors.

---

## `src/config/theme.ts` Matrix

| Field / Helper                       | Description & Impact                                                                                          |
|-------------------------------------|----------------------------------------------------------------------------------------------------------------|
| `primary.hex`                       | Master brand hex used for gradients, inline styles, default widget header/button colors.                       |
| `primary.tailwind`                  | Tailwind palette name (`emerald`, `blue`, etc.) used to construct utility classes (e.g. `bg-emerald-600`).      |
| `primary.darker`                    | Darker shade for hover states and drop-shadows.                                                                |
| `primary.lighter`                   | Lighter accent shade (badges, highlights).                                                                     |
| `primary.lightest`                  | Very light background fills (cards, assistant avatar background, etc.).                                        |
| `colors.bg`, `bgHover`, …           | Ready-to-use Tailwind classes derived from `primary.tailwind`; update automatically when the palette name changes. |
| `typography.fontFamily`             | Global sans stack applied wherever components reference `THEME.typography`.                                    |
| `typography.heading.size/weight`    | Standard heading sizes/weights for consistent typography.                                                      |
| `typography.body.size/weight`       | Body copy sizing.                                                                                              |
| `spacing.xs … spacing.xl`           | Shared spacing scale for components.                                                                           |
| `getButtonGradient(color?)`         | Produces `linear-gradient` strings from the provided color (defaults to `primary.hex`).                        |
| `getHeaderGradient(color?)`         | Gradient helper for widget headers and hero banners.                                                           |
| `getHoverColor()`                   | Returns `primary.darker` for easy hover styling.                                                               |

### How to Change the Primary Color

1. Update `primary.hex` and `primary.tailwind` inside `src/config/theme.ts`.
   ```ts
   export const THEME = {
     primary: {
       hex: '#059669',     // 👈 replace with your color
       tailwind: 'emerald' // 👈 replace with matching Tailwind palette name
     },
     // ...
   }
   ```
2. Optionally adjust `primary.darker/lighter/lightest` if you need custom shades; otherwise the defaults stay compatible.
3. Rebuild or restart the widget preview—the entire site and embedded widget will adopt the new palette automatically.

**Example palette mappings**

| Hex        | Tailwind palette |
|------------|------------------|
| `#7c3aed`  | `violet`         |
| `#2563eb`  | `blue`           |
| `#ea580c`  | `orange`         |
| `#4f46e5`  | `indigo`         |
| `#0891b2`  | `cyan`           |

**What updates automatically**
- Buttons & CTAs
- Navigation links and hover states
- Tab indicators and focus rings
- Icons/accent badges
- Widget header, user bubbles, loaders
- Logo/footer highlights driven by the theme
- All derived light/hover variants from `THEME.colors`

**Impact of changing `primary.hex`:**
- Navigation accents, CTA buttons, gradients, card highlights, footer badges, and the default widget color all shift immediately.

**Impact of changing `primary.tailwind`:**
- All Tailwind utility classes built from `THEME.colors` (e.g. `bg-emerald-600`, `text-emerald-600`) will point to the new palette. Make sure it matches a palette from the Tailwind docs above.

---

## `WidgetConfig` Matrix

The widget reads its configuration from `WidgetConfig` (used both inside the site and when embedded/NPM-installed). Each field affects the following:

| Field            | Affects                                                                                         |
|------------------|--------------------------------------------------------------------------------------------------|
| `uuid`           | Unique identifier for conversations/API calls; also used by the embed script helper.            |
| `theme`          | Reserved for light/dark theming (currently light); wiring is ready for future dark mode.        |
| `position`       | Corner placement of the floating launcher (`bottom-right`, `top-left`, etc.).                   |
| `size.width/height` | Dimensions of the open chat window.                                                         |
| `title`          | Header title text.                                                                              |
| `subtitle`       | Header subtitle shown next to the “Online” indicator.                                           |
| `placeholder`    | Input placeholder string.                                                                       |
| `welcomeMessage` | First assistant message injected when a conversation starts.                                    |
| `apiUrl`         | Assistant server base URL used for conversations and messages.                                  |
| `apiKey`         | API key or token passed to the assistant server (if required).                                  |
| `themeColor`     | Overrides the site-wide `THEME.primary.hex` for this widget instance (header, buttons, bubbles).|
| `defaultOpen`    | Whether the widget opens automatically on load (handy for playground demos/testing).            |
| `supabaseUrl`    | Supabase project URL (optional, required for realtime agent handoff + live message sync).        |
| `supabaseAnonKey`| Supabase anon key (optional, required for realtime updates).                                     |

Any embed or npm consumer can pass these properties to customize the widget without touching the site’s global theme.

---

### Quick Reference

- Global site colors/typography/spacing: edit `src/config/theme.ts`.
- Widget runtime color override: set `themeColor` in `WidgetConfig`.
- Tailwind palette mapping: <https://tailwindcss.com/docs/customizing-colors#default-color-palette>
- `theme.ts` is the single source—widgets inherit these colors unless a specific `themeColor` override is provided.

Keep this doc up to date when adding new theme fields or widget config options.

