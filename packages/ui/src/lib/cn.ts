import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Join class names, resolving conditionals (clsx) and de-duplicating
 * conflicting Tailwind utilities (tailwind-merge) so the last class wins.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Re-export cva so the whole monorepo has a single class-name toolkit:
//   cn()  — conditional / additive class strings
//   cva() — multi-variant component styling
export { cva, type VariantProps } from "class-variance-authority";
