import type { Prisma, Vendor } from "../generated/prisma/client.js";
import {
  BaseRepository,
  type ModelDelegate,
  type ModelTypes,
} from "./BaseRepository.js";

interface VendorTypes extends ModelTypes {
  Model: Vendor;
  WhereUnique: Prisma.VendorWhereUniqueInput;
  Where: Prisma.VendorWhereInput;
  Create: Prisma.VendorCreateInput;
  Update: Prisma.VendorUpdateInput;
  OrderBy:
    | Prisma.VendorOrderByWithRelationInput
    | Prisma.VendorOrderByWithRelationInput[];
}

export class VendorRepository extends BaseRepository<VendorTypes> {
  constructor(private readonly vendors: Prisma.TransactionClient["vendor"]) {
    super(vendors as unknown as ModelDelegate, "Vendor");
  }

  findByEmail(email: string) {
    return this.vendors.findFirst({ where: { email } });
  }

  // Company-scoped lookup; null companyId = no filter (superuser).
  findByIdScoped(id: string, companyId: string | null) {
    return this.vendors.findFirst({
      where: { id, ...(companyId ? { companyId } : {}) },
    });
  }

  withTx(tx: Prisma.TransactionClient): VendorRepository {
    return new VendorRepository(tx.vendor);
  }
}
