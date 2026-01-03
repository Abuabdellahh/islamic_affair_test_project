import './globals.css'

export const metadata = {
  title: 'Authentication System',
  description: 'Session-based authentication with RBAC',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans">{children}</body>
    </html>
  )
}