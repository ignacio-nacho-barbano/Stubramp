import { queryOptions } from '@tanstack/react-query'
import { getBillFn, listBillsFn, listVendorsFn } from './bills'
import type { BillStatus } from './bills'

// Query-option factories + a shared key namespace. Route loaders seed the cache
// with `ensureQueryData`, components read via `useQuery`/`useSuspenseQuery`, and
// mutations invalidate `billKeys.all` so lists/detail/derived views refresh.

export const billKeys = {
  all: ['bills'] as const,
  lists: () => [...billKeys.all, 'list'] as const,
  list: (status?: BillStatus) =>
    [...billKeys.lists(), { status: status ?? 'ALL' }] as const,
  detail: (id: string) => [...billKeys.all, 'detail', id] as const,
  vendors: ['vendors'] as const,
}

export const billsQueryOptions = (status?: BillStatus) =>
  queryOptions({
    queryKey: billKeys.list(status),
    queryFn: () => listBillsFn({ data: { status } }),
  })

export const billDetailQueryOptions = (id: string) =>
  queryOptions({
    queryKey: billKeys.detail(id),
    queryFn: () => getBillFn({ data: { id } }),
  })

export const vendorsQueryOptions = () =>
  queryOptions({
    queryKey: billKeys.vendors,
    queryFn: () => listVendorsFn({ data: { pageSize: 100 } }),
  })
