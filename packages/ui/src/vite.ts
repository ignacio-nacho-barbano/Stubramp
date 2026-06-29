/**
 * Ramp design system — Vite plugin.
 *
 * Re-exports the Tailwind v4 Vite plugin so consuming apps build their CSS
 * with the exact Tailwind version owned by this package. Apps should import
 * this instead of depending on `@tailwindcss/vite` directly:
 *
 *   import tailwindcss from "@stubramp/ui/vite"
 *
 * Pairs with `@stubramp/ui/theme.css`, which carries the tokens and `@theme`
 * mappings the generated utilities resolve against.
 */
export { default } from "@tailwindcss/vite";
