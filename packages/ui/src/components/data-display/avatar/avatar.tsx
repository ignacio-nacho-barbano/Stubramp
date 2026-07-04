import { type CSSProperties, type HTMLAttributes } from "react";

import { cn } from "../../../lib/cn";

export interface AvatarProps extends HTMLAttributes<HTMLSpanElement> {
  /** Image URL; falls back to initials when absent. */
  src?: string;
  /** Full name — used for initials and alt text. */
  name?: string;
  /** Pixel diameter. Default 32. */
  size?: number;
}

/** Ramp Avatar — circular, initials fallback, warm neutral fill. */
export function Avatar({
  src,
  name = "",
  size = 32,
  className,
  style,
  ...rest
}: AvatarProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  // Size is prop-driven, so width/height/font-size stay inline.
  const sizing: CSSProperties = {
    width: size,
    height: size,
    fontSize: Math.round(size * 0.4),
  };

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center overflow-hidden shrink-0 rounded-full bg-ink-900 text-paper-0 font-sans font-medium tracking-[0.01em]",
        className,
      )}
      style={{ ...sizing, ...style }}
      {...rest}
    >
      {src ? (
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        initials
      )}
    </span>
  );
}
