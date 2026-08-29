'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, Loader2 } from 'lucide-react'
import { searchMarketplace, type ProductSearchResult, type UserSearchResult } from '@/features/search/actions'
import { monoLabelClass } from '@/lib/ui'

const DEBOUNCE_MS = 250

export function SearchBar() {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [products, setProducts] = useState<ProductSearchResult[]>([])
  const [users, setUsers] = useState<UserSearchResult[]>([])
  const rootRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  useEffect(() => {
    // All state updates happen inside this callback (post-debounce), not synchronously
    // in the effect body — including the empty-query case, so clearing stale results
    // doesn't fire on every keystroke either.
    const timer = setTimeout(async () => {
      const q = query.trim()
      if (!q) {
        setProducts([])
        setUsers([])
        setIsLoading(false)
        return
      }
      setIsLoading(true)
      const res = await searchMarketplace(q, 5)
      setProducts(res.products)
      setUsers(res.users)
      setIsLoading(false)
    }, DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [query])

  function goToResultsPage() {
    const q = query.trim()
    if (!q) return
    setOpen(false)
    router.push(`/search?q=${encodeURIComponent(q)}`)
  }

  const hasResults = products.length > 0 || users.length > 0
  const showPanel = open && query.trim().length > 0

  return (
    <div ref={rootRef} className="relative hidden lg:block w-64">
      <form
        onSubmit={e => { e.preventDefault(); goToResultsPage() }}
        className="flex items-center gap-2 w-full px-3.5 py-2.5 rounded-full border border-white/10 bg-white/5 text-sm text-white/80 focus-within:border-indigo-300/60 transition-colors"
      >
        {isLoading ? (
          <Loader2 className="h-3.5 w-3.5 flex-shrink-0 animate-spin text-white/40" />
        ) : (
          <Search className="h-3.5 w-3.5 flex-shrink-0 text-white/40" strokeWidth={2.5} />
        )}
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder="Search items or people"
          className="w-full bg-transparent outline-none placeholder-white/40"
        />
      </form>

      {showPanel && (
        <div className="absolute left-0 top-full mt-3 w-[26rem] max-w-[90vw] rounded-2xl border border-white/10 bg-[#0d0d14] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.6)] p-2 z-50 max-h-[70vh] overflow-y-auto">
          {!isLoading && !hasResults ? (
            <div className="px-3 py-4 text-sm text-white/40 text-center">No matches for &quot;{query.trim()}&quot;.</div>
          ) : (
            <>
              {products.length > 0 && (
                <div className="mb-1">
                  <div className={`${monoLabelClass} px-3 py-1.5`}>Items</div>
                  {products.map(p => (
                    <Link
                      key={p.id}
                      href={`/products/${p.id}`}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/[0.06] transition-colors"
                    >
                      <div className="w-9 h-9 flex-shrink-0 rounded-lg bg-black/40 overflow-hidden">
                        {p.images?.[0] && <img src={p.images[0]} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm text-white/85 truncate">{p.title}</div>
                        <div className="text-xs text-white/45">${(p.price / 100).toFixed(2)}{p.is_auction ? ' · auction' : ''}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {users.length > 0 && (
                <div>
                  <div className={`${monoLabelClass} px-3 py-1.5`}>People</div>
                  {users.map(u => (
                    <Link
                      key={u.id}
                      href={`/user/${u.id}`}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/[0.06] transition-colors"
                    >
                      <div className="w-9 h-9 flex-shrink-0 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
                        {u.full_name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div className="text-sm text-white/85 truncate">{u.full_name || 'Anonymous User'}</div>
                    </Link>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={goToResultsPage}
                className="w-full mt-1 px-3 py-2.5 rounded-xl text-sm font-medium text-indigo-300 hover:text-indigo-200 hover:bg-white/[0.06] transition-colors text-left"
              >
                See all results for &quot;{query.trim()}&quot;
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
