import Link from 'next/link'
import { cardClass, cardHoverClass, monoLabelClass, priceClass, statusPill, formatTimeLeft, ENDING_SOON_MS } from '@/lib/ui'

// `now` is passed in (rather than read via Date.now() here) so this stays a pure
// function of its props — callers hold it in state, e.g. useState(() => Date.now()).
export function ProductCard({ item, now }: { item: any, now: number }) {
  const highestOffer = item.offers?.length > 0 ? Math.max(...item.offers.map((o: any) => o.amount)) : null
  const offerCount = item.offers?.length || 0
  // Reaching the deadline only ever marks an auction ENDED — SOLD is a separate, later
  // status the seller sets once themselves, never inferred from having a winning offer.
  const isEnded = item.status === 'ENDED'
  const isSold = item.status === 'SOLD'
  const isAuction = item.is_auction

  const msLeft = item.auction_deadline ? new Date(item.auction_deadline).getTime() - now : null
  const isEndingSoon = isAuction && !isEnded && msLeft !== null && msLeft > 0 && msLeft <= ENDING_SOON_MS
  // The mockup's one rule: vermilion only ever means "the clock is running".
  const isLive = isAuction && !isEnded && !isSold

  const priceLabel = isAuction ? (highestOffer ? 'Highest offer' : 'Starting at') : (isSold ? 'Sold for' : 'Buy now')
  const priceCents = isAuction ? (highestOffer ?? item.price) : item.price
  const meta = isAuction ? (offerCount > 0 ? `${offerCount} offer${offerCount === 1 ? '' : 's'}` : 'No offers yet') : item.location

  return (
    <Link
      href={`/products/${item.id}`}
      className={`block overflow-hidden group cursor-pointer ${cardClass} ${cardHoverClass}`}
    >
      <div className="aspect-[4/3] bg-[#14120e]/5 relative overflow-hidden">
        {item.images?.[0] ? (
          <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#14120e]/30 text-sm">No Image</div>
        )}

        {isSold ? (
          <span className={`absolute top-3 left-3 ${statusPill('sold')}`}>SOLD</span>
        ) : isEnded ? (
          <span className={`absolute top-3 left-3 ${statusPill('ended')}`}>ENDED</span>
        ) : isAuction && (
          <span className={`absolute top-3 left-3 ${statusPill(isEndingSoon ? 'ending-soon' : 'auction')}`}>
            {isEndingSoon ? 'ENDING SOON' : 'AUCTION'}
          </span>
        )}

        {isAuction && !isEnded && !isSold && item.auction_deadline && (
          <div className={`absolute bottom-0 left-0 right-0 px-3 py-2 font-mono text-[11px] flex items-center justify-between ${isEndingSoon ? 'bg-[#d93c14] text-white' : 'bg-[#14120e] text-[#efe9dc]'}`}>
            <span className="tracking-[0.14em] uppercase">Bidding</span>
            <span className={isEndingSoon ? 'text-white' : 'text-[#f0a98f]'}>{formatTimeLeft(item.auction_deadline, now)}</span>
          </div>
        )}
      </div>
      <div className="p-4">
        {item.category?.name && (
          <div className={monoLabelClass}>{item.category.name}</div>
        )}
        <div className="mt-1.5 font-serif text-xl text-[#14120e] truncate leading-snug">{item.title}</div>
        <div className="mt-3 flex items-baseline justify-between gap-2 border-t border-[#14120e]/15 pt-2.5">
          <div>
            <div className="text-[11px] text-[#14120e]/45">{priceLabel}</div>
            <div className={`mt-0.5 font-mono text-xl tracking-tight ${isLive ? 'text-[#d93c14]' : priceClass}`}>
              ${(priceCents / 100).toFixed(2)}
            </div>
          </div>
          {meta && <div className="text-[11px] text-[#14120e]/40 text-right uppercase font-mono tracking-[0.1em]">{meta}</div>}
        </div>
      </div>
    </Link>
  )
}
