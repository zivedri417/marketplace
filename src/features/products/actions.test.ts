import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockSupabase, chainable, asMock } from '@/test/supabaseMock'

const redirectMock = vi.fn((url: string) => {
  throw new Error(`REDIRECT:${url}`)
})
const revalidatePathMock = vi.fn()

vi.mock('next/navigation', () => ({
  redirect: (url: string) => redirectMock(url),
}))
vi.mock('next/cache', () => ({
  revalidatePath: (path: string) => revalidatePathMock(path),
}))

let mockUser: { id: string; email?: string } | null = null
// createClient() is called fresh inside every server action; tests need that
// call and their own setup call to land on the *same* mock client instance
// so a `.from` mock configured in the test is actually the one the action
// under test sees. Caching per-test (reset in beforeEach) achieves that.
let currentClient: ReturnType<typeof createMockSupabase>['client'] | null = null

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => {
    if (!currentClient) currentClient = createMockSupabase(mockUser).client
    return currentClient
  },
}))

// Re-import after mocks are registered
const { createProduct, markProductSold, startConversation, makeOffer } = await import('./actions')

function buildFormData(fields: Record<string, string>) {
  const fd = new FormData()
  for (const [k, v] of Object.entries(fields)) fd.set(k, v)
  return fd
}

async function getSupabase() {
  return (await import('@/lib/supabase/server')).createClient()
}

beforeEach(() => {
  mockUser = null
  currentClient = null
  redirectMock.mockClear()
  revalidatePathMock.mockClear()
})

describe('createProduct', () => {
  const validFields = {
    title: 'Bike',
    description: 'A nice bike',
    category_id: 'cat-1',
    location: 'Tel Aviv',
    price: '100',
  }

  it('rejects when not logged in', async () => {
    mockUser = null
    const result = await createProduct(buildFormData(validFields), ['img1'])
    expect(result).toEqual({ error: 'You must be logged in to list an item.' })
  })

  it('rejects a zero price', async () => {
    mockUser = { id: 'user-1' }
    const result = await createProduct(buildFormData({ ...validFields, price: '0' }), ['img1'])
    expect(result?.error).toMatch(/fill out all required fields/i)
  })

  it('rejects a negative price', async () => {
    mockUser = { id: 'user-1' }
    const result = await createProduct(buildFormData({ ...validFields, price: '-5' }), ['img1'])
    expect(result?.error).toMatch(/fill out all required fields/i)
  })

  it('rejects missing required fields (no title)', async () => {
    mockUser = { id: 'user-1' }
    const result = await createProduct(buildFormData({ ...validFields, title: '' }), ['img1'])
    expect(result?.error).toMatch(/fill out all required fields/i)
  })

  it('rejects zero images', async () => {
    mockUser = { id: 'user-1' }
    const result = await createProduct(buildFormData(validFields), [])
    expect(result?.error).toMatch(/between 1 and 10 images/i)
  })

  it('rejects more than 10 images', async () => {
    mockUser = { id: 'user-1' }
    const result = await createProduct(buildFormData(validFields), Array(11).fill('img'))
    expect(result?.error).toMatch(/between 1 and 10 images/i)
  })

  it('rejects an auction with no deadline/minimum price', async () => {
    mockUser = { id: 'user-1' }
    const result = await createProduct(
      buildFormData({ ...validFields, is_auction: 'true' }),
      ['img1']
    )
    expect(result?.error).toMatch(/auctions require/i)
  })

  it('rejects an auction with a zero minimum price', async () => {
    mockUser = { id: 'user-1' }
    const result = await createProduct(
      buildFormData({
        ...validFields,
        is_auction: 'true',
        minimum_price: '0',
        auction_deadline: '2999-01-01T00:00:00.000Z',
      }),
      ['img1']
    )
    expect(result?.error).toMatch(/auctions require/i)
  })

  it('creates a valid listing and redirects', async () => {
    mockUser = { id: 'user-1' }
    const fd = buildFormData(validFields)

    // `from('products').insert(...).select('id').single()` resolves to the new row.
    const supabase = await getSupabase()
    asMock(supabase.from).mockReturnValueOnce(
      chainable({ data: { id: 'prod-1' }, error: null })
    )

    await expect(createProduct(fd, ['img1'])).rejects.toThrow(
      'REDIRECT:/user/user-1?message=item-listed'
    )
    expect(revalidatePathMock).toHaveBeenCalledWith('/products')
  })
})

describe('markProductSold', () => {
  it('rejects when not authenticated', async () => {
    mockUser = null
    const result = await markProductSold('prod-1')
    expect(result).toEqual({ error: 'Not authenticated' })
  })

  it('rejects when the caller does not own the product', async () => {
    mockUser = { id: 'user-1' }
    const supabase = await getSupabase()
    asMock(supabase.from).mockReturnValueOnce(
      chainable({ data: { seller_id: 'someone-else', status: 'AVAILABLE' }, error: null })
    )
    const result = await markProductSold('prod-1')
    expect(result).toEqual({ error: 'Not authorized' })
  })

  it('rejects a product that is already sold', async () => {
    mockUser = { id: 'user-1' }
    const supabase = await getSupabase()
    asMock(supabase.from).mockReturnValueOnce(
      chainable({ data: { seller_id: 'user-1', status: 'SOLD' }, error: null })
    )
    const result = await markProductSold('prod-1')
    expect(result?.error).toMatch(/already marked as sold/i)
  })

  it('marks an owned, unsold product as sold', async () => {
    mockUser = { id: 'user-1' }
    const supabase = await getSupabase()
    asMock(supabase.from)
      .mockReturnValueOnce(chainable({ data: { seller_id: 'user-1', status: 'AVAILABLE' }, error: null }))
      .mockReturnValueOnce(chainable({ data: null, error: null }))
    const result = await markProductSold('prod-1')
    expect(result).toEqual({ success: true })
  })
})

