import Link from 'next/link'
import { CheckCircle2, ArrowRight } from 'lucide-react'

export default function VerifiedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
      <div className="w-full max-w-md p-8 border border-white/10 rounded-3xl bg-white/5 backdrop-blur-xl text-center">
        <div className="mx-auto w-16 h-16 border border-green-500/20 bg-green-500/10 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-green-500/10">
          <CheckCircle2 className="w-8 h-8 text-green-400" />
        </div>

        <h1 className="text-3xl font-bold text-white mb-4">Email Verified!</h1>
        <p className="text-gray-400 mb-8">
          Your email has been successfully verified. You can now access all features of the marketplace.
        </p>

        <Link
          href="/"
          className="w-full flex items-center justify-center py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-semibold transition-all"
        >
          Go to Homepage
          <ArrowRight className="h-4 w-4 ml-2" />
        </Link>
      </div>
    </div>
  )
}
