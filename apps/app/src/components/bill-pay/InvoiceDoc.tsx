import {
  Modal,
  avatarColor,
  cn,
  formatCents,
  formatDate,
  initials,
} from '@stubramp/ui'
import { Maximize2 } from 'lucide-react'
import { useState } from 'react'

export interface InvoiceDocLine {
  idx: string
  description: string
  qty: string
  unit: string
  amount: string
}

export interface InvoiceDocData {
  logoBg: string
  logoText: string
  vendor: string
  fromLine1: string
  fromLine2: string
  invoiceNo: string
  invoiceDate: string
  dueDate: string
  contact: string
  phone: string
  website: string
  terms: string
  poRef: string
  lines: InvoiceDocLine[]
  subtotal: string
  tax: string
  totalDue: string
}

export interface InvoiceSource {
  vendorName: string
  vendorEmail?: string | null
  invoiceNo: string
  issueDate?: string | null
  dueDate?: string | null
  lines: {
    description: string
    quantity: number
    unitCents: number
    amountCents: number
  }[]
  totalCents: number
}

/** Map a bill / draft into the paper-document view model. */
export function buildInvoiceDoc(src: InvoiceSource): InvoiceDocData {
  const slug = (src.vendorName || 'vendor')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
  const digits = src.invoiceNo
    ? src.invoiceNo.replace(/\D/g, '').slice(-4)
    : '0001'
  return {
    logoBg: avatarColor(src.vendorName || 'Vendor'),
    logoText: initials(src.vendorName) || 'V',
    vendor: src.vendorName || 'Vendor name',
    fromLine1: '123 Commerce Way',
    fromLine2: 'San Francisco, CA 94105',
    invoiceNo: src.invoiceNo || '—',
    invoiceDate: formatDate(src.issueDate),
    dueDate: formatDate(src.dueDate),
    contact: src.vendorEmail || `billing@${slug}.com`,
    phone: '(555) 123-4567',
    website: `www.${slug}.com`,
    terms: 'Net 30',
    poRef: `PO-${slug.slice(0, 4).toUpperCase() || 'STUB'}-${digits}`,
    lines: src.lines.map((l, i) => ({
      idx: String(i + 1),
      description: l.description || 'Line item',
      qty: String(l.quantity || 1),
      unit: formatCents(l.unitCents),
      amount: formatCents(l.amountCents),
    })),
    subtotal: formatCents(src.totalCents),
    tax: formatCents(0),
    totalDue: formatCents(src.totalCents),
  }
}

/**
 * Column template for the line-item grid. Widths are expressed in `em` so the
 * table scales with the document's root font-size (see `InvoiceDoc`).
 */
const COLS = 'grid grid-cols-[3.238em_1fr_4.762em_8.571em_8.571em]'

/**
 * Faithful recreation of the vendor's invoice PDF — a paper document held at a
 * fixed 0.71 (A4-portrait) aspect ratio. Every measurement inside is relative
 * (`em` off a `cqw`-based root font-size), so the whole document scales with
 * the container width and stays legible and proportional at any rendered size.
 */
