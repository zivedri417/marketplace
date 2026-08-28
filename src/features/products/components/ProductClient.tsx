'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, MessageSquare, Trash2, Tag, MapPin, User, Clock, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { deleteProduct, startConversation, makeOffer } from '@/features/products/actions'

export function ProductClient({ product, currentUser }: { product: any, currentUser: any }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const isOwner = currentUser?.id === product.seller_id
  const images = product.images || []
  
  const highestOffer = product.offers?.length > 0 ? Math.max(...product.offers.map((o: any) => o.amount)) : null
  const minRequiredOffer = highestOffer ? highestOffer + 1 : (product.minimum_price || product.price)

  const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % images.length)
  const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this listing?')) return
    setIsSubmitting(true)
    const res = await deleteProduct(product.id)
    if (res?.error) {
      setError(res.error)
      setIsSubmitting(false)
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
        <div className="aspect-[4/3] bg-black/50 rounded-3xl overflow-hidden relative border border-white/10 group">
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
              <div className="w-full h-full flex items-center justify-center text-gray-600">No images</div>
            )}
          </AnimatePresence>
          
          {images.length > 1 && (
            <>
              <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80">
                <ChevronRight className="w-6 h-6" />
              </button>
              <div className="absolute bottom-4 left-1/2 -translate-y-1/2 flex gap-2">
                {images.map((_: any, idx: number) => (
                  <div key={idx} className={`w-2 h-2 rounded-full transition-colors ${idx === currentImageIndex ? 'bg-white' : 'bg-white/30'}`} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right Column: Info & Actions */}
      <div className="space-y-8">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-medium tracking-wide">
              {product.category?.name || 'Uncategorized'}
            </span>
            {product.is_auction && (
              <span className="px-3 py-1 bg-purple-600 rounded-full text-xs font-bold tracking-wide shadow-lg shadow-purple-600/20">
                AUCTION
              </span>
            )}
            {product.status !== 'AVAILABLE' && product.status !== 'AUCTION' && (
              <span className="px-3 py-1 bg-yellow-600 rounded-full text-xs font-bold tracking-wide shadow-lg shadow-yellow-600/20">
                {product.status}
              </span>
            )}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">{product.title}</h1>
          <div className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
            {product.is_auction ? (
              highestOffer ? `Highest Offer: $${(highestOffer/100).toFixed(2)}` : `Starting: $${(product.price/100).toFixed(2)}`
            ) : (
              `$${(product.price/100).toFixed(2)}`
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 py-6 border-y border-white/10">
          <Link href={`/user/${product.seller_id}`} className="w-12 h-12 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-xl font-bold hover:scale-105 transition-transform">
            {product.seller?.full_name?.charAt(0) || 'U'}
          </Link>
          <div>
            <div className="text-sm text-gray-400">Listed by</div>
            <Link href={`/user/${product.seller_id}`} className="font-medium hover:text-purple-400 transition-colors">
              {product.seller?.full_name || 'Anonymous User'}
            </Link>
          </div>
        </div>

        <div className="space-y-4 text-gray-300">
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-gray-500" />
            <span>{product.location}</span>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-gray-500" />
            <span>Listed on {new Date(product.created_at).toLocaleDateString()}</span>
          </div>
          {product.is_auction && product.auction_deadline && (
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-gray-500" />
              <span>
                {product.status === 'ENDED' ? 'Auction ended on ' : 'Auction deadline: '}
                {new Date(product.auction_deadline).toLocaleString()}
              </span>
            </div>
          )}
        </div>

        <div className="prose prose-invert">
          <p className="whitespace-pre-wrap leading-relaxed">{product.description}</p>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        <div className="pt-6">
          {isOwner ? (
            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">Manage Listing</h3>
                <p className="text-sm text-gray-400">You are the owner of this item.</p>
              </div>
              <button 
                onClick={handleDelete}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-5 h-5" /> Delete
              </button>
            </div>
          ) : (
            product.status === 'AVAILABLE' || product.status === 'AUCTION' ? (
              product.is_auction ? (
                <form onSubmit={handleMakeOffer} className="bg-white/5 border border-white/10 p-6 rounded-2xl space-y-4">
                  <div>
                    <h3 className="font-bold text-lg">Make an Offer</h3>
                    <p className="text-sm text-gray-400 mt-1">Must be at least ${(minRequiredOffer / 100).toFixed(2)}</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="relative flex-1">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                      <input 
                        type="number" 
                        name="amount"
                        step="0.01"
                        min={(minRequiredOffer / 100).toFixed(2)}
                        required
                        className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-8 pr-4 focus:outline-none focus:border-purple-500 text-white"
                        placeholder="0.00"
                      />
                    </div>
                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-bold transition-all disabled:opacity-50"
                    >
                      Place Offer
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={handleStartConversation}
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-2xl font-bold text-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                >
                  <MessageSquare className="w-6 h-6" /> Start Conversation
                </button>
              )
            ) : product.is_auction && product.status === 'ENDED' ? (
              <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                <h3 className="font-bold text-lg">Auction Ended</h3>
                <p className="text-sm text-gray-400 mt-1">
                  {highestOffer
                    ? `This auction has ended. The winning offer was $${(highestOffer / 100).toFixed(2)}.`
                    : 'This auction has ended with no offers.'}
                </p>
              </div>
            ) : null
          )}
        </div>
      </div>
    </div>
  )
}
