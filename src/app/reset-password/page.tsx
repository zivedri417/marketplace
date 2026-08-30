'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, ArrowRight, Loader2, AlertCircle } from 'lucide-react'
import { updatePassword } from '@/features/auth/actions'

export default function ResetPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)
    
    const formData = new FormData(e.currentTarget)
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string
    
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setIsSubmitting(false)
      return
    }
    
    const res = await updatePassword(formData)
    if (res?.error) {
      setError(res.error)
      setIsSubmitting(false)
    }
    // Success will redirect to /login?message=password-updated
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#efe9dc] p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md p-8 border border-[#14120e]/20 bg-[#efe9dc]"
      >
        
        <div className="text-center mb-8">
          <h2 className="font-serif text-4xl text-[#14120e] mb-2">
            Reset Password
          </h2>
          <p className="text-[#14120e]/55 text-sm">
            Please enter your new password below.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="p-3 border border-[#d93c14]/40 text-[#d93c14] text-sm text-center flex items-center justify-center gap-2"
            >
              <AlertCircle className="w-4 h-4" />
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
                className="w-full pl-10 pr-3 py-3 text-sm bg-transparent border border-[#14120e]/20 focus:outline-none focus:border-[#14120e]/60 transition-colors rounded-none text-[#14120e]"
                placeholder="••••••••"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#14120e]/70 ml-1">Confirm Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-[#14120e]/40" />
              </div>
              <input
                name="confirmPassword"
                type="password"
                required
                className="w-full pl-10 pr-3 py-3 text-sm bg-transparent border border-[#14120e]/20 focus:outline-none focus:border-[#14120e]/60 transition-colors rounded-none text-[#14120e]"
                placeholder="••••••••"
              />
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.99 }}
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center py-3.5 px-4 bg-[#14120e] hover:bg-[#14120e]/90 text-[#efe9dc] text-sm transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Update Password
                <ArrowRight className="ml-2 w-4 h-4" />
              </>
            )}
          </motion.button>
        </form>

      </motion.div>
    </div>
  )
}
