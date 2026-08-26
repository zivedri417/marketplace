import Link from 'next/link'
import { ArrowRight, ShoppingBag } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950 text-white selection:bg-purple-500/30">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 flex flex-col items-center justify-center text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-sm">
          <ShoppingBag className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-medium text-gray-300">The next-gen marketplace</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8">
          Discover. Buy. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
            Sell with ease.
          </span>
        </h1>
        
        <p className="max-w-2xl text-lg md:text-xl text-gray-400 mb-12">
          Join our vibrant community to discover unique items or start selling your own. Experience a marketplace built for the modern web.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/register"
            className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-full transition-all hover:scale-105 active:scale-95"
          >
            Start Selling
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-gray-300 hover:text-white transition-colors"
          >
            Sign In
          </Link>
        </div>
      </main>
      
      {/* Abstract Background */}
      <div className="fixed top-[-50%] left-[-20%] w-[100%] h-[100%] rounded-full bg-indigo-900/20 blur-[150px] pointer-events-none -z-10" />
      <div className="fixed bottom-[-50%] right-[-20%] w-[100%] h-[100%] rounded-full bg-fuchsia-900/20 blur-[150px] pointer-events-none -z-10" />
    </div>
  )
}
