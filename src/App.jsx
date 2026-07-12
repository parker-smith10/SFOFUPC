import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute'
import NavBar from './components/NavBar'
import Spinner from './components/Spinner'
import Login from './pages/Login'
import MyPicks from './pages/MyPicks'
import Results from './pages/Results'
import Standings from './pages/Standings'
import AdminLayout from './pages/admin/AdminLayout'
import AdminSchedule from './pages/admin/AdminSchedule'
import AdminResults from './pages/admin/AdminResults'
import AdminOptions from './pages/admin/AdminOptions'
import AdminUsers from './pages/admin/AdminUsers'
import AdminPicks from './pages/admin/AdminPicks'

function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-osu-paper">
      <NavBar />
      <main className="pb-20 sm:pb-6">{children}</main>
    </div>
  )
}

export default function App() {
  const { loading } = useAuth()

  if (loading) return <Spinner full />

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route
          path="/picks"
          element={
            <AppLayout>
              <MyPicks />
            </AppLayout>
          }
        />
        <Route
          path="/results"
          element={
            <AppLayout>
              <Results />
            </AppLayout>
          }
        />
        <Route
          path="/standings"
          element={
            <AppLayout>
              <Standings />
            </AppLayout>
          }
        />

        <Route element={<AdminRoute />}>
          <Route
            path="/admin"
            element={
              <AppLayout>
                <AdminLayout />
              </AppLayout>
            }
          >
            <Route index element={<Navigate to="schedule" replace />} />
            <Route path="schedule" element={<AdminSchedule />} />
            <Route path="results" element={<AdminResults />} />
            <Route path="options" element={<AdminOptions />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="picks" element={<AdminPicks />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/picks" replace />} />
    </Routes>
  )
}
