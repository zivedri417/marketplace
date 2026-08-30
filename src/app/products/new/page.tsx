import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ListProductForm } from '@/features/products/components/ListProductForm'

export const metadata = {
  title: 'List an Item | Marketplace',
}

export default async function NewProductPage() {
  const supabase = await createClient()
  
  // Protect route
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login?next=/products/new')
  }

  // Fetch categories
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .order('name')

  return (
    <div className="min-h-screen bg-[#efe9dc] py-24 px-4">
      <div className="max-w-7xl mx-auto">
        <ListProductForm categories={categories || []} />
      </div>
    </div>
  )
}
