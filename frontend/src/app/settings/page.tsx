'use client'

import { useAuth } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function SettingsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">Manage your account settings and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Your account details and status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" value={user.email} disabled className="mt-1" />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Input id="role" value={user.role} disabled className="mt-1 capitalize" />
              </div>
              <div>
                <Label htmlFor="userId">User ID</Label>
                <Input id="userId" value={user.id} disabled className="mt-1" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Security Features</CardTitle>
              <CardDescription>Current security implementations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-green-600">✓ Active Security</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• HTTP-only session cookies</li>
                  <li>• BCrypt password hashing</li>
                  <li>• Same-site cookie protection</li>
                  <li>• Role-based access control</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-orange-600">⚠ Limitations</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• No password change feature</li>
                  <li>• No 2FA implementation</li>
                  <li>• Single session per user</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Session Information</CardTitle>
            <CardDescription>Current session details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">
              <p>You are currently logged in with session-based authentication.</p>
              <p className="mt-2">Session cookies are HTTP-only and secure.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}