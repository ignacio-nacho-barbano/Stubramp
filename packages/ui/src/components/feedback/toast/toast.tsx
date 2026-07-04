"use client";

import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

import { cn } from "../../../lib/cn";

export type ToastTone = "neutral" | "positive" | "negative";

export interface Toast {
  id: string;
  message: ReactNode;
  tone?: ToastTone;
  /** Auto-dismiss delay in ms. Default 4000. */
  duration?: number;
}

interface ToastContextValue {
  toast: (t: Omit<Toast, "id">) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/** Access the toast API. Must be used under a `ToastProvider`. */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}

const TONE_STYLES: Record<ToastTone, string> = {
  neutral: "bg-ink-900 text-paper-0",
  positive: "bg-green-600 text-paper-0",
  negative: "bg-red-600 text-paper-0",
};

/**
 * Ramp toast provider — a bottom-center stack of dark, auto-dismissing pills.
 * Wrap the app (or a section) and call `useToast().toast(...)` from anywhere.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seq = useRef(0);

  const dismiss = useCallback((id: string) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((t: Omit<Toast, "id">) => {
    const id = `t${++seq.current}`;
    setToasts((list) => [...list, { ...t, id }]);
  }, []);

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {typeof document !== "undefined" &&
        createPortal(
          <div className="fixed bottom-6 left-1/2 z-[60] flex -translate-x-1/2 flex-col items-center gap-2">
            {toasts.map((t) => (
              <ToastPill key={t.id} toast={t} onDismiss={dismiss} />
            ))}
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  );
}

function ToastPill({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    const ms = toast.duration ?? 4000;
    const timer = setTimeout(() => onDismiss(toast.id), ms);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  return (
    <div
      role="status"
      onClick={() => onDismiss(toast.id)}
      className={cn(
        "cursor-pointer rounded-none px-5 py-2.5 font-sans text-sm font-medium shadow-pop",
        TONE_STYLES[toast.tone ?? "neutral"],
      )}
    >
      {toast.message}
    </div>
  );
}
