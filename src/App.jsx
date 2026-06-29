import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import AuthCallback from './pages/AuthCallback'
import Dashboard from './pages/Dashboard'
import Properties from './pages/Properties'
import Tenants from './pages/Tenants'
import Leases from './pages/Leases' 
import LeaseNew from './pages/LeaseNew'
import LeaseView from './pages/LeaseView'
import Account from './pages/Account'
import Apply from './pages/Apply'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import Inspection from './pages/Inspection'
import Applications from './pages/Applications'

export default function App() {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) return null

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/"                    element={<Landing />} />
        <Route path="/login"               element={<Login />} />
        <Route path="/signup"              element={<Signup />} />
        <Route path="/forgot-password"     element={<ForgotPassword />} />
        <Route path="/reset-password"      element={<ResetPassword />} />
        <Route path="/auth/callback"       element={<AuthCallback />} />
        <Route path="/apply/:leaseId"      element={<Apply />} />
        <Route path="/privacy"             element={<Privacy />} />
        <Route path="/terms"               element={<Terms />} />

        {/* Protected */}
        <Route path="/dashboard"     element={session ? <Dashboard     session={session} /> : <Navigate to="/login" replace />} />
        <Route path="/properties"    element={session ? <Properties    session={session} /> : <Navigate to="/login" replace />} />
        <Route path="/tenants"       element={session ? <Tenants       session={session} /> : <Navigate to="/login" replace />} />
        <Route path="/leases"        element={session ? <Leases        session={session} /> : <Navigate to="/login" replace />} />
        <Route path="/leases/new"    element={session ? <LeaseNew      session={session} /> : <Navigate to="/login" replace />} />
        <Route path="/leases/:id"    element={session ? <LeaseView     session={session} /> : <Navigate to="/login" replace />} />
        <Route path="/account"       element={session ? <Account       session={session} /> : <Navigate to="/login" replace />} />
        <Route path="/inspect"       element={session ? <Inspection    session={session} /> : <Navigate to="/login" replace />} />
        <Route path="/applications"  element={session ? <Applications  session={session} /> : <Navigate to="/login" replace />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to={session ? '/dashboard' : '/login'} replace />} />
      </Routes>
    </BrowserRouter>
  )
}
