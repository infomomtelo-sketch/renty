import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    const handleCallback = async () => {
      const { data, error } = await supabase.auth.getSession()
      
      if (data?.session) {
        navigate('/dashboard')
        return
      }

      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')

      if (accessToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })
        if (!error) {
          navigate('/dashboard')
          return
        }
      }

      const urlParams = new URLSearchParams(window.location.search)
      const code = urlParams.get('code')

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
          navigate('/dashboard')
          return
        }
      }

      navigate('/login')
    }

    handleCallback()
  }, [])

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: '4rem', textAlign: 'center' }}>
      <p>Signing you in...</p>
    </div>
  )
}
