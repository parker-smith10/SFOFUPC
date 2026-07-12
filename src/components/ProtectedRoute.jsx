import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Spinner from './Spinner'

export function ProtectedRoute() {
  const { session, loading } = useAuth()

  if (loading) return <Spinner full />
  if (!session) return <Navigate to="/login" replace />
  return <Outlet />
}

export function AdminRoute() {
  const { isAdmin, loading } = useAuth()

  if (loading) return <Spinner full />
  if (!isAdmin) return <Navigate to="/picks" replace />
  return <Outlet />
}
