import { describe, it, expect, vi } from 'vitest'
import { chainable, asSupabaseClient } from '@/test/supabaseMock'
import { deleteExpiredSoldProducts } from './cleanupSoldProducts'

function buildAdmin(selectResult: { data: unknown; error: unknown }, deleteResults: { data: unknown; error: unknown }[] = []) {
  const from = vi.fn()
  from.mockReturnValueOnce(chainable(selectResult)) // the initial SOLD-and-past-cutoff select
  deleteResults.forEach((r) => from.mockReturnValueOnce(chainable(r)))
  const remove = vi.fn().mockResolvedValue({ data: null, error: null })
  const fake = { from, storage: { from: vi.fn(() => ({ remove })) } }
  return { admin: asSupabaseClient(fake), remove }
}

describe('deleteExpiredSoldProducts', () => {
  it('deletes nothing when no products are past the retention window', async () => {
    const { admin } = buildAdmin({ data: [], error: null })
    const count = await deleteExpiredSoldProducts(admin)
    expect(count).toBe(0)
  })

  it('throws when the initial lookup errors', async () => {
    const { admin } = buildAdmin({ data: null, error: { message: 'db down' } })
    await expect(deleteExpiredSoldProducts(admin)).rejects.toEqual({ message: 'db down' })
  })

  it('removes stored images and deletes each expired SOLD product', async () => {
    const { admin, remove } = buildAdmin(
      {
        data: [
          { id: 'p1', images: ['https://x.supabase.co/storage/v1/object/public/product-images/p1/a.jpg'] },
          { id: 'p2', images: [] },
        ],
        error: null,
      },
      [
        { data: null, error: null }, // delete p1
        { data: null, error: null }, // delete p2
      ]
    )
    const count = await deleteExpiredSoldProducts(admin)
    expect(count).toBe(2)
    expect(remove).toHaveBeenCalledWith(['p1/a.jpg'])
  })

  it('keeps going and only counts successful deletions when one product errors', async () => {
    const { admin } = buildAdmin(
      { data: [{ id: 'p1', images: [] }, { id: 'p2', images: [] }], error: null },
      [
        { data: null, error: { message: 'delete failed' } }, // p1 delete fails
        { data: null, error: null }, // p2 delete succeeds
      ]
    )
    const count = await deleteExpiredSoldProducts(admin)
    expect(count).toBe(1)
  })
})
