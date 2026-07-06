import { useMemo, type ReactNode } from "react";
import { ArcElement, Chart as ChartJS, Tooltip } from "chart.js";
import { Doughnut } from "react-chartjs-2";

import { cn } from "../../../lib/cn";
import type { PropsWithClass } from "../../../types/props";

// Register only the pieces a doughnut needs (tree-shakeable). The built-in
// legend is intentionally left unregistered — we render our own DS legend.
ChartJS.register(ArcElement, Tooltip);

export interface DonutSegment {
  label: string;
  /** Raw magnitude of the slice (any unit; formatted via `formatValue`). */
  value: number;
  /** CSS color — a `var(--token)` from the DS palette or any valid color. */
  color: string;
}

export interface DonutProps {
  segments: DonutSegment[];
  /** Diameter of the ring in px. Default 168. */
  size?: number;
  /** Small eyebrow text above the center figure. */
  centerLabel?: ReactNode;
  /** Large figure shown in the ring's hole. */
  centerValue?: ReactNode;
  /** Small caption below the center figure. */
  centerCaption?: ReactNode;
  /** Formats slice values for the tooltip + legend. Default `String`. */
  formatValue?: (value: number) => string;
  /** Rendered (centered) when there are no non-zero segments. */
  emptyMessage?: string;
}

const VAR_RE = /^var\((--[\w-]+)\)$/;
const FALLBACK = "#8C887E"; // --gray-500

/**
 * Resolve a `var(--token)` color to its computed value so it paints on a
 * <canvas> (which cannot resolve CSS custom properties). Non-var colors pass
 * through unchanged; guarded for non-DOM (SSR) environments.
 */
function resolveColor(color: string): string {
  const match = VAR_RE.exec(color.trim());
  if (!match) return color;
  if (typeof document === "undefined") return FALLBACK;
  const resolved = getComputedStyle(document.documentElement)
    .getPropertyValue(match[1]!)
    .trim();
  return resolved || FALLBACK;
}

/**
 * Ramp Donut — a hollow ring chart (chart.js) with an optional center figure
 * and a DS-styled legend of swatch · label · value rows. Slice colors accept
 * design-system `var(--token)` strings and are resolved for the canvas.
 */
export function Donut({
  segments,
  size = 168,
  centerLabel,
  centerValue,
  centerCaption,
  formatValue = String,
  emptyMessage = "No data.",
  className,
}: DonutProps & PropsWithClass) {
  const resolved = useMemo(
    () => segments.map((s) => ({ ...s, hex: resolveColor(s.color) })),
    [segments],
  );

  const hasData = resolved.some((s) => s.value > 0);

  const data = useMemo(
    () => ({
      labels: resolved.map((s) => s.label),
      datasets: [
        {
          data: resolved.map((s) => s.value),
          backgroundColor: resolved.map((s) => s.hex),
          borderWidth: 0,
        },
      ],
    }),
    [resolved],
  );

  const options = useMemo(
    () => ({
      cutout: "68%",
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx: { label?: string; parsed: number }) =>
              `${ctx.label}: ${formatValue(ctx.parsed)}`,
          },
        },
      },
    }),
    [formatValue],
  );

  if (!hasData) {
    return (
      <div
        className={cn(
          "px-6 py-6 text-center text-[13px] text-gray-500",
          className,
        )}
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <Doughnut data={data} options={options} />
        {(centerLabel != null ||
          centerValue != null ||
          centerCaption != null) && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            {centerLabel != null && (
              <span className="font-sans text-xs font-medium uppercase tracking-wide text-gray-500">
                {centerLabel}
              </span>
            )}
            {centerValue != null && (
              <span className="font-sans text-md font-semibold tracking-snug text-ink-900 tabular-nums">
                {centerValue}
              </span>
            )}
            {centerCaption != null && (
              <span className="font-sans text-xs text-gray-500">
                {centerCaption}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 flex w-full flex-col gap-2">
        {resolved.map((s, i) => (
          <span
            key={i}
            className="flex items-center gap-2 text-xs text-gray-600"
          >
            <span
              className="h-2.5 w-2.5 shrink-0"
              style={{ background: s.hex }}
            />
            <span className="truncate">{s.label}</span>
            <span className="ml-auto shrink-0 font-semibold tabular-nums text-ink-900">
              {formatValue(s.value)}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
