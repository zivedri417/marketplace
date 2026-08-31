import { describe, it, expect, vi } from 'vitest'
import { chainable, asSupabaseClient } from '@/test/supabaseMock'
import { resolveExpiredAuction, isExpiredAuction, createAdminClient } from './resolveAuction'

function buildAdmin(steps: ReturnType<typeof chainable>[]) {
  const from = vi.fn()
  steps.forEach((step) => from.mockReturnValueOnce(step))
  const fake = {
    from,
    auth: { admin: { getUserById: vi.fn().mockResolvedValue({ data: { user: { email: 'winner@example.com' } } }) } },
  }
  return { admin: asSupabaseClient(fake), from: fake.from, auth: fake.auth }
}

describe('isExpiredAuction', () => {
  const base = { status: 'AUCTION', is_auction: true, auction_deadline: '2000-01-01T00:00:00.000Z' }

  it('is true for a past deadline still marked AUCTION', () => {
    expect(isExpiredAuction(base)).toBe(true)
  })

  it('is false for a future deadline', () => {
    expect(isExpiredAuction({ ...base, auction_deadline: '2999-01-01T00:00:00.000Z' })).toBe(false)
  })

  it('is false once the auction has already ended', () => {
    expect(isExpiredAuction({ ...base, status: 'ENDED' })).toBe(false)
  })

  it('is false for a fixed-price (non-auction) listing', () => {
    expect(isExpiredAuction({ ...base, is_auction: false })).toBe(false)
  })

  it('is false with no deadline set', () => {
    expect(isExpiredAuction({ ...base, auction_deadline: null })).toBe(false)
  })
})

describe('createAdminClient', () => {
  it('returns null when the service role key is missing', () => {
    const prev = process.env.SUPABASE_SERVICE_ROLE_KEY
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
    expect(createAdminClient()).toBeNull()
    if (prev !== undefined) process.env.SUPABASE_SERVICE_ROLE_KEY = prev
  })
})

describe('resolveExpiredAuction', () => {
  const auction = { id: 'prod-1', seller_id: 'seller-1', title: 'Old Bike' }

  it('ends the auction with no buyer when there were no offers', async () => {
    const { admin, from } = buildAdmin([
      chainable({ data: [], error: null }), // offers lookup, empty
      chainable({ data: null, error: null }), // products update
    ])
    await resolveExpiredAuction(admin, auction)
    expect(from).toHaveBeenNthCalledWith(1, 'offers')
    expect(from).toHaveBeenNthCalledWith(2, 'products')
    const updateCall = from.mock.results[1].value
    expect(updateCall.update).toHaveBeenCalledWith({ status: 'ENDED' })
  })

  it('declares the highest bidder the winner, messages them, and ends the auction', async () => {
    const bestOffer = { amount: 5000, buyer_id: 'buyer-1' }
    const { admin, from, auth } = buildAdmin([
      chainable({ data: [bestOffer], error: null }), // offers lookup (ordered desc, limit 1)
      chainable({ data: null, error: null }), // existing conversation lookup: none
      chainable({ data: { id: 'convo-1' }, error: null }), // conversation insert
      chainable({ data: null, error: null }), // message insert
      chainable({ data: null, error: null }), // products update
    ])
    await resolveExpiredAuction(admin, auction)

    expect(auth.admin.getUserById).toHaveBeenCalledWith('buyer-1')

    const convoInsertBuilder = from.mock.results[2].value
    expect(convoInsertBuilder.insert).toHaveBeenCalledWith({
      product_id: 'prod-1',
      buyer_id: 'buyer-1',
      seller_id: 'seller-1',
    })

    const messageInsertBuilder = from.mock.results[3].value
    expect(messageInsertBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({ conversation_id: 'convo-1', sender_id: 'buyer-1' })
    )

    const productsUpdateBuilder = from.mock.results[4].value
    expect(productsUpdateBuilder.update).toHaveBeenCalledWith({ status: 'ENDED', buyer_id: 'buyer-1' })
  })

  it('reuses an existing conversation instead of creating a duplicate', async () => {
    const bestOffer = { amount: 5000, buyer_id: 'buyer-1' }
    const { admin, from } = buildAdmin([
      chainable({ data: [bestOffer], error: null }),
      chainable({ data: { id: 'existing-convo' }, error: null }), // existing conversation found
      chainable({ data: null, error: null }), // message insert
      chainable({ data: null, error: null }), // products update
    ])
    await resolveExpiredAuction(admin, auction)
    const messageInsertBuilder = from.mock.results[2].value
    expect(messageInsertBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({ conversation_id: 'existing-convo' })
    )
  })
})
