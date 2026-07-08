---
name: classnames
description: How to compose css and tailwind class names use cn() for conditional/additive classes and cva() for multi-variant component styling. Load when writing or reviewing any JSX/HTML className that isn't a single static string literal.
---

# Class name composition

Two helpers, both exported from `@stubramp/ui`:
One Type to enhance components also exported from the package .

```ts
import { cn, cva, type VariantProps, type PropsWithClass } from "@stubramp/ui";
```

- `cn(...inputs)` — `twMerge(clsx(inputs))`. Resolves conditionals and **de-duplicates
  conflicting Tailwind utilities so the last one wins**. Use for **conditionals and additions**.
- `cva(base, { variants })` — builds a variant→classes function. Use for **complex/multi-variant styling**.
- PropsWithClass — a type that adds an optional `className` prop to a component's props. Use for components that accept a `className` prop.

Because `cn` runs through `tailwind-merge`, a `className` prop passed last can override a base
utility (`cn('p-5', 'p-0')` → `p-0`). It accepts the full clsx `ClassValue` API — strings,
`false`/`null`, arrays, and object maps (`{ 'font-bold': isActive }`).

## Rules

1. **Never** build a `className` with a template literal or `+` concatenation.
   Interpolating (`` `${GRID} px-4 ${x ? 'a' : 'b'}` ``) is the mistake this skill exists to prevent.
2. Combining a base with anything conditional or a shared constant → `cn()`.
3. A component whose look is driven by props/state with 2+ dimensions (variant × size, or a
   state enum that maps to several classes) → `cva()`.
4. A lone either/or ternary that picks between two complete class strings and nothing else
   (`className={isActive ? 'text-ink-900' : 'text-gray-500'}`) needs no helper — leave it.

## cn() — conditionals & additions

```tsx
// base constant + static extras + a conditional
<div className={cn(GRID, 'border-b px-4 py-3', overdue ? 'text-status-negative' : 'text-gray-600')} />

// falsy values drop out — good for optional/toggle classes
<div className={cn('rounded-sm px-2', isActive && 'bg-surface-card font-semibold')} />
```

Pass each logical piece as its own argument (base string, then extras, then conditionals) rather
than pre-concatenating.

## cva() — complex / multi-variant styling

Reach for `cva` when the same element's classes fan out across a variant or a derived state enum.
Model the state as a variant so the branch logic lives in one table, not inline ternaries:

```tsx
type StepState = 'failed' | 'current' | 'done' | 'upcoming'

const stepDot = cva('shrink-0 rounded-full', {
  variants: {
    state: {
      failed: 'size-3.5 bg-status-negative',
      current: 'size-3.5 bg-accent-500',
      done: 'size-2.5 bg-ink-900',
      upcoming: 'size-2.5 bg-gray-300',
    } satisfies Record<StepState, string>,
  },
})

// usage
<span className={stepDot({ state })} />
```

When two axes interact (each combination needs its own classes, e.g. Badge's `tone` × `variant`),
declare both axes as variants and pair them in `compoundVariants` rather than nesting records:

```tsx
const badge = cva("inline-flex …", {
  variants: {
    tone: { neutral: "", positive: "" }, // empty — the axes only type the matrix
    variant: { soft: "", solid: "" },
  },
  compoundVariants: [
    { tone: "neutral", variant: "soft", class: "bg-sand-100 text-gray-700" },
    { tone: "positive", variant: "solid", class: "bg-green-600 text-paper-0" },
    // …one row per real combination
  ],
  defaultVariants: { tone: "neutral", variant: "soft" },
});
```

For components with a public variant API, derive the prop types from the cva config:

```tsx
const button = cva("inline-flex items-center", {
  variants: {
    variant: { primary: "…", ghost: "…" },
    size: { sm: "…", md: "…" },
  },
  defaultVariants: { variant: "primary", size: "md" },
});
type ButtonProps = VariantProps<typeof button>;
// merge extra classes from a `className` prop with cn:
<button className={cn(button({ variant, size }), className)} />;
```

## PropsWithClass — optional className prop

### Definition

```ts
type PropsWithClass = {
  className?: string;
};
```

### Usage

```TS
import type { PropsWithClass } from "@stubramp/ui" // Or relative path if not in a package;
export const SomeComponent  = ({
  className,
  PropsWithChildren,
  ...rest
}: SomeComponentProps & PropsWithChildren & PropsWithClass) =>(
  <div
className={cn(className, "flex flex-col gap-2")}>{children}</div>
)
```

## Quick decision

| Situation                                                      | Use                            |
| -------------------------------------------------------------- | ------------------------------ |
| Base + one or more conditionals / a shared constant            | `cn()`                         |
| Optional class toggled by a boolean                            | `cn('base', flag && 'extra')`  |
| Two complete strings, nothing else                             | plain ternary (no helper)      |
| Prop/state maps to several classes across 1+ dimensions        | `cva()`                        |
| A cva component that also accepts a `className` prop           | `cn(variants({…}), className)` |
| A component that should accept a `className` prop for external | `PropsWithClass` type          |
| styling (all in UI + re-usables in projects)                   |                                |
