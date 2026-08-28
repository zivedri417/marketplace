// Shared styling tokens for the "premium P2P" dark-glass design system.
// Centralized here so every restyled component pulls the same look instead of
// re-typing long arbitrary-value Tailwind strings.

export const cardClass =
  'rounded-[22px] border border-white/10 bg-white/[0.045] backdrop-blur-xl transition-colors'

export const cardHoverClass =
  'hover:border-indigo-300/40 hover:-translate-y-0.5 transition-all duration-300'

export const monoLabelClass =
  'font-mono text-[10px] tracking-[0.16em] uppercase text-white/40'

export const pillButtonPrimary =
  'inline-flex items-center justify-center rounded-full font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:brightness-110 shadow-[0_10px_30px_-12px_rgba(124,58,237,0.9)] transition-all disabled:opacity-60 disabled:cursor-not-allowed'

export const pillButtonSecondary =
  'inline-flex items-center justify-center rounded-full font-semibold text-white/85 bg-white/[0.06] border border-white/15 hover:bg-white/[0.12] transition-all disabled:opacity-60 disabled:cursor-not-allowed'

export const pillButtonDanger =
  'inline-flex items-center justify-center rounded-full font-semibold text-red-300 bg-red-400/10 border border-red-400/30 hover:bg-red-400/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed'

export const inputClass =
  'w-full rounded-2xl border border-white/10 bg-white/5 text-white placeholder-white/30 outline-none focus:border-indigo-300/70 transition-colors'

export const priceGradientClass =
  'bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 to-purple-300'

type StatusKind = 'auction' | 'available' | 'ending-soon' | 'sold' | 'ended'

const statusStyles: Record<StatusKind, string> = {
  auction: 'bg-gradient-to-r from-violet-700 to-purple-600 text-white',
  available: 'bg-emerald-400/15 text-emerald-300 border border-emerald-400/30',
  'ending-soon': 'bg-yellow-400/15 text-yellow-300 border border-yellow-400/30',
  sold: 'bg-red-400/15 text-red-300 border border-red-400/30',
  ended: 'bg-white/10 text-white/70 border border-white/15',
}

export function statusPill(kind: StatusKind) {
  return `inline-flex items-center px-3 py-[5px] rounded-full text-[11px] font-bold tracking-wider ${statusStyles[kind]}`
}

// Auction cards/panels count down toward "ending soon" inside this window.
export const ENDING_SOON_MS = 24 * 60 * 60 * 1000

// Short countdown label used on card overlays and detail-page timers,
// e.g. "05d 11h" while there's more than a day left, "03h 22m" once inside a day,
// and down to seconds once inside an hour. Takes `now` explicitly (rather than
// reading Date.now() itself) so it stays a pure function of its arguments —
// callers hold `now` in state (e.g. useState(() => Date.now())) instead.
export function formatTimeLeft(deadline: string | null | undefined, now: number): string {
  if (!deadline) return ''
  const ms = new Date(deadline).getTime() - now
  if (ms <= 0) return 'Ended'
  const totalSeconds = Math.floor(ms / 1000)
  const d = Math.floor(totalSeconds / 86400)
  const h = Math.floor((totalSeconds % 86400) / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  const p = (n: number) => String(n).padStart(2, '0')
  if (d > 0) return `${p(d)}d ${p(h)}h`
  if (h > 0) return `${p(h)}h ${p(m)}m`
  return `${p(m)}m ${p(s)}s`
}
