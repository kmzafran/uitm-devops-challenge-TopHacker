import { create } from 'zustand'
import type { User, AuthState } from '@/types/auth'
import { AuthApiClient } from '@/utils/authApiClient'
import { setCookie, deleteCookie } from '@/utils/cookies'

interface AuthActions {
  // Login functionality
  setPassword: (password: string) => void
  submitLogIn: () => Promise<void>

  // Signup functionality
  setFirstName: (firstName: string) => void
  setLastName: (lastName: string) => void
  setBirthdate: (birthdate: string) => void
  setEmail: (email: string) => void
  setPhone: (phone: string) => void
  setSignUpPassword: (password: string) => void
  submitSignUp: () => Promise<void>

  // Email check functionality
  validateEmail: (email: string) => boolean
  submitEmailCheck: () => Promise<{ exists: boolean; isActive: boolean; role: string | null } | null>

  // General auth actions
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  logout: () => void
  resetForm: () => void
  isLoginFormValid: () => boolean
  isSignUpFormValid: () => boolean

  // Auth persistence
  initializeAuth: () => void
  validateToken: () => Promise<boolean>
  refreshUserData: () => Promise<boolean>

  // MFA functionality
  setOtp: (otp: string) => void
  submitOtp: () => Promise<void>
}

interface AuthFormState {
  password: string
  firstName: string
  lastName: string
  birthdate: string
  email: string
  phone: string
  signUpPassword: string
  otp: string
}

type AuthStore = AuthState & AuthFormState & AuthActions

