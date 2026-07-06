'use client'

import { useCallback } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useDropzone } from 'react-dropzone'
import { Loader2, UploadCloud } from 'lucide-react'
import { Button, Card, cn, useToast } from '@stubramp/ui'
import { parseBillDocumentFn } from '../../lib/bills'
import type { ParsedBillDocument } from '../../lib/bills'

/**
 * Invoice upload + parse step. Drop (or browse to) a PDF; it's uploaded to the
 * API, which extracts best-effort fields (vendor, invoice #, dates, line items).
 * On success we hand the parsed fields straight to the caller, which seeds the
 * standard bill create form — the user reviews and corrects there in the exact
 * same UI as a manual entry. Extraction is best-effort: unmatched fields just
 * come back empty for the user to fill in.
 */
export function UploadFlow({
  onAccept,
  onCancel,
}: {
  onAccept: (parsed: ParsedBillDocument) => void
  onCancel: () => void
}) {
  const { toast } = useToast()

  const parse = useMutation({
    mutationFn: (file: File) => parseBillDocumentFn({ data: { file } }),
    onSuccess: (res) => {
      if (!res.ok) {
        toast({ message: res.error, tone: 'negative' })
        return
      }
      onAccept(res.data)
    },
  })
  const parsing = parse.isPending

  const onDrop = useCallback(
    (files: File[]) => {
      if (files.length === 0) return
      parse.mutate(files[0])
    },
    [parse.mutate],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    multiple: false,
    disabled: parsing,
  })

  if (parsing) {
    return (
      <Card>
        <div className="p-10 text-center">
          <Loader2
            size={28}
            className="mx-auto mb-3.5 animate-spin text-ink-900"
          />
          <div className="text-sm font-medium">Reading invoice…</div>
          <div className="mt-1 text-xs text-gray-500">
            Extracting fields from your PDF
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <div
        {...getRootProps()}
        className={cn(
          'cursor-pointer border-2 border-dashed border-gray-300 bg-surface-page p-14 text-center transition-colors',
          isDragActive && 'border-accent-500 bg-accent-100',
        )}
      >
        <input {...getInputProps()} />
        <UploadCloud size={46} className="mx-auto mb-3.5 text-gray-400" />
        <div className="text-[15px] font-semibold">
          {isDragActive
            ? 'Drop the PDF to upload'
            : 'Drop a PDF or click to browse'}
        </div>
        <div className="mt-1 text-[13px] text-gray-500">
          We’ll auto-fill the vendor, dates and line items for you to review
        </div>
      </div>
      <div className="mt-4">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </Card>
  )
}
