import { describe, it, expect, vi, beforeEach } from 'vitest'
import { chainable } from '@/test/supabaseMock'

const resolveExpiredAuctionMock = vi.fn().mockResolvedValue(undefined)
const deleteExpiredSoldProductsMock = vi.fn().mockResolvedValue(0)
let expiredAuctions: unknown[] = []
let adminFrom: ReturnType<typeof vi.fn>

vi.mock('@/features/products/resolveAuction', () => ({
  createAdminClient: () => {
    adminFrom = vi.fn().mockReturnValueOnce(chainable({ data: expiredAuctions, error: null }))
    return { from: adminFrom }
  },
  resolveExpiredAuction: (...args: unknown[]) => resolveExpiredAuctionMock(...args),
}))

vi.mock('@/features/products/cleanupSoldProducts', () => ({
  deleteExpiredSoldProducts: (...args: unknown[]) => deleteExpiredSoldProductsMock(...args),
}))

const { GET } = await import('./route')

function requestWithAuth(header?: string) {
  return new Request('http://localhost/api/cron/auctions', {
    headers: header ? { authorization: header } : {},
  })
}

const ORIGINAL_ENV = { ...process.env }

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV, CRON_SECRET: 'test-secret' }
  expiredAuctions = []
  resolveExpiredAuctionMock.mockClear()
  deleteExpiredSoldProductsMock.mockClear().mockResolvedValue(0)
})

describe('GET /api/cron/auctions', () => {
  it('rejects a request with no authorization header', async () => {
    const res = await GET(requestWithAuth())
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'Unauthorized' })
  })

  it('rejects a request with the wrong token', async () => {
    const res = await GET(requestWithAuth('Bearer wrong-token'))
    expect(res.status).toBe(401)
  })

  it('accepts a request with the correct bearer token', async () => {
    const res = await GET(requestWithAuth('Bearer test-secret'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
  })

  it('processes each expired auction and reports the count', async () => {
    expiredAuctions = [
      { id: 'a1', seller_id: 's1', title: 'Item 1' },
      { id: 'a2', seller_id: 's2', title: 'Item 2' },
    ]
    const res = await GET(requestWithAuth('Bearer test-secret'))
    const body = await res.json()
    expect(resolveExpiredAuctionMock).toHaveBeenCalledTimes(2)
    expect(body.processed).toBe(2)
  })

  it('keeps processing remaining auctions when one fails to resolve', async () => {
    expiredAuctions = [
      { id: 'a1', seller_id: 's1', title: 'Item 1' },
      { id: 'a2', seller_id: 's2', title: 'Item 2' },
    ]
    resolveExpiredAuctionMock.mockRejectedValueOnce(new Error('boom')).mockResolvedValueOnce(undefined)
    const res = await GET(requestWithAuth('Bearer test-secret'))
    const body = await res.json()
    expect(body.processed).toBe(1)
  })

  it('reports how many sold products were swept up', async () => {
    deleteExpiredSoldProductsMock.mockResolvedValueOnce(3)
    const res = await GET(requestWithAuth('Bearer test-secret'))
    const body = await res.json()
    expect(body.deletedSold).toBe(3)
  })
})
