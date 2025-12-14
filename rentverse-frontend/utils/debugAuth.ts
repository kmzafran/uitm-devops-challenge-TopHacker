/**
 * Debug helper to check authentication state
 */
export function debugAuthState() {
  if (typeof window === 'undefined') {
    console.log('Running on server side - no localStorage available')
    return
  }

  console.log('=== AUTH DEBUG INFO ===')
  console.log('localStorage keys:', Object.keys(localStorage))
  
  // Check standard auth token
  const authToken = localStorage.getItem('authToken')
  console.log('authToken:', authToken ? `${authToken.substring(0, 30)}...` : 'NOT FOUND')
  
  // Check auth user
  const authUser = localStorage.getItem('authUser')
  console.log('authUser:', authUser ? JSON.parse(authUser) : 'NOT FOUND')
  
  // Check all possible auth-related keys
  const authKeys = Object.keys(localStorage).filter(key => 
    key.toLowerCase().includes('auth') || 
    key.toLowerCase().includes('token') ||
    key.toLowerCase().includes('user')
  )
  
  console.log('Auth-related localStorage keys:', authKeys)
  
  authKeys.forEach(key => {
    const value = localStorage.getItem(key)
    if (value) {
      try {
        const parsed = JSON.parse(value)
        console.log(`${key}:`, parsed)
      } catch {
        console.log(`${key}:`, value.substring(0, 100) + (value.length > 100 ? '...' : ''))
      }
    }
  })
  
  console.log('=== END AUTH DEBUG ===')
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  ;(window as unknown as { debugAuthState: typeof debugAuthState }).debugAuthState = debugAuthState
}