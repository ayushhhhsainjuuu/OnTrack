const DEFAULT_LIMIT = 20
const MAX_LIMIT = 100

// Converts a 1-indexed page/limit pair into the zero-indexed [from, to]
// range expected by Supabase's `.range()`.
export function paginate(page, limit) {
  const safePage = Number.isInteger(page) && page > 0 ? page : 1
  const safeLimit = Number.isInteger(limit) && limit > 0 ? Math.min(limit, MAX_LIMIT) : DEFAULT_LIMIT

  const from = (safePage - 1) * safeLimit
  const to = from + safeLimit - 1

  return { from, to, page: safePage, limit: safeLimit }
}
