'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, Edit3, MessageSquare, Package, CheckCircle, Send } from 'lucide-react'
import { updateBio } from '@/features/profile/actions'
import { createClient } from '@/lib/supabase/client'
import { logout } from '@/features/auth/actions'
import { ProductCard } from '@/features/products/components/ProductCard'
import { cardClass, monoLabelClass, pillButtonPrimary, pillButtonSecondary, inputClass } from '@/lib/ui'

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
  // Computed once on mount (not read directly during render) to stay a pure render.
  const [now] = useState(() => Date.now())

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

  const tabs = [
    { id: 'listings' as const, label: 'Listings', icon: Package, show: true },
    { id: 'reviews' as const, label: 'Reviews', icon: Star, show: true },
    { id: 'messages' as const, label: 'Messages', icon: MessageSquare, show: isOwner },
  ]

  return (
    <div className="min-h-screen bg-[#07070b] py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Success Banner */}
        <AnimatePresence>
          {message === 'item-listed' && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 px-[18px] py-3.5 rounded-2xl border border-emerald-400/28 bg-emerald-500/10 text-emerald-300 text-sm font-semibold"
            >
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              Item listed successfully! It is now visible on your homepage.
            </motion.div>
          )}
        </AnimatePresence>

        {/* Profile Header */}
        <div className={`${cardClass} p-7 relative overflow-hidden`}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-[80px]" />

          <div className="flex flex-col md:flex-row gap-7 items-start md:items-start justify-between relative z-10">
            <div className="flex gap-5">
              <div className="w-[88px] h-[88px] flex-shrink-0 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-3xl font-bold text-white shadow-xl">
                {profile.full_name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div>
                <h1 className="text-[28px] font-bold text-white leading-tight">{profile.full_name || 'User'}</h1>

                <div className="flex items-center gap-2 mt-2 text-sm text-white/62">
                  <span className="text-yellow-300 text-base tracking-wider">★★★★★</span>
                  <span className="font-semibold text-white">{averageRating.toFixed(1)}</span>
                  <span className="text-white/45">· {reviews.length} review{reviews.length === 1 ? '' : 's'}</span>
                </div>

                <div className="mt-3 max-w-xl text-white/70 text-[14.5px]">
                  {isEditingBio ? (
                    <form onSubmit={handleBioSubmit} className="space-y-3">
                      <textarea
                        name="bio"
                        defaultValue={profile.bio || ''}
                        className={`${inputClass} p-3 text-sm`}
                        rows={3}
                      />
                      {bioError && <p className="text-red-400 text-sm">{bioError}</p>}
                      <div className="flex gap-2">
                        <button type="submit" className={`${pillButtonPrimary} px-4 py-2 text-sm`}>Save</button>
                        <button type="button" onClick={() => setIsEditingBio(false)} className={`${pillButtonSecondary} px-4 py-2 text-sm`}>Cancel</button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex items-start gap-3">
                      <p className="whitespace-pre-wrap leading-relaxed">{profile.bio || "No bio added yet."}</p>
                      {isOwner && (
                        <button onClick={() => setIsEditingBio(true)} className="text-white/40 hover:text-white transition-colors flex-shrink-0">
                          <Edit3 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 items-end w-full md:w-auto">
              {isOwner && (
                <form action={logout}>
                  <button type="submit" className={`${pillButtonSecondary} px-5 py-2.5 text-[13px]`}>
                    Sign Out
                  </button>
                </form>
              )}
              <div className="flex gap-5 px-5 py-3.5 rounded-[18px] border border-white/10 bg-white/[0.04]">
                <div className="text-center">
                  <div className="text-xl font-bold">{listings.length}</div>
                  <div className="text-[11px] text-white/50">Listings</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold">{reviews.length}</div>
                  <div className="text-[11px] text-white/50">Reviews</div>
                </div>
                {isOwner && (
                  <div className="text-center">
                    <div className="text-xl font-bold">{conversations.length}</div>
                    <div className="text-[11px] text-white/50">Conversations</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-1.5 p-1.5 rounded-full border border-white/10 bg-white/[0.04] w-fit">
          {tabs.filter(t => t.show).map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold transition-colors whitespace-nowrap ${
                activeTab === t.id ? 'text-white bg-gradient-to-r from-indigo-600 to-purple-600' : 'text-white/62 hover:text-white'
              }`}
            >
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'listings' && (
            <motion.div key="listings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {listings.length === 0 ? (
                <div className="col-span-full text-center py-16 text-white/45">No active listings.</div>
              ) : (
                listings.map((item: any) => <ProductCard item={item} now={now} key={item.id} />)
              )}
            </motion.div>
          )}

          {activeTab === 'reviews' && (
            <motion.div key="reviews" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-[18px]">
              {reviews.length === 0 ? (
                <div className="col-span-full text-center py-16 text-white/45">No reviews yet.</div>
              ) : (
                reviews.map((rev: any) => (
                  <div key={rev.id} className={`${cardClass} p-[22px]`}>
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white font-semibold text-[15px] flex-shrink-0">
                          {rev.reviewer?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="font-semibold text-white text-[14.5px]">{rev.reviewer?.full_name || 'Anonymous'}</p>
                          <div className="mt-0.5 text-[15px] tracking-wider">
                            <span className="text-yellow-300">{'★'.repeat(rev.rating)}</span>
                            <span className="text-white/20">{'★'.repeat(5 - rev.rating)}</span>
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-white/42 flex-shrink-0">{new Date(rev.created_at).toLocaleDateString()}</span>
                    </div>
                    {rev.comment && <p className="mt-3.5 text-[14px] leading-relaxed text-white/72">{rev.comment}</p>}
                  </div>
                ))
              )}
            </motion.div>
          )}

          {activeTab === 'messages' && isOwner && (
            <motion.div key="messages" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-[18px] h-[560px]">
              {/* Conversations List */}
              <div className={`${cardClass} p-3.5 flex flex-col gap-2 overflow-y-auto`}>
                <div className={monoLabelClass + ' px-2 py-1.5'}>Conversations</div>
                {conversations.length === 0 ? (
                  <div className="p-6 text-center text-white/45 text-sm">No active conversations.</div>
                ) : (
                  conversations.map((conv: any) => {
                    const isBuyer = conv.buyer_id === currentUserId
                    const otherPartyName = isBuyer ? conv.seller?.full_name : conv.buyer?.full_name
                    const isActive = activeConversationId === conv.id

                    return (
                      <button
                        key={conv.id}
                        onClick={() => loadMessages(conv.id)}
                        className={`w-full text-left p-3.5 rounded-2xl transition-colors cursor-pointer ${
                          isActive
                            ? 'border border-indigo-300/30 bg-gradient-to-br from-indigo-600/20 to-purple-600/[0.12]'
                            : 'border border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.07]'
                        }`}
                      >
                        <div className="font-semibold text-white text-sm truncate">{conv.product?.title || 'Unknown Item'}</div>
                        <div className="text-[12.5px] text-white/55 mt-1">{otherPartyName}</div>
                      </button>
                    )
                  })
                )}
              </div>

              {/* Chat Window */}
              <div className={`${cardClass} flex flex-col overflow-hidden`}>
                {activeConversationId ? (
                  <>
                    <div className="flex-1 p-5 overflow-y-auto space-y-3">
                      {messages.map(msg => {
                        const isMe = msg.sender_id === currentUserId
                        return (
                          <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] px-4 py-3 text-sm leading-relaxed ${
                              isMe
                                ? 'rounded-[18px_18px_6px_18px] bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                                : 'rounded-[18px_18px_18px_6px] bg-white/[0.08] border border-white/[0.08] text-white/88'
                            }`}>
                              {msg.content}
                            </div>
                          </div>
                        )
                      })}
                      {messages.length === 0 && (
                        <div className="h-full flex items-center justify-center text-white/40 text-sm">No messages yet. Say hi!</div>
                      )}
                    </div>
                    <form onSubmit={sendMessage} className="flex gap-2.5 p-4 border-t border-white/[0.07]">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        placeholder="Write a message…"
                        className={`${inputClass} flex-1 px-4 py-3 text-sm rounded-full`}
                      />
                      <button type="submit" className="w-[46px] h-[46px] flex-shrink-0 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:brightness-110 text-white flex items-center justify-center transition-all">
                        <Send className="w-4 h-4" />
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="h-full flex items-center justify-center text-white/40 flex-col gap-3">
                    <MessageSquare className="w-10 h-10 opacity-50" />
                    <p className="text-sm">Select a conversation to start chatting.</p>
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
