import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Properties from './pages/Properties'
import Tenants from './pages/Tenants'
import LeaseNew from './pages/LeaseNew'
import LeaseView from './pages/LeaseView'

function ProtectedRoute({ session, children }) {
  if (!session) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
  }, [])

  if (loading) return <div style={{ padding: '2rem' }}>Loading...</div>

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={
          <ProtectedRoute session={session}>
            <Dashboard session={session} />
          </ProtectedRoute>
        } />
        <Route path="/properties" element={
          <ProtectedRoute session={session}>
            <Properties session={session} />
          </ProtectedRoute>
        } />
        <Route path="/tenants" element={
          <ProtectedRoute session={session}>
            <Tenants session={session} />
          </ProtectedRoute>
        } />
        <Route path="/leases/new" element={
          <ProtectedRoute session={session}>
            <LeaseNew session={session} />
          </ProtectedRoute>
        } />
        <Route path="/leases/:id" element={
          <ProtectedRoute session={session}>
            <LeaseView session={session} />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}
