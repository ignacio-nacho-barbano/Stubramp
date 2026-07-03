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

**2. Import components** from the single `@stubramp/ui` entrypoint:

```tsx
import { Button, StatTile, Badge } from "@stubramp/ui";

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

## Package structure

Components live under `src/components/`, grouped by category, one folder per
component co-locating its implementation, its story, and an `index.ts` barrel.
The root `src/index.ts` re-exports everything as the single public entrypoint,
so consumers never import by path — just `import { X } from "@stubramp/ui"`.

```
src/
  index.ts                     # single public barrel
  lib/cn.ts                    # internal class-name helper
  components/
    forms/          button, input, select, checkbox, switch
    data-display/   card, stat-tile, avatar, badge
    feedback/       modal, toast
    navigation/     tabs, menu
    brand/          logo
    business/       money, vendor-avatar, status-badge,
                    segmented-toggle, allocation-bar
  styles/                      # tokens + theme.css (shipped separately)
```

The `business/` category holds domain-aware components shared across apps (Bill
Pay and beyond). They build on the primitives above plus the pure helpers in
`lib/` (`money`, `format`, `bill-status`), all re-exported from the barrel — so
apps can also import the helpers directly: `import { formatCents, avatarColor }
from "@stubramp/ui"`.

To add a component: create `components/<category>/<name>/{<name>.tsx,
<name>.stories.tsx, index.ts}` and add one `export *` line to `src/index.ts`.

## Components

All exports come from the `@stubramp/ui` barrel.

| Category       | Export        | Notes                                                       |
| -------------- | ------------- | ----------------------------------------------------------- |
| forms          | `Button`      | `primary` / `secondary` / `ghost` / `accent` / `danger`, 3 sizes |
| forms          | `Input`       | Label, hint, error, prefix/suffix slots                     |
| forms          | `Select`      | Native select styled to match `Input`                       |
| forms          | `Checkbox`    | Squared, ink fill — controlled or uncontrolled              |
| forms          | `Switch`      | Pill toggle — `onChange(next: boolean)`                     |
| data-display   | `Card`        | Squared surface, hairline border, optional header/footer/shadow |
| data-display   | `StatTile`    | KPI block — big tabular numeral, label, directional delta   |
| data-display   | `Avatar`      | Circular, initials fallback                                 |
| data-display   | `Badge`       | Status pill — 6 tones, `soft`/`solid`, optional dot         |
| feedback       | `Modal`       | Squared dialog — hairline border, pop shadow                |
| feedback       | `ToastProvider`, `useToast` | Toast context + hook — `toast({ message, tone })` |
| navigation     | `Tabs`        | Underline tab bar — controlled or uncontrolled              |
| navigation     | `Menu`        | Dropdown/popover — item list or arbitrary panel content     |
| brand          | `Logo`        | Wordmark / icon lockup                                       |
| business       | `Money`       | Currency-formatted cents with tabular figures               |
| business       | `VendorAvatar`| Avatar with deterministic name→color background             |
| business       | `StatusBadge` | Bill lifecycle status → tone-mapped `Badge`                 |
| business       | `SegmentedToggle` | Compact segmented control (generic over option value)   |
| business       | `AllocationBar`   | Proportional split bar + legend                         |

Stateful and portal components (`Checkbox`, `Switch`, `Tabs`, `Modal`, `Menu`,
`Toast`) carry the `"use client"` directive for React Server Component
compatibility; re-exporting them through the barrel preserves that boundary.
`Button`, `Input`, and the rest are server-safe — `Input`'s focus ring uses the
`focus-within:` variant rather than React state.
