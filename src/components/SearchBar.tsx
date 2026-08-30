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
        className="flex items-center gap-2 w-full px-3.5 py-2.5 border border-[#14120e]/25 bg-transparent text-sm text-[#14120e]/80 focus-within:border-[#14120e] transition-colors"
      >
        {isLoading ? (
          <Loader2 className="h-3.5 w-3.5 flex-shrink-0 animate-spin text-[#14120e]/40" />
        ) : (
          <Search className="h-3.5 w-3.5 flex-shrink-0 text-[#14120e]/40" strokeWidth={2.5} />
        )}
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder="Search items or people"
          className="w-full bg-transparent outline-none placeholder-[#14120e]/40"
        />
      </form>

      {showPanel && (
        <div className="absolute left-0 top-full mt-3 w-[26rem] max-w-[90vw] border border-[#14120e]/20 bg-[#efe9dc] shadow-[0_20px_50px_-15px_rgba(20,18,14,0.25)] p-2 z-50 max-h-[70vh] overflow-y-auto">
          {!isLoading && !hasResults ? (
            <div className="px-3 py-4 text-sm text-[#14120e]/40 text-center">No matches for &quot;{query.trim()}&quot;.</div>
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
                      className="flex items-center gap-3 px-3 py-2 hover:bg-[#14120e]/5 transition-colors"
                    >
                      <div className="w-9 h-9 flex-shrink-0 border border-[#14120e]/15 bg-[#14120e]/5 overflow-hidden">
                        {p.images?.[0] && <img src={p.images[0]} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm text-[#14120e]/85 truncate">{p.title}</div>
                        <div className="text-xs text-[#14120e]/45">${(p.price / 100).toFixed(2)}{p.is_auction ? ' · auction' : ''}</div>
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
                      className="flex items-center gap-3 px-3 py-2 hover:bg-[#14120e]/5 transition-colors"
                    >
                      <div className="w-9 h-9 flex-shrink-0 border border-[#14120e] flex items-center justify-center font-serif text-sm text-[#14120e]">
                        {u.full_name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div className="text-sm text-[#14120e]/85 truncate">{u.full_name || 'Anonymous User'}</div>
                    </Link>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={goToResultsPage}
                className="w-full mt-1 px-3 py-2.5 text-sm font-medium text-[#d93c14] hover:bg-[#14120e]/5 transition-colors text-left"
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
