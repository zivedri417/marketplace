'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Lock, ArrowRight } from 'lucide-react'
import { updatePassword } from '@/features/auth/actions'
import { inputClass, pillButtonPrimary } from '@/lib/ui'

export function ResetPasswordForm() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsPending(true)
    setError(null)
    const formData = new FormData(e.currentTarget)

    // Check if passwords match
    if (formData.get('password') !== formData.get('confirmPassword')) {
      setError('Passwords do not match')
      setIsPending(false)
      return
    }

    const res = await updatePassword(formData)

    if (res?.error) {
      setError(res.error)
      setIsPending(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="w-full max-w-md p-8 border border-[#14120e]/20 bg-[#efe9dc]"
    >
      <div className="mb-8 text-center">
        <h2 className="font-serif text-4xl text-[#14120e] mb-2">
          New Password
        </h2>
        <p className="text-[#14120e]/55 text-sm">
          Enter your new password below.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="p-3 border border-[#d93c14]/40 text-[#d93c14] text-sm text-center"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-medium text-[#14120e]/70 ml-1">New Password</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-[#14120e]/40" />
            </div>
            <input
              name="password"
              type="password"
              required
              className={`${inputClass} pl-10 pr-3 py-3 text-sm`}
              placeholder="••••••••"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[#14120e]/70 ml-1">Confirm New Password</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-[#14120e]/40" />
            </div>
            <input
              name="confirmPassword"
              type="password"
              required
              className={`${inputClass} pl-10 pr-3 py-3 text-sm`}
              placeholder="••••••••"
            />
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.99 }}
          type="submit"
          disabled={isPending}
          className={`w-full py-3.5 px-4 text-sm ${pillButtonPrimary}`}
        >
          {isPending ? (
            <Loader2 className="animate-spin h-5 w-5 mr-2" />
          ) : (
            <>
              Update Password
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </motion.button>
      </form>
    </motion.div>
  )
}
