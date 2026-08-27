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
