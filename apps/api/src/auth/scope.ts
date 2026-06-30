import { GuardFailedError } from "../domain/errors.js";
import type { AuthContext } from "./context.js";

// The company a request reads within. Non-superusers are pinned to their own
// company. Superusers may target one company (X-Company-Id, captured on
// auth.requestedCompanyId); absent ⇒ null = "no company filter" (all companies).
export function resolveCompanyId(auth: AuthContext): string | null {
  if (auth.isSuperuser) return auth.requestedCompanyId;
  return auth.companyId;
}

// The company a write is attributed to. Non-superusers write into their own
// company. A superuser must explicitly target a company (X-Company-Id); an
// ownerless write is rejected even though a superuser may read across companies.
export function requireCompanyForWrite(auth: AuthContext): string {
  if (!auth.isSuperuser) {
    if (!auth.companyId) {
      throw new GuardFailedError("User is not attached to a company");
    }
    return auth.companyId;
  }
  if (!auth.requestedCompanyId) {
    throw new GuardFailedError(
      "Superuser must target a company (X-Company-Id) to write",
    );
  }
  return auth.requestedCompanyId;
}
