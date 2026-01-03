'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { api, type User } from '@/lib/api'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function AdminPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [updateLoading, setUpdateLoading] = useState<string | null>(null)

  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      try {
        const user = await api.getCurrentUser()
        if (user.role !== 'admin') {
          router.push('/')
          return
        }
        setCurrentUser(user)
        const allUsers = await api.getAllUsers()
        setUsers(allUsers)
      } catch {
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    checkAuthAndLoadData()
  }, [router])

  const handleRoleChange = async (userId: string, newRole: 'user' | 'admin') => {
    setUpdateLoading(userId)
    try {
      const updatedUser = await api.updateUserRole(userId, newRole)
      setUsers(users.map(user => 
        user.id === userId ? updatedUser : user
      ))
    } catch (error) {
      console.error('Failed to update role:', error)
    } finally {
      setUpdateLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!currentUser) {
    return null
  }

  return (
    <DashboardLayout user={currentUser}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-2">Manage user roles and permissions</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
            <CardDescription>
              {users.length} total users in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-primary-foreground">
                        {user.email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{user.email}</p>
                      <p className="text-sm text-gray-500">
                        Joined {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                      {user.role}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRoleChange(
                        user.id, 
                        user.role === 'admin' ? 'user' : 'admin'
                      )}
                      disabled={updateLoading === user.id}
                    >
                      {updateLoading === user.id 
                        ? 'Updating...' 
                        : `Make ${user.role === 'admin' ? 'User' : 'Admin'}`
                      }
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}