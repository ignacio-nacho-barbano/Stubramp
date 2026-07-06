'use client'

import { useNavigate } from '@tanstack/react-router'
import { FileSpreadsheet, PenLine, UploadCloud } from 'lucide-react'
import { Button, Menu, useToast } from '@stubramp/ui'

/** The "+ New bill" dropdown. Manual + Upload are wired; CSV/AP-inbox are stubs. */
export function NewBillMenu() {
  const navigate = useNavigate()
  const { toast } = useToast()

  return (
    <Menu
      align="end"
      width={280}
      trigger={<Button variant="accent">+ New bill</Button>}
      items={[
        {
          id: 'manual',
          label: 'Enter manually',
          description: 'Type in the bill details',
          icon: <PenLine size={18} className="text-ink-900" />,
          onSelect: () => navigate({ to: '/bills/new' }),
        },
        {
          id: 'upload',
          label: 'Upload invoice (PDF)',
          description: 'Auto-parse with OCR',
          icon: <UploadCloud size={18} className="text-ink-900" />,
          onSelect: () =>
            navigate({ to: '/bills/new', search: { mode: 'upload' } }),
        },
        {
          id: 'csv',
          label: 'Import CSV / spreadsheet',
          description: 'Map columns, bulk create',
          icon: <FileSpreadsheet size={18} className="text-gray-500" />,
          onSelect: () =>
            toast({
              message: 'CSV import is not available in this build yet.',
            }),
        },
        // {
        //   id: 'email',
        //   label: 'Forward to AP inbox',
        //   description: 'ap@northwind.stubramp.com',
        //   icon: <Inbox size={18} className="text-gray-500" />,
        //   onSelect: () =>
        //     toast({ message: 'AP inbox forwarding is not available yet.' }),
        // },
      ]}
    />
  )
}
