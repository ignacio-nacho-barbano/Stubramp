import type { Company, Prisma } from "../generated/prisma/client.js";
import {
  BaseRepository,
  type ModelDelegate,
  type ModelTypes,
} from "./BaseRepository.js";

interface CompanyTypes extends ModelTypes {
  Model: Company;
  WhereUnique: Prisma.CompanyWhereUniqueInput;
  Where: Prisma.CompanyWhereInput;
  Create: Prisma.CompanyCreateInput;
  Update: Prisma.CompanyUpdateInput;
  OrderBy:
    | Prisma.CompanyOrderByWithRelationInput
    | Prisma.CompanyOrderByWithRelationInput[];
}

export class CompanyRepository extends BaseRepository<CompanyTypes> {
  constructor(private readonly companies: Prisma.TransactionClient["company"]) {
    super(companies as unknown as ModelDelegate, "Company");
  }

  findBySlug(slug: string) {
    return this.companies.findUnique({ where: { slug } });
  }

  withTx(tx: Prisma.TransactionClient): CompanyRepository {
    return new CompanyRepository(tx.company);
  }
}
