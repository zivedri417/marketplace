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
    <div className="min-h-screen bg-[#07070b] py-24 px-4 relative overflow-hidden">
      {/* Abstract Backgrounds */}
      <div className="absolute top-0 right-0 w-[40%] h-[40%] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[40%] h-[40%] rounded-full bg-purple-600/10 blur-[120px] pointer-events-none" />
      
      <div className="relative z-10 max-w-7xl mx-auto">
        <ListProductForm categories={categories || []} />
      </div>
    </div>
  )
}
