export const PAGE_SIZE_OPTIONS = [25, 50, 100] as const
export const DEFAULT_PAGE_SIZE: number = PAGE_SIZE_OPTIONS[0]

export type SearchParamValue = string | string[] | undefined

/** One page of rows plus the counts the table footer needs. */
export type Paginated<T> = {
  /** null when there's no active campaign. */
  campaignId: string | null
  rows: T[]
  /** Rows matching the current filters. */
  total: number
  /** All rows for the campaign, ignoring filters. */
  totalAll: number
  /** Requested page, clamped to the last page that exists. */
  page: number
  pageSize: number
}

/** Page count for `total` rows, never less than 1 so an empty table still has page 1. */
export function getPageCount(total: number, pageSize: number) {
  return Math.max(1, Math.ceil(total / pageSize))
}

export function firstParam(value: SearchParamValue) {
  return Array.isArray(value) ? value[0] : value
}

export function parsePage(value: SearchParamValue) {
  const page = Number(firstParam(value))
  return Number.isInteger(page) && page >= 1 ? page : 1
}

export function parsePageSize(value: SearchParamValue) {
  const size = Number(firstParam(value))
  return (PAGE_SIZE_OPTIONS as readonly number[]).includes(size)
    ? size
    : DEFAULT_PAGE_SIZE
}

/** Returns `value` if it's one of `options`, otherwise null. */
export function parseOption<T extends string>(
  value: SearchParamValue,
  options: readonly T[],
): T | null {
  const v = firstParam(value)
  return v !== undefined && (options as readonly string[]).includes(v)
    ? (v as T)
    : null
}
