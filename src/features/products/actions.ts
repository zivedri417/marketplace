'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function createProduct(formData: FormData, imageUrls: string[]) {
  const supabase = await createClient()
  
  // Authenticate user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'You must be logged in to list an item.' }
  }

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const category_id = formData.get('category_id') as string
  const location = formData.get('location') as string
  const priceDollars = parseFloat(formData.get('price') as string)
  
  const is_auction = formData.get('is_auction') === 'true'
  const minimumPriceDollars = formData.get('minimum_price') ? parseFloat(formData.get('minimum_price') as string) : null
  const auction_deadline = formData.get('auction_deadline') as string || null

  // Validate
  if (!title || !category_id || !location || isNaN(priceDollars) || priceDollars <= 0) {
    return { error: 'Please fill out all required fields correctly.' }
  }

  if (imageUrls.length < 1 || imageUrls.length > 10) {
    return { error: 'You must upload between 1 and 10 images.' }
  }

  if (is_auction) {
    if (!auction_deadline || !minimumPriceDollars || minimumPriceDollars <= 0) {
      return { error: 'Auctions require a valid minimum price and deadline.' }
    }
  }

  // Convert to cents
  const price = Math.round(priceDollars * 100)
  const minimum_price = minimumPriceDollars ? Math.round(minimumPriceDollars * 100) : null

  // Insert product
  const { data: product, error } = await supabase
    .from('products')
    .insert({
      seller_id: user.id,
      title,
      description,
      category_id,
      location,
      price,
      images: imageUrls,
      is_auction,
      minimum_price,
      auction_deadline,
      status: is_auction ? 'AUCTION' : 'AVAILABLE'
    })
    .select('id')
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/products')
  redirect(`/user/${user.id}?message=item-listed`)
}

export async function deleteProduct(productId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Check ownership
  const { data: product } = await supabase.from('products').select('seller_id').eq('id', productId).single()
  if (product?.seller_id !== user.id) return { error: 'Not authorized' }

  const { error } = await supabase.from('products').delete().eq('id', productId)
  if (error) return { error: error.message }

  revalidatePath('/')
  redirect(`/user/${user.id}`)
}

export async function startConversation(productId: string, sellerId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login?message=login-required')
  }
  if (user.id === sellerId) {
    return { error: 'You cannot start a conversation with yourself.' }
  }

  // Check if conversation already exists
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('product_id', productId)
    .eq('buyer_id', user.id)
    .single()

  let conversationId = existing?.id

  // Create new if not exists
  if (!conversationId) {
    const { data: newConvo, error } = await supabase
      .from('conversations')
      .insert({
        product_id: productId,
        buyer_id: user.id,
        seller_id: sellerId
      })
      .select('id')
      .single()

    if (error) return { error: error.message }
    conversationId = newConvo.id
  }

  redirect(`/user/${user.id}?tab=messages`)
}

export async function makeOffer(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be logged in to make an offer.' }

  const product_id = formData.get('product_id') as string
  const amountDollars = parseFloat(formData.get('amount') as string)
  
  if (isNaN(amountDollars) || amountDollars <= 0) {
    return { error: 'Please enter a valid amount.' }
  }

  const amount = Math.round(amountDollars * 100)

  // Validate the offer against current highest and minimum
  const { data: product } = await supabase
    .from('products')
    .select('minimum_price, status, offers(amount)')
    .eq('id', product_id)
    .single()

  if (!product || product.status !== 'AUCTION') {
    return { error: 'This item is not available for auction.' }
  }

  if (product.minimum_price && amount < product.minimum_price) {
    return { error: `Offer must be at least $${(product.minimum_price / 100).toFixed(2)}.` }
  }

  const currentHighest = product.offers?.length > 0 ? Math.max(...product.offers.map((o:any) => o.amount)) : 0
  if (amount <= currentHighest) {
    return { error: `You must bid higher than the current highest offer ($${(currentHighest / 100).toFixed(2)}).` }
  }

  const { error } = await supabase
    .from('offers')
    .insert({
      product_id,
      buyer_id: user.id,
      amount
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/products/${product_id}`)
  return { success: true }
}
