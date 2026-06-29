import { type HTMLAttributes, type ReactNode } from "react";

import { cn } from "./cn";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Shadow depth. Default "flat" (border-only). */
  elevation?: "flat" | "sm" | "md";
  /** Apply default body padding. Default true. */
  padded?: boolean;
  /** Optional header node (rendered with bottom divider). */
  header?: ReactNode;
  /** Optional footer node (rendered with top divider, raised bg). */
  footer?: ReactNode;
  children?: ReactNode;
}

const SHADOWS: Record<NonNullable<CardProps["elevation"]>, string> = {
  flat: "shadow-none",
  sm: "shadow-sm",
  md: "shadow-md",
};

/**
 * Ramp Card — squared surface, hairline border, optional soft shadow.
 * Ramp leans on borders over shadow; default is border-only.
 */
export function Card({
  elevation = "flat",
  padded = true,
  header = null,
  footer = null,
  children,
  className,
  ...rest
}: CardProps) {
  return (
    <div
      className={cn(
        "flex flex-col bg-surface-card border border-gray-200 rounded-none",
        SHADOWS[elevation],
        className,
      )}
      {...rest}
    >
      {header && (
        <div className="px-5 py-4 border-b border-gray-200 font-sans text-md font-semibold leading-snug text-ink-900">
          {header}
        </div>
      )}
      <div className={cn("flex-1", padded ? "p-5" : "p-0")}>{children}</div>
      {footer && (
        <div className="px-5 py-4 border-t border-gray-200 bg-surface-page">{footer}</div>
      )}
    </div>
  );
}
