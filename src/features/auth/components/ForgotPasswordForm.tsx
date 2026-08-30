'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Mail, ArrowRight, CheckCircle2 } from 'lucide-react'
import { resetPassword } from '@/features/auth/actions'
import { inputClass, pillButtonPrimary } from '@/lib/ui'

export function ForgotPasswordForm() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, setIsPending] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsPending(true)
    setError(null)
    const formData = new FormData(e.currentTarget)

    const res = await resetPassword(formData)

    if (res?.error) {
      setError(res.error)
      setIsPending(false)
    } else if (res?.success) {
      setSuccess(true)
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
          Reset Password
        </h2>
        <p className="text-[#14120e]/55 text-sm">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            key="error"
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="p-3 border border-[#d93c14]/40 text-[#d93c14] text-sm text-center"
          >
            {error}
          </motion.div>
        )}
        {success && (
          <motion.div
            key="success"
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="p-3 border border-[#14120e]/25 text-[#14120e] text-sm text-center flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            Check your email for a reset link.
          </motion.div>
        )}
      </AnimatePresence>

      {!success && (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#14120e]/70 ml-1">Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-[#14120e]/40" />
              </div>
              <input
                name="email"
                type="email"
                required
                className={`${inputClass} pl-10 pr-3 py-3 text-sm`}
                placeholder="you@example.com"
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
                Send Reset Link
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </motion.button>
        </form>
      )}

      <div className="mt-8 text-center text-sm text-[#14120e]/55">
        Remember your password?{' '}
        <a
          href="/login"
          className="font-medium text-[#d93c14] hover:text-[#d93c14]/80 transition-colors"
        >
          Sign in
        </a>
      </div>
    </motion.div>
  )
}
