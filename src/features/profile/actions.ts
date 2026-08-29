'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function updateBio(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const bio = formData.get('bio') as string

  const { error } = await supabase
    .from('profiles')
    .update({ bio })
    .eq('id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/user/${user.id}`)
  return { success: true }
}

const MAX_REVIEW_COMMENT_LENGTH = 300

export async function submitReview(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'You must be logged in to leave a review.' }
  }

  const seller_id = formData.get('seller_id') as string
  if (!seller_id) {
    return { error: 'Missing user to review.' }
  }
  if (seller_id === user.id) {
    return { error: 'You cannot review yourself.' }
  }

  const rating = parseInt(formData.get('rating') as string, 10)
  if (isNaN(rating) || rating < 1 || rating > 5) {
    return { error: 'Please select a star rating from 1 to 5.' }
  }

  const comment = ((formData.get('comment') as string) || '').trim()
  if (comment.length > MAX_REVIEW_COMMENT_LENGTH) {
    return { error: `Review must be ${MAX_REVIEW_COMMENT_LENGTH} characters or fewer.` }
  }

  const { error } = await supabase
    .from('reviews')
    .insert({
      seller_id,
      reviewer_id: user.id,
      rating,
      comment: comment || null,
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/user/${seller_id}`)
  return { success: true }
}
