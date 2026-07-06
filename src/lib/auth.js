import { supabase } from './supabase'

// Auth utility functions for better error handling and session management

const AUTH_ERRORS = {
  'Invalid login credentials': { message: 'Wrong email or password. Try again or reset your password.', code: 'INVALID_CREDENTIALS' },
  'Email not confirmed': { message: 'Please confirm your email before logging in. Check your inbox.', code: 'EMAIL_NOT_CONFIRMED' },
  'Too many requests': { message: 'Too many attempts. Please wait a few minutes before trying again.', code: 'RATE_LIMITED' },
  'Email link is invalid': { message: 'This link has expired or is invalid. Request a new one.', code: 'INVALID_LINK' },
  'Token expired': { message: 'Your session has expired. Please sign in again.', code: 'SESSION_EXPIRED' },
  'Invalid email': { message: 'Please enter a valid email address.', code: 'INVALID_EMAIL' },
  'Password should be at least': { message: 'Password must be at least 6 characters.', code: 'WEAK_PASSWORD' },
}

export function friendlyError(errorMessage) {
  if (!errorMessage) return 'Something went wrong. Please try again.'
  
  for (const [key, val] of Object.entries(AUTH_ERRORS)) {
    if (errorMessage.includes(key)) {
      return val.message
    }
  }
  
  // Return original error if no match found
  return errorMessage || 'Something went wrong. Please try again.'
}

export function getErrorCode(errorMessage) {
  if (!errorMessage) return 'UNKNOWN_ERROR'
  
  for (const [key, val] of Object.entries(AUTH_ERRORS)) {
    if (errorMessage.includes(key)) {
      return val.code
    }
  }
  
  return 'UNKNOWN_ERROR'
}

export async function signInWithEmail(email, password) {
  try {
    if (!email || !password) {
      return { error: { message: 'Email and password are required.' } }
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    return { data, error }
  } catch (err) {
    return { error: { message: 'Network error. Please check your connection.' } }
  }
}

export async function signInWithGoogle(redirectUrl) {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirectUrl },
    })
    return { data, error }
  } catch (err) {
    return { error: { message: 'Failed to initiate Google sign-in.' } }
  }
}

export async function signUp(email, password) {
  try {
    if (!email || !password) {
      return { error: { message: 'Email and password are required.' } }
    }
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: 'https://rentyapp.net/auth/callback',
      },
    })
    return { data, error }
  } catch (err) {
    return { error: { message: 'Network error. Please check your connection.' } }
  }
}

export async function resetPassword(email) {
  try {
    if (!email) {
      return { error: { message: 'Email is required.' } }
    }
    
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://rentyapp.net/reset-password',
    })
    return { data, error }
  } catch (err) {
    return { error: { message: 'Network error. Please check your connection.' } }
  }
}

export async function updatePassword(password) {
  try {
    if (!password || password.length < 6) {
      return { error: { message: 'Password must be at least 6 characters.' } }
    }
    
    const { data, error } = await supabase.auth.updateUser({ password })
    return { data, error }
  } catch (err) {
    return { error: { message: 'Network error. Please check your connection.' } }
  }
}

export async function getCurrentSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    return { session, error }
  } catch (err) {
    return { session: null, error: err }
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()
    return { error }
  } catch (err) {
    return { error: err }
  }
}

export function onAuthStateChange(callback) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback)
  return subscription
}