describe('startConversation', () => {
  it('redirects to login when not authenticated', async () => {
    mockUser = null
    await expect(startConversation('prod-1', 'seller-1')).rejects.toThrow(
      'REDIRECT:/login?message=login-required'
    )
  })

  it('blocks starting a conversation with yourself', async () => {
    mockUser = { id: 'seller-1' }
    const result = await startConversation('prod-1', 'seller-1')
    expect(result).toEqual({ error: 'You cannot start a conversation with yourself.' })
  })

  it('reuses an existing conversation and redirects to messages', async () => {
    mockUser = { id: 'buyer-1' }
    const supabase = await getSupabase()
    asMock(supabase.from).mockReturnValueOnce(
      chainable({ data: { id: 'convo-1' }, error: null })
    )
    await expect(startConversation('prod-1', 'seller-1')).rejects.toThrow(
      'REDIRECT:/user/buyer-1?tab=messages'
    )
  })

  it('creates a new conversation when none exists', async () => {
    mockUser = { id: 'buyer-1' }
    const supabase = await getSupabase()
    asMock(supabase.from)
      .mockReturnValueOnce(chainable({ data: null, error: null })) // existing lookup: none
      .mockReturnValueOnce(chainable({ data: { id: 'convo-2' }, error: null })) // insert
    await expect(startConversation('prod-1', 'seller-1')).rejects.toThrow(
      'REDIRECT:/user/buyer-1?tab=messages'
    )
  })
})

describe('makeOffer', () => {
  function offerForm(amount: string, product_id = 'prod-1') {
    return buildFormData({ product_id, amount })
  }

  it('rejects when not logged in', async () => {
    mockUser = null
    const result = await makeOffer(offerForm('100'))
    expect(result).toEqual({ error: 'You must be logged in to make an offer.' })
  })

  it('rejects a non-numeric or non-positive amount', async () => {
    mockUser = { id: 'buyer-1' }
    const result = await makeOffer(offerForm('0'))
    expect(result?.error).toMatch(/valid amount/i)
  })

  it('rejects bidding on a product that is not an active auction', async () => {
    mockUser = { id: 'buyer-1' }
    const supabase = await getSupabase()
    asMock(supabase.from).mockReturnValueOnce(
      chainable({ data: { minimum_price: 1000, status: 'AVAILABLE', offers: [] }, error: null })
    )
    const result = await makeOffer(offerForm('50'))
    expect(result?.error).toMatch(/not available for auction/i)
  })

  it('rejects bidding on an auction that already ended', async () => {
    mockUser = { id: 'buyer-1' }
    const supabase = await getSupabase()
    asMock(supabase.from).mockReturnValueOnce(
      chainable({ data: { minimum_price: 1000, status: 'ENDED', offers: [] }, error: null })
    )
    const result = await makeOffer(offerForm('50'))
    expect(result?.error).toMatch(/not available for auction/i)
  })

  it('rejects an offer below the minimum price', async () => {
    mockUser = { id: 'buyer-1' }
    const supabase = await getSupabase()
    asMock(supabase.from).mockReturnValueOnce(
      chainable({ data: { minimum_price: 1000, status: 'AUCTION', offers: [] }, error: null })
    )
    const result = await makeOffer(offerForm('5')) // $5 < $10 minimum
    expect(result?.error).toMatch(/at least \$10\.00/)
  })

  it('rejects an offer that does not beat the current highest bid', async () => {
    mockUser = { id: 'buyer-1' }
    const supabase = await getSupabase()
    asMock(supabase.from).mockReturnValueOnce(
      chainable({
        data: { minimum_price: 1000, status: 'AUCTION', offers: [{ amount: 5000 }] },
        error: null,
      })
    )
    const result = await makeOffer(offerForm('50')) // ties the current highest ($50)
    expect(result?.error).toMatch(/higher than the current highest offer \(\$50\.00\)/)
  })

  it('accepts a valid offer above the current highest bid', async () => {
    mockUser = { id: 'buyer-1' }
    const supabase = await getSupabase()
    asMock(supabase.from)
      .mockReturnValueOnce(
        chainable({
          data: { minimum_price: 1000, status: 'AUCTION', offers: [{ amount: 5000 }] },
          error: null,
        })
      )
      .mockReturnValueOnce(chainable({ data: null, error: null })) // insert
    const result = await makeOffer(offerForm('60'))
    expect(result).toEqual({ success: true })
  })

  it('rejects a second, lower concurrent bid after the highest offer moved (race condition)', async () => {
    // Simulates two bids racing for the same auction: bidder A's offer of $60 has
    // already landed by the time bidder B's read sees the product, so B's $55 bid
    // must be rejected against the post-A highest, not a stale value.
    mockUser = { id: 'buyer-2' }
    const supabase = await getSupabase()
    asMock(supabase.from).mockReturnValueOnce(
      chainable({
        data: { minimum_price: 1000, status: 'AUCTION', offers: [{ amount: 5000 }, { amount: 6000 }] },
        error: null,
      })
    )
    const result = await makeOffer(offerForm('55'))
    expect(result?.error).toMatch(/higher than the current highest offer \(\$60\.00\)/)
  })
})
