'use client'

import { useState, useEffect } from 'react'
import { api, type User } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function AdminPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [updateLoading, setUpdateLoading] = useState<string | null>(null)

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const allUsers = await api.getAllUsers()
        setUsers(allUsers)
      } catch (error) {
        console.error('Failed to load users:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUsers()
  }, [])

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

  return (
    <ProtectedRoute requiredRole="admin">
      <DashboardLayout user={currentUser!}>
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 rounded-xl p-6 text-white">
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-violet-100 mt-2">Manage user roles and permissions</p>
          </div>

          <Card className="bg-gradient-to-br from-white to-slate-50 border-slate-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-t-lg">
              <CardTitle className="text-slate-800">All Users</CardTitle>
              <CardDescription className="text-slate-600">
                {users.length} total users in the system
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-slate-600">Loading users...</div>
                </div>
              ) : (
                <div className="space-y-4">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-gradient-to-r hover:from-slate-50 hover:to-gray-50 transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-white">
                            {user.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{user.email}</p>
                          <p className="text-sm text-slate-500">Role: {user.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge 
                          variant={user.role === 'admin' ? 'default' : 'secondary'}
                          className={user.role === 'admin' 
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white' 
                            : 'bg-gradient-to-r from-slate-100 to-gray-200 text-slate-700'
                          }
                        >
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
                          className={`border-slate-300 transition-all duration-200 ${
                            user.role === 'admin' 
                              ? 'hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 hover:border-red-300 hover:text-red-700'
                              : 'hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 hover:border-emerald-300 hover:text-emerald-700'
                          }`}
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
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}