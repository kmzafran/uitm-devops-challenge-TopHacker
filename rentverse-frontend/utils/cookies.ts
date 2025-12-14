/**
 * Utility functions for cookie management
 */

/**
 * Set a cookie from client-side
 */
export function setCookie(name: string, value: string, days: number = 7): void {
  if (typeof window === 'undefined') return

  const expires = new Date()
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
  
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;secure;samesite=strict`
}

/**
 * Get a cookie value from client-side
 */
export function getCookie(name: string): string | null {
  if (typeof window === 'undefined') return null

  const nameEQ = name + '='
  const ca = document.cookie.split(';')
  
  for (const cookie of ca) {
    let c = cookie
    while (c.charAt(0) === ' ') c = c.substring(1, c.length)
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length)
  }
  
  return null
}

/**
 * Delete a cookie
 */
export function deleteCookie(name: string): void {
  if (typeof window === 'undefined') return

  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`
}