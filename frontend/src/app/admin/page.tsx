'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { api, type User } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

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

  const handleLogout = async () => {
    try {
      await api.logout()
      router.push('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!currentUser) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => router.push('/')}>
                ← Back to Dashboard
              </Button>
              <h1 className="text-xl font-semibold">Admin Panel</h1>
            </div>
            <div className="flex items-center">
              <Button variant="ghost" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Manage user roles and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{user.email}</p>
                      <p className="text-sm text-muted-foreground">
                        Created: {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        user.role === 'admin' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-secondary text-secondary-foreground'
                      }`}>
                        {user.role}
                      </span>
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
      </main>
    </div>
  )
}