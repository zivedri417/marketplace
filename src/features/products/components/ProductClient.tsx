'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, MessageSquare, CheckCircle2, MapPin, Clock, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { markProductSold, startConversation, makeOffer } from '@/features/products/actions'
import { cardClass, monoLabelClass, pillButtonPrimary, pillButtonSecondary, pillButtonDanger, priceGradientClass, statusPill, formatTimeLeft, ENDING_SOON_MS } from '@/lib/ui'

export function ProductClient({ product, currentUser, sellerRating, sellerReviewCount }: { product: any, currentUser: any, sellerRating: number, sellerReviewCount: number }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [now, setNow] = useState(() => Date.now())
  const router = useRouter()

  const isOwner = currentUser?.id === product.seller_id
  const images = product.images || []

  const offers = [...(product.offers || [])].sort((a: any, b: any) => b.amount - a.amount)
  const highestOffer = offers.length > 0 ? offers[0].amount : null
  const minRequiredOffer = highestOffer ? highestOffer + 1 : (product.minimum_price || product.price)
  const isAuctionLive = product.is_auction && product.status === 'AUCTION'
  // Reaching the deadline only ever marks an auction ENDED — SOLD is a separate, later
  // status the seller sets once themselves (see handleMarkSold), never inferred here.
  const isEnded = product.status === 'ENDED'
  const isSold = product.status === 'SOLD'
  const winner = isEnded && product.is_auction ? offers[0] : null

  const msLeft = product.auction_deadline ? new Date(product.auction_deadline).getTime() - now : null
  const isEndingSoon = isAuctionLive && msLeft !== null && msLeft > 0 && msLeft <= ENDING_SOON_MS

  // Live countdown for auctions still running — same idea as the mockup's timer.
  useEffect(() => {
    if (!isAuctionLive) return
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [isAuctionLive])

  const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % images.length)
  const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)

  async function handleMarkSold() {
    if (!confirm('Mark this listing as sold? It will stop being offered or bid on, and will be removed automatically after 30 days.')) return
    setIsSubmitting(true)
    const res = await markProductSold(product.id)
    if (res?.error) {
      setError(res.error)
      setIsSubmitting(false)
    } else {
      setIsSubmitting(false)
      router.refresh()
    }
  }

  async function handleStartConversation() {
    setIsSubmitting(true)
    const res = await startConversation(product.id, product.seller_id)
    if (res?.error) {
      setError(res.error)
      setIsSubmitting(false)
    }
  }

  async function handleMakeOffer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    setError('')
    setIsSubmitting(true)
    const formData = new FormData(form)
    formData.append('product_id', product.id)
    const res = await makeOffer(formData)
    if (res?.error) {
      setError(res.error)
    } else {
      form.reset()
    }
    setIsSubmitting(false)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
      {/* Left Column: Image Gallery */}
      <div className="space-y-4">
        <div className={`aspect-[4/3] bg-black/50 rounded-[24px] overflow-hidden relative border border-white/10 group`}>
          <AnimatePresence mode="wait">
            {images.length > 0 ? (
              <motion.img
                key={currentImageIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                src={images[currentImageIndex]}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/30">No images</div>
            )}
          </AnimatePresence>

          {isSold ? (
            <span className={`absolute top-4 left-4 ${statusPill('sold')}`}>SOLD</span>
          ) : product.is_auction && (
            <span className={`absolute top-4 left-4 ${statusPill(isEnded ? 'ended' : (isEndingSoon ? 'ending-soon' : 'auction'))}`}>
              {isEnded ? 'ENDED' : (isEndingSoon ? 'ENDING SOON' : 'AUCTION')}
            </span>
          )}

          {images.length > 1 && (
            <>
              <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 w-[42px] h-[42px] rounded-full border border-white/15 bg-black/50 backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80 flex items-center justify-center">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 w-[42px] h-[42px] rounded-full border border-white/15 bg-black/50 backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80 flex items-center justify-center">
                <ChevronRight className="w-5 h-5" />
              </button>
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
                {images.map((_: any, idx: number) => (
                  <div key={idx} className={`rounded-full transition-all ${idx === currentImageIndex ? 'w-[22px] h-[6px] bg-white' : 'w-[6px] h-[6px] bg-white/40'}`} />
                ))}
              </div>
            </>
          )}
        </div>

        {images.length > 1 && (
          <div className="grid grid-cols-4 gap-3">
            {images.map((img: string, idx: number) => (
              <button
                key={idx}
                onClick={() => setCurrentImageIndex(idx)}
                className={`aspect-square rounded-2xl overflow-hidden border transition-colors ${idx === currentImageIndex ? 'border-indigo-300/70' : 'border-white/10 hover:border-white/25'}`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right Column: Info & Actions */}
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="px-3 py-[5px] rounded-full text-[11px] font-semibold tracking-wide border border-white/15 bg-white/5 text-white/75">
              {product.category?.name?.toUpperCase() || 'UNCATEGORIZED'}
            </span>
            {isSold ? (
              <span className={statusPill('sold')}>SOLD</span>
            ) : product.is_auction ? (
              <span className={statusPill(isEnded ? 'ended' : (isEndingSoon ? 'ending-soon' : 'auction'))}>
                {isEnded ? 'ENDED' : (isEndingSoon ? 'ENDING SOON' : 'AUCTION')}
              </span>
            ) : product.status === 'AVAILABLE' && (
              <span className={statusPill('available')}>AVAILABLE</span>
            )}
          </div>
          <h1 className="text-4xl md:text-[38px] font-bold tracking-tight leading-tight mb-2">{product.title}</h1>
          {!product.is_auction && (
            <div className={`text-3xl font-bold tracking-tight ${priceGradientClass}`}>
              ${(product.price / 100).toFixed(2)}
            </div>
          )}
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Auction offer panel */}
        {product.is_auction && isAuctionLive && (
          <div className="p-6 rounded-[22px] border border-indigo-300/20 bg-gradient-to-br from-indigo-600/[0.16] to-purple-600/10 backdrop-blur-xl">
            <div className="flex items-end justify-between gap-5 flex-wrap">
              <div>
                <div className={monoLabelClass}>Highest offer</div>
                <div className={`mt-1 text-[42px] font-bold tracking-tight leading-none ${priceGradientClass}`}>
                  ${((highestOffer ?? product.price) / 100).toFixed(2)}
                </div>
                <div className="text-[13px] text-white/50 mt-1.5">
                  {offers.length} offer{offers.length === 1 ? '' : 's'} · started at ${(product.price / 100).toFixed(2)}
                </div>
              </div>
              {product.auction_deadline && (
                <div className="text-right">
                  <div className={monoLabelClass}>Ends in</div>
                  <div className="mt-1.5 font-mono text-2xl font-medium text-yellow-300">{formatTimeLeft(product.auction_deadline, now)}</div>
                  <div className="text-[13px] text-white/50 mt-1">{new Date(product.auction_deadline).toLocaleString()}</div>
                </div>
              )}
            </div>

            {!isOwner && (
              <form onSubmit={handleMakeOffer} className="mt-5 space-y-2.5">
                <div className="flex gap-2.5 items-stretch">
                  <div className="flex-1 flex items-center gap-2 px-4 rounded-2xl border border-white/15 bg-black/30">
                    <span className="text-white/50">$</span>
                    <input
                      type="number"
                      name="amount"
                      step="0.01"
                      min={(minRequiredOffer / 100).toFixed(2)}
                      required
                      className="flex-1 bg-transparent border-none py-3.5 text-[17px] font-semibold text-white outline-none"
                      placeholder={`${(minRequiredOffer / 100).toFixed(2)} or more`}
                    />
                  </div>
                  <button type="submit" disabled={isSubmitting} className={`${pillButtonPrimary} px-6 text-[15px]`}>
                    Place Offer
                  </button>
                </div>
                <div className="text-xs text-white/45">
                  Minimum next offer is ${(minRequiredOffer / 100).toFixed(2)}. Offers are binding until the auction closes.
                </div>
              </form>
            )}
          </div>
        )}

        {/* Seller row */}
        <div className="flex items-center justify-between gap-4 p-4 rounded-[20px] border border-white/10 bg-white/[0.045]">
          <div className="flex items-center gap-3">
            <Link href={`/user/${product.seller_id}`} className="w-[46px] h-[46px] bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-lg font-bold hover:brightness-110 transition-all flex-shrink-0">
              {product.seller?.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </Link>
            <div>
              <Link href={`/user/${product.seller_id}`} className="font-semibold text-white hover:text-purple-300 transition-colors">
                {product.seller?.full_name || 'Anonymous User'}
              </Link>
              <div className="mt-0.5 text-xs text-white/55 flex items-center gap-1.5">
                {sellerReviewCount > 0 ? (
                  <>
                    <span className="text-yellow-300">{'★'.repeat(Math.round(sellerRating))}</span>
                    {sellerRating.toFixed(1)} · {sellerReviewCount} review{sellerReviewCount === 1 ? '' : 's'}
                  </>
                ) : 'No reviews yet'}
              </div>
            </div>
          </div>
          {!isOwner && product.is_auction && isAuctionLive && (
            <button onClick={handleStartConversation} disabled={isSubmitting} className={`${pillButtonSecondary} px-[18px] py-2.5 text-[13px]`}>
              Message seller
            </button>
          )}
        </div>

        <div className="space-y-3 text-white/65 text-sm">
          <div className="flex items-center gap-2.5">
            <MapPin className="w-4 h-4 text-white/40 flex-shrink-0" />
            <span>{product.location}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-white/40 flex-shrink-0" />
            <span>Listed {new Date(product.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        <p className="whitespace-pre-wrap leading-relaxed text-[15px] text-white/75">{product.description}</p>

        {/* Offer history */}
        {product.is_auction && offers.length > 0 && (
          <div className="p-[18px] rounded-[20px] border border-white/10 bg-white/[0.035]">
            <div className={monoLabelClass}>Offer history</div>
            <div className="mt-3 space-y-2.5">
              {offers.slice(0, 10).map((o: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs font-semibold">
                      {o.buyer?.full_name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <span className="text-white/80">{o.buyer?.full_name || 'Anonymous bidder'}</span>
                  </div>
                  <div className="flex items-center gap-3.5">
                    <span className="text-xs text-white/40">{new Date(o.created_at).toLocaleDateString()}</span>
                    <span className="font-semibold">${(o.amount / 100).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-2">
          {isOwner ? (
            <div className={`${cardClass} p-6 flex items-center justify-between gap-4 flex-wrap`}>
              <div>
                <h3 className="font-bold text-lg">Manage Listing</h3>
                <p className="text-sm text-white/55 mt-1">
                  {isSold ? "Sold — this listing will be removed automatically after 30 days." : 'You own this item.'}
                </p>
              </div>
              {!isSold && (
                <button
                  onClick={handleMarkSold}
                  disabled={isSubmitting}
                  className={`${pillButtonDanger} gap-2 px-6 py-3 text-sm`}
                >
                  <CheckCircle2 className="w-4 h-4" /> Mark as sold
                </button>
              )}
            </div>
          ) : (
            !product.is_auction && (product.status === 'AVAILABLE') ? (
              <button
                onClick={handleStartConversation}
                disabled={isSubmitting}
                className={`w-full gap-2 px-8 py-4 text-lg ${pillButtonPrimary}`}
              >
                <MessageSquare className="w-5 h-5" /> Start Conversation
              </button>
            ) : isSold ? (
              <div className={`${cardClass} p-6`}>
                <h3 className="font-bold text-lg">Item Sold</h3>
                <p className="text-sm text-white/55 mt-1">This item has already been sold and is no longer available.</p>
              </div>
            ) : isEnded ? (
              <div className={`${cardClass} p-6 ${winner ? 'border-emerald-400/25 bg-gradient-to-br from-emerald-600/[0.12] to-indigo-600/[0.06]' : ''}`}>
                <h3 className="font-bold text-lg">Auction Ended</h3>
                {winner ? (
                  <>
                    <div className={monoLabelClass + ' mt-3'}>Winning offer</div>
                    <div className="mt-1 text-3xl font-bold tracking-tight text-emerald-200">${(winner.amount / 100).toFixed(2)}</div>
                    <div className="mt-2 flex items-center gap-2.5 text-sm text-white/70">
                      <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs font-semibold">
                        {winner.buyer?.full_name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      {winner.buyer?.full_name || 'Anonymous bidder'} won on {new Date(product.auction_deadline || product.updated_at).toLocaleDateString()}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-white/55 mt-1">This auction ended without any offers.</p>
                )}
              </div>
            ) : null
          )}
        </div>
      </div>
    </div>
  )
}
