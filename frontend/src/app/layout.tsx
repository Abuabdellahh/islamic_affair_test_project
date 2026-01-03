import './globals.css'
import { AuthProvider } from '@/lib/auth'

export const metadata = {
  title: 'Session-Based Authentication System',
  description: 'Session-based authentication with RBAC using NestJS and Next.js',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}