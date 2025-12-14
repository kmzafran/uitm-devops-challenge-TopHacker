// Core user and authentication types
export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  name: string
  dateOfBirth: string
  phone: string
  role: string
  birthdate?: string // Keep for backward compatibility
}

export interface AuthState {
  user: User | null
  isLoggedIn: boolean
  isLoading: boolean
  error: string | null
}

// Authentication form data types
export interface LoginFormData {
  password: string
}

export interface SignUpFormData {
  firstName: string
  lastName: string
  birthdate: string
  email: string
  password: string
  phone: string
}

export interface RegisterRequest {
  email: string
  password: string
  firstName: string
  lastName: string
  dateOfBirth: string
  phone: string
}

export interface AuthResponse {
  success: boolean
  message: string
  data: {
    user: User
    token: string
  }
}

export interface EmailCheckData {
  email: string
}
