import { vi } from 'vitest'

/**
 * Creates a chainable Supabase query builder mock.
 * Supports both .single() (returns {data, error}) and direct await (returns {data, error, count}).
 */
export function q(data: any = null, error: any = null, count: number | null = null) {
  const res = { data, error, count }
  const p = Promise.resolve(res)
  // Assign object first, then bind methods — avoids TDZ when referencing `chain` inside initializer
  const chain: any = {}
  const ret = () => chain
  ;['select', 'insert', 'update', 'delete', 'upsert', 'eq', 'order', 'head'].forEach(
    (m) => { chain[m] = vi.fn().mockImplementation(ret) }
  )
  chain.single = vi.fn().mockResolvedValue({ data, error })
  chain.then = p.then.bind(p)
  chain.catch = p.catch.bind(p)
  chain.finally = p.finally.bind(p)
  return chain
}

/** Builds a mock Supabase client where from() dispatches to per-table chains */
export function buildClient(tables: Record<string, ReturnType<typeof q>>, authUser?: any) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue(
        authUser
          ? { data: { user: authUser }, error: null }
          : { data: { user: null }, error: new Error('no user') }
      ),
    },
    from: vi.fn((table: string) => tables[table] ?? q()),
  }
}
