import Link from 'next/link'
import { PlusCircle, User, LogIn } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export async function Navbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-gray-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
              Marketplace
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-4">
            
            {/* List an Item Button */}
            <Link 
              href="/products/new" 
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 transition-all"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              List an Item
            </Link>

            {/* Profile / Auth Button */}
            {user ? (
              <Link 
                href="/profile" 
                className="inline-flex items-center justify-center p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all border border-transparent hover:border-white/10"
                title="Profile"
              >
                <User className="h-5 w-5" />
              </Link>
            ) : (
              <Link 
                href="/login" 
                className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-all border border-white/10"
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
