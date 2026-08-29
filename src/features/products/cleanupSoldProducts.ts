import { SupabaseClient } from '@supabase/supabase-js'

const SOLD_RETENTION_MS = 30 * 24 * 60 * 60 * 1000 // 1 month

/**
 * Permanently removes products that have been marked SOLD for over a month. Marking an
 * item sold (see markProductSold in actions.ts) never deletes anything itself — this
 * scheduled sweep is the only thing that does, later. Shared by the cron route and the
 * profile page's on-demand check below, same reasoning as resolveAuction.ts: the cron
 * schedule doesn't run in local dev, so a page load is the fallback that keeps things
 * correct there too.
 */
export async function deleteExpiredSoldProducts(supabaseAdmin: SupabaseClient): Promise<number> {
  const cutoff = new Date(Date.now() - SOLD_RETENTION_MS).toISOString()

  const { data: expiredSold, error } = await supabaseAdmin
    .from('products')
    .select('id, images')
    .eq('status', 'SOLD')
    .lt('sold_at', cutoff)

  if (error) throw error

  let deletedCount = 0
  for (const product of expiredSold ?? []) {
    try {
      const paths: string[] = (product.images || [])
        .map((url: string) => url.split('/product-images/')[1])
        .filter(Boolean)
      if (paths.length > 0) {
        await supabaseAdmin.storage.from('product-images').remove(paths)
      }

      // Conversations/offers for this product cascade-delete automatically (ON DELETE
      // CASCADE); reviews are untouched since they're about the user, not the product.
      const { error: deleteError } = await supabaseAdmin.from('products').delete().eq('id', product.id)
      if (deleteError) throw deleteError
      deletedCount++
    } catch (err) {
      console.error(`Failed to delete expired sold product ${product.id}:`, err)
    }
  }

  return deletedCount
}
