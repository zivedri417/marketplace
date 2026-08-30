export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#efe9dc] selection:bg-[#d93c14]/25">
      <div className="w-full flex justify-center px-4">
        {children}
      </div>
    </div>
  )
}
