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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-xl p-6 text-white">
          <h1 className="text-3xl font-bold">
            Welcome, {user.email}
          </h1>
          <p className="text-blue-100 mt-2">
            Session-Based Authentication System with RBAC
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-emerald-700">Your Role</CardTitle>
              <Shield className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize text-emerald-800">{user.role}</div>
              <p className="text-xs text-emerald-600">
                {user.role === 'admin' ? 'Full system access' : 'Limited access'}
              </p>
            </CardContent>
          </Card>

          {user.role === 'admin' && (
            <Card className="bg-gradient-to-br from-violet-50 to-purple-50 border-violet-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-violet-700">User Management</CardTitle>
                <Users className="h-4 w-4 text-violet-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-violet-800">Admin Panel</div>
                <p className="text-xs text-violet-600 mb-3">
                  Manage user roles and permissions
                </p>
                <Button 
                  size="sm" 
                  onClick={() => router.push('/admin')}
                  className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                >
                  Manage Users
                </Button>
              </CardContent>
            </Card>
          )}

          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-amber-700">Settings</CardTitle>
              <Settings className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-800">Profile</div>
              <p className="text-xs text-amber-600 mb-3">
                View your account settings
              </p>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => router.push('/settings')}
                className="w-full border-amber-300 text-amber-700 hover:bg-amber-50"
              >
                View Settings
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gradient-to-br from-slate-50 to-gray-50 border-slate-200">
          <CardHeader>
            <CardTitle className="text-slate-800">System Features</CardTitle>
            <CardDescription className="text-slate-600">
              This system demonstrates session-based authentication with role-based access control
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-emerald-600">✓ Implemented Features</h4>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• Session-based authentication (no JWT)</li>
                  <li>• HTTP-only cookies</li>
                  <li>• BCrypt password hashing</li>
                  <li>• Role-based access control</li>
                  <li>• Protected routes</li>
                  <li>• Admin user management</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-amber-600">⚠ Known Limitations</h4>
                <ul className="text-sm text-slate-600 space-y-1">
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