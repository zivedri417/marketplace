'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, Edit3, MessageSquare, Package, CheckCircle, Send } from 'lucide-react'
import { updateBio } from '@/features/profile/actions'
import { createClient } from '@/lib/supabase/client'
import { logout } from '@/features/auth/actions'
import Link from 'next/link'

export function UserHomepageClient({ 
  profile, 
  listings, 
  reviews, 
  averageRating, 
  isOwner, 
  conversations,
  message,
  initialTab,
  currentUserId
}: any) {
  const [activeTab, setActiveTab] = useState<'listings' | 'reviews' | 'messages'>(
    (initialTab === 'messages' && isOwner) ? 'messages' : 'listings'
  )
  const [isEditingBio, setIsEditingBio] = useState(false)
  const [bioError, setBioError] = useState('')
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')

  const supabase = createClient()

  async function handleBioSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBioError('')
    const formData = new FormData(e.currentTarget)
    const res = await updateBio(formData)
    if (res?.error) {
      setBioError(res.error)
    } else {
      setIsEditingBio(false)
    }
  }

  async function loadMessages(conversationId: string) {
    setActiveConversationId(conversationId)
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
    setMessages(data || [])
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim() || !activeConversationId || !currentUserId) return

    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: activeConversationId,
        sender_id: currentUserId,
        content: newMessage
      })
      .select()
      .single()

    if (!error && data) {
      setMessages([...messages, data])
      setNewMessage('')
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Success Banner */}
        <AnimatePresence>
          {message === 'item-listed' && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-2xl flex items-center shadow-lg"
            >
              <CheckCircle className="w-5 h-5 mr-3" />
              Item listed successfully! It is now visible on your homepage.
            </motion.div>
          )}
        </AnimatePresence>

        {/* Profile Header */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 relative overflow-hidden backdrop-blur-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-[80px]" />
          
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center relative z-10">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-3xl font-bold text-white shadow-xl">
              {profile.full_name?.charAt(0) || 'U'}
            </div>
            <div className="flex-grow">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-white">{profile.full_name || 'User'}</h1>
                {isOwner && (
                  <form action={logout}>
                    <button type="submit" className="text-sm px-4 py-2 text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-xl transition-colors">
                      Sign Out
                    </button>
                  </form>
                )}
              </div>
              
              <div className="flex items-center mt-2 text-yellow-400">
                <Star className="w-5 h-5 fill-current" />
                <span className="ml-2 font-medium">{averageRating.toFixed(1)} / 5.0</span>
                <span className="text-gray-500 ml-2">({reviews.length} reviews)</span>
              </div>

              <div className="mt-4 text-gray-300">
                {isEditingBio ? (
                  <form onSubmit={handleBioSubmit} className="space-y-3">
                    <textarea 
                      name="bio"
                      defaultValue={profile.bio || ''} 
                      className="w-full bg-black/30 border border-white/20 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500"
                      rows={3}
                    />
                    {bioError && <p className="text-red-400 text-sm">{bioError}</p>}
                    <div className="flex gap-2">
                      <button type="submit" className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm transition-colors">Save</button>
                      <button type="button" onClick={() => setIsEditingBio(false)} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-colors">Cancel</button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-start gap-4">
                    <p className="whitespace-pre-wrap">{profile.bio || "No bio added yet."}</p>
                    {isOwner && (
                      <button onClick={() => setIsEditingBio(true)} className="text-gray-500 hover:text-white transition-colors">
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-4 border-b border-white/10 pb-4 overflow-x-auto">
          <button onClick={() => setActiveTab('listings')} className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors whitespace-nowrap ${activeTab === 'listings' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
            <Package className="w-4 h-4" /> Listings
          </button>
          <button onClick={() => setActiveTab('reviews')} className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors whitespace-nowrap ${activeTab === 'reviews' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
            <Star className="w-4 h-4" /> Reviews
          </button>
          {isOwner && (
            <button onClick={() => setActiveTab('messages')} className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors whitespace-nowrap ${activeTab === 'messages' ? 'bg-purple-600/20 text-purple-400' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
              <MessageSquare className="w-4 h-4" /> Messages
            </button>
          )}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'listings' && (
            <motion.div key="listings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.length === 0 ? (
                <div className="col-span-full text-center py-12 text-gray-500">No active listings.</div>
              ) : (
                listings.map((item: any) => {
                  const highestOffer = item.offers?.length > 0 ? Math.max(...item.offers.map((o: any) => o.amount)) : null
                  return (
                    <Link href={`/products/${item.id}`} key={item.id} className="block bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-purple-500/50 transition-colors group cursor-pointer">
                      <div className="aspect-[4/3] bg-black/50 relative">
                        {item.images?.[0] && <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />}
                        {item.status === 'ENDED' ? (
                          <div className="absolute top-2 right-2 bg-yellow-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">ENDED</div>
                        ) : item.is_auction && (
                          <div className="absolute top-2 right-2 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">AUCTION</div>
                        )}
                      </div>
                      <div className="p-5">
                        <h3 className="font-semibold text-white truncate text-lg">{item.title}</h3>
                        <div className="mt-2 text-indigo-400 font-bold">
                          {item.is_auction ? (
                            highestOffer ? `Highest Offer: $${(highestOffer/100).toFixed(2)}` : `Starting: $${(item.price/100).toFixed(2)}`
                          ) : (
                            `$${(item.price/100).toFixed(2)}`
                          )}
                        </div>
                      </div>
                    </Link>
                  )
                })
              )}
            </motion.div>
          )}

          {activeTab === 'reviews' && (
            <motion.div key="reviews" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              {reviews.length === 0 ? (
                <div className="text-center py-12 text-gray-500">No reviews yet.</div>
              ) : (
                reviews.map((rev: any) => (
                  <div key={rev.id} className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white font-bold">
                          {rev.reviewer?.full_name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="font-medium text-white">{rev.reviewer?.full_name || 'Anonymous'}</p>
                          <div className="flex text-yellow-400 mt-1">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`w-4 h-4 ${i < rev.rating ? 'fill-current' : 'text-gray-600'}`} />
                            ))}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500">{new Date(rev.created_at).toLocaleDateString()}</span>
                    </div>
                    {rev.comment && <p className="mt-4 text-gray-300">{rev.comment}</p>}
                  </div>
                ))
              )}
            </motion.div>
          )}

          {activeTab === 'messages' && isOwner && (
            <motion.div key="messages" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex h-[600px] border border-white/10 rounded-3xl overflow-hidden bg-black/20">
              {/* Conversations List */}
              <div className="w-1/3 border-r border-white/10 bg-white/5 overflow-y-auto">
                <div className="p-4 border-b border-white/10">
                  <h3 className="font-bold text-white">Conversations</h3>
                </div>
                {conversations.length === 0 ? (
                  <div className="p-6 text-center text-gray-500 text-sm">No active conversations.</div>
                ) : (
                  conversations.map((conv: any) => {
                    const isBuyer = conv.buyer_id === currentUserId
                    const otherPartyName = isBuyer ? conv.seller?.full_name : conv.buyer?.full_name
                    
                    return (
                      <button 
                        key={conv.id}
                        onClick={() => loadMessages(conv.id)}
                        className={`w-full text-left p-4 border-b border-white/5 hover:bg-white/5 transition-colors ${activeConversationId === conv.id ? 'bg-white/10' : ''}`}
                      >
                        <div className="font-medium text-white truncate">{conv.product?.title || 'Unknown Item'}</div>
                        <div className="text-sm text-gray-400 mt-1">With: {otherPartyName}</div>
                      </button>
                    )
                  })
                )}
              </div>
              
              {/* Chat Window */}
              <div className="flex-1 flex flex-col bg-black/40">
                {activeConversationId ? (
                  <>
                    <div className="flex-1 p-6 overflow-y-auto space-y-4">
                      {messages.map(msg => {
                        const isMe = msg.sender_id === currentUserId
                        return (
                          <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] p-3 rounded-2xl ${isMe ? 'bg-purple-600 text-white rounded-tr-sm' : 'bg-white/10 text-gray-200 rounded-tl-sm'}`}>
                              {msg.content}
                            </div>
                          </div>
                        )
                      })}
                      {messages.length === 0 && (
                        <div className="h-full flex items-center justify-center text-gray-500">No messages yet. Say hi!</div>
                      )}
                    </div>
                    <form onSubmit={sendMessage} className="p-4 bg-white/5 border-t border-white/10 flex gap-3">
                      <input 
                        type="text" 
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 focus:outline-none focus:border-purple-500 text-white"
                      />
                      <button type="submit" className="p-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-colors">
                        <Send className="w-5 h-5" />
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500 flex-col gap-4">
                    <MessageSquare className="w-12 h-12 opacity-50" />
                    <p>Select a conversation to start chatting.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
