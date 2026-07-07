// The single source of truth for legal bill transitions now lives in
// @stubramp/contracts so the API and the web client share one table. This module
// re-exports it under the original import path. The Prisma-generated `BillStatus`
// enum is asserted to match the contract's in ../contracts-compat.ts.
export { BILL_STATUSES } from "@stubramp/contracts/enums";
export {
  TRANSITIONS,
  DELETABLE_STATUSES,
  canTransition,
  canDelete,
  isTerminal,
} from "@stubramp/contracts/bill-state-machine";
