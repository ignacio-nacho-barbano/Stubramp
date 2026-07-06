import {
  avatarColor,
  cn,
  formatCents,
  formatDate,
  initials,
} from '@stubramp/ui'

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

const COLS = 'grid grid-cols-[34px_1fr_50px_90px_90px]'

/** Faithful recreation of the vendor's invoice PDF — a paper document preview. */
export function InvoiceDoc({ doc }: { doc: InvoiceDocData }) {
  return (
    <div className="flex justify-center bg-[#E9E7E1] p-[22px] text-ink-900">
      <div className="w-full max-w-[560px] bg-white px-9 pb-[30px] pt-[34px] shadow-[0_2px_10px_rgba(0,0,0,0.12)]">
        {/* header: logo + meta */}
        <div className="mb-[30px] flex items-start justify-between">
          <span
            className="inline-flex items-center gap-1.5 px-[15px] py-[9px] text-[17px] font-bold tracking-[0.02em] text-white"
            style={{ background: doc.logoBg }}
          >
            {doc.logoText}
            <span className="inline-block h-[7px] w-[7px] rounded-full bg-white" />
          </span>
          <div className="text-right text-[10.5px] leading-[1.65]">
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
            <div className="mt-1">
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
        <div className="mb-[22px] flex gap-10 text-[10.5px] leading-[1.6]">
          <div>
            <div className="mb-[3px] font-bold">From:</div>
            <div>{doc.vendor}</div>
            <div className="text-[#44403a]">{doc.fromLine1}</div>
            <div className="text-[#44403a]">{doc.fromLine2}</div>
            <div className="text-[#44403a]">United States</div>
          </div>
          <div>
            <div className="mb-[3px] font-bold">Bill To:</div>
            <div>StubRamp Inc.</div>
            <div className="text-[#44403a]">28 W 23rd St</div>
            <div className="text-[#44403a]">New York, NY 10010</div>
            <div className="text-[#44403a]">United States</div>
          </div>
          <div>
            <div className="mb-[3px] font-bold">Ship To:</div>
            <div>StubRamp Inc.</div>
            <div className="text-[#44403a]">1 Beacon Street</div>
            <div className="text-[#44403a]">Boston, MA 02108</div>
            <div className="text-[#44403a]">United States</div>
          </div>
        </div>

        <div className="mb-4 text-[10.5px] leading-[1.6]">
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
              'bg-ink-900 px-2.5 py-[7px] text-[10px] font-semibold text-white',
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
                'border-b border-[#ECEAE4] px-2.5 py-[7px] text-[10.5px] tabular-nums',
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
        <div className="mt-3.5 flex justify-end">
          <div className="w-[230px] text-[10.5px] tabular-nums">
            <div className="flex justify-between py-[3px]">
              <span className="font-semibold">Subtotal</span>
              <span>{doc.subtotal}</span>
            </div>
            <div className="flex justify-between py-[3px] text-[#44403a]">
              <span className="font-semibold">Sales Tax (0%)</span>
              <span>{doc.tax}</span>
            </div>
            <div className="mt-[3px] flex justify-between border-t border-ink-900 py-1.5">
              <span className="font-bold">Total Due</span>
              <span className="font-bold text-status-negative">
                {doc.totalDue}
              </span>
            </div>
          </div>
        </div>

        {/* payment info */}
        <div className="mt-[22px] bg-paper-100 px-[15px] py-[13px] text-[10px] leading-[1.7]">
          <div className="mb-1 font-bold">Payment Information (ACH):</div>
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

        <div className="mt-[18px] text-center text-[9.5px] italic leading-[1.6] text-[#8a8478]">
          <div>
            Thank you for your business! Please remit payment by the due date to
            avoid late fees.
          </div>
          <div>For any billing inquiries, contact {doc.contact}.</div>
        </div>
      </div>
    </div>
  )
}
