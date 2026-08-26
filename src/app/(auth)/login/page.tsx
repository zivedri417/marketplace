import { AuthForm } from '@/features/auth/components/AuthForm'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In | Marketplace',
  description: 'Sign in to your account',
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const message = (await searchParams).message as string | undefined
  return <AuthForm type="login" message={message} />
}
