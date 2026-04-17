import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import type { ReactNode } from 'react'

export function AdminRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth()

  if (user?.role !== 'admin' && user?.role !== 'super_admin') {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
