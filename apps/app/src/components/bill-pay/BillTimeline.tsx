import { cn, cva } from '@stubramp/ui'
import type { BillStatus } from '../../lib/bills'
import { billTimeline } from '../../lib/status'

type StepState = 'failed' | 'current' | 'done' | 'upcoming'

/** Dot color + size keyed off the step's lifecycle state. */
const stepDot = cva('shrink-0 rounded-full', {
  variants: {
    state: {
      failed: 'size-3.5 bg-status-negative',
      current: 'size-3.5 bg-accent-500',
      done: 'size-2.5 bg-ink-900',
      upcoming: 'size-2.5 bg-gray-300',
    } satisfies Record<StepState, string>,
  },
})

/** Label weight + color, matching the dot's emphasis per state. */
const stepLabel = cva('mt-[7px] text-[11.5px]', {
  variants: {
    state: {
      failed: 'font-semibold text-ink-900',
      current: 'font-semibold text-ink-900',
      done: 'text-gray-600',
      upcoming: 'text-gray-500',
    } satisfies Record<StepState, string>,
  },
})

/** Horizontal lifecycle timeline: dots + connectors, current step emphasized. */
export function BillTimeline({ status }: { status: BillStatus }) {
  const steps = billTimeline(status)
  const last = steps.length - 1

  return (
    <div className="flex items-start">
      {steps.map((s, i) => {
        const state: StepState = s.failed
          ? 'failed'
          : s.current
            ? 'current'
            : s.done
              ? 'done'
              : 'upcoming'
        const leftFilled = i > 0 && (s.done || s.current)
        const rightFilled = s.done
        return (
          <div
            key={s.key}
            className="relative flex flex-1 flex-col items-center"
          >
            <div className="flex w-full h-3.5 items-center">
              <span
                className={cn(
                  'h-0.5 flex-1',
                  leftFilled ? 'bg-ink-900' : 'bg-gray-300',
                )}
              />
              <span className={stepDot({ state })} />
              <span
                className={cn(
                  'h-0.5 flex-1',
                  i === last
                    ? 'bg-transparent'
                    : rightFilled
                      ? 'bg-ink-900'
                      : 'bg-gray-300',
                )}
              />
            </div>
            <span className={stepLabel({ state })}>{s.label}</span>
          </div>
        )
      })}
    </div>
  )
}
