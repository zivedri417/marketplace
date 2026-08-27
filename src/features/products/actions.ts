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
