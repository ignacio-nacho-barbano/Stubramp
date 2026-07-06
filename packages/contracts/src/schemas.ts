// Zod request contracts shared by the API (request validation + response
// serialization via fastify-type-provider-zod) and the web client (pre-send
// parse in its data layer). This is the wire contract; user-facing form-copy
// lives in the client.
import { z } from "zod";
import {
  billSourceEnum,
  billStatusEnum,
  classificationEnum,
  paymentMethodEnum,
  paymentOutcomeEnum,
  paymentTermsEnum,
  roleEnum,
} from "./enums.js";

const cents = z.number().int().nonnegative();

// ---- Auth ----

export const loginInput = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Public self-serve signup: creates a brand-new company plus its first (ADMIN)
// user. `companySize` is a marketing detail with no column on the model — it is
// accepted but not persisted.
export const signupInput = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  companyName: z.string().min(1),
  companySize: z.string().optional(),
});

// Public invite acceptance: join an existing company via a signed link. The
// target company is carried by the signed token, not the body.
export const acceptInviteInput = z.object({
  token: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

export type LoginInput = z.infer<typeof loginInput>;
export type SignupInput = z.infer<typeof signupInput>;
export type AcceptInviteInput = z.infer<typeof acceptInviteInput>;

// ---- Bills ----

export const splitInput = z.object({
  costCenter: z.string().min(1),
  amountCents: cents,
});

export const lineItemInput = z.object({
  description: z.string().min(1),
  quantity: z.number().int().positive().default(1),
  unitCents: cents,
  classification: classificationEnum.default("EXPENSE"),
  glAccount: z.string().optional(),
  splits: z.array(splitInput).min(1),
});

export const createBillInput = z.object({
  vendorId: z.string().uuid(),
  billNumber: z.string().min(1),
  source: billSourceEnum.default("MANUAL"),
  issueDate: z.coerce.date(),
  dueDate: z.coerce.date(),
  currency: z.string().length(3).default("USD"),
  lines: z.array(lineItemInput).min(1),
});

export const transitionInput = z.object({
  to: billStatusEnum,
  // actor is derived from the authenticated user, never the request body.
  // only consulted when scheduling a payment (APPROVED -> SCHEDULED)
  scheduledFor: z.coerce.date().optional(),
  method: paymentMethodEnum.optional(),
});

export const listBillsQuery = z.object({
  status: billStatusEnum.optional(),
});

export const billIdParams = z.object({
  id: z.string().uuid(),
});

export type CreateBillInput = z.infer<typeof createBillInput>;
export type TransitionInput = z.infer<typeof transitionInput>;

// ---- Document parsing (PDF upload) ----
// The kinds of document the parser can extract. Only bills today; the enum keeps
// the facade's `parse({ type })` contract explicit and extensible.
export const parseDocumentType = z.enum(["bill"]);
export type ParseDocumentType = z.infer<typeof parseDocumentType>;

// A single best-effort line extracted from an invoice.
export const parsedLineItem = z.object({
  description: z.string(),
  unitCents: cents,
});

// The parser's best-effort result for a bill PDF. Every field is best-effort:
// unmatched fields come back empty ("" / null / []) for the user to fill in on
// the confirm screen — the parser never fabricates data. Mirrors the fields the
// client's create-bill form seeds from.
export const parsedBillDocument = z.object({
  vendorName: z.string(),
  billNumber: z.string(),
  issueDate: z.string().nullable(),
  dueDate: z.string().nullable(),
  lines: z.array(parsedLineItem),
});

export type ParsedLineItem = z.infer<typeof parsedLineItem>;
export type ParsedBillDocument = z.infer<typeof parsedBillDocument>;

// ---- Payments ----

export const settlePaymentInput = z.object({
  // SUCCEEDED drives the bill SCHEDULED -> PAID; FAILED drives SCHEDULED -> FAILED.
  // actor is derived from the authenticated user, never the request body.
  outcome: paymentOutcomeEnum,
});

export const paymentIdParams = z.object({
  id: z.string().uuid(),
});

export type SettlePaymentInput = z.infer<typeof settlePaymentInput>;

// ---- Vendors ----

export const createVendorInput = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  bankRef: z.string().optional(),
  terms: paymentTermsEnum.optional(),
  paymentMethod: paymentMethodEnum.optional(),
});

// Partial update — every field optional. Nullable fields accept `null` to clear
// them; `active` toggles the vendor's status (activate / deactivate).
export const updateVendorInput = z
  .object({
    name: z.string().min(1),
    email: z.string().email().nullable(),
    bankRef: z.string().nullable(),
    terms: paymentTermsEnum.nullable(),
    paymentMethod: paymentMethodEnum.nullable(),
    active: z.boolean(),
  })
  .partial();

export const listVendorsQuery = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
});

export const vendorIdParams = z.object({
  id: z.string().uuid(),
});

export type CreateVendorInput = z.infer<typeof createVendorInput>;
export type UpdateVendorInput = z.infer<typeof updateVendorInput>;

// ---- Companies ----

export const createCompanyInput = z.object({
  name: z.string().min(1),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, "slug must be lowercase alphanumeric/hyphen"),
});

export const listCompaniesQuery = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
});

export type CreateCompanyInput = z.infer<typeof createCompanyInput>;

// ---- Users ----

export const createUserInput = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(8),
  role: roleEnum,
  // Superuser-only target company; ADMINs are forced into their own company.
  companyId: z.string().uuid().optional(),
});

export const listUsersQuery = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
});

export const userIdParams = z.object({
  id: z.string().uuid(),
});

export type CreateUserInput = z.infer<typeof createUserInput>;
