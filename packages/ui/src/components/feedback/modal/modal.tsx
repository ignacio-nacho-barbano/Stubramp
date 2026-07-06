"use client";

import { type ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";

import { cn, cva } from "../../../lib/cn";
import type { PropsWithClass } from "../../../types/props";

export interface ModalProps {
  /** Whether the dialog is shown. */
  open: boolean;
  /** Called on scrim click (when enabled) or Escape. */
  onClose: () => void;
  /** Optional header content (rendered with a bottom divider). */
  title?: ReactNode;
  /** Optional sticky footer content (rendered with a top divider). */
  footer?: ReactNode;
  /** Max-width preset. Default "md". */
  size?: "sm" | "md" | "lg";
  /** Close when the backdrop is clicked. Default true. */
  closeOnScrim?: boolean;
  children?: ReactNode;
}

const dialog = cva(
  "flex max-h-[90vh] w-full flex-col overflow-hidden bg-surface-card border border-gray-300 rounded-none shadow-pop",
  {
    variants: {
      size: {
        sm: "max-w-[420px]",
        md: "max-w-[600px]",
        lg: "max-w-[820px]",
      },
    },
    defaultVariants: { size: "md" },
  },
);

/**
 * Ramp Modal — a centered dialog over a dim scrim. Sharp corners, hairline
 * border, and the `--shadow-pop` elevation reserved for popovers/dialogs.
 * Escape and (optionally) scrim clicks close it. Rendered through a portal.
 */
export function Modal({
  open,
  onClose,
  title,
  footer,
  size,
  closeOnScrim = true,
  children,
  className,
}: ModalProps & PropsWithClass) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    // Lock body scroll while the dialog is open.
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-ink-900/40"
      onClick={closeOnScrim ? onClose : undefined}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className={cn(dialog({ size }), className)}
      >
        {title && (
          <div className="shrink-0 px-5.5 py-4.5 border-b border-gray-200">
            {title}
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto px-5.5 py-5">
          {children}
        </div>
        {footer && (
          <div className="shrink-0 px-[22px] py-4 border-t border-gray-200 flex items-center gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
