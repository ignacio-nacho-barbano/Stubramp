import type { BillStatus } from '../../lib/bills'
import { billTimeline } from '../../lib/status'

/** Horizontal lifecycle timeline: dots + connectors, current step emphasized. */
export function BillTimeline({ status }: { status: BillStatus }) {
  const steps = billTimeline(status)
  const last = steps.length - 1

  return (
    <div className="flex items-start">
      {steps.map((s, i) => {
        const leftFilled = i > 0 && (s.done || s.current)
        const rightFilled = s.done
        const dotClass = s.failed
          ? 'bg-status-negative'
          : s.current
            ? 'bg-accent-500'
            : s.done
              ? 'bg-ink-900'
              : 'bg-gray-300'
        const dotSize = s.current || s.failed ? 'h-3.5 w-3.5' : 'h-2.5 w-2.5'
        return (
          <div
            key={s.key}
            className="relative flex flex-1 flex-col items-center"
          >
            <div className="flex w-full items-center">
              <span
                className={`h-0.5 flex-1 ${leftFilled ? 'bg-ink-900' : 'bg-gray-300'}`}
              />
              <span
                className={`shrink-0 rounded-full ${dotSize} ${dotClass}`}
              />
              <span
                className={`h-0.5 flex-1 ${
                  i === last
                    ? 'bg-transparent'
                    : rightFilled
                      ? 'bg-ink-900'
                      : 'bg-gray-300'
                }`}
              />
            </div>
            <span
              className={`mt-[7px] text-[11.5px] ${
                s.current || s.failed
                  ? 'font-semibold text-ink-900'
                  : s.done
                    ? 'text-gray-600'
                    : 'text-gray-500'
              }`}
            >
              {s.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
