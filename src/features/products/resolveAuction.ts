import { createClient, SupabaseClient } from '@supabase/supabase-js'

/**
 * Resolving an expired auction (marking it ENDED, recording the winner, notifying them,
 * and starting the "I won" conversation) needs to bypass RLS, so it always runs through
 * the service-role admin client — never the request-scoped one.
 */
export function createAdminClient(): SupabaseClient | null {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY)
}

interface ExpiredAuction {
  id: string
  seller_id: string
  title: string
}

/**
 * Resolves a single expired auction: emails the winning bidder, starts (or reuses) their
 * conversation with the seller with the automatic "I won" message, and marks the listing
 * ENDED (keeping the post up, with buyer_id set to the winner) — or just marks it ENDED if
 * nobody bid. Shared by the Vercel Cron route and the product page's on-demand check below,
 * so an auction gets resolved the moment anyone looks at it even if the cron never fires
 * (e.g. in local dev, where `vercel.json`'s cron schedule doesn't run).
 */
export async function resolveExpiredAuction(supabaseAdmin: SupabaseClient, auction: ExpiredAuction) {
  // Fetch the highest offer (the winner, if any)
  const { data: offers } = await supabaseAdmin
    .from('offers')
    .select('*, buyer:profiles(full_name, id)')
    .eq('product_id', auction.id)
    .order('amount', { ascending: false })
    .limit(1)

  const bestOffer = offers && offers.length > 0 ? offers[0] : null

  if (bestOffer) {
    const winnerId = bestOffer.buyer_id

    // Email the winning buyer to let them know they won
    const { data: { user: winnerUser } } = await supabaseAdmin.auth.admin.getUserById(winnerId)
    const winnerEmail = winnerUser?.email

    if (winnerEmail) {
      // TODO: Replace console.log with actual email provider (e.g., Resend, SendGrid)
      console.log(`[EMAIL DISPATCH] To: ${winnerEmail} | Subject: You won the auction for "${auction.title}"! | Body: Congratulations! Your offer of $${(bestOffer.amount / 100).toFixed(2)} was the highest and you won "${auction.title}". Check your messages to coordinate with the seller.`)
    }

    // Automatically start (or reuse) a conversation with the seller
    const { data: existingConvo } = await supabaseAdmin
      .from('conversations')
      .select('id')
      .eq('product_id', auction.id)
      .eq('buyer_id', winnerId)
      .single()

    let conversationId = existingConvo?.id

    if (!conversationId) {
      const { data: newConvo, error: convoError } = await supabaseAdmin
        .from('conversations')
        .insert({
          product_id: auction.id,
          buyer_id: winnerId,
          seller_id: auction.seller_id
        })
        .select('id')
        .single()

      if (convoError) throw convoError
      conversationId = newConvo.id
    }

    // Drop the automatic "I won" message into the conversation
    const { error: messageError } = await supabaseAdmin
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: winnerId,
        content: `Hey I just won the auction for the item: ${auction.title}`
      })

    if (messageError) throw messageError

    // End the auction but keep the listing up (status ENDED, not deleted)
    // until the seller removes it themselves. Record the winner as the buyer.
    await supabaseAdmin
      .from('products')
      .update({ status: 'ENDED', buyer_id: winnerId })
      .eq('id', auction.id)
  } else {
    // No offers were made — nothing to notify the winner about, just end the auction.
    await supabaseAdmin
      .from('products')
      .update({ status: 'ENDED' })
      .eq('id', auction.id)
  }
}

/** True when a product is still marked AUCTION but its deadline has already passed. */
export function isExpiredAuction(product: { status: string; is_auction: boolean; auction_deadline: string | null }): boolean {
  return product.is_auction && product.status === 'AUCTION' && !!product.auction_deadline && new Date(product.auction_deadline) <= new Date()
}
