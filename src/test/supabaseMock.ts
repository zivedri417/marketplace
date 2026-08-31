import { vi, type Mock } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * These test doubles deliberately don't implement the real Supabase SDK
 * types (that's the whole point — they're much smaller). Call sites get the
 * real types back from `createClient()`/`SupabaseClient`, so reaching into a
 * mock's `.mockReturnValueOnce`/`.mockResolvedValueOnce` needs one narrow,
 * explicit cast. Centralizing it here keeps `any` out of the test files.
 */
export function asMock(fn: unknown): Mock {
  return fn as Mock
}

/** Same idea, for handing a fully-scripted fake admin client to code typed to expect the real `SupabaseClient`. */
export function asSupabaseClient(fake: object): SupabaseClient {
  return fake as SupabaseClient
}

type QueryResult = { data: unknown; error: unknown }

interface ChainableBuilder extends PromiseLike<QueryResult> {
  select: Mock
  insert: Mock
  update: Mock
  delete: Mock
  eq: Mock
  neq: Mock
  lt: Mock
  lte: Mock
  gt: Mock
  gte: Mock
  order: Mock
  limit: Mock
  single: Mock
}

/**
 * Minimal stand-in for a Supabase query builder. Every chain method returns
 * itself so calls like `.select().eq().single()` compose freely, and the
 * object is also `then`-able so `await`-ing it at any point in the chain
 * (with or without a terminal `.single()`) resolves to `result`.
 */
export function chainable(result: QueryResult): ChainableBuilder {
  const builder = {} as ChainableBuilder
  const self = () => builder
  Object.assign(builder, {
    select: vi.fn(self),
    insert: vi.fn(self),
    update: vi.fn(self),
    delete: vi.fn(self),
    eq: vi.fn(self),
    neq: vi.fn(self),
    lt: vi.fn(self),
    lte: vi.fn(self),
    gt: vi.fn(self),
    gte: vi.fn(self),
    order: vi.fn(self),
    limit: vi.fn(self),
    single: vi.fn(() => Promise.resolve(result)),
    then: (onFulfilled: (v: QueryResult) => unknown, onRejected?: (e: unknown) => unknown) =>
      Promise.resolve(result).then(onFulfilled, onRejected),
  })
  return builder
}

/** Builds a fake Supabase client whose `.from(table)` calls are scripted in order. */
export function createMockSupabase(user: { id: string; email?: string } | null = null) {
  const from = vi.fn()
  const client = {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user } }),
      signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
      signUp: vi.fn().mockResolvedValue({ error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
      updateUser: vi.fn().mockResolvedValue({ error: null }),
      admin: {
        getUserById: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
    },
    from,
    storage: {
      from: vi.fn(() => ({ remove: vi.fn().mockResolvedValue({ data: null, error: null }) })),
    },
    rpc: vi.fn(),
  }
  return { client, from }
}
