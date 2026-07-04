// Compile-time guarantee that the Prisma-generated enums (the DB's source of
// truth) exactly match the shared @stubramp/contracts unions (the wire/UI source
// of truth). If a status/role is added to the Prisma schema but not to the
// contract (or vice versa), one of the assertions below fails `check-types`.
// This file is type-only — it emits no runtime code.
import type {
  BillSource as PrismaBillSource,
  BillStatus as PrismaBillStatus,
  Classification as PrismaClassification,
  PaymentMethod as PrismaPaymentMethod,
  PaymentStatus as PrismaPaymentStatus,
  Role as PrismaRole,
} from "./generated/prisma/client.js";
import type {
  BillSource as ContractBillSource,
  BillStatus as ContractBillStatus,
  Classification as ContractClassification,
  PaymentMethod as ContractPaymentMethod,
  PaymentStatus as ContractPaymentStatus,
  Role as ContractRole,
} from "@stubramp/contracts/enums";

// Invariant (exact) type equality — not just mutual assignability.
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;
type Assert<_T extends true> = true;

type _BillStatus = Assert<Equal<PrismaBillStatus, ContractBillStatus>>;
type _Role = Assert<Equal<PrismaRole, ContractRole>>;
type _BillSource = Assert<Equal<PrismaBillSource, ContractBillSource>>;
type _Classification = Assert<
  Equal<PrismaClassification, ContractClassification>
>;
type _PaymentStatus = Assert<Equal<PrismaPaymentStatus, ContractPaymentStatus>>;
type _PaymentMethod = Assert<Equal<PrismaPaymentMethod, ContractPaymentMethod>>;
