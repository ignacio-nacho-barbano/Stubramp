# @stubramp/ui — Ramp Design System

The shared React component library for the monorepo, implementing the **Ramp**
design language: monochrome warm-neutrals, sharp 0-radius corners, weight-500
labels, hairline borders over shadow, a single electric-chartreuse (`#E4F222`)
accent used sparingly with dark ink text on top, sentence case, and tabular
numerals for money.

> Imported from the `Ramp Design System` Claude Design project. This is a
> **reference recreation** for prototyping — replace the substituted webfont
> (Hanken Grotesk → licensed Lausanne) and placeholder wordmark/icons before
> any production or external use.

## Usage

This is a *Just-in-Time* package: it ships TypeScript source directly (no build
step) via the `exports` map, and the consuming app transpiles it. That keeps it
zero-config inside Turborepo — `turbo run check-types lint` type-checks and
lints it in place.

The components are styled with **Tailwind CSS v4** utility classes. The Ramp
design tokens are mapped into Tailwind's `@theme` (via `@theme inline`, so
utilities reference the live token variables — the `tokens/*.css` files remain
the single source of truth, with no value duplication).

**1. Import the Tailwind theme once** at your app's CSS entry. This pulls in
Tailwind, the Ramp tokens + webfont, and registers this package as a content
source so the utility classes its components use are generated:

```css
/* app/globals.css */
@import "@stubramp/ui/theme.css";
```

Your app needs Tailwind v4 wired into its build (`@tailwindcss/postcss`,
`@tailwindcss/vite`, or the Next.js plugin). Because `theme.css` carries an
`@source "../**/*.tsx"` pointing at this package's components, no extra content
globs are needed for `@stubramp/ui` — but add `@source` lines for your own app
files as usual.

**2. Import components** (one module per component, kebab-case file names):

```tsx
import { Button } from "@stubramp/ui/button";
import { StatTile } from "@stubramp/ui/stat-tile";
import { Badge } from "@stubramp/ui/badge";

export function Example() {
  return (
    <div>
      <StatTile label="Total spend" prefix="$" value="48,250.00" delta="12.4%" deltaDir="up" />
      <Badge tone="positive" dot>Cleared</Badge>
      <Button variant="accent">Issue card</Button>
    </div>
  );
}
```

Components carry the Tailwind classes inline, so they render correctly as long
as the app's Tailwind build includes `theme.css`. Genuinely dynamic values that
can't be static utilities (e.g. `Avatar`'s pixel `size`) stay as inline styles.

> **Not using Tailwind?** `@stubramp/ui/styles.css` still ships the raw design
> tokens (CSS custom properties + webfont) for token-only consumers, but the
> components themselves require the Tailwind utilities from `theme.css`.

## Tokens

Linking `@stubramp/ui/styles.css` pulls in all token layers (also importable
individually via `@stubramp/ui/styles/tokens/<name>.css`):

| File              | Provides                                                        |
| ----------------- | --------------------------------------------------------------- |
| `tokens/fonts.css`      | Hanken Grotesk + Spline Sans Mono webfonts (Google Fonts) |
| `tokens/colors.css`     | Warm neutral scale, chartreuse accent, financial semantics + semantic aliases (`--text-primary`, `--surface-card`, `--status-positive`, …) |
| `tokens/typography.css` | Families, weights, type scale, semantic roles (`--heading-md`, `--body`, `--eyebrow`, …) |
| `tokens/spacing.css`    | 4px-grid spacing scale, containers, gutters               |
| `tokens/effects.css`    | Radii (sharp by default), borders, soft shadows, focus ring, motion |

Prefer the **semantic aliases** over raw scale values when composing new UI.

## Components

| Module        | Export      | Notes                                                       |
| ------------- | ----------- | ----------------------------------------------------------- |
| `button`      | `Button`    | `primary` / `secondary` / `ghost` / `accent` / `danger`, 3 sizes |
| `badge`       | `Badge`     | Status pill — 6 tones, `soft`/`solid`, optional dot         |
| `card`        | `Card`      | Squared surface, hairline border, optional header/footer/shadow |
| `input`       | `Input`     | Label, hint, error, prefix/suffix slots                     |
| `select`      | `Select`    | Native select styled to match `Input`                       |
| `checkbox`    | `Checkbox`  | Squared, ink fill — controlled or uncontrolled              |
| `switch`      | `Switch`    | Pill toggle — `onChange(next: boolean)`                     |
| `avatar`      | `Avatar`    | Circular, initials fallback                                 |
| `stat-tile`   | `StatTile`  | KPI block — big tabular numeral, label, directional delta   |
| `tabs`        | `Tabs`      | Underline tab bar — controlled or uncontrolled              |

Stateful components (`Checkbox`, `Switch`, `Tabs`) carry the `"use client"`
directive for React Server Component compatibility. `Button`, `Input`, and the
rest are server-safe — `Input`'s focus ring uses the `focus-within:` variant
rather than React state.
