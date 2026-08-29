import { NextResponse } from 'next/server'
import { createAdminClient, resolveExpiredAuction } from '@/features/products/resolveAuction'
import { deleteExpiredSoldProducts } from '@/features/products/cleanupSoldProducts'

export async function GET(request: Request) {
  // Security check for Vercel Cron
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseAdmin = createAdminClient()
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Missing Service Role Key' }, { status: 500 });
  }

  const now = new Date().toISOString()

  // 1. Fetch expired auctions
  const { data: expiredAuctions, error } = await supabaseAdmin
    .from('products')
    .select('id, seller_id, title')
    .eq('status', 'AUCTION')
    .lt('auction_deadline', now)

  if (error) {
    console.error('Error fetching expired auctions:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let processedCount = 0;

  for (const auction of expiredAuctions) {
    try {
      await resolveExpiredAuction(supabaseAdmin, auction)
      processedCount++
    } catch (err) {
      console.error(`Failed to process auction ${auction.id}:`, err)
    }
  }

  // 2. Also sweep out any listing that's been marked SOLD for over a month.
  let deletedSoldCount = 0
  try {
    deletedSoldCount = await deleteExpiredSoldProducts(supabaseAdmin)
  } catch (err) {
    console.error('Error cleaning up expired sold products:', err)
  }

  return NextResponse.json({ success: true, processed: processedCount, deletedSold: deletedSoldCount })
}
