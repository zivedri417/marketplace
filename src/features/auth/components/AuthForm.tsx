'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Mail, Lock, User, ArrowRight } from 'lucide-react'
import { login, signup } from '@/features/auth/actions'
import { inputClass, pillButtonPrimary } from '@/lib/ui'

interface AuthFormProps {
  type: 'login' | 'register'
  message?: string
}

export function AuthForm({ type, message }: AuthFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)
  const isLogin = type === 'login'

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsPending(true)
    setError(null)
    const formData = new FormData(e.currentTarget)

    let res
    if (isLogin) {
      res = await login(formData)
    } else {
      res = await signup(formData)
    }

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
          {isLogin ? 'Welcome back' : 'Create an account'}
        </h2>
        <p className="text-[#14120e]/55 text-sm">
          {isLogin ? 'Enter your details to sign in to your account' : 'Enter your details below to create your account'}
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
        {message === 'password-updated' && !error && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="p-3 border border-[#14120e]/25 text-[#14120e] text-sm text-center"
          >
            Password successfully updated! You can now log in.
          </motion.div>
        )}
        {message === 'login-required-for-listing' && !error && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="p-3 border border-[#14120e]/25 text-[#14120e] text-sm text-center"
          >
            Please login to post an item for sale.
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-5">
        <AnimatePresence>
          {!isLogin && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              <label className="text-sm font-medium text-[#14120e]/70 ml-1">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-[#14120e]/40" />
                </div>
                <input
                  name="fullName"
                  type="text"
                  required={!isLogin}
                  className={`${inputClass} pl-10 pr-3 py-3 text-sm`}
                  placeholder="John Doe"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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

        <div className="space-y-2">
          <div className="flex items-center justify-between ml-1">
            <label className="text-sm font-medium text-[#14120e]/70">Password</label>
            {isLogin && (
              <a href="/forgot-password" className="text-xs font-medium text-[#d93c14] hover:text-[#d93c14]/80 transition-colors">
                Forgot password?
              </a>
            )}
          </div>
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
              {isLogin ? 'Sign In' : 'Sign Up'}
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </motion.button>
      </form>

      <div className="mt-8 text-center text-sm text-[#14120e]/55">
        {isLogin ? "Don't have an account? " : "Already have an account? "}
        <a
          href={isLogin ? "/register" : "/login"}
          className="font-medium text-[#d93c14] hover:text-[#d93c14]/80 transition-colors"
        >
          {isLogin ? 'Sign up' : 'Sign in'}
        </a>
      </div>
    </motion.div>
  )
}
