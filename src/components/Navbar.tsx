import Link from 'next/link'
import { PlusCircle, LogIn } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { pillButtonPrimary } from '@/lib/ui'
import { CategoriesMenu } from '@/components/CategoriesMenu'
import { SearchBar } from '@/components/SearchBar'

export async function Navbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let initial = 'U'
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()
    initial = profile?.full_name?.charAt(0)?.toUpperCase() || 'U'
  }

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug')
    .order('name')

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-[#14120e]/15 bg-[#efe9dc]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-6">

          {/* Logo + nav labels */}
          <div className="flex items-center gap-9">
            <Link href="/" className="font-serif text-2xl tracking-tight text-[#14120e]">
              Marketplace
            </Link>
            <div className="hidden md:flex items-center gap-6 text-sm text-[#14120e]/60">
              <Link href="/auctions" className="hover:text-[#14120e] transition-colors">Auctions</Link>
              <CategoriesMenu categories={categories || []} />
            </div>
          </div>

          {/* Search + actions */}
          <div className="flex items-center gap-3">
            <SearchBar />

            <Link
              href="/products/new"
              className={`${pillButtonPrimary} px-5 py-2.5 text-sm`}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              List an Item
            </Link>

            {user ? (
              <Link
                href="/profile"
                className="flex-shrink-0 w-[38px] h-[38px] border border-[#14120e] flex items-center justify-center font-serif text-lg text-[#14120e] hover:bg-[#14120e]/5 transition-colors"
                title="Profile"
              >
                {initial}
              </Link>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-[#14120e]/80 hover:text-[#14120e] hover:bg-[#14120e]/5 transition-all border border-[#14120e]/20"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Sign In
              </Link>
            )}

          </div>
        </div>
      </div>
    </nav>
  )
}
