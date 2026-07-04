// Canonical enums shared by the API and the web client. These const arrays are
// the single source of truth for every string-literal union in the payables
// domain; the API asserts (in contracts-compat.ts) that its Prisma-generated
// enums match these exactly, so drift is a compile error.
import { z } from "zod";

export const BILL_STATUSES = [
  "DRAFT",
  "SUBMITTED",
  "APPROVED",
  "SCHEDULED",
  "PAID",
  "REJECTED",
  "FAILED",
] as const;
export type BillStatus = (typeof BILL_STATUSES)[number];
export const billStatusEnum = z.enum(BILL_STATUSES);

export const ROLES = [
  "SUPERUSER",
  "ADMIN",
  "ACCOUNTANT",
  "APPROVER",
  "EMPLOYEE",
] as const;
export type Role = (typeof ROLES)[number];
export const roleEnum = z.enum(ROLES);

export const CLASSIFICATIONS = ["EXPENSE", "ITEM"] as const;
export type Classification = (typeof CLASSIFICATIONS)[number];
export const classificationEnum = z.enum(CLASSIFICATIONS);

export const PAYMENT_METHODS = ["ACH", "WIRE", "CHECK", "CARD"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export const paymentMethodEnum = z.enum(PAYMENT_METHODS);

// Vendor payment terms — how long after the issue date a bill is due. Stored as
// a plain string on the Vendor row (no Prisma enum), validated at the wire
// boundary against this list. Used to pre-fill the due date on new bills.
export const PAYMENT_TERMS = [
  "DUE_ON_RECEIPT",
  "NET_15",
  "NET_30",
  "NET_45",
  "NET_60",
] as const;
export type PaymentTerms = (typeof PAYMENT_TERMS)[number];
export const paymentTermsEnum = z.enum(PAYMENT_TERMS);

export const BILL_SOURCES = [
  "MANUAL",
  "UPLOAD",
  "OCR",
  "EMAIL",
  "CSV",
] as const;
export type BillSource = (typeof BILL_SOURCES)[number];
export const billSourceEnum = z.enum(BILL_SOURCES);

export const PAYMENT_STATUSES = ["PENDING", "SUCCEEDED", "FAILED"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
export const paymentStatusEnum = z.enum(PAYMENT_STATUSES);

// The two terminal outcomes a scheduled payment can settle into.
export const PAYMENT_OUTCOMES = ["SUCCEEDED", "FAILED"] as const;
export type PaymentOutcome = (typeof PAYMENT_OUTCOMES)[number];
export const paymentOutcomeEnum = z.enum(PAYMENT_OUTCOMES);
