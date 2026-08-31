import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockSupabase, chainable, asMock } from '@/test/supabaseMock'

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

let mockUser: { id: string; email?: string } | null = null
let currentClient: ReturnType<typeof createMockSupabase>['client'] | null = null

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => {
    if (!currentClient) currentClient = createMockSupabase(mockUser).client
    return currentClient
  },
}))

const { updateBio, submitReview } = await import('./actions')

function formOf(fields: Record<string, string>) {
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
})

describe('updateBio', () => {
  it('rejects when not authenticated', async () => {
    const result = await updateBio(formOf({ bio: 'hi' }))
    expect(result).toEqual({ error: 'Not authenticated' })
  })

  it('updates the bio for the logged-in user', async () => {
    mockUser = { id: 'user-1' }
    const supabase = await getSupabase()
    asMock(supabase.from).mockReturnValueOnce(chainable({ data: null, error: null }))
    const result = await updateBio(formOf({ bio: 'hello world' }))
    expect(result).toEqual({ success: true })
  })
})

describe('submitReview', () => {
  it('rejects when not authenticated', async () => {
    const result = await submitReview(formOf({ seller_id: 's-1', rating: '5' }))
    expect(result).toEqual({ error: 'You must be logged in to leave a review.' })
  })

  it('rejects a missing seller_id', async () => {
    mockUser = { id: 'user-1' }
    const result = await submitReview(formOf({ seller_id: '', rating: '5' }))
    expect(result).toEqual({ error: 'Missing user to review.' })
  })

  it('blocks reviewing yourself', async () => {
    mockUser = { id: 'user-1' }
    const result = await submitReview(formOf({ seller_id: 'user-1', rating: '5' }))
    expect(result).toEqual({ error: 'You cannot review yourself.' })
  })

  it.each(['0', '6', 'abc'])('rejects an out-of-range or non-numeric rating (%s)', async (rating) => {
    mockUser = { id: 'user-1' }
    const result = await submitReview(formOf({ seller_id: 'seller-1', rating }))
    expect(result?.error).toMatch(/star rating from 1 to 5/i)
  })

  it('rejects a comment over the max length', async () => {
    mockUser = { id: 'user-1' }
    const longComment = 'x'.repeat(301)
    const result = await submitReview(
      formOf({ seller_id: 'seller-1', rating: '5', comment: longComment })
    )
    expect(result?.error).toMatch(/300 characters or fewer/i)
  })

  it('accepts a valid review at the boundary comment length', async () => {
    mockUser = { id: 'user-1' }
    const supabase = await getSupabase()
    asMock(supabase.from).mockReturnValueOnce(chainable({ data: null, error: null }))
    const okComment = 'x'.repeat(300)
    const result = await submitReview(
      formOf({ seller_id: 'seller-1', rating: '5', comment: okComment })
    )
    expect(result).toEqual({ success: true })
  })
})
