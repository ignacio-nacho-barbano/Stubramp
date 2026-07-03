"use client";

import { type HTMLAttributes, type ReactNode, useState } from "react";

import { cn } from "../../../lib/cn";

export interface TabItem {
  id: string;
  label: ReactNode;
  /** Optional count chip. */
  count?: number;
}

export interface TabsProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  tabs: TabItem[];
  value?: string;
  defaultValue?: string;
  onChange?: (id: string) => void;
}

/** Ramp Tabs — underline indicator, ink active, muted rest. */
export function Tabs({ tabs = [], value, defaultValue, onChange, className, ...rest }: TabsProps) {
  const [internal, setInternal] = useState(defaultValue ?? tabs[0]?.id);
  const active = value !== undefined ? value : internal;

  const select = (id: string) => {
    if (value === undefined) setInternal(id);
    onChange?.(id);
  };

  return (
    <div role="tablist" className={cn("flex gap-6 border-b border-gray-200", className)} {...rest}>
      {tabs.map((t) => {
        const on = t.id === active;
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={on}
            onClick={() => select(t.id)}
            className={cn(
              "inline-flex items-center gap-2 pb-3 -mb-px appearance-none bg-none border-none border-b-2 cursor-pointer font-sans text-sm transition-[color] duration-[120ms]",
              on
                ? "border-black font-semibold text-ink-900"
                : "border-transparent font-medium text-gray-500",
            )}
          >
            {t.label}
            {t.count != null && (
              <span className="font-sans text-xs leading-normal font-medium bg-sand-100 text-gray-600 px-1.5 py-px rounded-sm">
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
