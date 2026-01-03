'use client'

import { useAuth } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Shield, Settings } from 'lucide-react'

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome, {user.email}
          </h1>
          <p className="text-gray-600 mt-2">
            Session-Based Authentication System with RBAC
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Your Role</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">{user.role}</div>
              <p className="text-xs text-muted-foreground">
                {user.role === 'admin' ? 'Full system access' : 'Limited access'}
              </p>
            </CardContent>
          </Card>

          {user.role === 'admin' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">User Management</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Admin Panel</div>
                <p className="text-xs text-muted-foreground mb-3">
                  Manage user roles and permissions
                </p>
                <Button 
                  size="sm" 
                  onClick={() => router.push('/admin')}
                  className="w-full"
                >
                  Manage Users
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Settings</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Profile</div>
              <p className="text-xs text-muted-foreground mb-3">
                View your account settings
              </p>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => router.push('/settings')}
                className="w-full"
              >
                View Settings
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>System Features</CardTitle>
            <CardDescription>
              This system demonstrates session-based authentication with role-based access control
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-green-600">✓ Implemented Features</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Session-based authentication (no JWT)</li>
                  <li>• HTTP-only cookies</li>
                  <li>• BCrypt password hashing</li>
                  <li>• Role-based access control</li>
                  <li>• Protected routes</li>
                  <li>• Admin user management</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-orange-600">⚠ Known Limitations</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• No refresh tokens</li>
                  <li>• No rate limiting</li>
                  <li>• Single session per user</li>
                  <li>• Two-role RBAC only</li>
                  <li>• In-memory sessions (dev only)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}