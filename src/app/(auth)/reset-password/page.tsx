import { ResetPasswordForm } from '@/features/auth/components/ResetPasswordForm'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Set New Password | Marketplace',
  description: 'Set a new password for your account',
}

export default function ResetPasswordPage() {
  return <ResetPasswordForm />
}
