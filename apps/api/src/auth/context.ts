import type { Role } from "../generated/prisma/client.js";

// The authenticated identity for a request, derived from a verified access token
// and set on `request.auth` by the auth plugin. companyId is null only for
// SUPERUSERs (platform staff who can act on any company).
export interface AuthContext {
  userId: string;
  role: Role;
  companyId: string | null;
  isSuperuser: boolean;
  // The company a superuser is targeting for this request, from the X-Company-Id
  // header. Null when absent. Ignored for non-superusers (they are pinned to
  // their own company).
  requestedCompanyId: string | null;
}