const useAuthStore = create<AuthStore>((set, get) => ({
  // Auth state
  user: null,
  isLoggedIn: false,
  isLoading: false,
  error: null,
  mfaRequired: false,
  userId: null,

  // Form state
  password: '',
  firstName: '',
  lastName: '',
  birthdate: '',
  email: '',
  phone: '',
  signUpPassword: '',
  otp: '',

  // Actions
  setPassword: (password: string) => set({ password }),
  setFirstName: (firstName: string) => set({ firstName }),
  setLastName: (lastName: string) => set({ lastName }),
  setBirthdate: (birthdate: string) => set({ birthdate }),
  setEmail: (email: string) => set({ email }),
  setPhone: (phone: string) => set({ phone }),
  setSignUpPassword: (signUpPassword: string) => set({ signUpPassword }),
  setLoading: (isLoading: boolean) => set({ isLoading }),
  setError: (error: string | null) => set({ error }),
  setOtp: (otp: string) => set({ otp }),

  validateEmail: (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  },

  isLoginFormValid: () => {
    const { password } = get()
    return password.length >= 6
  },

  isSignUpFormValid: () => {
    const { firstName, lastName, email, signUpPassword, birthdate, phone } = get()
    const { validateEmail } = get()
    return (
      firstName.trim().length > 0 &&
      lastName.trim().length > 0 &&
      validateEmail(email) &&
      signUpPassword.length >= 6 &&
      birthdate.length > 0 &&
      phone.trim().length > 0
    )
  },

  submitLogIn: async () => {
    const { email, password, setLoading, setError } = get()

    if (!get().isLoginFormValid()) {
      setError('Please enter a valid password')
      return
    }

    if (!email) {
      setError('Email is required')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        if (result.data.requiresMfa) {
          const mfaState = {
            mfaRequired: true,
            userId: result.data.userId,
          }
          // Persist MFA state to sessionStorage to survive page navigation
          sessionStorage.setItem('mfaState', JSON.stringify(mfaState))

          set({
            mfaRequired: true,
            userId: result.data.userId,
            password: '',
            error: null,
          })
          window.location.href = '/auth/verify-mfa'
          return
        }

        // Store user data and token
        const backendUser = result.data.user

        // Debug logging for development
        if (process.env.NODE_ENV === 'development') {
          console.log('[AUTH] Backend user data:', backendUser)
          console.log('[AUTH] First name:', backendUser.firstName)
          console.log('[AUTH] Last name:', backendUser.lastName)
          console.log('[AUTH] Name field:', backendUser.name)
        }

        const user: User = {
          id: backendUser.id,
          email: backendUser.email,
          firstName: backendUser.firstName || '',
          lastName: backendUser.lastName || '',
          name: backendUser.name || `${backendUser.firstName || ''} ${backendUser.lastName || ''}`.trim(),
          dateOfBirth: backendUser.dateOfBirth || '',
          phone: backendUser.phone || '',
          role: backendUser.role || 'user',
          birthdate: backendUser.dateOfBirth || undefined,
        }

        // Debug logging for final user object
        if (process.env.NODE_ENV === 'development') {
          console.log('[AUTH] Final user object:', user)
          console.log('[AUTH] Constructed name:', user.name)
        }

        set({
          user,
          isLoggedIn: true,
          password: '',
          email: '', // Clear email from form
          error: null,
        })

        // Store token and user data in localStorage for future API calls
        if (typeof window !== 'undefined') {
          localStorage.setItem('authToken', result.data.token)
          localStorage.setItem('authUser', JSON.stringify(user))
          // Also set cookie for server-side middleware access
          setCookie('authToken', result.data.token, 7) // 7 days expiry
        }

        // Navigate to home page instead of forcing to property page
        window.location.href = '/'
      } else {
        // Handle 400/401 errors
        setError(result.message || 'Login failed. Please check your credentials.')
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  },

  submitOtp: async () => {
    const { userId, otp, setLoading, setError } = get()

    if (!userId || !otp) {
      setError('User ID and OTP are required.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, otp }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        const backendUser = result.data.user
        const user: User = {
          id: backendUser.id,
          email: backendUser.email,
          firstName: backendUser.firstName || '',
          lastName: backendUser.lastName || '',
          name: backendUser.name || `${backendUser.firstName || ''} ${backendUser.lastName || ''}`.trim(),
          dateOfBirth: backendUser.dateOfBirth || '',
          phone: backendUser.phone || '',
          role: backendUser.role || 'user',
          birthdate: backendUser.dateOfBirth || undefined,
        }

        set({
          user,
          isLoggedIn: true,
          mfaRequired: false,
          userId: null,
          otp: '',
          error: null,
        })

        if (typeof window !== 'undefined') {
          localStorage.setItem('authToken', result.data.token)
          localStorage.setItem('authUser', JSON.stringify(user))
          setCookie('authToken', result.data.token, 7)
          // Clear MFA session state
          sessionStorage.removeItem('mfaState')
        }

        window.location.href = '/'
      } else {
        setError(result.message || 'OTP verification failed.')
      }
    } catch (error) {
      console.error('OTP verification error:', error)
      setError('OTP verification failed. Please try again.')
    } finally {
      setLoading(false)
    }
  },

  submitSignUp: async () => {
    const { firstName, lastName, email, signUpPassword, birthdate, phone, setLoading, setError } = get()

    if (!get().isSignUpFormValid()) {
      setError('Please fill in all fields correctly')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await AuthApiClient.register({
        email,
        password: signUpPassword,
        firstName,
        lastName,
        dateOfBirth: birthdate,
        phone,
      })

      if (result.success) {
        // Clear form fields after successful sign-up
        set({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          signUpPassword: '',
          birthdate: '',
          error: null,
        })
        // Redirect to homepage after successful registration
        window.location.href = '/'
      } else {
        // Handle errors
        setError(result.message || 'Sign up failed. Please try again.')
      }
    } catch (error) {
      console.error('Sign up error:', error)
      setError(error instanceof Error ? error.message : 'Sign up failed. Please try again.')
    } finally {
      setLoading(false)
    }
  },

  submitEmailCheck: async () => {
    const { email, validateEmail, setLoading, setError } = get()

    if (!validateEmail(email)) {
      setError('Please enter a valid email address')
      return null
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        return result.data
      } else {
        setError(result.message || 'Email check failed. Please try again.')
        return null
      }
    } catch (error) {
      console.error('Email check error:', error)
      setError('Email check failed. Please try again.')
      return null
    } finally {
      setLoading(false)
    }
  },

  logout: () => {
    set({
      user: null,
      isLoggedIn: false,
      error: null,
      password: '',
      email: '',
      phone: '',
      signUpPassword: '',
    })

    // Clear localStorage and cookies
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken')
      localStorage.removeItem('authUser')
      deleteCookie('authToken')
    }
  },

  resetForm: () => set({
    password: '',
    firstName: '',
    lastName: '',
    birthdate: '',
    email: '',
    phone: '',
    signUpPassword: '',
    error: null,
  }),

  // Initialize auth state from localStorage
  initializeAuth: () => {
    if (typeof window === 'undefined') return

    try {
      const storedToken = localStorage.getItem('authToken')
      const storedUser = localStorage.getItem('authUser')

      if (storedToken && storedUser) {
        const user = JSON.parse(storedUser) as User
        set({
          user,
          isLoggedIn: true,
          error: null,
        })

        if (process.env.NODE_ENV === 'development') {
          console.log('[AUTH] Initialized with stored user:', user)
        }
      }
    } catch (error) {
      console.error('Error initializing auth:', error)
      // Clear corrupted data
      localStorage.removeItem('authToken')
      localStorage.removeItem('authUser')
      deleteCookie('authToken')
    }
  },

  // Validate stored token and refresh user data with backend
  validateToken: async () => {
    if (typeof window === 'undefined') return false

    const token = localStorage.getItem('authToken')
    if (!token) return false

    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const result = await response.json()

        // Debug logging for development
        if (process.env.NODE_ENV === 'development') {
          console.log('[AUTH] validateToken response:', result)
          console.log('[AUTH] result.data:', result.data)
        }

        if (result.success && result.data?.user) {
          // Update user data with fresh data from backend
          const backendUser = result.data.user

          // Debug logging for backend user data
          if (process.env.NODE_ENV === 'development') {
            console.log('[AUTH] validateToken backendUser:', backendUser)
            console.log('[AUTH] validateToken firstName:', backendUser.firstName)
            console.log('[AUTH] validateToken lastName:', backendUser.lastName)
            console.log('[AUTH] validateToken name:', backendUser.name)
          }

          const user: User = {
            id: backendUser.id,
            email: backendUser.email,
            firstName: backendUser.firstName || '',
            lastName: backendUser.lastName || '',
            name: backendUser.name || `${backendUser.firstName || ''} ${backendUser.lastName || ''}`.trim(),
            dateOfBirth: backendUser.dateOfBirth || '',
            phone: backendUser.phone || '',
            role: backendUser.role || 'user',
            birthdate: backendUser.dateOfBirth || undefined,
          }

          // Debug logging for final user object
          if (process.env.NODE_ENV === 'development') {
            console.log('[AUTH] validateToken final user:', user)
          }

          set({
            user,
            isLoggedIn: true,
            error: null,
          })

          // Update stored user data
          localStorage.setItem('authUser', JSON.stringify(user))
          return true
        } else if (process.env.NODE_ENV === 'development') {
          console.log('[AUTH] validateToken failed - no success or data:', result)
        }
      } else if (process.env.NODE_ENV === 'development') {
        console.log('[AUTH] validateToken failed - response not ok:', response.status)
      }

      // Token is invalid or response unsuccessful, clear auth state
      get().logout()
      return false
    } catch (error) {
      console.error('Token validation error:', error)
      return false
    }
  },

  // Refresh user data from backend
  refreshUserData: async () => {
    if (typeof window === 'undefined') return false

    const token = localStorage.getItem('authToken')
    if (!token) return false

    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const result = await response.json()

        if (result.success && result.data?.user) {
          // Update user data with fresh data from backend
          const backendUser = result.data.user
          const user: User = {
            id: backendUser.id,
            email: backendUser.email,
            firstName: backendUser.firstName || '',
            lastName: backendUser.lastName || '',
            name: backendUser.name || `${backendUser.firstName || ''} ${backendUser.lastName || ''}`.trim(),
            dateOfBirth: backendUser.dateOfBirth || '',
            phone: backendUser.phone || '',
            role: backendUser.role || 'user',
            birthdate: backendUser.dateOfBirth || undefined,
          }

          set({
            user,
            isLoggedIn: true,
            error: null,
          })

          // Update stored user data
          localStorage.setItem('authUser', JSON.stringify(user))
          return true
        }
      }

      return false
    } catch (error) {
      console.error('Error refreshing user data:', error)
      return false
    }
  },
}))

export default useAuthStore
