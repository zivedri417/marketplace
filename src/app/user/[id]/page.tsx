import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { UserHomepageClient } from '@/features/profile/components/UserHomepageClient'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', id).single()
  return {
    title: profile ? `${profile.full_name} | Marketplace` : 'User Profile',
  }
}

export default async function UserProfilePage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>,
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { id } = await params
  const resolvedSearchParams = await searchParams
  const { message, tab } = resolvedSearchParams
  
  const supabase = await createClient()
  const { data: { user: currentUser } } = await supabase.auth.getUser()

  // Fetch Profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (!profile) {
    notFound()
  }

  // Fetch Listings (Products) — an ended auction is never deleted automatically, just
  // marked ENDED, so it stays listed here until the seller deletes it themselves.
  const { data: listings } = await supabase
    .from('products')
    .select(`
      *,
      offers ( amount ),
      category:category_id ( name )
    `)
    .eq('seller_id', id)
    .in('status', ['AVAILABLE', 'AUCTION', 'ENDED'])
    .order('created_at', { ascending: false })

  // Fetch Reviews
  const { data: reviews } = await supabase
    .from('reviews')
    .select(`
      *,
      reviewer:reviewer_id ( full_name, avatar_url )
    `)
    .eq('seller_id', id)
    .order('created_at', { ascending: false })

  // Calculate Average Rating
  const averageRating = reviews && reviews.length > 0 
    ? reviews.reduce((acc, rev) => acc + rev.rating, 0) / reviews.length 
    : 0

  const isOwner = currentUser?.id === id

  // Fetch conversations only if owner
  let conversations = null
  if (isOwner) {
    const { data: convos } = await supabase
      .from('conversations')
      .select(`
        *,
        product:product_id ( title, images ),
        buyer:buyer_id ( full_name ),
        seller:seller_id ( full_name )
      `)
      .or(`buyer_id.eq.${id},seller_id.eq.${id}`)
      .order('created_at', { ascending: false })
      
    conversations = convos
  }

  return (
    <UserHomepageClient 
      profile={profile}
      listings={listings || []}
      reviews={reviews || []}
      averageRating={averageRating}
      isOwner={isOwner}
      conversations={conversations || []}
      message={message as string | undefined}
      initialTab={tab as string | undefined}
      currentUserId={currentUser?.id}
    />
  )
}
