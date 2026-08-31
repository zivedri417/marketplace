import { describe, it, expect, vi, beforeEach } from 'vitest'

const exchangeCodeForSessionMock = vi.fn()

vi.mock('@supabase/ssr', () => ({
  createServerClient: () => ({
    auth: { exchangeCodeForSession: exchangeCodeForSessionMock },
  }),
}))

vi.mock('next/headers', () => ({
  cookies: async () => ({ getAll: () => [], set: vi.fn() }),
}))

const { GET } = await import('./route')

beforeEach(() => {
  exchangeCodeForSessionMock.mockReset()
})

describe('GET /auth/callback', () => {
  // This is the exact regression from resetpasswordbug.md: the "forgot password"
  // email link carries ?code=...&next=/reset-password, and a successful code
  // exchange must land the user on /reset-password — not silently fall through
  // to the homepage.
  it('redirects to the reset-password page after a valid code with next=/reset-password', async () => {
    exchangeCodeForSessionMock.mockResolvedValue({ error: null })
    const req = new Request('https://example.com/auth/callback?code=abc123&next=/reset-password')
    const res = await GET(req)
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe('https://example.com/reset-password')
  })

  it('defaults to /verified when no next param is given', async () => {
    exchangeCodeForSessionMock.mockResolvedValue({ error: null })
    const req = new Request('https://example.com/auth/callback?code=abc123')
    const res = await GET(req)
    expect(res.headers.get('location')).toBe('https://example.com/verified')
  })

  it('redirects to a login error page when there is no code at all', async () => {
    const req = new Request('https://example.com/auth/callback')
    const res = await GET(req)
    expect(res.headers.get('location')).toBe('https://example.com/login?error=auth-callback-failed')
    expect(exchangeCodeForSessionMock).not.toHaveBeenCalled()
  })

  it('redirects to a login error page when the code exchange fails', async () => {
    exchangeCodeForSessionMock.mockResolvedValue({ error: { message: 'invalid code' } })
    const req = new Request('https://example.com/auth/callback?code=bad&next=/reset-password')
    const res = await GET(req)
    expect(res.headers.get('location')).toBe('https://example.com/login?error=auth-callback-failed')
  })
})
