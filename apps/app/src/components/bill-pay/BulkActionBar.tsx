import { Button } from '@stubramp/ui'

/** Sticky dark action bar shown when bills are selected in the list. */
export function BulkActionBar({
  count,
  canApprove,
  onApprove,
  onClear,
  busy,
}: {
  count: number
  canApprove: boolean
  onApprove: () => void
  onClear: () => void
  busy?: boolean
}) {
  return (
    <div className="sticky bottom-4 mt-4 flex items-center gap-3.5 bg-ink-900 px-[18px] py-3 text-paper-0 shadow-pop">
      <span className="text-[13px] font-medium">
        {count} {count === 1 ? 'bill' : 'bills'} selected
      </span>
      <div className="ml-auto flex items-center gap-2">
        {canApprove && (
          <Button
            variant="accent"
            size="sm"
            onClick={onApprove}
            disabled={busy}
          >
            {busy ? 'Approving…' : 'Approve selected'}
          </Button>
        )}
        <span
          onClick={onClear}
          className="cursor-pointer px-1.5 text-[13px] text-gray-400 hover:text-paper-0"
        >
          Clear
        </span>
      </div>
    </div>
  )
}
