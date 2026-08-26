import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/features/auth/actions'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-gray-950 p-8 text-white">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex justify-between items-center bg-white/5 p-6 rounded-2xl border border-white/10">
          <div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
              Welcome, {profile?.full_name || 'User'}
            </h1>
            <p className="text-gray-400">{user.email}</p>
          </div>
          
          <form action={logout}>
            <button
              type="submit"
              className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl transition-colors font-medium"
            >
              Sign Out
            </button>
          </form>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
            <h2 className="text-xl font-semibold mb-4">Your Listings</h2>
            <div className="text-gray-400 flex items-center justify-center h-32 border border-dashed border-white/10 rounded-xl">
              No listings yet.
            </div>
          </div>
          <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
            <h2 className="text-xl font-semibold mb-4">Recent Messages</h2>
            <div className="text-gray-400 flex items-center justify-center h-32 border border-dashed border-white/10 rounded-xl">
              No messages yet.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
