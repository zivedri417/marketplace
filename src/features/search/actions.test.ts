import { describe, it, expect, vi, beforeEach } from 'vitest'

const rpcMock = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ rpc: rpcMock }),
}))

const { searchMarketplace } = await import('./actions')

beforeEach(() => {
  rpcMock.mockReset()
  rpcMock.mockResolvedValue({ data: [], error: null })
})

describe('searchMarketplace', () => {
  it('short-circuits on an empty query without hitting the database', async () => {
    const result = await searchMarketplace('   ')
    expect(result).toEqual({ products: [], users: [] })
    expect(rpcMock).not.toHaveBeenCalled()
  })

  it('trims the query and forwards the limit to both RPCs', async () => {
    await searchMarketplace('  bike  ', 3)
    expect(rpcMock).toHaveBeenCalledWith('search_products', { query: 'bike', match_limit: 3 })
    expect(rpcMock).toHaveBeenCalledWith('search_profiles', { query: 'bike', match_limit: 3 })
  })

  it('returns empty arrays (not a throw) when an RPC errors', async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: { message: 'db error' } })
    const result = await searchMarketplace('bike')
    expect(result.products).toEqual([])
  })
})
