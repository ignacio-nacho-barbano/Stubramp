// Generic, reusable data-access base built on top of Prisma. Each concrete
// repository binds the generated input/output types via a `ModelTypes` shape and
// passes its Prisma delegate (e.g. prisma.user) to the constructor. The base
// adds value over raw delegates: domain NotFound semantics, offset pagination,
// `exists`/`count`, and select/include passthrough.
import { NotFoundError, mapPrismaError } from "./errors.js";

/**
 * The subset of a Prisma model delegate the base relies on. Every generated
 * delegate (UserDelegate, CardDelegate, …) satisfies this structurally. The
 * `any` is contained here: it never leaks to callers because every public method
 * casts results to the subclass-bound `T[...]` shape.
 */
export interface ModelDelegate {
  findUnique(args: unknown): Promise<unknown>;
  findFirst(args?: unknown): Promise<unknown>;
  findMany(args?: unknown): Promise<unknown[]>;
  create(args: unknown): Promise<unknown>;
  update(args: unknown): Promise<unknown>;
  delete(args: unknown): Promise<unknown>;
  count(args?: unknown): Promise<number>;
}

/**
 * Per-model type binding. A subclass extends this with the generated types so the
 * generated client stays the single source of truth.
 */
export interface ModelTypes {
  Model: unknown;
  WhereUnique: unknown;
  Where: unknown;
  Create: unknown;
  Update: unknown;
  OrderBy: unknown;
}

/** Optional Prisma projection passthrough kept loosely typed at the base. */
export interface SelectInclude {
  select?: unknown;
  include?: unknown;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface FindAllOptions<T extends ModelTypes> {
  where?: T["Where"];
  orderBy?: T["OrderBy"];
  /** 1-based. Clamped to >= 1. */
  page?: number;
  /** Defaults to 20, clamped to 1..100. */
  pageSize?: number;
}

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export abstract class BaseRepository<T extends ModelTypes> {
  protected constructor(
    /** The bound Prisma delegate, e.g. prisma.user. */
    protected readonly delegate: ModelDelegate,
    /** Human-readable model name used in NotFoundError messages. */
    protected readonly modelName: string,
  ) {}

  async findById(id: string, args?: SelectInclude): Promise<T["Model"] | null> {
    return this.delegate.findUnique({ where: { id }, ...args }) as Promise<
      T["Model"] | null
    >;
  }

  /** Throws NotFoundError (not Prisma P2025) when absent. */
  async findByIdOrThrow(id: string, args?: SelectInclude): Promise<T["Model"]> {
    const found = await this.findById(id, args);
    if (found === null) {
      throw new NotFoundError(this.modelName, { id });
    }
    return found;
  }

  async findOne(
    where: T["WhereUnique"],
    args?: SelectInclude,
  ): Promise<T["Model"] | null> {
    return this.delegate.findUnique({ where, ...args }) as Promise<
      T["Model"] | null
    >;
  }

  /** Offset-paginated listing returning data plus pagination metadata. */
  async getAll(
    options: FindAllOptions<T> = {},
  ): Promise<Paginated<T["Model"]>> {
    const page = Math.max(1, options.page ?? 1);
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, options.pageSize ?? DEFAULT_PAGE_SIZE),
    );
    const skip = (page - 1) * pageSize;

    const [data, total] = await Promise.all([
      this.delegate.findMany({
        where: options.where,
        orderBy: options.orderBy,
        skip,
        take: pageSize,
      }) as Promise<T["Model"][]>,
      this.delegate.count({ where: options.where }),
    ]);

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async create(data: T["Create"], args?: SelectInclude): Promise<T["Model"]> {
    try {
      return (await this.delegate.create({ data, ...args })) as T["Model"];
    } catch (err) {
      mapPrismaError(err, this.modelName, {});
    }
  }

  async update(
    id: string,
    data: T["Update"],
    args?: SelectInclude,
  ): Promise<T["Model"]> {
    try {
      return (await this.delegate.update({
        where: { id },
        data,
        ...args,
      })) as T["Model"];
    } catch (err) {
      mapPrismaError(err, this.modelName, { id });
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.delegate.delete({ where: { id } });
    } catch (err) {
      mapPrismaError(err, this.modelName, { id });
    }
  }

  async count(where?: T["Where"]): Promise<number> {
    return this.delegate.count({ where });
  }

  /** Cheap existence check — selects only the id column. */
  async exists(where: T["Where"]): Promise<boolean> {
    const found = await this.delegate.findFirst({
      where,
      select: { id: true },
    });
    return found !== null;
  }
}
