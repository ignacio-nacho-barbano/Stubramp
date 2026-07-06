"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

import { cn } from "../../../lib/cn";
import type { PropsWithClass } from "../../../types/props";

export interface MenuItem {
  id: string;
  label: ReactNode;
  icon?: ReactNode;
  description?: ReactNode;
  onSelect?: () => void;
  disabled?: boolean;
  danger?: boolean;
}

export interface MenuProps {
  /** The element that toggles the menu (button, icon, etc.). */
  trigger: ReactNode;
  /** Simple item list. Ignored when `children` is provided. */
  items?: MenuItem[];
  /** Arbitrary panel content (e.g. a notifications feed). Overrides `items`. */
  children?: ReactNode;
  /** Horizontal alignment of the panel relative to the trigger. Default "end". */
  align?: "start" | "end";
  /** Panel width in px. Default 260. */
  width?: number;
}

/**
 * Ramp Menu — a lightweight anchored popover. Pass `items` for a standard
 * action list, or `children` for a custom panel. Closes on outside-click and
 * Escape. Sharp corners, hairline border, `--shadow-pop` elevation.
 */
export function Menu({
  trigger,
  items,
  children,
  align = "end",
  width = 260,
  className,
}: MenuProps & PropsWithClass) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className={cn("relative inline-flex", className)}>
      <span
        onClick={() => setOpen((o) => !o)}
        className="inline-flex cursor-pointer"
      >
        {trigger}
      </span>
      {open && (
        <div
          className={cn(
            "absolute top-full z-40 mt-2 rounded-none border border-gray-200 bg-surface-card shadow-pop",
            align === "end" ? "right-0" : "left-0",
          )}
          style={{ width }}
        >
          {children ? (
            children
          ) : (
            <div className="p-1.5">
              {(items ?? []).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  disabled={item.disabled}
                  onClick={() => {
                    if (item.disabled) return;
                    setOpen(false);
                    item.onSelect?.();
                  }}
                  className={cn(
                    "flex w-full items-start gap-2.75 rounded-sm px-2.75 py-2.5 text-left font-sans transition-[background-color] duration-120",
                    item.disabled
                      ? "cursor-not-allowed opacity-45"
                      : "cursor-pointer hover:bg-surface-page",
                    item.danger ? "text-status-negative" : "text-ink-900",
                  )}
                >
                  {item.icon && (
                    <span className="mt-px shrink-0">{item.icon}</span>
                  )}
                  <span className="min-w-0">
                    <span className="block text-sm font-medium leading-snug">
                      {item.label}
                    </span>
                    {item.description && (
                      <span className="block text-xs text-gray-500">
                        {item.description}
                      </span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
