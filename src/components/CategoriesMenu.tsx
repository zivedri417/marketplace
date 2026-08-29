'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string
}

export function CategoriesMenu({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1 transition-colors ${open ? 'text-white' : 'text-white/60 hover:text-white'}`}
      >
        Categories
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-3 w-60 rounded-2xl border border-white/10 bg-[#0d0d14] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.6)] p-2 z-50">
          {categories.length === 0 ? (
            <div className="px-3 py-2 text-sm text-white/40">No categories yet.</div>
          ) : (
            categories.map(c => (
              <Link
                key={c.id}
                href={`/categories/${c.slug}`}
                onClick={() => setOpen(false)}
                className="block px-3 py-2.5 rounded-xl text-sm text-white/75 hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                {c.name}
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  )
}
