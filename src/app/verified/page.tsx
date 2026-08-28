import Link from 'next/link'
import { CheckCircle2, ArrowRight } from 'lucide-react'

export default function VerifiedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#07070b] relative overflow-hidden">
      <div className="relative z-10 w-full max-w-md p-8 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 text-center">
        <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-8 h-8 text-green-400" />
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-4">Email Verified!</h1>
        <p className="text-gray-400 mb-8">
          Your email has been successfully verified. You can now access all features of the marketplace.
        </p>
        
        <Link
          href="/profile"
          className="inline-flex items-center justify-center w-full py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 transition-all"
        >
          Go to Profile
          <ArrowRight className="h-4 w-4 ml-2" />
        </Link>
      </div>

      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-green-600/20 blur-[120px] mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[120px] mix-blend-screen pointer-events-none" />
    </div>
  )
}
