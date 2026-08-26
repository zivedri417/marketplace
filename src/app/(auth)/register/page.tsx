import { AuthForm } from '@/features/auth/components/AuthForm'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Create Account | Marketplace',
  description: 'Join our marketplace today',
}

export default function RegisterPage() {
  return <AuthForm type="register" />
}