export function InvoiceDoc({ doc }: { doc: InvoiceDocData }) {
  return (
    <div className="flex justify-center bg-[#E9E7E1] p-[3%] text-ink-900">
      <div
        className="relative w-full overflow-hidden bg-white shadow-[0_2px_10px_rgba(0,0,0,0.12)]"
        style={{ aspectRatio: '0.71', containerType: 'inline-size' }}
      >
        {/* Root font-size drives every `em` below; 1.875cqw keeps the body
            text at ~10.5px when the page is ~560px wide and scales from there. */}
        <div
          className="px-[3.429em] pb-[2.857em] pt-[3.238em]"
          style={{ fontSize: '1.875cqw' }}
        >
          {/* header: logo + meta */}
          <div className="mb-[2.857em] flex items-start justify-between">
            <span
              className="inline-flex items-center gap-[0.571em] px-[1.429em] py-[0.857em] text-[1.619em] font-bold tracking-[0.02em] text-white"
              style={{ background: doc.logoBg }}
            >
              {doc.logoText}
              <span className="inline-block h-[0.667em] w-[0.667em] rounded-full bg-white" />
            </span>
            <div className="text-right leading-[1.65]">
              <div>
                <span className="text-[#6b655b]">Invoice Number: </span>
                <b>{doc.invoiceNo}</b>
              </div>
              <div>
                <span className="text-[#6b655b]">Invoice Date: </span>
                <b>{doc.invoiceDate}</b>
              </div>
              <div>
                <span className="text-[#6b655b]">Due Date: </span>
                <b>{doc.dueDate}</b>
              </div>
              <div className="mt-[0.381em]">
                <span className="text-[#6b655b]">Contact: </span>
                <b>{doc.contact}</b>
              </div>
              <div>
                <span className="text-[#6b655b]">Phone: </span>
                <b>{doc.phone}</b>
              </div>
              <div>
                <span className="text-[#6b655b]">Website: </span>
                <b>{doc.website}</b>
              </div>
            </div>
          </div>

          {/* from / bill to / ship to */}
          <div className="mb-[2.095em] flex gap-[3.81em] leading-[1.6]">
            <div>
              <div className="mb-[0.286em] font-bold">From:</div>
              <div>{doc.vendor}</div>
              <div className="text-[#44403a]">{doc.fromLine1}</div>
              <div className="text-[#44403a]">{doc.fromLine2}</div>
              <div className="text-[#44403a]">United States</div>
            </div>
            <div>
              <div className="mb-[0.286em] font-bold">Bill To:</div>
              <div>StubRamp Inc.</div>
              <div className="text-[#44403a]">28 W 23rd St</div>
              <div className="text-[#44403a]">New York, NY 10010</div>
              <div className="text-[#44403a]">United States</div>
            </div>
            <div>
              <div className="mb-[0.286em] font-bold">Ship To:</div>
              <div>StubRamp Inc.</div>
              <div className="text-[#44403a]">1 Beacon Street</div>
              <div className="text-[#44403a]">Boston, MA 02108</div>
              <div className="text-[#44403a]">United States</div>
            </div>
          </div>

          <div className="mb-[1.524em] leading-[1.6]">
            <div>
              <span className="font-bold">Payment Terms: </span>
              {doc.terms}
            </div>
            <div>
              <span className="font-bold">Reference PO#: </span>
              {doc.poRef}
            </div>
            <div>
              <span className="font-bold">Currency: </span>USD
            </div>
          </div>

          {/* line items */}
          <div>
            <div
              className={cn(
                COLS,
                'bg-ink-900 px-[0.952em] py-[0.667em] text-[0.952em] font-semibold text-white',
              )}
            >
              <span>Item</span>
              <span>Description</span>
              <span className="text-right">Qty</span>
              <span className="text-right">Unit Price</span>
              <span className="text-right">Total</span>
            </div>
            {doc.lines.map((ln, i) => (
              <div
                key={ln.idx}
                className={cn(
                  COLS,
                  'border-b border-[#ECEAE4] px-[0.952em] py-[0.667em] tabular-nums',
                  i % 2 === 1 ? 'bg-[#FAF9F6]' : 'bg-white',
                )}
              >
                <span className="text-[#6b655b]">{ln.idx}</span>
                <span>{ln.description}</span>
                <span className="text-right">{ln.qty}</span>
                <span className="text-right">{ln.unit}</span>
                <span className="text-right">{ln.amount}</span>
              </div>
            ))}
          </div>

          {/* totals */}
          <div className="mt-[1.333em] flex justify-end">
            <div className="w-[21.905em] tabular-nums">
              <div className="flex justify-between py-[0.286em]">
                <span className="font-semibold">Subtotal</span>
                <span>{doc.subtotal}</span>
              </div>
              <div className="flex justify-between py-[0.286em] text-[#44403a]">
                <span className="font-semibold">Sales Tax (0%)</span>
                <span>{doc.tax}</span>
              </div>
              <div className="mt-[0.286em] flex justify-between border-t border-ink-900 py-[0.571em]">
                <span className="font-bold">Total Due</span>
                <span className="font-bold text-status-negative">
                  {doc.totalDue}
                </span>
              </div>
            </div>
          </div>

          {/* payment info */}
          <div className="mt-[2.095em] bg-paper-100 px-[1.429em] py-[1.238em] text-[0.952em] leading-[1.7]">
            <div className="mb-[0.381em] font-bold">
              Payment Information (ACH):
            </div>
            <div>
              <span className="font-semibold">Bank Name:</span> First National
              Bank
            </div>
            <div>
              <span className="font-semibold">Routing Number:</span> 123456789
            </div>
            <div>
              <span className="font-semibold">Account Number:</span> 987654321
            </div>
            <div>
              <span className="font-semibold">Account Type:</span> Checking
            </div>
          </div>

          <div className="mt-[1.714em] text-center text-[0.905em] italic leading-[1.6] text-[#8a8478]">
            <div>
              Thank you for your business! Please remit payment by the due date
              to avoid late fees.
            </div>
            <div>For any billing inquiries, contact {doc.contact}.</div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * The invoice document plus a "Preview" affordance: a floating button that
 * opens the same document, larger, in a modal. The document scales to fill
 * whichever container it lands in, so the modal copy is simply bigger.
 */
export function InvoicePreview({ doc }: { doc: InvoiceDocData }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="absolute right-2.5 top-2.5 z-10 inline-flex items-center gap-1.5 border border-gray-300 bg-surface-card/90 px-2.5 py-1.5 text-xs font-medium text-ink-900 shadow-sm backdrop-blur transition-colors hover:bg-surface-raised"
      >
        <Maximize2 size={13} />
        Preview
      </button>
      <InvoiceDoc doc={doc} />
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Invoice preview"
        size="lg"
      >
        <InvoiceDoc doc={doc} />
      </Modal>
    </div>
  )
}
