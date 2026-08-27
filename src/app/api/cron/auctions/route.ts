import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
  // Security check for Vercel Cron
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Missing Service Role Key' }, { status: 500 });
  }

  // Initialize Admin client to bypass RLS and access auth.users
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

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
      // 2. Fetch the highest offer
      const { data: offers } = await supabaseAdmin
        .from('offers')
        .select('*, buyer:profiles(full_name, id)')
        .eq('product_id', auction.id)
        .order('amount', { ascending: false })
        .limit(1)

      const bestOffer = offers && offers.length > 0 ? offers[0] : null;

      // 3. Fetch Seller email via Admin API
      const { data: { user: sellerUser } } = await supabaseAdmin.auth.admin.getUserById(auction.seller_id)
      const sellerEmail = sellerUser?.email

      if (sellerEmail) {
        // TODO: Replace console.log with actual email provider (e.g., Resend, SendGrid)
        if (bestOffer) {
          console.log(`[EMAIL DISPATCH] To: ${sellerEmail} | Subject: Auction Ended: ${auction.title} | Body: The best offer was $${(bestOffer.amount / 100).toFixed(2)} from ${bestOffer.buyer.full_name}.`)
        } else {
          console.log(`[EMAIL DISPATCH] To: ${sellerEmail} | Subject: Auction Ended: ${auction.title} | Body: No offers were made. Your item is now listed as available.`)
        }
      }

      // 4. Resolve the auction (Update status to AVAILABLE)
      await supabaseAdmin
        .from('products')
        .update({ status: 'AVAILABLE' })
        .eq('id', auction.id)

      processedCount++
    } catch (err) {
      console.error(`Failed to process auction ${auction.id}:`, err)
    }
  }

  return NextResponse.json({ success: true, processed: processedCount })
}
