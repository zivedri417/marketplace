import Link from 'next/link'
import { Gavel, Gift, Timer, Trophy } from 'lucide-react'
import { cardClass, monoLabelClass, pillButtonPrimary, pillButtonSecondary } from '@/lib/ui'

export const metadata = {
  title: 'How Auctions Work | Marketplace',
}

const STEPS = [
  {
    icon: Gavel,
    title: 'List it as an auction',
    body: "When listing an item, toggle Auction instead of a fixed price. Set a starting price, a minimum accepted price, and a deadline — that's it.",
  },
  {
    icon: Timer,
    title: 'Buyers place offers',
    body: 'Each new offer has to beat the current highest one. The listing always shows the live highest offer and how many bids it has.',
  },
  {
    icon: Trophy,
    title: 'The deadline hits',
    body: "The moment it ends, the listing is marked Ended, the highest bidder gets emailed, and a conversation with the seller opens automatically so they can arrange the handoff.",
  },
  {
    icon: Gift,
    title: 'Wrap up the sale',
    body: 'Once the seller has sold the item, it’s no longer available.',
  },
]

export default function AuctionsPage() {
  return (
    <div className="min-h-screen bg-[#efe9dc] text-[#14120e] pt-16">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className={monoLabelClass}>Auctions</div>
        <h1 className="mt-3 font-serif text-[52px] leading-none tracking-tight">How auctions work</h1>
        <p className="mt-4 text-[#14120e]/60 text-[16px] max-w-2xl">
          Auctions let buyers compete for an item instead of paying a fixed price. Here&apos;s the whole lifecycle,
          start to finish.
        </p>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-5">
          {STEPS.map((step, idx) => (
            <div key={step.title} className={`${cardClass} p-6`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex-shrink-0 border border-[#14120e] flex items-center justify-center">
                  <step.icon className="w-5 h-5 text-[#14120e]" />
                </div>
                <div className={monoLabelClass}>Step {idx + 1}</div>
              </div>
              <h3 className="mt-4 font-serif text-2xl">{step.title}</h3>
              <p className="mt-1.5 text-sm text-[#14120e]/60 leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>

        <div className={`${cardClass} mt-8 p-7 flex items-center justify-between gap-6 flex-wrap`}>
          <div>
            <h3 className="font-serif text-2xl">Ready to see it live?</h3>
            <p className="text-sm text-[#14120e]/55 mt-1">Every auction currently taking bids, in one filtered view.</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Link href="/?filter=auctions" className={`${pillButtonPrimary} px-6 py-3 text-sm`}>
              Browse live auctions
            </Link>
            <Link href="/products/new" className={`${pillButtonSecondary} px-6 py-3 text-sm`}>
              Start an auction
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
