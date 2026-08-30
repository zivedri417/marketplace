// Shared styling tokens for the "paper catalogue" design system: warm paper
// background, hairline ink borders, square corners, and a single vermilion
// accent reserved for live/urgent states. Centralized here so every restyled
// component pulls the same look instead of re-typing long arbitrary-value
// Tailwind strings.

export const paper = '#efe9dc'
export const ink = '#14120e'
export const vermilion = '#d93c14'
export const peach = '#f0a98f'

export const cardClass =
  'border border-[#14120e]/15 bg-[#efe9dc] transition-colors'

export const cardHoverClass =
  'hover:border-[#14120e]/45 transition-colors duration-200'

export const monoLabelClass =
  'font-mono text-[10px] tracking-[0.16em] uppercase text-[#14120e]/50'

export const pillButtonPrimary =
  'inline-flex items-center justify-center font-mono text-[11px] tracking-[0.14em] uppercase text-[#efe9dc] bg-[#14120e] hover:bg-[#14120e]/85 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'

export const pillButtonSecondary =
  'inline-flex items-center justify-center font-mono text-[11px] tracking-[0.14em] uppercase text-[#14120e] bg-transparent border border-[#14120e] hover:bg-[#14120e]/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'

export const pillButtonDanger =
  'inline-flex items-center justify-center font-mono text-[11px] tracking-[0.14em] uppercase text-white bg-[#d93c14] hover:bg-[#d93c14]/85 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'

export const inputClass =
  'w-full border border-[#14120e]/25 bg-transparent text-[#14120e] placeholder-[#14120e]/40 outline-none focus:border-[#14120e] transition-colors'

// Plain ink price text (the mockup's "vermilion only means the clock is
// running" rule — settled/buy-now prices stay neutral ink; call sites that
// render a live countdown price use the vermilion color directly instead).
export const priceClass = 'text-[#14120e]'

type StatusKind = 'auction' | 'available' | 'ending-soon' | 'sold' | 'ended'

const statusStyles: Record<StatusKind, string> = {
  auction: 'bg-[#14120e] text-[#efe9dc]',
  available: 'border border-[#14120e]/30 text-[#14120e]/70',
  'ending-soon': 'bg-[#d93c14] text-white',
  sold: 'border-2 border-[#d93c14] text-[#d93c14] bg-[#efe9dc]/80',
  ended: 'bg-[#d93c14] text-white',
}

export function statusPill(kind: StatusKind) {
  return `inline-flex items-center px-2.5 py-[5px] font-mono text-[10px] tracking-[0.14em] uppercase ${statusStyles[kind]}`
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
