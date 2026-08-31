import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

// Unit/integration tests only — everything here runs against mocked Supabase
// clients and mocked Next.js APIs (next/navigation, next/cache, next/headers),
// never a live database or browser. See teststorun.md for the full manual/E2E
// test plan; anything requiring a live DB, RLS enforcement, or a browser is
// out of scope for this suite and called out there instead.
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
