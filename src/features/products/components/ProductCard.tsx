import Link from 'next/link'
import { cardClass, cardHoverClass, monoLabelClass, priceGradientClass, statusPill, formatTimeLeft, ENDING_SOON_MS } from '@/lib/ui'

// `now` is passed in (rather than read via Date.now() here) so this stays a pure
// function of its props — callers hold it in state, e.g. useState(() => Date.now()).
export function ProductCard({ item, now }: { item: any, now: number }) {
  const highestOffer = item.offers?.length > 0 ? Math.max(...item.offers.map((o: any) => o.amount)) : null
  const offerCount = item.offers?.length || 0
  const isEnded = item.status === 'ENDED'
  const isAuction = item.is_auction

  const msLeft = item.auction_deadline ? new Date(item.auction_deadline).getTime() - now : null
  const isEndingSoon = isAuction && !isEnded && msLeft !== null && msLeft > 0 && msLeft <= ENDING_SOON_MS

  const priceLabel = isAuction ? (highestOffer ? 'Highest offer' : 'Starting at') : (isEnded ? 'Sold for' : 'Buy now')
  const priceCents = isAuction ? (highestOffer ?? item.price) : item.price
  const meta = isAuction ? (offerCount > 0 ? `${offerCount} offer${offerCount === 1 ? '' : 's'}` : 'No offers yet') : item.location

  return (
    <Link
      href={`/products/${item.id}`}
      className={`block overflow-hidden group cursor-pointer ${cardClass} ${cardHoverClass}`}
    >
      <div className="aspect-[4/3] bg-black/50 relative overflow-hidden">
        {item.images?.[0] ? (
          <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/30 text-sm">No Image</div>
        )}

        {isEnded ? (
          <span className={`absolute top-3 left-3 ${statusPill(highestOffer ? 'sold' : 'ended')}`}>
            {highestOffer ? 'SOLD' : 'ENDED'}
          </span>
        ) : isAuction && (
          <span className={`absolute top-3 left-3 ${statusPill(isEndingSoon ? 'ending-soon' : 'auction')}`}>
            {isEndingSoon ? 'ENDING SOON' : 'AUCTION'}
          </span>
        )}

        {isAuction && !isEnded && item.auction_deadline && (
          <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full font-mono text-[11px] bg-black/70 border border-white/10 backdrop-blur-sm text-yellow-300">
            {formatTimeLeft(item.auction_deadline, now)}
          </div>
        )}
      </div>
      <div className="p-4">
        {item.category?.name && (
          <div className={monoLabelClass}>{item.category.name}</div>
        )}
        <div className="mt-1.5 text-[15px] font-semibold text-white truncate leading-snug">{item.title}</div>
        <div className="mt-3 flex items-baseline justify-between gap-2">
          <div>
            <div className="text-[11px] text-white/45">{priceLabel}</div>
            <div className={`mt-0.5 text-xl font-bold tracking-tight ${priceGradientClass}`}>
              ${(priceCents / 100).toFixed(2)}
            </div>
          </div>
          {meta && <div className="text-[11px] text-white/40 text-right">{meta}</div>}
        </div>
      </div>
    </Link>
  )
}
