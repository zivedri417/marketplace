import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockSupabase, asMock } from '@/test/supabaseMock'

const redirectMock = vi.fn((url: string) => {
  throw new Error(`REDIRECT:${url}`)
})
const revalidatePathMock = vi.fn()

vi.mock('next/navigation', () => ({
  redirect: (url: string) => redirectMock(url),
}))
vi.mock('next/cache', () => ({
  revalidatePath: (path: string, type?: string) => revalidatePathMock(path, type),
}))

let currentClient: ReturnType<typeof createMockSupabase>['client'] | null = null

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => {
    if (!currentClient) currentClient = createMockSupabase(null).client
    return currentClient
  },
}))

const { login, signup, logout, resetPassword, updatePassword } = await import('./actions')

function formOf(fields: Record<string, string>) {
  const fd = new FormData()
  for (const [k, v] of Object.entries(fields)) fd.set(k, v)
  return fd
}

async function getSupabase() {
  return (await import('@/lib/supabase/server')).createClient()
}

const ORIGINAL_ENV = { ...process.env }

beforeEach(() => {
  currentClient = null
  redirectMock.mockClear()
  revalidatePathMock.mockClear()
  process.env = { ...ORIGINAL_ENV }
  delete process.env.NEXT_PUBLIC_SITE_URL
  delete process.env.NEXT_PUBLIC_VERCEL_URL
  delete process.env.VERCEL_URL
})

describe('login', () => {
  it('rejects a missing email or password', async () => {
    expect(await login(formOf({ email: '', password: 'x' }))).toEqual({
      error: 'Email and password are required',
    })
    expect(await login(formOf({ email: 'a@b.com', password: '' }))).toEqual({
      error: 'Email and password are required',
    })
  })

  it('surfaces the Supabase error on bad credentials', async () => {
    const supabase = await getSupabase()
    asMock(supabase.auth.signInWithPassword).mockResolvedValueOnce({
      error: { message: 'Invalid login credentials' },
    })
    const result = await login(formOf({ email: 'a@b.com', password: 'wrong' }))
    expect(result).toEqual({ error: 'Invalid login credentials' })
  })

  it('redirects to /profile on success', async () => {
    await expect(login(formOf({ email: 'a@b.com', password: 'right' }))).rejects.toThrow(
      'REDIRECT:/profile'
    )
  })
})

describe('signup', () => {
  it('rejects missing fields', async () => {
    const result = await signup(formOf({ email: '', password: 'x', fullName: 'Y' }))
    expect(result).toEqual({ error: 'All fields are required' })
  })

  it('redirects to /profile on success', async () => {
    await expect(
      signup(formOf({ email: 'a@b.com', password: 'secret123', fullName: 'A B' }))
    ).rejects.toThrow('REDIRECT:/profile')
  })
})

describe('logout', () => {
  it('redirects to /login regardless of prior state', async () => {
    await expect(logout()).rejects.toThrow('REDIRECT:/login')
  })

  it('does not throw when sign-out itself errors (void server action)', async () => {
    const supabase = await getSupabase()
    asMock(supabase.auth.signOut).mockResolvedValueOnce({ error: { message: 'boom' } })
    await expect(logout()).resolves.toBeUndefined()
    expect(redirectMock).not.toHaveBeenCalled()
  })
})

describe('resetPassword', () => {
  it('rejects a missing email', async () => {
    const result = await resetPassword(formOf({ email: '' }))
    expect(result).toEqual({ error: 'Email is required' })
  })

  it('falls back to localhost with no site URL configured', async () => {
    const supabase = await getSupabase()
    await resetPassword(formOf({ email: 'a@b.com' }))
    expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith('a@b.com', {
      redirectTo: 'http://localhost:3000/auth/callback?next=/reset-password',
    })
  })

  it('strips a trailing slash from the configured site URL', async () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com/'
    const supabase = await getSupabase()
    await resetPassword(formOf({ email: 'a@b.com' }))
    expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith('a@b.com', {
      redirectTo: 'https://example.com/auth/callback?next=/reset-password',
    })
  })

  it('adds https:// to a bare Vercel URL', async () => {
    process.env.NEXT_PUBLIC_VERCEL_URL = 'my-app.vercel.app'
    const supabase = await getSupabase()
    await resetPassword(formOf({ email: 'a@b.com' }))
    expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith('a@b.com', {
      redirectTo: 'https://my-app.vercel.app/auth/callback?next=/reset-password',
    })
  })

  it('surfaces a Supabase error', async () => {
    const supabase = await getSupabase()
    asMock(supabase.auth.resetPasswordForEmail).mockResolvedValueOnce({
      error: { message: 'rate limited' },
    })
    const result = await resetPassword(formOf({ email: 'a@b.com' }))
    expect(result).toEqual({ error: 'rate limited' })
  })
})

describe('updatePassword', () => {
  it('rejects a missing password', async () => {
    const result = await updatePassword(formOf({ password: '' }))
    expect(result).toEqual({ error: 'Password is required' })
  })

  it('redirects to login with a confirmation message on success', async () => {
    await expect(updatePassword(formOf({ password: 'newpass123' }))).rejects.toThrow(
      'REDIRECT:/login?message=password-updated'
    )
  })

  it('surfaces a Supabase error', async () => {
    const supabase = await getSupabase()
    asMock(supabase.auth.updateUser).mockResolvedValueOnce({
      error: { message: 'Password too weak' },
    })
    const result = await updatePassword(formOf({ password: '123' }))
    expect(result).toEqual({ error: 'Password too weak' })
  })
})
