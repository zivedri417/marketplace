import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

let mockUser: { id: string } | null = null

vi.mock('@supabase/ssr', () => ({
  createServerClient: () => ({
    auth: { getUser: async () => ({ data: { user: mockUser } }) },
  }),
}))

const { updateSession } = await import('./middleware')

beforeEach(() => {
  mockUser = null
})

function req(path: string) {
  return new NextRequest(new URL(path, 'https://example.com'))
}

describe('updateSession route protection', () => {
  it('redirects an unauthenticated user away from /products/new with the listing message', async () => {
    const res = await updateSession(req('/products/new'))
    expect(res.status).toBe(307)
    const location = new URL(res.headers.get('location')!)
    expect(location.pathname).toBe('/login')
    expect(location.searchParams.get('message')).toBe('login-required-for-listing')
  })

  it('redirects an unauthenticated user away from /profile without the listing message', async () => {
    const res = await updateSession(req('/profile'))
    expect(res.status).toBe(307)
    const location = new URL(res.headers.get('location')!)
    expect(location.pathname).toBe('/login')
    expect(location.searchParams.get('message')).toBeNull()
  })

  it('lets an authenticated user through to /products/new', async () => {
    mockUser = { id: 'user-1' }
    const res = await updateSession(req('/products/new'))
    expect(res.headers.get('location')).toBeNull()
  })

  it('does not redirect away from public routes when unauthenticated', async () => {
    const res = await updateSession(req('/'))
    expect(res.headers.get('location')).toBeNull()
  })

  it('never redirects away from /login itself, even unauthenticated', async () => {
    const res = await updateSession(req('/login'))
    expect(res.headers.get('location')).toBeNull()
  })
})
