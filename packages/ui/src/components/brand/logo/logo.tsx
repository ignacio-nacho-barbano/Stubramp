import { type HTMLAttributes } from "react";

import { cn } from "../../../lib/cn";

export interface LogoProps extends HTMLAttributes<HTMLSpanElement> {
  /** Tile/glyph size in px. Default 22. */
  size?: number;
  /** Render the "StubRamp" wordmark after the glyph. Default true. */
  wordmark?: boolean;
  /** Wordmark font size in px. Default 20. */
  wordmarkSize?: number;
  /** Fill of the square tile. Default ink. */
  tileColor?: string;
  /** Fill of the ramp glyph. Default accent. */
  glyphColor?: string;
}

/**
 * StubRamp wordmark — a squared tile with a "ramp" peak glyph, optionally
 * followed by the wordmark text. Colors are parameterized so it reads correctly
 * on the dark auth panel (accent tile), the light app sidebar, and marketing
 * surfaces (ink tile).
 */
export function Logo({
  size = 22,
  wordmark = true,
  wordmarkSize = 20,
  tileColor = "var(--ink-900)",
  glyphColor = "var(--accent-500)",
  className,
  ...rest
}: LogoProps) {
  return (
    <span className={cn("flex items-center gap-[9px]", className)} {...rest}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 22 22"
        className="block shrink-0"
        aria-hidden
      >
        <rect width="22" height="22" fill={tileColor} />
        <path d="M4 17 L11 5 L18 17 Z" fill={glyphColor} />
      </svg>
      {wordmark && (
        <span
          className="font-bold tracking-[-0.03em]"
          style={{ fontSize: wordmarkSize }}
        >
          StubRamp
        </span>
      )}
    </span>
  );
}
