import Link from 'next/link'
import { CheckCircle2, ArrowRight } from 'lucide-react'

export default function VerifiedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#efe9dc] p-4">
      <div className="w-full max-w-md p-8 border border-[#14120e]/20 bg-[#efe9dc] text-center">
        <div className="mx-auto w-16 h-16 border border-[#14120e] flex items-center justify-center mb-6">
          <CheckCircle2 className="w-8 h-8 text-[#14120e]" />
        </div>

        <h1 className="font-serif text-3xl text-[#14120e] mb-4">Email Verified!</h1>
        <p className="text-[#14120e]/60 mb-8 text-sm">
          Your email has been successfully verified. You can now access all features of the marketplace.
        </p>

        <Link
          href="/"
          className="w-full flex items-center justify-center py-3.5 px-4 bg-[#14120e] hover:bg-[#14120e]/90 text-[#efe9dc] text-sm transition-all"
        >
          Go to Homepage
          <ArrowRight className="h-4 w-4 ml-2" />
        </Link>
      </div>
    </div>
  )
}
